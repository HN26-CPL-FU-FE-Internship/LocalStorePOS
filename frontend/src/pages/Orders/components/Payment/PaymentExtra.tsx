import Icon from '@/components/common/Icon';
import { Button } from 'react-bootstrap';

type PaymentExtraProps = {
    label: string;
    onAdd?: () => void;
    onRemove?: () => void;
    valueText?: string;
};

export default function PaymentExtra({ label, onAdd, onRemove, valueText }: PaymentExtraProps) {
    return (
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4 fw-medium text-dark">
            <span>{label}</span>

            <span className="line flex-grow-1" />

            {valueText ? (
                <div className="d-flex align-items-center gap-2">
                    <span className="text-primary fw-semibold">{valueText}</span>
                    {onRemove && (
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger"
                            onClick={onRemove}
                            title="Remove"
                        >
                            <Icon name="x" />
                        </Button>
                    )}
                </div>
            ) : (
                <Button variant="outline-light" size="sm" className="d-flex align-items-center" onClick={onAdd}>
                    <Icon name="plus" className="me-1" />
                    Add
                </Button>
            )}
        </div>
    );
}
