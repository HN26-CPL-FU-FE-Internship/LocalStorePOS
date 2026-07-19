import Icon from '@/components/common/Icon';
import { paymentTypes } from '@/constants';
import { Button, Col, Modal, Nav, Row, Tab } from 'react-bootstrap';
import { CardPaymentTab, CashPaymentTab, ScanPaymentTab } from '../Payment';
import type { OrderSummary } from '@/types';
import { toTitleCase } from '@/utils';
import { memo } from 'react';

const PayOrderModal = ({
    show,
    order,
    handleClose,
}: {
    show: boolean;
    order: OrderSummary | null;
    handleClose: () => void;
}) => {
    return (
        <Modal
            show={show}
            onHide={handleClose}
            style={{
                display: 'block',
                paddingLeft: '0px',
            }}
            dialogClassName="modal-dialog-centered modal-lg"
        >
            <Modal.Header className="border-0">
                <Modal.Title>Pay & Complete Order</Modal.Title>
                <Button className="btn-close btn-close-modal" variant="default" onClick={handleClose}>
                    <Icon name="x" />
                </Button>
            </Modal.Header>
            <Modal.Body>
                <div className="p-3 border rounded mb-4">
                    <h3 className="text-center mb-0">Final Total : ${order?.grandTotal}</h3>
                </div>

                <Row className="g-4">
                    <Col lg={6} className="border-end">
                        <div className="mb-3 pb-3 border-bottom">
                            <h5 className="mb-3 fs-16">Order Info</h5>
                            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                                Order No <span className="fw-medium text-dark"> {order?.orderNumber}</span>
                            </h6>
                            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                                No of Items <span className="fw-medium text-dark"> {order?.items.length}</span>
                            </h6>
                            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-0">
                                Order Type
                                <span className="fw-medium text-dark">
                                    {' '}
                                    {toTitleCase(order?.orderType)}{' '}
                                    {order?.tableNumber ? `(TabIe ${order.tableNumber})` : ''}{' '}
                                </span>
                            </h6>
                        </div>

                        <div className="mb-3 pb-3 border-bottom orders-list">
                            <h5 className="mb-3 fs-16">Ordered Menus</h5>

                            {order?.items.map((item) => (
                                <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3 orders-two">
                                    {item.itemName} ×{item.quantity} <span className="line"></span>
                                    <span className="fw-medium text-dark">$49</span>
                                </h6>
                            ))}
                        </div>

                        <div>
                            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                                Sub Total<span className="fw-medium text-dark">${order?.subtotal}</span>
                            </h6>
                            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                                Tax (10%)<span className="fw-medium text-dark"> ${order?.taxAmount}</span>
                            </h6>
                            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                                Discount (15%)<span className="fw-medium text-dark"> ${order?.discountAmount}</span>
                            </h6>
                            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                                Service Charge <span className="fw-medium text-dark"> ${order?.serviceCharge}</span>
                            </h6>
                            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                                Coupon (FIRSTORDER) <span className="fw-medium text-danger"> -$45</span>
                            </h6>
                            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-0">
                                Tip <span className="fw-medium text-dark"> ${order?.tipAmount}</span>
                            </h6>
                        </div>
                    </Col>

                    <Col lg={6}>
                        <Tab.Container defaultActiveKey="cash">
                            <div>
                                <h6 className="mb-3">Payment Type</h6>

                                <Nav variant="tabs" fill className="nav-tabs nav-tabs-solid border-0 flex-nowrap mb-4">
                                    {paymentTypes.map((item) => (
                                        <Nav.Item key={item.key}>
                                            <Nav.Link
                                                eventKey={item.key}
                                                className="d-flex align-items-center justify-content-center"
                                            >
                                                <Icon name={item.icon} className="me-1" />
                                                {item.label}
                                            </Nav.Link>
                                        </Nav.Item>
                                    ))}
                                </Nav>

                                <Tab.Content>
                                    <Tab.Pane eventKey="cash">
                                        <CashPaymentTab />
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="card">
                                        <CardPaymentTab />
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="scan">
                                        <ScanPaymentTab />
                                    </Tab.Pane>
                                </Tab.Content>
                            </div>
                        </Tab.Container>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleClose}>
                    Pay & Complete Order
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default memo(PayOrderModal);
