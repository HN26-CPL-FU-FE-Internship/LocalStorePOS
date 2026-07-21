import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CouponPopup from './CouponPopup';
import type { CouponOrder } from '@/types';

// ── Mock the useCoupon hook ──────────────────────────────────────────
const mockUseCoupon = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/order/useCoupon', () => ({
    default: mockUseCoupon,
}));

const SAMPLE_COUPONS: CouponOrder[] = [
    { code: 'SAVE10', discountAmount: 10, discountType: 'fixed_amount' },
    { code: 'PERCENT20', discountAmount: 20, discountType: 'percentage' },
];

const defaultProps = {
    show: true,
    onHide: vi.fn(),
    onSelect: vi.fn(),
    subtotal: 100,
};

describe('CouponPopup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ────────────────────────────────────────────────────

    it('renders the modal when show is true', () => {
        mockUseCoupon.mockReturnValue({ data: { result: [] }, isLoading: false });
        render(<CouponPopup {...defaultProps} />);
        expect(screen.getByText('Select Coupon')).toBeInTheDocument();
    });

    it('does not render the modal when show is false', () => {
        mockUseCoupon.mockReturnValue({ data: { result: [] }, isLoading: false });
        render(<CouponPopup {...defaultProps} show={false} />);
        expect(screen.queryByText('Select Coupon')).not.toBeInTheDocument();
    });

    // ── Loading state ────────────────────────────────────────────────

    it('shows a spinner while loading', () => {
        mockUseCoupon.mockReturnValue({ data: undefined, isLoading: true });
        render(<CouponPopup {...defaultProps} />);
        expect(screen.getByText('Loading coupons...')).toBeInTheDocument();
        // There should be a Spinner element
        expect(document.querySelector('.spinner-border')).toBeInTheDocument();
    });

    it('does not show the coupon list while loading', () => {
        mockUseCoupon.mockReturnValue({ data: undefined, isLoading: true });
        render(<CouponPopup {...defaultProps} />);
        expect(screen.queryByText('SAVE10')).not.toBeInTheDocument();
        expect(screen.queryByText('No active coupons available')).not.toBeInTheDocument();
    });

    // ── Empty state ──────────────────────────────────────────────────

    it('shows empty message when no coupons are returned', () => {
        mockUseCoupon.mockReturnValue({ data: { result: [] }, isLoading: false });
        render(<CouponPopup {...defaultProps} />);
        expect(screen.getByText('No active coupons available')).toBeInTheDocument();
    });

    it('does not show the loading spinner when there are no coupons', () => {
        mockUseCoupon.mockReturnValue({ data: { result: [] }, isLoading: false });
        render(<CouponPopup {...defaultProps} />);
        expect(document.querySelector('.spinner-border')).not.toBeInTheDocument();
    });

    it('does not show the coupon list when there are no coupons', () => {
        mockUseCoupon.mockReturnValue({ data: { result: [] }, isLoading: false });
        render(<CouponPopup {...defaultProps} />);
        // Coupon list should be empty — no coupon codes rendered
        expect(screen.queryByText('SAVE10')).not.toBeInTheDocument();
        // But the Close button is still in the footer
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    // ── Coupon list rendering ────────────────────────────────────────

    it('renders all coupon codes', () => {
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} />);
        expect(screen.getByText('SAVE10')).toBeInTheDocument();
        expect(screen.getByText('PERCENT20')).toBeInTheDocument();
    });

    it('renders percentage discount description correctly', () => {
        mockUseCoupon.mockReturnValue({ data: { result: [SAMPLE_COUPONS[1]] }, isLoading: false });
        render(<CouponPopup {...defaultProps} />);
        expect(screen.getByText('20% off')).toBeInTheDocument();
    });

    it('renders fixed_amount discount description correctly', () => {
        mockUseCoupon.mockReturnValue({ data: { result: [SAMPLE_COUPONS[0]] }, isLoading: false });
        render(<CouponPopup {...defaultProps} />);
        expect(screen.getByText('$10 off')).toBeInTheDocument();
    });

    it('renders calculated discount value for each coupon', () => {
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} subtotal={200} />);
        // SAVE10: fixed $10 off → -$10
        expect(screen.getByText('-$10')).toBeInTheDocument();
        // PERCENT20: 20% of 200 = 40 → -$40
        expect(screen.getByText('-$40')).toBeInTheDocument();
    });

    it('calculates discount using the provided subtotal', () => {
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} subtotal={50} />);
        // Both coupons give -$10 at subtotal=50: SAVE10 fixed $10, PERCENT20 20% of 50 = 10
        const values = screen.getAllByText('-$10');
        expect(values).toHaveLength(2);
    });

    it('defaults subtotal to 0 when not provided', () => {
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} subtotal={undefined as unknown as number} />);
        // With subtotal=0: SAVE10 capped at 0 → -$0, PERCENT20: 20% of 0 = 0 → -$0
        const zeroValues = screen.getAllByText('-$0');
        expect(zeroValues).toHaveLength(2);
    });

    // ── Active coupon highlighting ───────────────────────────────────

    it('highlights the selected coupon with active class', () => {
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} selectedCode="PERCENT20" />);
        // Modal renders into a portal on document.body
        const items = document.querySelectorAll('.list-group-item');
        expect(items[0]).not.toHaveClass('active');
        expect(items[1]).toHaveClass('active');
    });

    it('does not highlight any coupon when selectedCode does not match', () => {
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} selectedCode="NONEXISTENT" />);
        const items = document.querySelectorAll('.list-group-item');
        items.forEach((item) => {
            expect(item).not.toHaveClass('active');
        });
    });

    // ── Selecting a coupon ───────────────────────────────────────────

    it('calls onSelect with the coupon when clicked', () => {
        const onSelect = vi.fn();
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} onSelect={onSelect} />);
        fireEvent.click(screen.getByText('SAVE10'));
        expect(onSelect).toHaveBeenCalledWith(SAMPLE_COUPONS[0]);
    });

    it('calls onHide after selecting a coupon', () => {
        const onHide = vi.fn();
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} onHide={onHide} />);
        fireEvent.click(screen.getByText('SAVE10'));
        expect(onHide).toHaveBeenCalledOnce();
    });

    // ── Close button ─────────────────────────────────────────────────

    it('calls onHide when Close button is clicked', () => {
        const onHide = vi.fn();
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} onHide={onHide} />);
        // The footer Close button has visible text, unlike the modal-header X button
        fireEvent.click(screen.getByText('Close'));
        expect(onHide).toHaveBeenCalledOnce();
    });

    // ── Enter key ────────────────────────────────────────────────────

    it('selects the first coupon when Enter is pressed and no coupon is selected', () => {
        const onSelect = vi.fn();
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} onSelect={onSelect} />);
        // Modal's onKeyDown handles Enter. Fire on the modal dialog element.
        const modalDialog = document.querySelector('.modal-content')!;
        fireEvent.keyDown(modalDialog, { key: 'Enter' });
        expect(onSelect).toHaveBeenCalledWith(SAMPLE_COUPONS[0]);
    });

    it('selects the active coupon when Enter is pressed and a coupon is already selected', () => {
        const onSelect = vi.fn();
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} onSelect={onSelect} selectedCode="PERCENT20" />);
        const modalDialog = document.querySelector('.modal-content')!;
        fireEvent.keyDown(modalDialog, { key: 'Enter' });
        expect(onSelect).toHaveBeenCalledWith(SAMPLE_COUPONS[1]);
    });

    it('does not select any coupon when Enter is pressed on a button (no double-fire)', () => {
        const onSelect = vi.fn();
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} onSelect={onSelect} />);
        // The footer Close button has visible text, unlike the modal-header X button
        const closeBtn = screen.getByText('Close').closest('button')!;
        fireEvent.keyDown(closeBtn, { key: 'Enter' });
        // onSelect should NOT have been called (the early-return for buttons fires)
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('calls onHide when Enter key selects a coupon', () => {
        const onHide = vi.fn();
        mockUseCoupon.mockReturnValue({ data: { result: SAMPLE_COUPONS }, isLoading: false });
        render(<CouponPopup {...defaultProps} onHide={onHide} />);
        const modalDialog = document.querySelector('.modal-content')!;
        fireEvent.keyDown(modalDialog, { key: 'Enter' });
        expect(onHide).toHaveBeenCalledOnce();
    });

    it('does nothing on Enter when the coupon list is empty', () => {
        const onSelect = vi.fn();
        mockUseCoupon.mockReturnValue({ data: { result: [] }, isLoading: false });
        render(<CouponPopup {...defaultProps} onSelect={onSelect} />);
        const modalDialog = document.querySelector('.modal-content')!;
        fireEvent.keyDown(modalDialog, { key: 'Enter' });
        expect(onSelect).not.toHaveBeenCalled();
    });

    // ── Edge cases ───────────────────────────────────────────────────

    it('handles a single coupon correctly', () => {
        mockUseCoupon.mockReturnValue({
            data: { result: [{ code: 'ONLYONE', discountAmount: 5, discountType: 'fixed_amount' }] },
            isLoading: false,
        });
        render(<CouponPopup {...defaultProps} />);
        expect(screen.getByText('ONLYONE')).toBeInTheDocument();
        expect(screen.getByText('$5 off')).toBeInTheDocument();
        expect(screen.getByText('-$5')).toBeInTheDocument();
    });

    it('handles coupon with 0 discount amount', () => {
        mockUseCoupon.mockReturnValue({
            data: { result: [{ code: 'FREE', discountAmount: 0, discountType: 'fixed_amount' }] },
            isLoading: false,
        });
        render(<CouponPopup {...defaultProps} />);
        expect(screen.getByText('FREE')).toBeInTheDocument();
        expect(screen.getByText('-$0')).toBeInTheDocument();
    });

    it('handles large discount amounts', () => {
        mockUseCoupon.mockReturnValue({
            data: { result: [{ code: 'BIG100', discountAmount: 100, discountType: 'fixed_amount' }] },
            isLoading: false,
        });
        render(<CouponPopup {...defaultProps} subtotal={1000} />);
        expect(screen.getByText('-$100')).toBeInTheDocument();
    });
});
