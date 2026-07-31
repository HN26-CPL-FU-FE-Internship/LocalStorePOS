import Badge from 'react-bootstrap/Badge';

export interface PaymentStatusProps {
    status: string;
}

const statusVariant: Record<string, string> = {
    pending: 'warning',
    waiting: 'warning',
    paid: 'success',
    success: 'success',
    failed: 'danger',
    cancelled: 'secondary',
};

const PaymentStatus = ({ status }: PaymentStatusProps) => {
    const variant = statusVariant[status.toLowerCase()] ?? 'secondary';

    return (
        <Badge bg={variant} className="text-capitalize">
            {status}
        </Badge>
    );
};

export default PaymentStatus;
