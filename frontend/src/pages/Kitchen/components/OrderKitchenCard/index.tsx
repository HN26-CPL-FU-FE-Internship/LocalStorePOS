import Icon from '@/components/common/Icon';
import { Button, Card, Col } from 'react-bootstrap';

const OrderKitchenCard = () => {
    return (
        <Col xl={4} lg={6} md={6} className="d-flex">
            <Card className="flex-fill mb-0">
                <Card.Header className="bg-gray">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <div className="avatar rounded-circle bg-white">
                                <Icon name="hand-platter" className="fs-24 text-dark" />
                            </div>
                            <p className="mb-0 text-white fw-semibold fs-14">
                                Jennifer Brooks
                                <span className="fs-13 fw-normal d-block mt-1">Dine In</span>
                            </p>
                        </div>
                        <span className="badge bg-white text-center text-dark">#14751</span>
                    </div>
                </Card.Header>
                <Card.Body className="border-bottom">
                    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                        <h6 className="mb-0 fw-normal fs-14">
                            Token No : <span className="fw-semibold">31</span>
                        </h6>
                        <p className="mb-0 fw-normal text-dark">15 Nov 2025, 06:00 PM</p>
                    </div>
                </Card.Body>
                <Card.Body>
                    <div className="orders-list mb-4">
                        <div
                            className="border-bottom-dashed mb-3 pb-3
                        "
                        >
                            <div className="orders text-dark mb-2">
                                <p>
                                    <span className="dot success"></span>Mediterranean Salad - Regular
                                </p>
                                <p className="text-dark">×1</p>
                            </div>
                            <div className="bg-light rounded py-1 px-2">
                                <p className="mb-0 fw-medium d-flex align-items-center text-dark">
                                    <Icon name="badge-info" className="me-1" />
                                    Notes : Extra Spicy
                                </p>
                            </div>
                        </div>

                        <div
                            className="border-bottom-dashed mb-3 pb-3
                        "
                        >
                            <div className="orders text-dark mb-2">
                                <p>
                                    <span className="dot success"></span>Mediterranean Salad - Regular
                                </p>
                                <p className="text-dark">×1</p>
                            </div>
                        </div>

                        <div
                            className="border-bottom-dashed mb-3 pb-3
                        "
                        >
                            <div className="orders text-dark mb-2">
                                <p>
                                    <span className="dot success"></span>Mediterranean Salad - Regular
                                </p>
                                <p className="text-dark">×1</p>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between gap-3">
                        <div className="progress-item">
                            <div className="progress-bar bg-success" style={{ width: '50%' }}></div>
                        </div>
                        <p className="mb-0 fw-normal d-flex align-items-center">
                            <Icon name="clock" className="me-1" /> 20:00
                        </p>
                    </div>
                </Card.Body>
                <Card.Footer className="d-flex align-items-center justify-content-between gap-2 pt-0 border-0 flex-wrap flex-xl-nowrap">
                    <Button className="btn-light w-100 timer-btn">
                        <Icon name="play" className="me-2" />
                        <span className="label">Play</span>
                        <span className="ps-1 fw-semibold time">00:00</span>
                    </Button>

                    <Button className="btn-outline-light w-100">
                        <Icon name="check-check" className="me-2" />
                        <span>Mark Done</span>
                    </Button>
                </Card.Footer>
            </Card>
        </Col>
    );
};

export default OrderKitchenCard;
