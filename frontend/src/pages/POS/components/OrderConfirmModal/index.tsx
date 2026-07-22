import { Button, Modal, Table } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import type { CartItem } from '@/types';
import { toTitleCase } from '@/utils';

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */
interface OrderConfirmModalProps {
    show: boolean;
    onHide: () => void;
    onConfirm: () => void;
    isProcessing: boolean;
    orderType: string;
    tableName: string | null;
    customerName: string | null;
    cartItems: CartItem[];
    subtotal: number;
    vatAmount: number;
    serviceTaxAmount: number;
    total: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
function OrderConfirmModal({
    show,
    onHide,
    onConfirm,
    isProcessing,
    orderType,
    tableName,
    customerName,
    cartItems,
    subtotal,
    vatAmount,
    serviceTaxAmount,
    total,
}: OrderConfirmModalProps) {
    return (
        <Modal show={show} onHide={onHide} centered size="lg" dialogClassName="order-confirm-dialog">
            <Modal.Header closeButton className="border-bottom pb-3">
                <div>
                    <Modal.Title className="fs-5 fw-semibold d-flex align-items-center gap-2">
                        <Icon name="clipboard-list" className="fs-4 text-primary" />
                        Confirm Order
                    </Modal.Title>
                    <p className="mb-0 text-muted fs-13 mt-1">
                        Please review your order before placing it.
                    </p>
                </div>
            </Modal.Header>

            <Modal.Body className="py-3">
                {/* ---- Order Info ---- */}
                <div className="bg-light rounded-3 p-3 mb-3">
                    <div className="d-flex flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <Icon name="wine" className="text-muted fs-5" />
                            <div>
                                <small className="text-muted d-block fs-11">Order Type</small>
                                <span className="fw-semibold fs-14">{toTitleCase(orderType)}</span>
                            </div>
                        </div>
                        {tableName && (
                            <div className="d-flex align-items-center gap-2">
                                <Icon name="table-2" className="text-muted fs-5" />
                                <div>
                                    <small className="text-muted d-block fs-11">Table</small>
                                    <span className="fw-semibold fs-14">{tableName}</span>
                                </div>
                            </div>
                        )}
                        <div className="d-flex align-items-center gap-2">
                            <Icon name="user" className="text-muted fs-5" />
                            <div>
                                <small className="text-muted d-block fs-11">Customer</small>
                                <span className="fw-semibold fs-14">{customerName ?? 'Walk-in'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ---- Items Table ---- */}
                <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2">
                    <Icon name="shopping-bag" className="fs-5" />
                    Ordered Items
                    <span className="badge bg-primary rounded-pill fs-12">{cartItems.length}</span>
                </h6>

                <div className="border rounded-3 overflow-hidden mb-3">
                    <Table className="mb-0 fs-13" size="sm">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-2 ps-3">Item</th>
                                <th className="py-2 text-center" style={{ width: 80 }}>Qty</th>
                                <th className="py-2 text-end" style={{ width: 100 }}>Price</th>
                                <th className="py-2 text-end pe-3" style={{ width: 100 }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item) => (
                                <tr key={item.id}>
                                    <td className="ps-3 py-2">
                                        <div className="fw-medium text-dark">{item.item.name}</div>
                                        {item.variationName && (
                                            <small className="text-muted">{item.variationName}</small>
                                        )}
                                        {item.note && (
                                            <small className="d-block text-muted fst-italic">
                                                Note: {item.note}
                                            </small>
                                        )}
                                    </td>
                                    <td className="text-center py-2">{item.quantity}</td>
                                    <td className="text-end py-2">${Number(item.unitPrice).toLocaleString()}</td>
                                    <td className="text-end pe-3 py-2 fw-medium">
                                        ${item.totalPrice.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                {/* ---- Payment Summary ---- */}
                <div className="bg-light rounded-3 p-3">
                    <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2">
                        <Icon name="receipt" className="fs-5" />
                        Payment Summary
                    </h6>
                    <div className="d-flex justify-content-between mb-1 fs-14">
                        <span className="text-muted">Sub Total (tax incl.)</span>
                        <span className="fw-medium text-dark">${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1 fs-14">
                        <span className="text-muted">VAT (10%)</span>
                        <span className="fw-medium text-dark">${vatAmount.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2 fs-14">
                        <span className="text-muted">Service Tax (5%)</span>
                        <span className="fw-medium text-dark">${serviceTaxAmount.toLocaleString()}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between fs-5 fw-bold">
                        <span>Total</span>
                        <span className="text-primary">${total.toLocaleString()}</span>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="border-top pt-3">
                <Button variant="light" onClick={onHide} disabled={isProcessing} className="d-flex align-items-center gap-1">
                    <Icon name="x" />
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className="d-flex align-items-center gap-1 px-4"
                >
                    {isProcessing ? (
                        <>
                            <span className="spinner-border spinner-border-sm" />
                            Placing Order...
                        </>
                    ) : (
                        <>
                            <Icon name="circle-check-big" />
                            Confirm & Place Order
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default OrderConfirmModal;
