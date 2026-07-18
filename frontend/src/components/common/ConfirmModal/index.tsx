import { Button, Modal } from 'react-bootstrap';
import Icon from '../Icon';
import { formatString } from '@/utils';
import { memo } from 'react';

type ConfirmModalProps = {
    show: boolean;
    handleClose: () => void;
    type: string;
    action: () => void;
    data: string;
};

const ConfirmModal = ({ show, handleClose, type, action, data }: ConfirmModalProps) => {
    return (
        <Modal show={show} onHide={handleClose} centered size="sm">
            <Modal.Body className="text-center p-4">
                <div className="mb-4">
                    <span className="avatar avatar-xxl rounded-circle bg-danger-subtle d-inline-flex align-items-center justify-content-center">
                        <Icon name="trash-2" className="fs-2 text-danger" />
                    </span>
                </div>
                <h4 className="mb-1">{formatString(type)} Confirmation</h4>
                <p className="mb-4">
                    Are you sure you want to {type} <strong>{data}</strong>?
                </p>
                <div className="d-flex justify-content-center gap-2">
                    <Button variant="light" className="w-100" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="danger" className="w-100" onClick={action}>
                        Delete
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default memo(ConfirmModal);
