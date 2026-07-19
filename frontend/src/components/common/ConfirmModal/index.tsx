import { CONFIRM_CONFIG } from '@/constants';
import { Button, Modal, Spinner } from 'react-bootstrap';
import Icon from '../Icon';
import type { ConfirmModalProps } from '@/types';
import { memo } from 'react';

const ConfirmModal = ({ show, handleClose, type, action, data, actionDisabled }: ConfirmModalProps) => {
    const config = CONFIRM_CONFIG[type];

    return (
        <Modal show={show} onHide={handleClose} centered size="sm">
            <Modal.Body className="text-center p-4">
                <div className="mb-4">
                    <span
                        className={`avatar avatar-xxl rounded-circle ${config.backgroundColor} d-inline-flex align-items-center justify-content-center`}
                    >
                        <Icon name={config.icon} className={`fs-2 ${config.iconColor}`} />
                    </span>
                </div>

                <h4 className="mb-1">{config.title}</h4>

                <p className="mb-4">
                    {config.message} <strong>{data}</strong>?
                </p>

                <div className="d-flex justify-content-center gap-2">
                    <Button variant="light" className="w-100" onClick={handleClose} disabled={actionDisabled}>
                        Cancel
                    </Button>

                    <Button variant={config.buttonVariant} className="w-100" onClick={action} disabled={actionDisabled}>
                        {actionDisabled ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Processing...
                            </>
                        ) : (
                            config.buttonText
                        )}
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default memo(ConfirmModal);
