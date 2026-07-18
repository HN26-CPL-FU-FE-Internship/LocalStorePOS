import Icon from '@/components/common/Icon';
import { Card, Col, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Fragment, useState } from 'react';

import styles from './TabContent.module.scss';
import { bindCx, formatHourAndMinute, formatString, toTitleCase } from '@/utils';
import type { ModalActionProps, OrderSummary } from '@/types';
import OrderActionDropdown from '../OrderActionDropdown';
import { statuses } from '@/constants';
import { useUpdateStatus } from '@/hooks/order/';

const cx = bindCx(styles);

export type TabContentProps = ModalActionProps & {
    onClick: (value: OrderSummary) => void;
};

const TabContent = ({ actions, order }: { actions: TabContentProps; order: OrderSummary }) => {
    const [show, setShow] = useState(false);

    const updateStatusMutate = useUpdateStatus();
    const handleUpdateStatus = (status: string) => {
        updateStatusMutate.mutate({ status, id: order.id }, {});
    };

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
                                        <Link to={''} onClick={() => actions.onClick(order)}>
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
                            <OrderActionDropdown
                                actions={{
                                    ...actions,
                                    cx,
                                }}
                                order={order}
                            />
                        </div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <p className="mb-0 fs-14 fw-semibold text-dark">
                                <span className="fw-normal">Token No :</span> {order.tokenNo || '-'}
                            </p>
                            <h6 className="mb-0 fw-semibold d-flex align-items-center gap-1">
                                <Icon name="clock" className="fs-14" />
                                {formatHourAndMinute(order.orderedAt)}
                            </h6>
                        </div>
                        <div className="mb-3 pb-3 border-bottom">
                            <div className="orders-list">
                                {order.items.map((o, index) => {
                                    if (index <= 2)
                                        return (
                                            <Fragment key={o.id}>
                                                <div className={`orders text-dark mb-${o.kitchenNote ? '2' : '3'}`}>
                                                    <p>
                                                        <span className="dot"></span>
                                                        {`${o.itemName} ${o.sizeName ? ` - ${o.sizeName}` : ''}`}
                                                    </p>
                                                    <span className="line"></span>
                                                    <p className="text-dark">x{o.quantity}</p>
                                                </div>

                                                {o.kitchenNote && (
                                                    <div className="bg-light rounded py-1 px-2 mb-3">
                                                        <p className="mb-0 fw-medium d-flex align-items-center text-dark">
                                                            <Icon name="icon-badge-info" className="me-1" />
                                                            Notes : {`${o.kitchenNote}`}
                                                        </p>
                                                    </div>
                                                )}
                                            </Fragment>
                                        );
                                })}

                                <div className={`more-menu ${show ? '' : 'd-none'}`}>
                                    {order.items.map((o, index) => {
                                        if (index > 2)
                                            return (
                                                <Fragment key={o.id}>
                                                    <div className={`orders text-dark mb-${o.kitchenNote ? '2' : '3'}`}>
                                                        <p>
                                                            <span className="dot"></span>
                                                            {`${o.itemName} ${o.sizeName ? `'-'${o.sizeName}` : ''}`}
                                                        </p>
                                                        <span className="line"></span>
                                                        <p className="text-dark">x{o.quantity}</p>
                                                    </div>

                                                    {o.kitchenNote && (
                                                        <div className="bg-light rounded py-1 px-2 mb-3">
                                                            <p className="mb-0 fw-medium d-flex align-items-center text-dark">
                                                                <Icon name="icon-badge-info" className="me-1" />
                                                                Notes : {o.kitchenNote}
                                                            </p>
                                                        </div>
                                                    )}
                                                </Fragment>
                                            );
                                    })}
                                </div>

                                {order.items.length - 3 > 0 && (
                                    <div className="view-all mt-1">
                                        <button
                                            className="fw-semibold fs-14 mb-0 text-primary viewall-button"
                                            onClick={() => setShow(!show)}
                                        >
                                            {show ? 'Show less' : `+${order.items.length - 3} More Items`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <p className="badge badge-soft-success mb-0">{formatString(order.paymentStatus)}</p>
                            <Dropdown>
                                <Dropdown.Toggle variant="" className=" btn btn-white d-inline-flex align-items-center">
                                    {formatString(order.status)}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {statuses.map((status) => (
                                        <Dropdown.Item key={status} onClick={() => handleUpdateStatus(status)}>
                                            {formatString(status)}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </>
    );
};

export default TabContent;
