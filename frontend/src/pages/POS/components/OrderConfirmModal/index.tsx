import { Button, Modal, Table } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import { calculateLineTotalPrice, toTitleCase } from '@/utils';
import usePOSCreateOrder from '@/stores/pos.store';
import { useShallow } from 'zustand/react/shallow';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import { usePlaceOrder } from '@/hooks/pos';
import axios from 'axios';

interface OrderConfirmModalProps {
    show: boolean;
    onHide: () => void;
    subtotal: number;
    total: number;
    taxAmount: number;
    serviceChargeAmount: number;
    deliveryChargeAmount: number;
}

function OrderConfirmModal({
    show,
    onHide,
    subtotal,
    total,
    taxAmount,
    serviceChargeAmount,
    deliveryChargeAmount,
}: OrderConfirmModalProps) {
    const { cartItems, customer, table, setPlacingOrder, orderActiveType, resetCart, setTable, setCustomer, waiter } =
        usePOSCreateOrder(
            useShallow((s) => ({
                cartItems: s.cartItems,
                customer: s.customer,
                table: s.table,
                waiter: s.waiter,
                setCustomer: s.setCustomer,
                setTable: s.setTable,
                setPlacingOrder: s.setPlacingOrder,
                orderActiveType: s.orderActiveType,
                resetCart: s.resetCart,
            })),
        );

    const { showToast } = useContextData(ToastContext);
    const placeOrderMutation = usePlaceOrder();

    const handlePlaceOrder = () => {
        if (cartItems.length === 0) return;
        setPlacingOrder(placeOrderMutation.isPending);
        placeOrderMutation.mutate(
            {
                orderType: orderActiveType,
                customerId: customer ? Number(customer.value) : null,
                waiterId: Number(waiter?.value),
                tableId: table ? Number(table.value) : null,
                subtotal: Math.round(subtotal * 100) / 100,
                taxAmount,
                serviceCharge: orderActiveType === 'dine_in' ? serviceChargeAmount : 0,
                deliveryCharge: orderActiveType === 'delivery' ? deliveryChargeAmount : 0,
                grandTotal: Math.round(total * 100) / 100,
                note: null,
                items: cartItems.map((c) => ({
                    itemId: c.item.id,
                    variationId: c.variationId,
                    itemName: c.item.name,
                    unitPrice: Math.round(c.unitPrice * 100) / 100,
                    quantity: c.quantity,
                    lineTotal: Math.round(calculateLineTotalPrice(c.unitPrice, c.quantity) * 100) / 100,
                    kitchenNote: c.note || null,
                    addons: c.item.addons.map((addon) => ({
                        addonId: addon.id,
                        addonName: addon.name,
                        addonPrice: addon.price,
                        quantity: addon.quantity,
                    })),
                })),
            },
            {
                onSuccess: () => {
                    showToast('success', 'Order placed successfully!');
                    resetCart();
                    setCustomer(null);
                    setTable(null);
                    onHide();
                },
                onError: (error) => {
                    let message = 'Failed to place order. Please try again.';

                    if (axios.isAxiosError(error)) {
                        message = error.response?.data?.message ?? message;
                    }

                    showToast('error', message);
                },
            },
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg" dialogClassName="order-confirm-dialog">
            <Modal.Header closeButton className="border-bottom pb-3">
                <div>
                    <Modal.Title className="fs-5 fw-semibold d-flex align-items-center gap-2">
                        <Icon name="clipboard-list" className="fs-4 text-primary" />
                        Confirm Order
                    </Modal.Title>
                    <p className="mb-0 text-muted fs-13 mt-1">Please review your order before placing it.</p>
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
                                <span className="fw-semibold fs-14">{toTitleCase(orderActiveType)}</span>
                            </div>
                        </div>
                        {table && (
                            <div className="d-flex align-items-center gap-2">
                                <Icon name="table-2" className="text-muted fs-5" />
                                <div>
                                    <small className="text-muted d-block fs-11">Table</small>
                                    <span className="fw-semibold fs-14">{table.label ?? null}</span>
                                </div>
                            </div>
                        )}
                        <div className="d-flex align-items-center gap-2">
                            <Icon name="user" className="text-muted fs-5" />
                            <div>
                                <small className="text-muted d-block fs-11">Customer</small>
                                <span className="fw-semibold fs-14">{customer?.label ?? 'Walk-in'}</span>
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
                                <th className="py-2 text-center" style={{ width: 80 }}>
                                    Qty
                                </th>
                                <th className="py-2 text-end" style={{ width: 100 }}>
                                    Price
                                </th>
                                <th className="py-2 text-end pe-3" style={{ width: 100 }}>
                                    Total
                                </th>
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
                                            <small className="d-block text-muted fst-italic">Note: {item.note}</small>
                                        )}
                                    </td>
                                    <td className="text-center py-2">{item.quantity}</td>
                                    <td className="text-end py-2">${Number(item.unitPrice).toLocaleString()}</td>
                                    <td className="text-end pe-3 py-2 fw-medium">
                                        ${calculateLineTotalPrice(item.unitPrice, item.quantity).toLocaleString()}
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
                        <span className="text-muted">Sub Total</span>
                        <span className="fw-medium text-dark">${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1 fs-14">
                        <span className="text-muted">Tax Amount</span>
                        <span className="fw-medium text-dark">${taxAmount.toLocaleString()}</span>
                    </div>
                    {orderActiveType === 'dine_in' && (
                        <div className="d-flex justify-content-between mb-1 fs-14">
                            <span className="text-muted">Service Charge</span>
                            <span className="fw-medium text-dark">${serviceChargeAmount.toLocaleString()}</span>
                        </div>
                    )}
                    {orderActiveType === 'delivery' && (
                        <div className="d-flex justify-content-between mb-1 fs-14">
                            <span className="text-muted">Delivery Charge</span>
                            <span className="fw-medium text-dark">${deliveryChargeAmount.toLocaleString()}</span>
                        </div>
                    )}

                    <hr className="my-2" />
                    <div className="d-flex justify-content-between fs-5 fw-bold">
                        <span>Total</span>
                        <span className="text-primary">${total.toLocaleString()}</span>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="border-top pt-3">
                <Button
                    variant="light"
                    onClick={onHide}
                    disabled={placeOrderMutation.isPending}
                    className="d-flex align-items-center gap-1"
                >
                    <Icon name="x" />
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handlePlaceOrder}
                    disabled={placeOrderMutation.isPending}
                    className="d-flex align-items-center gap-1 px-4"
                >
                    {placeOrderMutation.isPending ? (
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
