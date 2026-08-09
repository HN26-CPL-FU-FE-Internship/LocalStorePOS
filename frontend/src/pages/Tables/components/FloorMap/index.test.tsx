import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FloorMap from './index';
import type { ReservationEntry, TableEntry } from '@/api/table.api';

// Keep the SVG table visual out of these assertions (and out of text queries).
vi.mock('@/components/common/TableVisual', () => ({
    default: () => null,
}));

const AREAS = [
    { id: 1, name: 'Main Hall' },
    { id: 2, name: 'VIP Room' },
    { id: 3, name: 'Rooftop' },
];

const table = (over: Partial<TableEntry>): TableEntry => ({
    id: 1,
    tableNumber: 'T1',
    areaId: 1,
    areaName: 'Main Hall',
    seats: 4,
    status: 'available',
    xPosition: 300,
    yPosition: 350,
    shape: 'ROUND',
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    ...over,
});

const reservation = (over: Partial<ReservationEntry>): ReservationEntry => ({
    id: 1,
    customerId: 10,
    customerName: 'John',
    customerPhone: '0123',
    tableId: 1,
    tableNumber: 'T1',
    reservationTime: new Date(Date.now() + 86_400_000).toISOString(), // tomorrow
    guests: 2,
    status: 'booked',
    notes: null,
    createdAt: '2026-01-01T00:00:00',
    ...over,
});

const noop = () => {};

describe('FloorMap', () => {
    it('renders every table number and the legend', () => {
        render(
            <FloorMap
                tables={[table({ id: 1, tableNumber: 'T1' }), table({ id: 2, tableNumber: 'T2', areaId: 2, areaName: 'VIP Room' })]}
                reservations={[]}
                areas={AREAS}
                onTableClick={noop}
                onViewBookings={noop}
            />,
        );
        expect(screen.getByText('T1')).toBeInTheDocument();
        expect(screen.getByText('T2')).toBeInTheDocument();
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('Booked')).toBeInTheDocument();
        expect(screen.getByText('Occupied')).toBeInTheDocument();
    });

    it('draws a zone outline for every area that has geometry', () => {
        render(
            <FloorMap
                tables={[]}
                reservations={[]}
                areas={[...AREAS, { id: 999, name: 'Unknown Zone' }]}
                onTableClick={noop}
                onViewBookings={noop}
            />,
        );
        expect(screen.getByText('Main Hall')).toBeInTheDocument();
        expect(screen.getByText('VIP Room')).toBeInTheDocument();
        expect(screen.getByText('Rooftop')).toBeInTheDocument();
        // No geometry → no outline, and rendering must not throw.
        expect(screen.queryByText('Unknown Zone')).not.toBeInTheDocument();
    });

    it('renders legacy tables without coordinates via the auto grid slot', () => {
        render(
            <FloorMap
                tables={[table({ id: 1, xPosition: null, yPosition: null })]}
                reservations={[]}
                areas={AREAS}
                onTableClick={noop}
                onViewBookings={noop}
            />,
        );
        expect(screen.getByText('T1')).toBeInTheDocument();
    });

    it('renders a "booked" badge when the table has active reservations', () => {
        render(
            <FloorMap
                tables={[table({ id: 1 })]}
                reservations={[reservation({ id: 1, tableId: 1, status: 'booked' })]}
                areas={AREAS}
                onTableClick={noop}
                onViewBookings={noop}
            />,
        );
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('shows a tooltip with status and details on hover', () => {
        const onViewBookings = vi.fn();
        const { container } = render(
            <FloorMap
                tables={[table({ id: 1, seats: 6, areaId: 2, areaName: 'VIP Room' })]}
                reservations={[reservation({ id: 1, tableId: 1 })]}
                areas={AREAS}
                onTableClick={noop}
                onViewBookings={onViewBookings}
            />,
        );
        const node = screen.getByText('T1').closest('[class*="table-node"]');
        expect(node).not.toBeNull();
        fireEvent.mouseEnter(node!);

        const tooltip = container.querySelector('[class*="table-tooltip"]');
        expect(tooltip).not.toBeNull();
        // Reserved-but-future booking → effectively Available (tooltip text).
        expect(tooltip!.textContent).toContain('Available');
        expect(tooltip!.textContent).toContain('6 seats');
        expect(tooltip!.textContent).toContain('VIP Room');
        expect(screen.getByText(/active booking/)).toBeInTheDocument();

        fireEvent.click(screen.getByText(/active booking/));
        expect(onViewBookings).toHaveBeenCalledTimes(1);
    });

    it('calls onTableClick when a table node is clicked', () => {
        const onTableClick = vi.fn();
        const t = table({ id: 7, tableNumber: 'T7' });
        render(
            <FloorMap
                tables={[t]}
                reservations={[]}
                areas={AREAS}
                onTableClick={onTableClick}
                onViewBookings={noop}
            />,
        );
        fireEvent.click(screen.getByText('T7').closest('[class*="table-node"]')!);
        expect(onTableClick).toHaveBeenCalledWith(t);
    });

    it('renders the ghost preview marker while a table is being added', () => {
        const { container } = render(
            <FloorMap
                tables={[]}
                reservations={[]}
                areas={AREAS}
                onTableClick={noop}
                onViewBookings={noop}
                preview={{ x: 250, y: 300, shape: 'RECTANGLE', seats: 8 }}
            />,
        );
        const ghost = container.querySelector('[class*="preview-ghost"]');
        expect(ghost).not.toBeNull();
    });

    it('renders without a ghost preview when preview is null', () => {
        const { container } = render(
            <FloorMap
                tables={[table({ id: 1 })]}
                reservations={[]}
                areas={AREAS}
                onTableClick={noop}
                onViewBookings={noop}
            />,
        );
        expect(container.querySelector('[class*="preview-ghost"]')).toBeNull();
    });

    it('reports the dropped grid position via onDragEnd after a drag', () => {
        const onDragEnd = vi.fn();
        const { container } = render(
            <FloorMap
                tables={[table({ id: 1, xPosition: 300, yPosition: 350 })]}
                reservations={[]}
                areas={AREAS}
                onTableClick={noop}
                onViewBookings={noop}
                onDragEnd={onDragEnd}
            />,
        );
        const map = container.querySelector('[class*="floor-map"]')!;
        // jsdom has no layout: force a rect so pointer → grid math is finite.
        vi.spyOn(map, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 1000,
            height: 640,
        } as DOMRect);

        const node = screen.getByText('T1').closest('[class*="table-node"]')!;
        fireEvent.pointerDown(node, { clientX: 300, clientY: 350, pointerId: 1, button: 0 });
        fireEvent.pointerMove(node, { clientX: 560, clientY: 340, pointerId: 1 });
        // Coordinates are shown while dragging.
        expect(screen.getByText(/560, 340/)).toBeInTheDocument();
        fireEvent.pointerUp(node, { clientX: 560, clientY: 340, pointerId: 1 });

        expect(onDragEnd).toHaveBeenCalledTimes(1);
        expect(onDragEnd).toHaveBeenCalledWith(1, 560, 340);
    });

    it('swallows the click that follows a drag, but not later clicks', () => {
        const onTableClick = vi.fn();
        const onDragEnd = vi.fn();
        const { container } = render(
            <FloorMap
                tables={[table({ id: 1, xPosition: 300, yPosition: 350 })]}
                reservations={[]}
                areas={AREAS}
                onTableClick={onTableClick}
                onViewBookings={noop}
                onDragEnd={onDragEnd}
            />,
        );
        const map = container.querySelector('[class*="floor-map"]')!;
        vi.spyOn(map, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 1000,
            height: 640,
        } as DOMRect);
        const node = screen.getByText('T1').closest('[class*="table-node"]')!;

        fireEvent.pointerDown(node, { clientX: 300, clientY: 350, pointerId: 1, button: 0 });
        fireEvent.pointerMove(node, { clientX: 560, clientY: 340, pointerId: 1 });
        fireEvent.pointerUp(node, { clientX: 560, clientY: 340, pointerId: 1 });
        // The click right after the drag must be eaten…
        fireEvent.click(node);
        expect(onTableClick).not.toHaveBeenCalled();
        // …but a normal click (no drag) still reaches the table.
        fireEvent.click(node);
        expect(onTableClick).toHaveBeenCalledTimes(1);
    });
});
