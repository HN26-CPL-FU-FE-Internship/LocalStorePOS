import { Modal, InputGroup, Form, Tabs, Tab, Button, Badge } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import { customerSearchResults, orderSearchResults, kitchenSearchResults } from '@/data/dashboardData';

export interface SearchModalProps {
    show: boolean;
    onHide: () => void;
}

const SearchModal = ({ show, onHide }: SearchModalProps) => {
    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title as="h5" className="mb-0">
                    Search
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <InputGroup className="mb-4">
                    <Form.Control type="text" size="lg" className="fs-14" placeholder="Search your keyword" />
                    <InputGroup.Text>
                        <Icon name="search" className="text-dark" />
                    </InputGroup.Text>
                </InputGroup>

                <Tabs defaultActiveKey="customer" className="nav-bordered nav-bordered-primary mb-4">
                    <Tab
                        eventKey="customer"
                        title={
                            <span className="d-flex align-items-center">
                                <Icon name="badge-dollar-sign" className="me-2" />
                                Customer
                            </span>
                        }
                    >
                        {customerSearchResults.map((customer, index) => (
                            <div
                                key={customer.id}
                                className={`d-flex align-items-center justify-content-between pb-3 mb-3 ${
                                    index < customerSearchResults.length - 1 ? 'border-bottom' : ''
                                }`}
                            >
                                <div className="d-flex align-items-center">
                                    <div className="avatar avatar-rounded me-2">
                                        {customer.avatarUrl ? (
                                            <img src={customer.avatarUrl} alt="customer" />
                                        ) : (
                                            <span className="avatar-rounded bg-light text-dark border d-flex align-items-center justify-content-center h-100">
                                                <Icon name="user" className="fs-20" />
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h6 className="fs-14 fw-semibold mb-1">{customer.name}</h6>
                                        <p className="fs-13 mb-0">{customer.gender}</p>
                                    </div>
                                </div>
                                <Badge bg="light" text="dark">
                                    {customer.code}
                                </Badge>
                            </div>
                        ))}
                        <Button variant="white" size="sm" href="lorem ipsum" className="w-100 mt-1">
                            View All <Icon name="arrow-right" className="ms-1" />
                        </Button>
                    </Tab>

                    <Tab
                        eventKey="orders"
                        title={
                            <span className="d-flex align-items-center">
                                <Icon name="badge-dollar-sign" className="me-2" />
                                Orders
                            </span>
                        }
                    >
                        {orderSearchResults.map((order, index) => (
                            <div
                                key={order.id}
                                className={`d-flex align-items-sm-center justify-content-between flex-column gap-2 flex-sm-row pb-3 ${
                                    index < orderSearchResults.length - 1 ? 'mb-3 border-bottom' : ''
                                }`}
                            >
                                <div className="d-flex align-items-center">
                                    <div className="avatar avatar-rounded bg-light text-dark me-2">
                                        <Icon name="shopping-bag" className="fs-24" />
                                    </div>
                                    <div>
                                        <h6 className="fs-14 fw-semibold mb-1">{order.orderNo}</h6>
                                        <div className="d-flex align-items-center gap-2">
                                            <p className="mb-0">{order.type}</p>
                                            {order.tableNo && (
                                                <>
                                                    <span className="even-line" />
                                                    <p className="mb-0">Table No : {order.tableNo}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Badge bg="light" text="dark">
                                    Token No : {order.tokenNo}
                                </Badge>
                            </div>
                        ))}
                        <Button variant="white" size="sm" href="lorem ipsum" className="w-100 mt-1">
                            View All <Icon name="arrow-right" className="ms-1" />
                        </Button>
                    </Tab>

                    <Tab
                        eventKey="kitchen"
                        title={
                            <span className="d-flex align-items-center">
                                <Icon name="shopping-bag" className="me-2" />
                                Kitchen
                            </span>
                        }
                    >
                        {kitchenSearchResults.map((item, index) => (
                            <div
                                key={item.id}
                                className={`d-flex align-items-center justify-content-between pb-3 ${
                                    index < kitchenSearchResults.length - 1 ? 'mb-3 border-bottom' : ''
                                }`}
                            >
                                <div className="d-flex align-items-center">
                                    <div className="avatar avatar-rounded bg-light text-dark me-2">
                                        <Icon name="hand-platter" className="fs-24" />
                                    </div>
                                    <div>
                                        <h6 className="fs-14 fw-semibold mb-1">{item.name}</h6>
                                        <p className="fs-13 mb-0">{item.ref}</p>
                                    </div>
                                </div>
                                <Badge bg="light" text="dark">
                                    {item.tokenNo}
                                </Badge>
                            </div>
                        ))}
                        <Button variant="white" size="sm" href="lorem ipsum" className="w-100 mt-1">
                            View All <Icon name="arrow-right" className="ms-1" />
                        </Button>
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    );
};

export default SearchModal;
