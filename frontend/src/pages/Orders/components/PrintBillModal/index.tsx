import Icon from '@/components/common/Icon';
import { getPrintSetting, type PrintSetting } from '@/api/print-setting.api';
import { getAssetUrl } from '@/lib';
import { getStoreSetting, type StoreSetting } from '@/api/store.api';
import { calculateDiscount, computeKitchenSplitItems, formatDateTimeOrder, toTitleCase } from '@/utils';
import type { DiscountType, OrderItemType, OrderSummary } from '@/types';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Modal, Spinner } from 'react-bootstrap';
import { renderToStaticMarkup } from 'react-dom/server';

// ── Shared bill styles (used for both the on-screen preview and the print doc) ──
const PRINT_BILL_CSS = `
.pb-paper {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 28px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
}
.pb-caption {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 10px;
    letter-spacing: 0.3px;
}
.pb-print-frame {
    position: fixed;
    left: -10000px;
    top: 0;
    width: 8.5in;
    height: 11in;
    border: 0;
    background: #fff;
    pointer-events: none;
}
.pb-root {
    --pb-ink: #111827;
    --pb-muted: #6b7280;
    --pb-line: #d1d5db;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: var(--pb-ink);
    max-width: 720px;
    margin: 0 auto;
    background: #fff;
}
.pb-header { text-align: center; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 2px solid var(--pb-ink); }
.pb-store-logo { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; margin-bottom: 8px; }
.pb-store-name { font-size: 20px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin: 0; }
.pb-store-address { font-size: 12px; color: var(--pb-muted); margin: 2px 0; }
.pb-store-contact { font-size: 12px; color: var(--pb-muted); margin: 0; }
.pb-doc-title {
    display: inline-block;
    margin-top: 10px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 4px 16px;
    border: 1px solid var(--pb-ink);
    border-radius: 999px;
}
.pb-header-text { font-size: 12px; color: var(--pb-muted); font-style: italic; margin: 6px 0 0; }

.pb-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 40px; margin-bottom: 18px; font-size: 12.5px; }
.pb-meta-row { display: flex; justify-content: space-between; gap: 8px; }
.pb-meta-label { color: var(--pb-muted); white-space: nowrap; }
.pb-meta-value { font-weight: 600; text-align: right; }

.pb-items { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 16px; }
.pb-items th {
    text-align: left;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.8px;
    color: var(--pb-muted);
    border-bottom: 1px solid var(--pb-ink);
    padding: 6px 8px;
}
.pb-items td { padding: 8px; border-bottom: 1px dashed var(--pb-line); vertical-align: top; }
.pb-items .pb-num { text-align: right; white-space: nowrap; }
.pb-item-name { font-weight: 600; }
.pb-item-variation { font-weight: 400; color: var(--pb-muted); font-size: 11.5px; }
.pb-addons { margin: 4px 0 0; padding: 0; list-style: none; font-size: 11.5px; color: var(--pb-muted); }
.pb-addons li { padding-left: 10px; }
.pb-note {
    margin: 5px 0 0;
    font-size: 11px;
    color: var(--pb-muted);
    font-style: italic;
    background: #f9fafb;
    border-left: 2px solid var(--pb-line);
    padding: 4px 8px;
    border-radius: 4px;
}

.pb-totals { margin: 0 0 0 auto; width: 320px; font-size: 13px; }
.pb-total-row { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; }
.pb-total-label { color: var(--pb-muted); }
.pb-total-value { font-weight: 600; }
.pb-grand { border-top: 2px solid var(--pb-ink); border-bottom: 2px solid var(--pb-ink); padding: 8px 0; margin-top: 6px; }
.pb-grand .pb-total-label,
.pb-grand .pb-total-value { font-size: 16px; font-weight: 800; color: var(--pb-ink); }

.pb-footer { text-align: center; margin-top: 22px; padding-top: 14px; border-top: 1px dashed var(--pb-line); font-size: 12px; color: var(--pb-muted); }
.pb-footer-text { font-weight: 600; font-size: 13px; color: var(--pb-ink); margin: 0 0 4px; }
.pb-footer-sub { font-size: 10.5px; margin: 0; }

/* Receipt (thermal) layout */
.pb-root[data-format='receipt'] { max-width: 76mm; font-family: 'Courier New', monospace; font-size: 11px; }
.pb-root[data-format='receipt'] .pb-store-name { font-size: 15px; }
.pb-root[data-format='receipt'] .pb-header { border-bottom: 1px dashed var(--pb-ink); }
.pb-root[data-format='receipt'] .pb-meta { display: block; }
.pb-root[data-format='receipt'] .pb-meta-row { border-bottom: 1px dotted var(--pb-line); padding: 1px 0; }
.pb-root[data-format='receipt'] .pb-items { font-size: 10.5px; }
.pb-root[data-format='receipt'] .pb-items th { font-size: 9px; padding: 3px 2px; }
.pb-root[data-format='receipt'] .pb-items td { padding: 4px 2px; }
.pb-root[data-format='receipt'] .pb-totals { width: 100%; font-size: 11.5px; }
.pb-root[data-format='receipt'] .pb-total-row { border-bottom: 1px dotted var(--pb-line); }
`;

const DEFAULT_SETTINGS: PrintSetting = {
    id: 0,
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

const formatCurrency = (value: number | null | undefined) => `$${Number(value ?? 0).toFixed(2)}`;

// ── Small presentational helpers ────────────────────────────────────────
const MetaRow = ({ label, value }: { label: string; value: string }) => (
    <div className="pb-meta-row">
        <span className="pb-meta-label">{label}</span>
        <span className="pb-meta-value">{value}</span>
    </div>
);

const TotalRow = ({ label, value }: { label: string; value: string }) => (
    <div className="pb-total-row">
        <span className="pb-total-label">{label}</span>
        <span className="pb-total-value">{value}</span>
    </div>
);

// ── Bill content (shared between the preview and the print document) ────
function ItemRow({ item, setting, isExtra }: { item: OrderItemType; setting: PrintSetting; isExtra?: boolean }) {
    const addons = item.addons ?? [];
    return (
        <tr>
            <td>
                <div className="pb-item-name">
                    {item.itemName}
                    {item.sizeName && <span className="pb-item-variation"> ({item.sizeName})</span>}
                    {isExtra && <span className="pb-item-variation"> (added later)</span>}
                </div>
                {addons.length > 0 && (
                    <ul className="pb-addons">
                        {addons.map((addon) => (
                            <li key={addon.id}>
                                + {addon.addonName} ×{addon.quantity} — {formatCurrency(addon.addonPrice * addon.quantity)}
                            </li>
                        ))}
                    </ul>
                )}
                {setting.showNotes && item.kitchenNote && <div className="pb-note">Note: {item.kitchenNote}</div>}
            </td>
            <td className="pb-num">{item.quantity}</td>
            <td className="pb-num">{formatCurrency(item.unitPrice)}</td>
            <td className="pb-num">{formatCurrency(item.unitPrice * item.quantity)}</td>
        </tr>
    );
}

function BillContent({ order, store, setting }: { order: OrderSummary; store: StoreSetting | null; setting: PrintSetting }) {
    const isReceipt = /receipt/i.test(setting.pageSize || '');
    const storeAddress = store
        ? [
              store.addressLine1,
              store.addressLine2,
              [store.city, store.state, store.country].filter(Boolean).join(', '),
              store.postalCode,
          ]
              .filter(Boolean)
              .join(', ')
        : '';

    const discountValue = calculateDiscount(
        order.subtotal,
        order.discountAmount,
        (order.discountType ?? 'percentage') as DiscountType,
    );
    const coupon = order.coupon?.code ? order.coupon : null;
    const couponDiscount = coupon ? calculateDiscount(order.subtotal, coupon.discountAmount, coupon.discountType) : 0;

    // When the same menu item was ordered again after the first batch was
    // prepared, mark the freshly-added lines so the customer can see what was
    // added later.
    const { extraIds } = computeKitchenSplitItems(order.items);

    return (
        <div className="pb-root" data-format={isReceipt ? 'receipt' : 'standard'}>
            <div className="pb-header">
                {setting.showStoreDetails && store && (
                    <>
                        {store.imagePath && (
                            <img className="pb-store-logo" src={getAssetUrl(store.imagePath)} alt={store.name} />
                        )}
                        <p className="pb-store-name">{store.name}</p>
                        {storeAddress && <p className="pb-store-address">{storeAddress}</p>}
                        {store.phone && <p className="pb-store-contact">Tel: {store.phone}</p>}
                        {store.email && <p className="pb-store-contact">Email: {store.email}</p>}
                    </>
                )}
                <span className="pb-doc-title">Tax Invoice</span>
                {setting.headerText && <p className="pb-header-text">{setting.headerText}</p>}
            </div>

            <div className="pb-meta">
                <MetaRow label="Order No" value={order.orderNumber} />
                {setting.printTokens && <MetaRow label="Token No" value={order.tokenNo || '-'} />}
                <MetaRow label="Date & Time" value={formatDateTimeOrder(order.orderedAt)} />
                <MetaRow label="Order Type" value={toTitleCase(order.orderType)} />
                {order.tableNumber && <MetaRow label="Table No" value={order.tableNumber} />}
                {order.waiter && <MetaRow label="Waiter" value={order.waiter} />}
                {setting.showCustomerDetails && order.customerName && <MetaRow label="Customer" value={order.customerName} />}
                <MetaRow label="Payment" value={toTitleCase(order.paymentStatus)} />
            </div>

            <table className="pb-items">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th className="pb-num">Qty</th>
                        <th className="pb-num">Price</th>
                        <th className="pb-num">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item) => (
                        <ItemRow
                            key={item.id ?? item.itemName}
                            item={item}
                            setting={setting}
                            isExtra={extraIds.has(item.id)}
                        />
                    ))}
                </tbody>
            </table>

            {setting.showNotes && order.note && <p className="pb-note">Note: {order.note}</p>}

            <div className="pb-totals">
                <TotalRow label="Subtotal" value={formatCurrency(order.subtotal)} />
                {discountValue > 0 && (
                    <TotalRow
                        label={`Discount${
                            order.discountAmount > 0
                                ? ` (${order.discountType === 'fixed_amount' ? formatCurrency(order.discountAmount) : `${order.discountAmount}%`})`
                                : ''
                        }`}
                        value={`-${formatCurrency(discountValue)}`}
                    />
                )}
                {coupon && <TotalRow label={`Coupon (${coupon.code})`} value={`-${formatCurrency(couponDiscount)}`} />}
                {order.taxAmount > 0 && <TotalRow label="Tax" value={formatCurrency(order.taxAmount)} />}
                {order.serviceCharge > 0 && <TotalRow label="Service Charge" value={formatCurrency(order.serviceCharge)} />}
                {order.deliveryCharge > 0 && <TotalRow label="Delivery Charge" value={formatCurrency(order.deliveryCharge)} />}
                {order.tipAmount > 0 && <TotalRow label="Tip" value={formatCurrency(order.tipAmount)} />}
                <div className="pb-total-row pb-grand">
                    <span className="pb-total-label">Grand Total</span>
                    <span className="pb-total-value">{formatCurrency(order.grandTotal)}</span>
                </div>
                <TotalRow label="Paid" value={formatCurrency(order.paidAmount)} />
                {order.balanceAmount > 0 && <TotalRow label="Balance" value={formatCurrency(order.balanceAmount)} />}
            </div>

            <div className="pb-footer">
                {setting.footerText ? (
                    <p className="pb-footer-text">{setting.footerText}</p>
                ) : (
                    <p className="pb-footer-text">Thank you! Please come again.</p>
                )}
                <p className="pb-footer-sub">Powered by Restaurant POS</p>
            </div>
        </div>
    );
}

// ── Modal ───────────────────────────────────────────────────────────────
const PrintBillModal = ({
    show,
    order,
    onHide,
}: {
    show: boolean;
    order: OrderSummary | null;
    onHide: () => void;
}) => {
    const [setting, setSetting] = useState<PrintSetting | null>(null);
    const [store, setStore] = useState<StoreSetting | null>(null);
    const [loading, setLoading] = useState(false);
    const printFrameRef = useRef<HTMLIFrameElement | null>(null);

    useEffect(() => {
        if (!show) return;
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reset spinner when the modal opens
        setLoading(true);
        Promise.allSettled([getPrintSetting(), getStoreSetting()]).then(([settingResult, storeResult]) => {
            if (cancelled) return;
            if (settingResult.status === 'fulfilled') setSetting(settingResult.value);
            if (storeResult.status === 'fulfilled') setStore(storeResult.value);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [show]);

    const effectiveSetting = setting ?? DEFAULT_SETTINGS;
    const printDisabled = setting !== null && !setting.enablePrint;
    const isReceipt = /receipt/i.test(effectiveSetting.pageSize || '');

    const pageCss = useMemo(() => {
        if (isReceipt) {
            const width = (effectiveSetting.pageSize || '').includes('58') ? '58mm' : '80mm';
            return `@page { size: ${width} auto; margin: 4mm; }`;
        }
        return `@page { size: ${effectiveSetting.pageSize || 'A4'}; margin: 12mm; }`;
    }, [effectiveSetting.pageSize, isReceipt]);

    const handlePrint = useCallback(() => {
        if (!order) return;
        const iframe = printFrameRef.current;
        const doc = iframe?.contentDocument ?? iframe?.contentWindow?.document;
        if (!iframe || !doc) return;

        const markup = renderToStaticMarkup(<BillContent order={order} store={store} setting={effectiveSetting} />);
        doc.open();
        doc.write(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bill ${order.orderNumber}</title><style>${PRINT_BILL_CSS}\n${pageCss}</style></head><body>${markup}</body></html>`,
        );
        doc.close();

        // Wait one frame so the browser lays out the injected document before
        // opening the print dialog.
        requestAnimationFrame(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        });
    }, [order, store, effectiveSetting, pageCss]);

    if (!order) return null;

    return (
        <Modal
            show={show}
            onHide={onHide}
            style={{ display: 'block', paddingLeft: '0px' }}
            dialogClassName="modal-dialog-centered modal-lg"
        >
            <style>{PRINT_BILL_CSS}</style>

            <Modal.Header className="border-0">
                <Modal.Title className="d-flex align-items-center gap-2">
                    <Icon name="receipt-text" className="text-primary" />
                    Print Bill
                </Modal.Title>
                <Button className="btn-close btn-close-modal" variant="default" onClick={onHide}>
                    <Icon name="x" />
                </Button>
            </Modal.Header>

            <Modal.Body>
                {printDisabled && (
                    <Alert variant="warning" className="d-flex align-items-center gap-2 py-2 px-3 mb-4">
                        <Icon name="circle-alert" className="fs-5 flex-shrink-0" />
                        <span className="fs-14">
                            Printing is currently <strong>disabled</strong> in Print Settings. Enable it to print bills.
                        </span>
                    </Alert>
                )}

                {loading ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <Spinner animation="border" className="me-2" size="sm" />
                        Preparing bill...
                    </div>
                ) : (
                    <>
                        <p className="pb-caption">
                            Page size: <strong>{effectiveSetting.pageSize || 'A4'}</strong> · {isReceipt ? 'Receipt' : 'Invoice'} format
                        </p>
                        <div className="pb-paper">
                            <BillContent order={order} store={store} setting={effectiveSetting} />
                        </div>
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                <Button variant="primary" className="d-inline-flex align-items-center" onClick={handlePrint} disabled={printDisabled || loading}>
                    <Icon name="printer" className="me-1" />
                    Print Bill
                </Button>
            </Modal.Footer>

            <iframe ref={printFrameRef} title="print-frame" className="pb-print-frame" />
        </Modal>
    );
};

export default memo(PrintBillModal);
