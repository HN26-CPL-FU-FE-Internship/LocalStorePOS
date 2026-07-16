import { Col, Form, Row } from 'react-bootstrap';
import PaymentExtra from './PaymentExtra';

export default function CashPaymentTab() {
    return (
        <>
            <div className="mb-4">
                <Form.Label>
                    Amount <span className="text-danger">*</span>
                </Form.Label>

                <Form.Control type="text" />
            </div>

            <PaymentExtra label="Discount" />
            <PaymentExtra label="Tips" />
            <PaymentExtra label="Coupon" />

            <Row>
                <Col md={6}>
                    <div className="mb-4">
                        <Form.Label>
                            Given Amount <span className="text-danger">*</span>
                        </Form.Label>

                        <Form.Control type="text" />
                    </div>
                </Col>

                <Col md={6}>
                    <div className="mb-4">
                        <Form.Label>
                            Balance <span className="text-danger">*</span>
                        </Form.Label>

                        <Form.Control type="text" readOnly />
                    </div>
                </Col>
            </Row>

            <Form.Group>
                <Form.Label className="fw-semibold">Note</Form.Label>

                <Form.Control as="textarea" rows={4} />
            </Form.Group>
        </>
    );
}
