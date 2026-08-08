import Icon from '@/components/common/Icon';
import ItemStatusBadge from '@/components/common/ItemStatusBadge';
import type { OrderSummary } from '@/types';
import { computeKitchenSplitItems, formatDateTimeOrder, formatHourAndMinute, toTitleCase } from '@/utils';
import { memo } from 'react';
import { Button } from 'react-bootstrap';
import Offcanvas from 'react-bootstrap/Offcanvas';

function OrderModal({
    show = false,
    onHide,
    orderContent = null,
}: {
    show: boolean;
    onHide: () => void;
    orderContent: OrderSummary | null;
}) {
    // Same split detection as the kitchen card: when the same menu item was
    // ordered again after the first batch was prepared, tag the fresh lines as
    // "Extra" and their started siblings with their status.
    const { extraIds, splitStartedIds } = computeKitchenSplitItems(orderContent?.items ?? []);

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header className="d-block border-bottom">
                <div className="d-flex align-items-center justify-content-between">
                    <Offcanvas.Title>Order : {orderContent?.orderNumber}</Offcanvas.Title>
                    <Button className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" onClick={onHide}>
                        <Icon name="x" style={{ color: 'black' }} />
                    </Button>
                </div>
            </Offcanvas.Header>

            <Offcanvas.Body>
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h6 className="mb-0">Order Status</h6>

                            <h6 className="mb-0 fw-semibold d-flex align-items-center gap-1">
                                <Icon name="clock" className="fs-14" />
                                {formatHourAndMinute(orderContent?.orderedAt)}
                            </h6>
                        </div>

                        <div className="row g-3">
                            <div className="col-4 text-center">
                                <div className="avatar bg-primary rounded-circle mb-2">
                                    <Icon name="shopping-bag" />
                                </div>
                                <p>Accepted</p>
                            </div>

                            <div className="col-4 text-center">
                                <div className="avatar bg-warning rounded-circle mb-2">
                                    <Icon name="cooking-pot" />
                                </div>
                                <p>In Kitchen</p>
                            </div>

                            <div className="col-4 text-center">
                                <div className="avatar bg-light rounded-circle mb-2 text-dark">
                                    <Icon name="flag" />
                                </div>
                                <p>Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

                <hr />

                <h5>Order Info</h5>

                <div className="d-flex justify-content-between mb-2">
                    <span>Date & Time</span>
                    <strong>{formatDateTimeOrder(orderContent?.orderedAt)}</strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                    <span>Order No</span>
                    <strong>{orderContent?.orderNumber}</strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                    <span>Token No</span>
                    <strong>{orderContent?.tokenNo || '-'}</strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                    <span>No of Items</span>
                    <strong>{orderContent?.items.length}</strong>
                </div>

                <div className="d-flex justify-content-between">
                    <span>Order Type</span>
                    <strong>
                        {toTitleCase(orderContent?.orderType)}
                        {orderContent?.tableNumber ? `(Table ${orderContent?.tableNumber})` : ''}
                    </strong>
                </div>

                <hr />

                <h5>Items</h5>

                {orderContent?.items.map((item) => {
                    return (
                        <div key={item.id} className="mb-3">
                            <div className="fw-semibold">
                                {item.itemName} <span>x{item.quantity}</span>
                                <ItemStatusBadge
                                    status={splitStartedIds.has(item.id) ? item.status : null}
                                    extra={extraIds.has(item.id)}
                                />
                            </div>

                            {item.kitchenNote && (
                                <div className="bg-light rounded p-2 mt-1">Notes: {item.kitchenNote}</div>
                            )}
                        </div>
                    );
                })}

                <hr />

                <div className="d-flex justify-content-between mb-2">
                    <span>Sub Total</span>
                    <strong>${orderContent?.subtotal}</strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                    <span>Tax (10%)</span>
                    <strong>${orderContent?.taxAmount}</strong>
                </div>

                <div className="d-flex justify-content-between mb-3">
                    <span>Service Charge</span>
                    <strong>${orderContent?.serviceCharge}</strong>
                </div>

                <h4 className="d-flex justify-content-between">
                    <span>Total</span>
                    <span>${orderContent?.grandTotal}</span>
                </h4>
            </Offcanvas.Body>
        </Offcanvas>
    );
}

export default memo(OrderModal);
