import Icon from '@/components/common/Icon';
import { Button, Card, Col, Dropdown } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useCallback, useMemo, useState } from 'react';

import styles from './TabContent.module.scss';
import { bindCx, formatHourAndMinute, formatString, orderUtils, toTitleCase } from '@/utils';
import {
    ROUTE_PERMISSION_MAP,
    type ConfirmType,
    type ModalActionProps,
    type OrderStatus,
    type OrderSummary,
    type OrderUpdateStatus,
} from '@/types';
import type { PaymentRequest } from '@/services/orderService';
import OrderActionDropdown from '../OrderActionDropdown';
import { KITCHEN_QUERY_KEYS, ORDER_STATUS_ERROR_TITLE, POS_QUERY_KEYS, statuses } from '@/constants';
import { useUpdateStatus, usePayOrder } from '@/hooks/order/';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import ApprovalRequestModal from '@/components/common/ApprovalRequestModal';
import OrderModal from '../OrderModal';
import PayOrderModal from '../PayOrderModal';
import OrderItemRow from '../OrderItemRow';
import { queryClient } from '@/lib';
import useAuth from '@/hooks/useAuth';

const cx = bindCx(styles);

const VISIBLE_ITEMS_COUNT = 3;

export type TabContentProps = ModalActionProps;

const TabContent = ({ order }: { order: OrderSummary }) => {
    const { showToast } = useContextData(ToastContext);

    const [showItems, setShowItems] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showOrderPay, setShowOrderPay] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<OrderUpdateStatus>();
    const [confirmType, setConfirmType] = useState<ConfirmType>('update');
    const [showApprovalModal, setShowApprovalModal] = useState(false);

    const updateStatusMutate = useUpdateStatus();
    const payOrderMutate = usePayOrder();

    // Replaces the `if (index <= 2) return (...)` pattern, which silently returns
    // `undefined` for the other array slots on every render
    const visibleItems = useMemo(() => order.items.slice(0, VISIBLE_ITEMS_COUNT), [order.items]);
    const hiddenItems = useMemo(() => order.items.slice(VISIBLE_ITEMS_COUNT), [order.items]);
    const hiddenCount = hiddenItems.length;

    const handleOpenOrderModal = useCallback(() => setShowOrderModal(true), []);
    const handleCloseOrderModal = useCallback(() => setShowOrderModal(false), []);

    const handleRequestStatusUpdate = useCallback(
        (status: OrderStatus) => {
            if (!orderUtils.canTransition(order.status, status)) {
                showToast('error', ORDER_STATUS_ERROR_TITLE[order.status]);
                return;
            }

            setUpdateStatus({
                id: order.id,
                orderNumber: order.orderNumber,
                status,
            });
            setConfirmType(status === 'cancelled' ? 'cancel' : status === 'completed' ? 'complete' : 'update');

            // Cancelling an invoice requires manager approval before it takes
            // effect on the system.
            if (status === 'cancelled') {
                setShowApprovalModal(true);
            } else {
                setShowConfirmModal(true);
            }
        },
        [order.id, order.orderNumber, order.status, showToast],
    );

    const handleCloseOrderPay = useCallback(() => setShowOrderPay(false), []);

    const handleConfirm = useCallback(() => {
        if (updateStatus) {
            // The useUpdateStatus hook's onSuccess/onError already shows toasts.
            // No need to duplicate feedback handling here.
            updateStatusMutate.mutate(updateStatus, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: KITCHEN_QUERY_KEYS.all });
                    queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.tables() });
                },
            });
        }
        setShowConfirmModal(false);
    }, [updateStatus, updateStatusMutate]);

    const handlePaymentComplete = useCallback(
        (paymentData: PaymentRequest) =>
            payOrderMutate.mutate(
                {
                    id: order.id,
                    paymentData,
                },
                {
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.tables() });
                    },
                },
            ),
        [order.id, payOrderMutate],
    );

    const { pathname } = useLocation();
    const { hasPermission } = useAuth();

    return (
        <>
            <Col xxl={4} xl={6} md={6} className="d-flex">
                <Card className="flex-fill">
                    <Card.Body>
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div className="avatar avatar-lg bg-primary rounded-circle">
                                    <Icon name="shopping-bag" />
                                </div>
                                <div>
                                    <h6 className="mb-1 fs-14 fw-semibold">
                                        <Link to={''} onClick={handleOpenOrderModal}>
                                            {order.orderNumber}
                                        </Link>
                                    </h6>
                                    <p className="mb-0 d-flex align-items-center gap-2">
                                        {toTitleCase(order.orderType)}
                                        <span>|</span>
                                        Table No : {order.tableNumber || '-'}
                                    </p>
                                </div>
                            </div>
                            {hasPermission(ROUTE_PERMISSION_MAP[pathname], 'view') && (
                                <OrderActionDropdown
                                    actions={{
                                        cx,
                                        onUpdateStatus: handleRequestStatusUpdate,
                                        onPay: orderUtils.onPay,
                                        onPrint: orderUtils.onPrint,
                                        onOpenModal: setShowOrderPay,
                                    }}
                                    order={order}
                                />
                            )}
                        </div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <p className="mb-0 fs-12 fw-semibold text-dark">
                                <span className="fw-normal">Token No :</span> {order.tokenNo || '-'}
                            </p>
                            <h6 className="mb-0 fw-semibold d-flex align-items-center gap-1">
                                <Icon name="clock" className="fs-14" />
                                {formatHourAndMinute(order.orderedAt)}
                            </h6>
                        </div>
                        <div
                            className="mb-3 pb-3 border-bottom"
                            style={{
                                minHeight: '250px',
                                height: '300px',
                            }}
                        >
                            <div
                                className="orders-list"
                                style={{
                                    height: '100%',
                                    overflowY: 'scroll',
                                }}
                            >
                                {visibleItems.map((item) => (
                                    <OrderItemRow key={item.id} item={item} />
                                ))}

                                {showItems && (
                                    <div className="more-menu">
                                        {hiddenItems.map((item) => (
                                            <OrderItemRow key={item.id} item={item} />
                                        ))}
                                    </div>
                                )}

                                {hiddenCount > 0 && (
                                    <div className="view-all mt-1">
                                        <button
                                            className="fw-semibold fs-14 mb-0 text-primary viewall-button"
                                            onClick={() => setShowItems((prev) => !prev)}
                                        >
                                            {showItems ? 'Show less' : `+${hiddenCount} More Items`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <p className="badge badge-soft-success mb-0">{formatString(order.paymentStatus)}</p>
                            {hasPermission(ROUTE_PERMISSION_MAP[pathname], 'edit') ? (
                                <Dropdown>
                                    <Dropdown.Toggle
                                        variant=""
                                        className=" btn btn-white d-inline-flex align-items-center"
                                    >
                                        {formatString(order.status)}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        {statuses
                                            .filter((status) => status !== order.status)
                                            .map((status) => (
                                                <Dropdown.Item
                                                    key={status}
                                                    onClick={() => handleRequestStatusUpdate(status)}
                                                >
                                                    {formatString(status)}
                                                </Dropdown.Item>
                                            ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            ) : (
                                <div className="dropdown">
                                    <Button
                                        variant="default"
                                        className=" btn btn-white d-inline-flex align-items-center"
                                        disabled
                                    >
                                        {formatString(order.status)}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            <OrderModal onHide={handleCloseOrderModal} show={showOrderModal} orderContent={order || null} />
            <PayOrderModal
                show={showOrderPay}
                handleClose={handleCloseOrderPay}
                order={order}
                onPaymentComplete={handlePaymentComplete}
                isPaymentProcessing={payOrderMutate.isPending}
            />

            <ConfirmModal
                action={handleConfirm}
                data={`${updateStatus?.orderNumber}`}
                handleClose={() => setShowConfirmModal(false)}
                type={confirmType}
                show={showConfirmModal}
            />

            {/* Cancelling an invoice requires approval — the status is only
                changed once a manager approves the request. */}
            <ApprovalRequestModal
                show={showApprovalModal}
                onHide={() => setShowApprovalModal(false)}
                actionLabel="cancel"
                requestType="CANCEL_INVOICE"
                description={`Cancel invoice ${updateStatus?.orderNumber}`}
                targetType="Order"
                targetId={updateStatus?.id}
                targetDisplay={updateStatus?.orderNumber}
                additionalData={updateStatus ? JSON.stringify({ targetId: updateStatus.id }) : null}
                onSent={() => {
                    setShowApprovalModal(false);
                }}
            />
        </>
    );
};

export default TabContent;
