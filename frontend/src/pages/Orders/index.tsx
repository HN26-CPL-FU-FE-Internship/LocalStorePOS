import Icon from '@/components/common/Icon';
import PageHeader from '@/components/common/PageHeader';
import { Button, Card, Col, Nav, Row } from 'react-bootstrap';
import TabContent from './components/TabContent';

const Orders = () => {
    return (
        <>
            <PageHeader title="Orders" />

            <Row className="orders-list-four">
                <Col xxl={2} lg={4} md={4} sm={6}>
                    <Card>
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <div>
                                    <span className="fs-13 fw-medium mb-1 d-block">Confirmed</span>
                                    <h4 className="mb-0">98</h4>
                                </div>
                                <div className="avatar bg-soft-secondary fs-20 rounded-circle flex-shrink-0">
                                    <Icon name="bookmark-check" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 pb-4 mb-4 border-bottom">
                <Nav as={'ul'} className="nav-tabs nav-tabs-solid border-0" activeKey={'all'}>
                    <Nav.Item as={'li'}>
                        <Nav.Link as={Button} eventKey={'all'}>
                            All Orders (48)
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item as={'li'}>
                        <Nav.Link as={Button} eventKey={'all'}>
                            All Orders (48)
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item as={'li'}>
                        <Nav.Link as={Button} eventKey={'all'}>
                            All Orders (48)
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item as={'li'}>
                        <Nav.Link as={Button} eventKey={'all'}>
                            All Orders (48)
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item as={'li'}>
                        <Nav.Link as={Button} eventKey={'all'}>
                            All Orders (48)
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <Button className="btn-sm btn-icon" variant="primary">
                        <Icon name="grid-2x2" />
                    </Button>
                    <Button className="btn-sm btn-icon" variant="">
                        <Icon name="square-kanban" />
                    </Button>
                    <div className="input-group input-group-flat w-auto">
                        <input className="form-control" placeholder="Search" type="text" />
                        <span className="input-group-text">
                            <Icon name="search" className="text-dark" />
                        </span>
                    </div>
                </div>
            </div>
            <div className="tab-content">
                <div className="tab-pane show active" id="order-tab1">
                    <Row>
                        <TabContent />
                    </Row>
                </div>
            </div>
        </>
    );
};

export default Orders;
