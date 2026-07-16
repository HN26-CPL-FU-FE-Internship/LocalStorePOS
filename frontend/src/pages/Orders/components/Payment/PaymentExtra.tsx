import Icon from '@/components/common/Icon';
import { Button } from 'react-bootstrap';

type PaymentExtraProps = {
    label: string;
    onAdd?: () => void;
};

export default function PaymentExtra({ label, onAdd }: PaymentExtraProps) {
    return (
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4 fw-medium text-dark">
            <span>{label}</span>

            <span className="line flex-grow-1" />

            <Button variant="outline-light" size="sm" className="d-flex align-items-center" onClick={onAdd}>
                <Icon name="plus" className="me-1" />
                Add
            </Button>
        </div>
    );
}
