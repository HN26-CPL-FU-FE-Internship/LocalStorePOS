import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PositionPicker from './index';
import type { TableEntry } from '@/api/table.api';

// Zone 1 (Main Hall) bounds — mirrors ZONE_GEOMETRY in floorMapConstants.
const ZONE_1_MIN_X = 45;
const ZONE_1_MAX_X = 45 + 555;
const ZONE_1_MIN_Y = 175;
const ZONE_1_MAX_Y = 175 + 360;

// Mirrors the picker's client-pixel → grid conversion: rawX = clientX / width * 1000.
const RECT_W = 500;
const RECT_H = 320;
const CENTER_X = Math.round((ZONE_1_MIN_X + ZONE_1_MAX_X) / 2);
const CENTER_Y = Math.round((ZONE_1_MIN_Y + ZONE_1_MAX_Y) / 2);

// Keep the SVG table visual out of these assertions (and out of text queries).
vi.mock('@/components/common/TableVisual', () => ({
    default: () => null,
}));

const AREAS = [
    { id: 1, name: 'Main Hall' },
    { id: 2, name: 'VIP Room' },
    { id: 3, name: 'Rooftop' },
];

const existingTable = (over: Partial<TableEntry>): TableEntry => ({
    id: 1,
    tableNumber: 'T1',
    areaId: 1,
    areaName: 'Main Hall',
    seats: 4,
    status: 'available',
    xPosition: 100,
    yPosition: 100,
    shape: 'ROUND',
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    ...over,
});

/** The interactive container is the parent of the coords readout. */
const pickerOf = () =>
    screen.getByText('(200, 200)').closest('[class*="picker-container"]');

describe('PositionPicker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders every zone outline', () => {
        render(
            <PositionPicker
                x={200}
                y={200}
                shape="ROUND"
                seats={6}
                areas={AREAS}
                onPositionChange={vi.fn()}
            />,
        );
        expect(screen.getByText('Main Hall')).toBeInTheDocument();
        expect(screen.getByText('VIP Room')).toBeInTheDocument();
        expect(screen.getByText('Rooftop')).toBeInTheDocument();
    });

    it('renders the live marker with the current coordinates', () => {
        render(
            <PositionPicker
                x={320}
                y={240}
                shape="ROUND"
                seats={6}
                areas={AREAS}
                onPositionChange={vi.fn()}
            />,
        );
        expect(screen.getByText('(320, 240)')).toBeInTheDocument();
        expect(screen.getByText('Click / drag to place')).toBeInTheDocument();
    });

    it('renders the seat count inside the marker', () => {
        const { container } = render(
            <PositionPicker
                x={320}
                y={240}
                shape="ROUND"
                seats={8}
                areas={AREAS}
                onPositionChange={vi.fn()}
            />,
        );
        const marker = container.querySelector('[class*="picker-marker"]');
        expect(marker).not.toBeNull();
        expect(marker!.textContent).toContain('8');
    });

    it('calls onPositionChange with grid coords inside the active zone when clicked', () => {
        const onPositionChange = vi.fn();
        render(
            <PositionPicker
                x={200}
                y={200}
                shape="ROUND"
                seats={6}
                areas={AREAS}
                activeAreaId={1}
                onPositionChange={onPositionChange}
            />,
        );
        const picker = pickerOf();
        expect(picker).not.toBeNull();
        // jsdom has no layout (getBoundingClientRect = zeros → /0 = Infinity).
        // Force a rect so the pointer position maps to a finite grid coord.
        vi.spyOn(picker!, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: RECT_W,
            height: RECT_H,
        } as DOMRect);
        fireEvent.pointerDown(picker!, {
            clientX: (CENTER_X / 1000) * RECT_W,
            clientY: (CENTER_Y / 1000) * RECT_H,
            button: 0,
        });
        expect(onPositionChange).toHaveBeenCalledTimes(1);
        const [x, y] = onPositionChange.mock.calls[0] as [number, number];
        expect(x).toBeGreaterThanOrEqual(ZONE_1_MIN_X);
        expect(x).toBeLessThanOrEqual(ZONE_1_MAX_X);
        expect(y).toBeGreaterThanOrEqual(ZONE_1_MIN_Y);
        expect(y).toBeLessThanOrEqual(ZONE_1_MAX_Y);
    });

    it('ignores right/middle mouse buttons', () => {
        const onPositionChange = vi.fn();
        render(
            <PositionPicker
                x={200}
                y={200}
                shape="ROUND"
                seats={6}
                areas={AREAS}
                onPositionChange={onPositionChange}
            />,
        );
        const picker = pickerOf();
        fireEvent.pointerDown(picker!, {
            clientX: (CENTER_X / 1000) * RECT_W,
            clientY: (CENTER_Y / 1000) * RECT_H,
            button: 2,
        });
        expect(onPositionChange).not.toHaveBeenCalled();
    });

    it('draws existing tables (dimmed) and skips those without coordinates', () => {
        const { container } = render(
            <PositionPicker
                x={200}
                y={200}
                shape="ROUND"
                seats={6}
                areas={AREAS}
                existing={[
                    existingTable({ id: 1, xPosition: 100, yPosition: 100 }),
                    existingTable({ id: 2, xPosition: null, yPosition: null }),
                ]}
                onPositionChange={vi.fn()}
            />,
        );
        expect(container.querySelectorAll('[class*="picker-existing"]')).toHaveLength(1);
    });

    it('renders without throwing when areas contain an id with no geometry', () => {
        expect(() =>
            render(
                <PositionPicker
                    x={200}
                    y={200}
                    shape="ROUND"
                    seats={6}
                    areas={[...AREAS, { id: 999, name: 'Unknown Zone' }]}
                    onPositionChange={vi.fn()}
                />,
            ),
        ).not.toThrow();
    });
});
