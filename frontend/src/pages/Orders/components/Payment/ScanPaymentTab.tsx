import { Form } from 'react-bootstrap';
import qrImg from '@/assets/img/icons/qr-img.svg';

import PaymentExtra from './PaymentExtra';
import PaymentInstruction from './PaymentInstruction';

export default function ScanPaymentTab() {
    return (
        <>
            <PaymentExtra label="Discount" />
            <PaymentExtra label="Tips" />
            <PaymentExtra label="Coupon" />

            <PaymentInstruction image={qrImg} message="Scan with your UPI app to pay" />

            <Form.Group>
                <Form.Label className="fw-semibold">Note</Form.Label>

                <Form.Control as="textarea" rows={4} />
            </Form.Group>
        </>
    );
}
