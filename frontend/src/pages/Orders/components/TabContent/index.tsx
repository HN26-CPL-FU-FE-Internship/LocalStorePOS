import Icon from '@/components/common/Icon';
import { Card, Col, Dropdown, DropdownButton } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './TabContent.module.scss';
import { bindCx } from '@/utils';

const cx = bindCx(styles);

const TabContent = () => {
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
                                        <Link to={''}>#56998</Link>
                                    </h6>
                                    <p className="mb-0 d-flex align-items-center gap-2">
                                        Dine In
                                        <span>|</span>
                                        Table No : 3
                                    </p>
                                </div>
                            </div>

                            <DropdownButton title as={'div'} drop={'start'} variant="" className={cx('dropstart')}>
                                <Dropdown.Item eventKey="1">Action</Dropdown.Item>
                                <Dropdown.Item eventKey="2">Another action</Dropdown.Item>
                                <Dropdown.Item eventKey="3">Something else here</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item eventKey="4">Separated link</Dropdown.Item>
                            </DropdownButton>
                        </div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <p className="mb-0 fs-14 fw-semibold text-dark">
                                <span className="fw-normal">Token No :</span> 24
                            </p>
                            <h6 className="mb-0 fw-semibold d-flex align-items-center gap-1">
                                <Icon name="clock" className="fs-14" />
                                06:24 PM
                            </h6>
                        </div>
                        <div className="mb-3 pb-3 border-bottom">
                            <div className="orders-list">
                                <div className="orders text-dark mb-3">
                                    <p>
                                        <span className="dot"></span>Grilled Chicken
                                    </p>
                                    <span className="line"></span>
                                    <p className="text-dark">×1</p>
                                </div>
                                <div className="orders text-dark mb-2">
                                    <p>
                                        <span className="dot"></span>Grilled Chicken
                                    </p>
                                    <span className="line"></span>
                                    <p className="text-dark">×1</p>
                                </div>
                                <div className="bg-light rounded py-1 px-2 mb-3">
                                    <p className="mb-0 fw-medium d-flex align-items-center text-dark">
                                        <Icon name="icon-badge-info" className="me-1" />
                                        Notes : Extra Spicy
                                    </p>
                                </div>
                                <div className="orders text-dark mb-3">
                                    <p>
                                        <span className="dot"></span>Grilled Chicken
                                    </p>
                                    <span className="line"></span>
                                    <p className="text-dark">×1</p>
                                </div>
                                <div className="more-menu d-none">
                                    <div className="orders text-dark mb-3">
                                        <p>
                                            <span className="dot"></span>Grilled Chicken
                                        </p>
                                        <span className="line"></span>
                                        <p className="text-dark">×1</p>
                                    </div>
                                    <div className="orders text-dark mb-3">
                                        <p>
                                            <span className="dot"></span>Grilled Chicken
                                        </p>
                                        <span className="line"></span>
                                        <p className="text-dark">×1</p>
                                    </div>
                                </div>
                                <div className="view-all mt-1">
                                    <button className="fw-semibold fs-14 mb-0 text-primary viewall-button">
                                        +2 More Items
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <p className="badge badge-soft-success mb-0">Billed</p>
                            <Dropdown>
                                <Dropdown.Toggle variant="" className=" btn btn-white d-inline-flex align-items-center">
                                    Pending
                                </Dropdown.Toggle>
                                <Dropdown.Menu as={'ul'}>
                                    <li>
                                        <Dropdown.Item className="rounded">Pending</Dropdown.Item>
                                        <Dropdown.Item className="rounded">Preparing</Dropdown.Item>
                                        <Dropdown.Item className="rounded">Served</Dropdown.Item>
                                        <Dropdown.Item className="rounded">Delivered</Dropdown.Item>
                                        <Dropdown.Item className="rounded">Completed</Dropdown.Item>
                                        <Dropdown.Item className="rounded">Cancel</Dropdown.Item>
                                    </li>
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
