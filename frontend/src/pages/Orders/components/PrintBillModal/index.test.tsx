import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrintBillModal from './index';
import { getPrintSetting, type PrintSetting } from '@/api/print-setting.api';
import { getStoreSetting, type StoreSetting } from '@/api/store.api';
import type { OrderSummary } from '@/types';

// Mock dependencies

vi.mock('@/api/print-setting.api', () => ({
    getPrintSetting: vi.fn(),
}));

vi.mock('@/api/store.api', () => ({
    getStoreSetting: vi.fn<() => Promise<StoreSetting | null>>(),
}));

vi.mock('@/components/common/Icon', () => ({
    default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

// Sample data

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
    coupon: { code: '', discountAmount: 0, discountType: 'fixed_amount' },
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
        {
            id: 1,
            itemId: 101,
            itemName: 'Burger',
            quantity: 2,
            kitchenNote: null,
            sizeName: null,
            unitPrice: 10,
            addons: [],
            variationId: null,
            status: 'pending',
            taxRate: 0,
        },
        {
            id: 2,
            itemId: 102,
            itemName: 'Fries',
            quantity: 1,
            kitchenNote: 'No salt',
            sizeName: 'Large',
            unitPrice: 5,
            addons: [{ id: 1, addonId: 201, addonName: 'Cheese', addonPrice: 1.5, quantity: 1 }],
            variationId: null,
            status: 'pending',
            taxRate: 0,
        },
    ],
};

const defaultSetting: PrintSetting = {
    id: 1,
    enablePrint: true,
    showStoreDetails: true,
    showCustomerDetails: true,
    showNotes: true,
    printTokens: true,
    pageSize: 'A4',
    headerText: null,
    footerText: null,
    createdAt: '',
    updatedAt: '',
};

const defaultStore: StoreSetting = {
    id: 1,
    name: 'My Restaurant',
    imagePath: '/logo.png',
    addressLine1: '123 Main St',
    addressLine2: null,
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10001',
    email: 'hello@restaurant.com',
    phone: '555-1234',
    currencyCode: 'USD',
    timezone: 'UTC',
    enableQrMenu: null,
    enableTakeaway: null,
    enableDineIn: null,
    enableReservation: null,
    enableOrderViaQr: null,
    enableDelivery: null,
    enableTable: null,
    createdAt: '',
    updatedAt: '',
};

/** Helper: render the open modal and wait until the settings have loaded and the bill is visible. */
async function renderWithSettings(
    overrides: Partial<PrintSetting> = {},
    store: StoreSetting = defaultStore,
    order: OrderSummary = baseOrder,
) {
    vi.mocked(getPrintSetting).mockResolvedValue({ ...defaultSetting, ...overrides });
    vi.mocked(getStoreSetting).mockResolvedValue(store);
    const utils = render(<PrintBillModal show order={order} onHide={vi.fn()} />);
    await screen.findByText('Tax Invoice');
    return utils;
}

const getRoot = () => document.querySelector('.pb-root') as HTMLElement;
const printButton = () => screen.getByRole('button', { name: /print bill/i });

describe('PrintBillModal - rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when order is null', () => {
        const { container } = render(<PrintBillModal show order={null} onHide={vi.fn()} />);
        expect(container.innerHTML).toBe('');
    });

    it('does not render the modal when show is false', () => {
        render(<PrintBillModal show={false} order={baseOrder} onHide={vi.fn()} />);
        expect(screen.queryByText('Print Bill')).not.toBeInTheDocument();
    });

    it('renders the modal title and the bill when open', async () => {
        await renderWithSettings();
        // The title and the footer button both read "Print Bill"
        expect(screen.getAllByText('Print Bill').length).toBeGreaterThan(0);
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    it('shows a loading indicator and disables the print button while settings load', () => {
        vi.mocked(getPrintSetting).mockReturnValue(new Promise<PrintSetting>(() => {}));
        vi.mocked(getStoreSetting).mockResolvedValue(defaultStore);
        render(<PrintBillModal show order={baseOrder} onHide={vi.fn()} />);
        expect(screen.getByText(/preparing bill/i)).toBeInTheDocument();
        expect(printButton()).toBeDisabled();
    });

    it('renders the order metadata rows', async () => {
        await renderWithSettings();
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('T001')).toBeInTheDocument();
        expect(screen.getByText('A1')).toBeInTheDocument();
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Dine In')).toBeInTheDocument();
        expect(screen.getByText('Unpaid')).toBeInTheDocument();
    });

    it('renders items with quantity, price, addons and kitchen notes', async () => {
        await renderWithSettings();
        expect(screen.getByText('Burger')).toBeInTheDocument();
        // $10.00 is shown for the burger unit price and in the Tax row
        expect(screen.getAllByText('$10.00').length).toBeGreaterThan(0);
        expect(screen.getByText('$20.00')).toBeInTheDocument();
        expect(screen.getByText(/Cheese/)).toBeInTheDocument();
        expect(screen.getByText(/Note: No salt/)).toBeInTheDocument();
    });

    it('renders totals including discount, coupon, tax, service charge, tip and grand total', async () => {
        const order: OrderSummary = {
            ...baseOrder,
            discountAmount: 10,
            discountType: 'percentage',
            coupon: { code: 'SAVE10', discountAmount: 10, discountType: 'fixed_amount' },
            tipAmount: 3,
            paidAmount: 65,
            balanceAmount: 50,
        };
        await renderWithSettings({}, defaultStore, order);
        expect(screen.getByText('Discount (10%)')).toBeInTheDocument();
        expect(screen.getByText('Coupon (SAVE10)')).toBeInTheDocument();
        expect(screen.getByText('Tax')).toBeInTheDocument();
        expect(screen.getByText('Service Charge')).toBeInTheDocument();
        expect(screen.getByText('Tip')).toBeInTheDocument();
        expect(screen.getByText('Grand Total')).toBeInTheDocument();
        expect(screen.getByText('$115.00')).toBeInTheDocument();
        expect(screen.getByText('$65.00')).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument();
    });
});

describe('PrintBillModal - print settings toggles', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows store details (name, address, logo) when showStoreDetails is enabled', async () => {
        await renderWithSettings();
        expect(screen.getByText('My Restaurant')).toBeInTheDocument();
        expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
        expect(screen.getByText(/Tel: 555-1234/)).toBeInTheDocument();
        expect(document.querySelector('.pb-store-logo')).not.toBeNull();
    });

    it('hides store details when showStoreDetails is disabled', async () => {
        await renderWithSettings({ showStoreDetails: false });
        expect(screen.queryByText('My Restaurant')).not.toBeInTheDocument();
        expect(screen.queryByText(/123 Main St/)).not.toBeInTheDocument();
        expect(document.querySelector('.pb-store-logo')).toBeNull();
    });

    it('falls back gracefully when store settings fail to load', async () => {
        vi.mocked(getPrintSetting).mockResolvedValue(defaultSetting);
        vi.mocked(getStoreSetting).mockRejectedValue(new Error('network error'));
        render(<PrintBillModal show order={baseOrder} onHide={vi.fn()} />);
        await screen.findByText('Tax Invoice');
        expect(screen.queryByText('My Restaurant')).not.toBeInTheDocument();
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    it('shows the customer name when showCustomerDetails is enabled', async () => {
        await renderWithSettings();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('hides the customer name when showCustomerDetails is disabled', async () => {
        await renderWithSettings({ showCustomerDetails: false });
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('hides the token number when printTokens is disabled', async () => {
        await renderWithSettings({ printTokens: false });
        expect(screen.queryByText('T001')).not.toBeInTheDocument();
    });

    it('hides kitchen notes and order notes when showNotes is disabled', async () => {
        await renderWithSettings({ showNotes: false }, defaultStore, { ...baseOrder, note: 'Extra napkins' });
        expect(screen.queryByText(/no salt/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/extra napkins/i)).not.toBeInTheDocument();
    });

    it('renders custom header and footer text from settings', async () => {
        await renderWithSettings({ headerText: 'Welcome to My Restaurant', footerText: 'See you soon!' });
        expect(screen.getByText('Welcome to My Restaurant')).toBeInTheDocument();
        expect(screen.getByText('See you soon!')).toBeInTheDocument();
    });

    it('shows a default footer message when no custom footer is set', async () => {
        await renderWithSettings();
        expect(screen.getByText('Thank you! Please come again.')).toBeInTheDocument();
    });

    it('shows a warning and disables the print button when printing is disabled', async () => {
        await renderWithSettings({ enablePrint: false });
        expect(screen.getByText(/printing is currently/i)).toBeInTheDocument();
        expect(printButton()).toBeDisabled();
    });
});

describe('PrintBillModal - receipt vs invoice format', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses the standard invoice layout for A4 page size', async () => {
        await renderWithSettings({ pageSize: 'A4' });
        expect(getRoot().dataset.format).toBe('standard');
    });

    it('uses the receipt layout for 80mm page size', async () => {
        await renderWithSettings({ pageSize: 'Receipt (80mm)' });
        expect(getRoot().dataset.format).toBe('receipt');
    });

    it('uses the receipt layout for 58mm page size', async () => {
        await renderWithSettings({ pageSize: 'Receipt (58mm)' });
        expect(getRoot().dataset.format).toBe('receipt');
    });

    it('shows the page size and format in the caption', async () => {
        await renderWithSettings({ pageSize: 'Receipt (58mm)' });
        expect(screen.getByText('Receipt (58mm)')).toBeInTheDocument();
        expect(document.querySelector('.pb-caption')?.textContent).toContain('Receipt format');
    });
});

describe('PrintBillModal - started/new split annotation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('marks freshly-added lines as "added later" when the order has a split', async () => {
        const order: OrderSummary = {
            ...baseOrder,
            items: [
                { ...baseOrder.items[0], id: 11, quantity: 2, status: 'ready' },
                { ...baseOrder.items[0], id: 12, quantity: 1, status: 'pending' },
            ],
        };
        await renderWithSettings({}, defaultStore, order);
        expect(screen.getByText(/added later/)).toBeInTheDocument();
    });

    it('does not annotate items when there is no split', async () => {
        await renderWithSettings();
        expect(screen.queryByText(/added later/)).not.toBeInTheDocument();
    });

    it('does not annotate a single repeated pending item (no started sibling)', async () => {
        const order: OrderSummary = {
            ...baseOrder,
            items: [
                { ...baseOrder.items[0], id: 11, quantity: 2, status: 'pending' },
                { ...baseOrder.items[0], id: 12, quantity: 1, status: 'pending' },
            ],
        };
        await renderWithSettings({}, defaultStore, order);
        expect(screen.queryByText(/added later/)).not.toBeInTheDocument();
    });
});

describe('PrintBillModal - print action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('writes the bill into a hidden iframe and triggers window.print', async () => {
        await renderWithSettings();

        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        expect(iframe).not.toBeNull();

        const printSpy = vi.fn();
        Object.defineProperty(iframe.contentWindow, 'print', {
            value: printSpy,
            writable: true,
            configurable: true,
        });
        // jsdom does not implement focus(); stub it to keep the test output clean
        Object.defineProperty(iframe.contentWindow, 'focus', {
            value: vi.fn(),
            writable: true,
            configurable: true,
        });

        // Execute the deferred print synchronously so the test is deterministic
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            cb(0);
            return 0;
        });

        fireEvent.click(printButton());

        await waitFor(() => expect(printSpy).toHaveBeenCalled());

        const iframeDoc = iframe.contentDocument as Document;
        expect(iframeDoc.body?.textContent).toContain('ORD-001');
        expect(iframeDoc.body?.textContent).toContain('Burger');
        expect(iframeDoc.documentElement.outerHTML).toContain('size: A4');

        rafSpy.mockRestore();
    });

    it('does not render the print iframe when the modal is closed', () => {
        render(<PrintBillModal show={false} order={baseOrder} onHide={vi.fn()} />);
        expect(document.querySelector('iframe')).toBeNull();
    });
});
