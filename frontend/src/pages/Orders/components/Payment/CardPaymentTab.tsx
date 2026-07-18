import { Form } from 'react-bootstrap';
import mobilePhone from '@/assets/img/icons/mobile-phone.svg';

import PaymentExtra from './PaymentExtra';
import PaymentInstruction from './PaymentInstruction';

export default function CardPaymentTab() {
    return (
        <>
            <PaymentInstruction image={mobilePhone} message="Tap or Swipe your card to pay" />

            <PaymentExtra label="Discount" />
            <PaymentExtra label="Tips" />
            <PaymentExtra label="Coupon" />

            <Form.Group>
                <Form.Label className="fw-semibold">Note</Form.Label>

                <Form.Control as="textarea" rows={4} />
            </Form.Group>
        </>
    );
}
