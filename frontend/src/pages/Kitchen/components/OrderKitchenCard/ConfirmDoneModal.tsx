import { Button, Modal, Spinner } from 'react-bootstrap';
import Icon from '@/components/common/Icon';

interface ConfirmDoneModalProps {
    show: boolean;
    onHide: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    orderNumber: string;
    customerName: string;
}

const ConfirmDoneModal = ({
    show,
    onHide,
    onConfirm,
    isLoading,
    orderNumber,
    customerName,
}: ConfirmDoneModalProps) => {
    return (
        <Modal show={show} onHide={onHide} centered size="sm">
            <Modal.Header closeButton>
                <Modal.Title className="fs-15">Confirm Completion</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="text-center py-2">
                    <Icon name="check-circle" className="text-success fs-32 mb-2 d-block mx-auto" />
                    <p className="mb-0 fs-14">
                        Mark order <strong>{orderNumber}</strong> as{' '}
                        <strong className="text-success">completed</strong>?
                    </p>
                    <p className="text-muted fs-13 mt-1 mb-0">{customerName}</p>
                </div>
            </Modal.Body>
            <Modal.Footer className="d-flex gap-2">
                <Button variant="light" className="flex-fill" onClick={onHide}>
                    No, keep it
                </Button>
                <Button variant="success" className="flex-fill" onClick={onConfirm} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Spinner size="sm" className="me-2" /> Completing...
                        </>
                    ) : (
                        'Yes, mark done'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmDoneModal;
