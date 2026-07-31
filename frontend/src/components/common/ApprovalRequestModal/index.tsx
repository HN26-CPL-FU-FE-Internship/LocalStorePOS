import { useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { isAxiosError } from 'axios';
import Icon from '@/components/common/Icon';
import { createApprovalRequest, type ApprovalRequestType } from '@/services/api/approval.api';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';

interface ApprovalRequestModalProps {
    show: boolean;
    onHide: () => void;
    /** e.g. 'delete' → button reads "Send delete request" */
    actionLabel: string;
    requestType: ApprovalRequestType;
    description: string;
    targetType?: string | null;
    targetId?: number | null;
    targetDisplay?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    /** Optional JSON payload stored on the request & replayed when approved */
    additionalData?: string | null;
    /** Callback fired after the request is sent successfully */
    onSent?: () => void;
}

const ApprovalRequestModal = ({
    show,
    onHide,
    actionLabel,
    requestType,
    description,
    targetType,
    targetId,
    targetDisplay,
    oldValue,
    newValue,
    additionalData,
    onSent,
}: ApprovalRequestModalProps) => {
    const { showToast } = useContextData(ToastContext);
    const [reason, setReason] = useState('');
    const [sending, setSending] = useState(false);

    const handleClose = () => {
        if (sending) return;
        setReason('');
        onHide();
    };

    const handleSend = async () => {
        if (!reason.trim()) {
            showToast('warning', 'Please enter a reason for the request');
            return;
        }
        setSending(true);
        try {
            await createApprovalRequest({
                requestType,
                description,
                reason: reason.trim(),
                targetType: targetType ?? null,
                targetId: targetId ?? null,
                targetDisplay: targetDisplay ?? null,
                oldValue: oldValue ?? null,
                newValue: newValue ?? null,
                additionalData: additionalData ?? null,
            });
            showToast('success', `Your ${actionLabel} request has been sent. Please wait for approval.`);
            setReason('');
            onHide();
            onSent?.();
        } catch (err) {
            let message = `Failed to send ${actionLabel} request`;
            if (isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
                const data = err.response.data as { message?: string };
                if (data.message) message = data.message;
            }
            showToast('error', message);
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="sm">
            <Modal.Body className="text-center p-4">
                <div className="mb-4">
                    <span className="avatar avatar-xxl rounded-circle bg-primary-subtle d-inline-flex align-items-center justify-content-center">
                        <Icon name="send" className="fs-2 text-primary" />
                    </span>
                </div>

                <h4 className="mb-1">Send {actionLabel} request</h4>
                <p className="mb-4">
                    Are you sure you want to send this {actionLabel} request? Changes will only be applied after
                    approval.
                </p>

                <Form.Group className="text-start mb-4">
                    <Form.Label>
                        Reason <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter request reason..."
                    />
                </Form.Group>

                <div className="d-flex justify-content-center gap-2">
                    <Button variant="light" className="w-100" onClick={handleClose} disabled={sending}>
                        Cancel
                    </Button>
                    <Button variant="primary" className="w-100" onClick={handleSend} disabled={sending}>
                        {sending ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Sending...
                            </>
                        ) : (
                            `Send ${actionLabel} request`
                        )}
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default ApprovalRequestModal;
