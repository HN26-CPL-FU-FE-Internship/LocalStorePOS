export type ConfirmType = 'delete' | 'update' | 'cancel' | 'complete' | 'pay';

export type ConfirmModalProps = {
    show: boolean;
    handleClose: () => void;
    type: ConfirmType;
    action: () => void;
    data: string;
    actionDisabled?: boolean;
};
