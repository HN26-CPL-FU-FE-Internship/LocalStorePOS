import { Button, Form, Modal, Spinner } from 'react-bootstrap';

export const MIN_MINUTES = 1;
export const MAX_MINUTES = 180;

interface MinutesInputModalProps {
    show: boolean;
    onHide: () => void;
    onConfirm: () => void;
    minutesInput: number;
    onMinutesChange: (minutes: number) => void;
    isLoading: boolean;
    orderNumber: string;
    customerName: string;
}

const MinutesInputModal = ({
    show,
    onHide,
    onConfirm,
    minutesInput,
    onMinutesChange,
    isLoading,
    orderNumber,
    customerName,
}: MinutesInputModalProps) => {
    return (
        <Modal show={show} onHide={onHide} centered size="sm">
            <Modal.Header closeButton>
                <Modal.Title className="fs-15">Set Cooking Time</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-muted fs-13 mb-3">
                    Enter estimated cooking time for{' '}
                    <strong>
                        {customerName} - {orderNumber}
                    </strong>
                </p>
                <Form.Group>
                    <Form.Label className="fs-13 fw-medium">Estimated Minutes</Form.Label>
                    <Form.Control
                        type="number"
                        min={MIN_MINUTES}
                        max={MAX_MINUTES}
                        value={minutesInput}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val))
                                onMinutesChange(Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, val)));
                        }}
                        placeholder="e.g. 15"
                    />
                    <Form.Text className="text-muted">
                        Min: {MIN_MINUTES} min &mdash; Max: {MAX_MINUTES} min
                    </Form.Text>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer className="d-flex gap-2">
                <Button variant="light" className="flex-fill" onClick={onHide}>
                    Cancel
                </Button>
                <Button variant="primary" className="flex-fill" onClick={onConfirm} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Spinner size="sm" className="me-2" /> Starting...
                        </>
                    ) : (
                        'Start Cooking'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MinutesInputModal;
