import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AmountPopup from './AmountPopup';

// react-bootstrap Modal renders into a portal (document.body).
// The component returns null when show=false, and renders Modal when show=true.

const defaultProps = {
    show: true,
    onHide: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Set Discount',
};

describe('AmountPopup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ────────────────────────────────────────────────────

    it('renders the modal when show is true', () => {
        render(<AmountPopup {...defaultProps} />);
        expect(screen.getByText('Set Discount')).toBeInTheDocument();
    });

    it('does not render the modal when show is false', () => {
        render(<AmountPopup {...defaultProps} show={false} />);
        expect(screen.queryByText('Set Discount')).not.toBeInTheDocument();
    });

    // ── Title ────────────────────────────────────────────────────────

    it('displays the provided title', () => {
        render(<AmountPopup {...defaultProps} title="Tip Amount" />);
        expect(screen.getByText('Tip Amount')).toBeInTheDocument();
    });

    // ── Initial values ───────────────────────────────────────────────

    it('initialises input with initialAmount', () => {
        render(<AmountPopup {...defaultProps} initialAmount={25} />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        expect(Number(input.value)).toBe(25);
    });

    it('defaults amount to 0 when initialAmount is not provided', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        expect(Number(input.value)).toBe(0);
    });

    it('defaults type to percentage when initialType is not provided', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle />);
        // The type toggle button shows '%' when type is percentage
        expect(screen.getByRole('button', { name: '%' })).toBeInTheDocument();
    });

    // ── Type toggle ──────────────────────────────────────────────────

    it('shows the type toggle button when showTypeToggle is true', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle />);
        expect(screen.getByRole('button', { name: '%' })).toBeInTheDocument();
    });

    it('hides the type toggle button when showTypeToggle is false', () => {
        render(<AmountPopup {...defaultProps} />);
        expect(screen.queryByRole('button', { name: '%' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '$' })).not.toBeInTheDocument();
    });

    it('shows dollar sign suffix when showTypeToggle is false', () => {
        render(<AmountPopup {...defaultProps} />);
        // The InputGroup.Text shows '$' when there's no type toggle
        expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('toggles type when the type button is clicked', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle />);
        const toggleBtn = screen.getByRole('button', { name: '%' });
        fireEvent.click(toggleBtn);
        // After click, should show '$' for fixed_amount
        expect(screen.getByRole('button', { name: '$' })).toBeInTheDocument();
    });

    it('toggles back to percentage on second click', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle />);
        const toggleBtn = screen.getByRole('button', { name: '%' });
        fireEvent.click(toggleBtn);  // → fixed_amount
        fireEvent.click(screen.getByRole('button', { name: '$' })); // → percentage
        expect(screen.getByRole('button', { name: '%' })).toBeInTheDocument();
    });

    // ── Input clamping (percentage mode) ─────────────────────────────

    it('clamps negative value to 0 in percentage mode', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="percentage" />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '-50' } });
        expect(Number(input.value)).toBe(0);
    });

    it('clamps value > 100 to 100 in percentage mode', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="percentage" />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '150' } });
        expect(Number(input.value)).toBe(100);
    });

    it('allows value in range 0-100 in percentage mode', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="percentage" />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '75' } });
        expect(Number(input.value)).toBe(75);
    });

    it('allows 0 as a valid value in percentage mode', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="percentage" />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '0' } });
        expect(Number(input.value)).toBe(0);
    });

    it('allows 100 as a valid value in percentage mode', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="percentage" />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '100' } });
        expect(Number(input.value)).toBe(100);
    });

    // ── Input behaviour (fixed_amount mode) ──────────────────────────

    it('clamps negative value to 0 in fixed_amount mode', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="fixed_amount" />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '-20' } });
        expect(Number(input.value)).toBe(0);
    });

    it('allows value > 100 in fixed_amount mode', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="fixed_amount" />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '500' } });
        expect(Number(input.value)).toBe(500);
    });

    // ── Input behaviour (no type toggle — tip mode) ──────────────────

    it('clamps negative value to 0 when no type toggle (tip mode)', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '-10' } });
        expect(Number(input.value)).toBe(0);
    });

    it('allows any positive value when no type toggle (tip mode)', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '999' } });
        expect(Number(input.value)).toBe(999);
    });

    // ── Submission ───────────────────────────────────────────────────

    it('calls onConfirm with amount and type when showTypeToggle is true', () => {
        const onConfirm = vi.fn();
        render(<AmountPopup {...defaultProps} showTypeToggle onConfirm={onConfirm} />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '20' } });

        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onConfirm).toHaveBeenCalledWith(20, 'percentage');
    });

    it('calls onConfirm with amount only when showTypeToggle is false (tip mode)', () => {
        const onConfirm = vi.fn();
        render(<AmountPopup {...defaultProps} onConfirm={onConfirm} />);
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onConfirm).toHaveBeenCalledWith(0); // default initialAmount
    });

    it('calls onConfirm with fixed_amount type when toggled', () => {
        const onConfirm = vi.fn();
        render(<AmountPopup {...defaultProps} showTypeToggle onConfirm={onConfirm} />);
        // Switch to fixed_amount
        fireEvent.click(screen.getByRole('button', { name: '%' }));
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onConfirm).toHaveBeenCalledWith(0, 'fixed_amount');
    });

    it('calls onHide after submitting', () => {
        const onHide = vi.fn();
        render(<AmountPopup {...defaultProps} onHide={onHide} />);
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onHide).toHaveBeenCalledOnce();
    });

    // ── Cancel ───────────────────────────────────────────────────────

    it('calls onHide when Cancel is clicked', () => {
        const onHide = vi.fn();
        render(<AmountPopup {...defaultProps} onHide={onHide} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onHide).toHaveBeenCalledOnce();
    });

    // ── Enter key submission ─────────────────────────────────────────

    it('submits via Enter key (form submit)', () => {
        const onConfirm = vi.fn();
        render(<AmountPopup {...defaultProps} showTypeToggle onConfirm={onConfirm} />);
        // Modal renders into a portal (document.body), so find the form from the body
        const form = document.querySelector('form')!;
        fireEvent.submit(form);
        expect(onConfirm).toHaveBeenCalledOnce();
    });

    // ── Reset on show ────────────────────────────────────────────────

    it('resets amount when show becomes true with new initialAmount', () => {
        const { rerender } = render(
            <AmountPopup key={String(true)} {...defaultProps} show initialAmount={10} />,
        );
        // Change the input to a different value
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '50' } });
        expect(Number(input.value)).toBe(50);

        // Re-render with show=false then show=true (simulates closed → reopened)
        // Key changes with show to force remount with fresh state, matching production usage
        rerender(<AmountPopup key={String(false)} {...defaultProps} show={false} initialAmount={10} />);
        rerender(<AmountPopup key={String(true)} {...defaultProps} show initialAmount={10} />);

        // Should have reset to initialAmount
        const inputAfter = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        expect(Number(inputAfter.value)).toBe(10);
    });

    it('resets type when show becomes true with new initialType', () => {
        const { rerender } = render(
            <AmountPopup key={String(true)} {...defaultProps} show showTypeToggle initialType="fixed_amount" />,
        );
        // Toggle to percentage
        fireEvent.click(screen.getByRole('button', { name: '$' }));
        expect(screen.getByRole('button', { name: '%' })).toBeInTheDocument();

        // Re-open — key changes with show to force remount
        rerender(<AmountPopup key={String(false)} {...defaultProps} show={false} showTypeToggle initialType="fixed_amount" />);
        rerender(<AmountPopup key={String(true)} {...defaultProps} show showTypeToggle initialType="fixed_amount" />);

        // Should have reset to fixed_amount → shows '$'
        expect(screen.getByRole('button', { name: '$' })).toBeInTheDocument();
    });

    // ── HTML attributes ──────────────────────────────────────────────

    it('sets min=0 on the number input', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount');
        expect(input).toHaveAttribute('min', '0');
    });

    it('sets max=100 on the number input in percentage mode', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="percentage" />);
        const input = screen.getByPlaceholderText('Enter amount');
        expect(input).toHaveAttribute('max', '100');
    });

    it('does not set max attribute in fixed_amount mode', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="fixed_amount" />);
        const input = screen.getByPlaceholderText('Enter amount');
        expect(input).not.toHaveAttribute('max');
    });

    it('does not set max attribute when showTypeToggle is false (tip mode)', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount');
        expect(input).not.toHaveAttribute('max');
    });

    it('sets step="any" on the number input', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount');
        expect(input).toHaveAttribute('step', 'any');
    });

    // ── Decimal values ───────────────────────────────────────────────

    it('accepts decimal values in percentage mode without clamping', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="percentage" />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '12.5' } });
        // The raw Number value stays 12.5 (rounding happens in calculateDiscount, not in the input)
        expect(Number(input.value)).toBeCloseTo(12.5);
    });

    it('accepts decimal values in fixed_amount mode', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="fixed_amount" />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '15.75' } });
        expect(Number(input.value)).toBeCloseTo(15.75);
    });

    it('accepts decimal values in tip mode (no type toggle)', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '3.50' } });
        expect(Number(input.value)).toBeCloseTo(3.5);
    });

    // ── Edge case: non-numeric / empty string input ─────────────────

    it('resets to 0 when a non-numeric string is entered', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'abc' } });
        expect(Number(input.value)).toBe(0);
    });

    it('resets to 0 when a partially numeric string is entered', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '12abc' } });
        expect(Number(input.value)).toBe(0);
    });

    it('resets to 0 when a special-character string is entered', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '--' } });
        expect(Number(input.value)).toBe(0);
    });

    it('resets to 0 when an empty string is entered', () => {
        render(<AmountPopup {...defaultProps} />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '' } });
        expect(Number(input.value)).toBe(0);
    });

    // ── Dynamic max attribute on type toggle ─────────────────────────

    it('updates max attribute when toggling from percentage to fixed_amount', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="percentage" />);
        const input = screen.getByPlaceholderText('Enter amount');
        // Initially in percentage mode → max=100
        expect(input).toHaveAttribute('max', '100');

        // Toggle to fixed_amount → max removed
        fireEvent.click(screen.getByRole('button', { name: '%' }));
        expect(input).not.toHaveAttribute('max');
    });

    it('adds max attribute when toggling from fixed_amount to percentage', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="fixed_amount" />);
        const input = screen.getByPlaceholderText('Enter amount');
        // Initially in fixed_amount mode → no max
        expect(input).not.toHaveAttribute('max');

        // Toggle to percentage → max=100
        fireEvent.click(screen.getByRole('button', { name: '$' }));
        expect(input).toHaveAttribute('max', '100');
    });

    it('clamps value > 100 to 100 when toggling from fixed_amount to percentage', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle initialType="fixed_amount" />);
        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        // Set a value > 100 in fixed_amount mode
        fireEvent.change(input, { target: { value: '500' } });
        expect(Number(input.value)).toBe(500);

        // Toggle to percentage → value should be clamped to 100
        fireEvent.click(screen.getByRole('button', { name: '$' }));
        expect(Number(input.value)).toBe(100);
    });

    // ── Multiple rapid type toggles ──────────────────────────────────

    it('handles multiple rapid type toggles correctly', () => {
        render(<AmountPopup {...defaultProps} showTypeToggle />);
        // Cycle: % → $ → % → $ → %
        fireEvent.click(screen.getByRole('button', { name: '%' }));  // → $
        fireEvent.click(screen.getByRole('button', { name: '$' }));  // → %
        fireEvent.click(screen.getByRole('button', { name: '%' }));  // → $
        fireEvent.click(screen.getByRole('button', { name: '$' }));  // → %
        expect(screen.getByRole('button', { name: '%' })).toBeInTheDocument();
    });

    // ── Modal header close ───────────────────────────────────────────

    it('calls onHide when the Modal header close (X) button is clicked', () => {
        const onHide = vi.fn();
        render(<AmountPopup {...defaultProps} onHide={onHide} />);
        // The Modal.Header closeButton renders a <button> with class 'btn-close'
        // Since Modal renders into a portal, query from document.body
        const closeBtn = document.querySelector('.btn-close');
        expect(closeBtn).toBeInTheDocument();
        fireEvent.click(closeBtn!);
        expect(onHide).toHaveBeenCalledOnce();
    });

    it('does not call onConfirm when Modal header close button is clicked', () => {
        const onConfirm = vi.fn();
        render(<AmountPopup {...defaultProps} onConfirm={onConfirm} />);
        const closeBtn = document.querySelector('.btn-close');
        fireEvent.click(closeBtn!);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    // ── Form submission (Enter key) ──────────────────────────────────

    it('calls onHide after form submit', () => {
        const onHide = vi.fn();
        render(<AmountPopup {...defaultProps} onHide={onHide} />);
        const form = document.querySelector('form')!;
        fireEvent.submit(form);
        expect(onHide).toHaveBeenCalledOnce();
    });

    // ── onConfirm with updated values after input change ─────────────

    it('passes the updated amount and type to onConfirm after changes', () => {
        const onConfirm = vi.fn();
        render(<AmountPopup {...defaultProps} showTypeToggle onConfirm={onConfirm} />);

        const input = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '15' } });

        // Toggle to fixed_amount
        fireEvent.click(screen.getByRole('button', { name: '%' }));

        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onConfirm).toHaveBeenCalledWith(15, 'fixed_amount');
    });
});
