import { useState } from 'react';
import { Button, Form, InputGroup, Modal } from 'react-bootstrap';
import type { DiscountType } from '@/types';

type AmountPopupProps = {
    show: boolean;
    onHide: () => void;
    onConfirm: (amount: number, type?: DiscountType) => void;
    title: string;
    showTypeToggle?: boolean;
    initialAmount?: number;
    initialType?: DiscountType;
};

export default function AmountPopup({
    show,
    onHide,
    onConfirm,
    title,
    showTypeToggle = false,
    initialAmount = 0,
    initialType = 'percentage',
}: AmountPopupProps) {
    const [amount, setAmount] = useState<number>(initialAmount);
    const [discountType, setDiscountType] = useState<DiscountType>(initialType);

    const handleToggleType = () => {
        const newType = discountType === 'percentage' ? 'fixed_amount' : 'percentage';
        setDiscountType(newType);
        // Clamp amount when switching to percentage mode
        if (newType === 'percentage' && amount > 100) {
            setAmount(100);
        }
    };

    const handleSubmit = () => {
        if (showTypeToggle) {
            onConfirm(amount, discountType);
        } else {
            onConfirm(amount);
        }
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} centered size="sm">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fs-16">{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold fs-14">Amount</Form.Label>
                        <InputGroup>
                            {showTypeToggle && (
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleToggleType}
                                    className="fw-bold"
                                    style={{ minWidth: 48 }}
                                >
                                    {discountType === 'percentage' ? '%' : '$'}
                                </Button>
                            )}
                            <Form.Control
                                type="number"
                                min="0"
                                max={showTypeToggle && discountType === 'percentage' ? 100 : undefined}
                                step="any"
                                value={amount}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (isNaN(val)) {
                                        setAmount(0);
                                    } else if (val < 0) {
                                        setAmount(0);
                                    } else if (showTypeToggle && discountType === 'percentage' && val > 100) {
                                        setAmount(100);
                                    } else {
                                        setAmount(val);
                                    }
                                }}
                                placeholder="Enter amount"
                            />
                            {!showTypeToggle && <InputGroup.Text>$</InputGroup.Text>}
                        </InputGroup>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="secondary" size="sm" onClick={onHide}>
                    Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSubmit}>
                    Apply
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
