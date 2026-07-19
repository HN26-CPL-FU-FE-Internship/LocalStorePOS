export type ConfirmType = 'delete' | 'update' | 'cancel' | 'complete';

export type ConfirmModalProps = {
    show: boolean;
    handleClose: () => void;
    type: ConfirmType;
    action: () => void;
    data: string;
};
