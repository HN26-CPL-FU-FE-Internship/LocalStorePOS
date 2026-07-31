import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PayOrderModal from './index';
import type { OrderSummary } from '@/types';
import type { PaymentRequest } from '@/services/orderService';

// ── Mock dependencies ──────────────────────────────────────────────────

vi.mock('@/hooks/useContextData', () => ({
    default: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/utils', () => ({
    calculateOrderTotals: vi.fn(() => ({
        discountValue: 0,
        couponDiscount: 0,
        taxValue: 0,
        finalTotal: 100,
    })),
    toTitleCase: vi.fn((s: string) => s),
    formatHourAndMinute: vi.fn(() => '12:00 PM'),
    formatString: vi.fn((s: string) => s),
    bindCx: vi.fn(() => (cls: string) => cls),
}));

vi.mock('@/components/common/Icon', () => ({
    default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

vi.mock('@/components/common/ConfirmModal', () => ({
    default: ({
        show,
        action,
        data,
        actionDisabled,
    }: {
        show: boolean;
        action: () => void;
        data: string;
        actionDisabled?: boolean;
    }) =>
        show ? (
            <div data-testid="confirm-modal">
                <span data-testid="confirm-data">{data}</span>
                <button
                    data-testid="confirm-action"
                    onClick={action}
                    disabled={actionDisabled}
                >
                    Confirm
                </button>
            </div>
        ) : null,
}));

// Mock payment tab components so tests stay focused on PayOrderModal's note logic
vi.mock('../Payment', () => ({
    CashPaymentTab: vi.fn(
        ({
            note,
            onNoteChange,
            readOnly,
            givenAmount,
            onGivenAmountChange,
        }: {
            note: string | null;
            onNoteChange: (n: string) => void;
            readOnly?: boolean;
            givenAmount?: string;
            onGivenAmountChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
        }) => (
            <div data-testid="cash-tab">
                <textarea
                    data-testid="note-input"
                    value={note ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onNoteChange(e.target.value)}
                    readOnly={readOnly}
                />
                <input
                    data-testid="given-amount-input"
                    value={givenAmount ?? ''}
                    onChange={onGivenAmountChange}
                />
            </div>
        ),
    ),
    CardPaymentTab: vi.fn(
        ({
            note,
            onNoteChange,
            readOnly,
        }: {
            note: string | null;
            onNoteChange: (n: string) => void;
            readOnly?: boolean;
        }) => (
            <div data-testid="card-tab">
                <textarea
                    data-testid="note-input"
                    value={note ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onNoteChange(e.target.value)}
                    readOnly={readOnly}
                />
            </div>
        ),
    ),
    ScanPaymentTab: vi.fn(
        ({
            note,
            onNoteChange,
            readOnly,
        }: {
            note: string | null;
            onNoteChange: (n: string) => void;
            readOnly?: boolean;
        }) => (
            <div data-testid="scan-tab">
                <textarea
                    data-testid="note-input"
                    value={note ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onNoteChange(e.target.value)}
                    readOnly={readOnly}
                />
            </div>
        ),
    ),
}));

// ── Sample orders ──────────────────────────────────────────────────────

const baseOrder: OrderSummary = {
    id: 1,
    orderNumber: 'ORD-001',
    tokenNo: 'T001',
    orderType: 'dine_in',
    tableNumber: 'A1',
    orderedAt: '2025-01-01T12:00:00',
    waiter: 'John',
    waiterId: null,
    customerId: null,
    tableId: null,
    coupon: { code: 'SAVE10', discountAmount: 10, discountType: 'fixed_amount' },
    status: 'pending',
    paymentStatus: 'unpaid',
    subtotal: 100,
    taxAmount: 10,
    serviceCharge: 5,
    deliveryCharge: 0,
    tipAmount: 0,
    discountAmount: 0,
    estimatedMinutes: 15,
    cookingStartedAt: '',
    customerName: 'John Doe',
    kitchenStatus: 'new_order',
    grandTotal: 115,
    paidAmount: 0,
    balanceAmount: 115,
    note: null,
    items: [
        { id: 1, itemId: 101, itemName: 'Burger', quantity: 2, kitchenNote: null, sizeName: null, unitPrice: 10, addons: [], variationId: null, status: 'pending', taxRate: 0 },
        { id: 2, itemId: 102, itemName: 'Fries', quantity: 1, kitchenNote: null, sizeName: null, unitPrice: 5, addons: [], variationId: null, status: 'pending', taxRate: 0 },
    ],
};

const defaultProps = {
    show: true,
    order: baseOrder,
    handleClose: vi.fn(),
    onPaymentComplete: vi.fn(),
    isPaymentProcessing: false,
};

/** Helper: get the note textarea from the active (cash) tab */
const noteInput = () => screen.getAllByTestId('note-input')[0] as HTMLTextAreaElement;

/** Helper: set a valid given amount on the cash tab to bypass cash validation */
function setGivenAmount(value: string) {
    const input = screen.getByTestId('given-amount-input');
    fireEvent.change(input, { target: { value } });
}

/** Helper: click the Pay & Complete Order button (role-based selector avoids title collision) */
function clickPayButton() {
    fireEvent.click(screen.getByRole('button', { name: /pay.*complete/i }));
}

/** Helper: confirm payment in the confirmation modal */
function confirmPayment() {
    fireEvent.click(screen.getByTestId('confirm-action'));
}

describe('PayOrderModal — note flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ────────────────────────────────────────────────────

    it('renders the modal title when show is true and order is provided', () => {
        render(<PayOrderModal {...defaultProps} />);
        // The Modal.Title <div> is the first match for this text
        const title = screen.getByText('Pay & Complete Order', { selector: 'div' });
        expect(title).toBeInTheDocument();
    });

    it('renders nothing when order is null', () => {
        const { container } = render(<PayOrderModal {...defaultProps} order={null} />);
        expect(container.innerHTML).toBe('');
    });

    it('does not render the modal when show is false', () => {
        render(<PayOrderModal {...defaultProps} show={false} />);
        expect(screen.queryByText('Pay & Complete Order')).not.toBeInTheDocument();
    });

    // ── Note initialization ──────────────────────────────────────────

    it('initialises note from order.note when order has a note', () => {
        render(<PayOrderModal {...defaultProps} order={{ ...baseOrder, note: 'Extra napkins' }} />);
        expect(noteInput().value).toBe('Extra napkins');
    });

    it('initialises note as empty string when order.note is null', () => {
        render(<PayOrderModal {...defaultProps} />);
        expect(noteInput().value).toBe('');
    });

    // ── Note editing via textarea ────────────────────────────────────

    it('updates note when user types in the CashPaymentTab textarea', () => {
        render(<PayOrderModal {...defaultProps} />);
        fireEvent.change(noteInput(), { target: { value: 'Please rush' } });
        expect(noteInput().value).toBe('Please rush');
    });

    it('sends updated note via onPaymentComplete when Pay is confirmed', () => {
        const onPaymentComplete = vi.fn();
        render(<PayOrderModal {...defaultProps} onPaymentComplete={onPaymentComplete} />);

        // Edit the note
        fireEvent.change(noteInput(), { target: { value: 'No onions' } });

        // Provide a valid given amount (cash validation requires it)
        setGivenAmount('100');
        clickPayButton();
        confirmPayment();

        const paymentData = onPaymentComplete.mock.calls[0][0] as PaymentRequest;
        expect(paymentData.note).toBe('No onions');
    });

    it('sends empty note in PaymentRequest when note is unchanged', () => {
        const onPaymentComplete = vi.fn();
        render(
            <PayOrderModal
                {...defaultProps}
                order={{ ...baseOrder, note: null }}
                onPaymentComplete={onPaymentComplete}
            />,
        );

        setGivenAmount('100');
        clickPayButton();
        confirmPayment();

        const paymentData = onPaymentComplete.mock.calls[0][0] as PaymentRequest;
        expect(paymentData.note).toBe('');
    });

    // ── Note reset on close ─────────────────────────────────────────

    it('resets paymentNote to empty string when Close is clicked and modal reopens', () => {
        const handleClose = vi.fn();
        const { rerender } = render(
            <PayOrderModal
                {...defaultProps}
                handleClose={handleClose}
                order={{ ...baseOrder, note: 'Original' }}
            />,
        );

        // Edit the note
        fireEvent.change(noteInput(), { target: { value: 'Changed note' } });
        expect(noteInput().value).toBe('Changed note');

        // Close the modal
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(handleClose).toHaveBeenCalled();

        // Re-open with the same order — handleModalClose has reset paymentNote to ''
        rerender(
            <PayOrderModal
                {...defaultProps}
                show
                handleClose={handleClose}
                order={{ ...baseOrder, note: 'Original' }}
            />,
        );

        expect(noteInput().value).toBe('');
    });

    // ── Read-only mode ───────────────────────────────────────────────

    it('sets readOnly on note textarea when order is completed', () => {
        render(
            <PayOrderModal {...defaultProps} order={{ ...baseOrder, status: 'completed' }} />,
        );
        expect(noteInput()).toHaveAttribute('readOnly');
    });

    it('sets readOnly on note textarea when order is cancelled', () => {
        render(
            <PayOrderModal {...defaultProps} order={{ ...baseOrder, status: 'cancelled' }} />,
        );
        expect(noteInput()).toHaveAttribute('readOnly');
    });

    it('does not set readOnly when order is active (pending)', () => {
        render(
            <PayOrderModal {...defaultProps} order={{ ...baseOrder, status: 'pending' }} />,
        );
        expect(noteInput()).not.toHaveAttribute('readOnly');
    });

    // ── Pay button visibility ────────────────────────────────────────

    it('shows Pay button when order is active', () => {
        render(<PayOrderModal {...defaultProps} order={{ ...baseOrder, status: 'pending' }} />);
        expect(screen.getByRole('button', { name: /pay.*complete/i })).toBeInTheDocument();
    });

    it('hides Pay button when order is completed', () => {
        render(<PayOrderModal {...defaultProps} order={{ ...baseOrder, status: 'completed' }} />);
        expect(screen.queryByRole('button', { name: /pay.*complete/i })).not.toBeInTheDocument();
    });

    it('hides Pay button when order is cancelled', () => {
        render(<PayOrderModal {...defaultProps} order={{ ...baseOrder, status: 'cancelled' }} />);
        expect(screen.queryByRole('button', { name: /pay.*complete/i })).not.toBeInTheDocument();
    });

    // ── PaymentRequest structure ─────────────────────────────────────

    it('includes all payment fields alongside note in PaymentRequest', () => {
        const onPaymentComplete = vi.fn();
        render(<PayOrderModal {...defaultProps} onPaymentComplete={onPaymentComplete} />);

        setGivenAmount('100');
        clickPayButton();
        confirmPayment();

        const paymentData = onPaymentComplete.mock.calls[0][0] as PaymentRequest;
        expect(paymentData).toHaveProperty('discountAmount');
        expect(paymentData).toHaveProperty('discountType');
        expect(paymentData).toHaveProperty('tipAmount');
        expect(paymentData).toHaveProperty('couponCode');
        expect(paymentData).toHaveProperty('paymentType');
        expect(paymentData).toHaveProperty('givenAmount');
        expect(paymentData).toHaveProperty('note');
    });

    // ── Edge cases ───────────────────────────────────────────────────

    it('handles note with special characters', () => {
        render(
            <PayOrderModal
                {...defaultProps}
                order={{ ...baseOrder, note: "Don't forget the <sauce> & $100 tip!" }}
            />,
        );
        expect(noteInput().value).toBe("Don't forget the <sauce> & $100 tip!");
    });

    it('handles very long note text', () => {
        const longNote = 'A'.repeat(500);
        render(
            <PayOrderModal {...defaultProps} order={{ ...baseOrder, note: longNote }} />,
        );
        expect(noteInput().value).toBe(longNote);
    });
});
