import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentExtra from './PaymentExtra';

describe('PaymentExtra', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Basic rendering ─────────────────────────────────────────────

    it('renders the label', () => {
        render(<PaymentExtra label="Discount" />);
        expect(screen.getByText('Discount')).toBeInTheDocument();
    });

    it('renders the line separator', () => {
        const { container } = render(<PaymentExtra label="Discount" />);
        // The <span className="line" /> is the visual separator
        expect(container.querySelector('.line')).toBeInTheDocument();
    });

    // ── Add button (no valueText) ────────────────────────────────────

    it('shows an "Add" button when valueText is not provided', () => {
        render(<PaymentExtra label="Discount" />);
        const addBtn = screen.getByRole('button', { name: /add/i });
        expect(addBtn).toBeInTheDocument();
    });

    it('calls onAdd when the Add button is clicked', () => {
        const onAdd = vi.fn();
        render(<PaymentExtra label="Discount" onAdd={onAdd} />);
        fireEvent.click(screen.getByRole('button', { name: /add/i }));
        expect(onAdd).toHaveBeenCalledOnce();
    });

    it('hides the value text and remove button when no valueText', () => {
        render(<PaymentExtra label="Discount" />);
        expect(screen.queryByText('$10.00')).not.toBeInTheDocument();
    });

    // ── Value display ────────────────────────────────────────────────

    it('shows the valueText when provided', () => {
        render(<PaymentExtra label="Discount" valueText="$10.00" />);
        expect(screen.getByText('$10.00')).toBeInTheDocument();
    });

    it('hides the Add button when valueText is provided', () => {
        render(<PaymentExtra label="Discount" valueText="$10.00" />);
        expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
    });

    it('renders valueText with correct styling (text-primary fw-semibold)', () => {
        render(<PaymentExtra label="Discount" valueText="15%" />);
        const valueSpan = screen.getByText('15%');
        expect(valueSpan).toHaveClass('text-primary', 'fw-semibold');
    });

    // ── Remove button ────────────────────────────────────────────────

    it('shows a remove (X) button when onRemove is provided and valueText is set', () => {
        const onRemove = vi.fn();
        render(<PaymentExtra label="Discount" valueText="$10.00" onRemove={onRemove} />);
        const removeBtn = screen.getByRole('button', { name: /remove/i });
        expect(removeBtn).toBeInTheDocument();
    });

    it('hides the remove button when onRemove is not provided', () => {
        render(<PaymentExtra label="Discount" valueText="$10.00" />);
        expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });

    it('calls onRemove when the remove button is clicked', () => {
        const onRemove = vi.fn();
        render(<PaymentExtra label="Discount" valueText="$10.00" onRemove={onRemove} />);
        fireEvent.click(screen.getByRole('button', { name: /remove/i }));
        expect(onRemove).toHaveBeenCalledOnce();
    });

    // ── Icon checks ──────────────────────────────────────────────────

    it('renders a plus icon inside the Add button', () => {
        render(<PaymentExtra label="Discount" />);
        const addBtn = screen.getByRole('button', { name: /add/i });
        expect(addBtn.querySelector('.lucide-plus')).toBeInTheDocument();
    });

    it('renders an X icon inside the Remove button', () => {
        const onRemove = vi.fn();
        render(<PaymentExtra label="Discount" valueText="$10.00" onRemove={onRemove} />);
        const removeBtn = screen.getByRole('button', { name: /remove/i });
        expect(removeBtn.querySelector('.lucide-x')).toBeInTheDocument();
    });

    // ── Switching between states ─────────────────────────────────────

    it('switches from Add button to value when valueText is provided after mount', () => {
        const { rerender } = render(<PaymentExtra label="Discount" />);
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();

        rerender(<PaymentExtra label="Discount" valueText="$20.00" onRemove={vi.fn()} />);
        expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
        expect(screen.getByText('$20.00')).toBeInTheDocument();
    });

    it('switches back to Add button when valueText is removed', () => {
        const { rerender } = render(<PaymentExtra label="Discount" valueText="$5.00" />);
        expect(screen.getByText('$5.00')).toBeInTheDocument();

        rerender(<PaymentExtra label="Discount" />);
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
        expect(screen.queryByText('$5.00')).not.toBeInTheDocument();
    });

    // ── Edge cases ───────────────────────────────────────────────────

    it('renders with both onAdd and onRemove but no valueText – shows Add button', () => {
        render(<PaymentExtra label="Tip" onAdd={vi.fn()} onRemove={vi.fn()} />);
        // onRemove should be ignored when there's no valueText
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });

    it('shows Add button when valueText is an empty string (falsy)', () => {
        // valueText="" is falsy in JS, so the component renders the Add button
        render(<PaymentExtra label="Discount" valueText="" />);
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
        expect(screen.queryByText('$10.00')).not.toBeInTheDocument();
    });

    it('renders long valueText without truncation', () => {
        const longValue = '$999,999.99 (50% off applied)';
        render(<PaymentExtra label="Discount" valueText={longValue} />);
        expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it('renders multiple PaymentExtra instances independently', () => {
        render(
            <div>
                <PaymentExtra label="Discount" valueText="$10" onRemove={vi.fn()} />
                <PaymentExtra label="Tip" />
                <PaymentExtra label="Coupon" valueText="SAVE20" />
            </div>,
        );

        // Each label is rendered
        expect(screen.getByText('Discount')).toBeInTheDocument();
        expect(screen.getByText('Tip')).toBeInTheDocument();
        expect(screen.getByText('Coupon')).toBeInTheDocument();

        // Discount has value + remove
        expect(screen.getByText('$10')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(1);

        // Tip has Add button (no value)
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();

        // Coupon has value but no remove (no onRemove prop)
        expect(screen.getByText('SAVE20')).toBeInTheDocument();
    });

    // ── HTML / CSS structure ─────────────────────────────────────────

    it('has the correct container class structure', () => {
        const { container } = render(<PaymentExtra label="Discount" />);
        const outer = container.firstElementChild;
        expect(outer).toHaveClass('d-flex', 'align-items-center', 'justify-content-between');
    });
});
