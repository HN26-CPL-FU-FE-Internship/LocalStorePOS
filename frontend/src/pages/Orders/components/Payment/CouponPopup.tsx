import { Button, ListGroup, Modal, Spinner } from 'react-bootstrap';
import useCoupon from '@/hooks/order/useCoupon';
import type { CouponOrder } from '@/types';
import { orderUtils } from '@/utils';

type CouponPopupProps = {
    show: boolean;
    onHide: () => void;
    onSelect: (coupon: CouponOrder) => void;
    subtotal?: number;
    selectedCode?: string;
};

export default function CouponPopup({
    show,
    onHide,
    onSelect,
    subtotal = 0,
    selectedCode,
}: CouponPopupProps) {
    const { data, isLoading } = useCoupon();
    const { calculateDiscount } = orderUtils;

    const coupons: CouponOrder[] = data?.result ?? [];

    const handleSelect = (coupon: CouponOrder) => {
        onSelect(coupon);
        onHide();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && coupons.length > 0) {
            const el = e.target as HTMLElement;
            // Let buttons/links handle their own Enter keypress to avoid double-firing
            if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.closest('button, a')) {
                return;
            }
            e.preventDefault();
            // Select the already-active coupon, or the first one
            const target = coupons.find((c) => c.code === selectedCode) ?? coupons[0];
            handleSelect(target);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered onKeyDown={handleKeyDown}>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fs-16">Select Coupon</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isLoading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Loading coupons...</p>
                    </div>
                ) : coupons.length === 0 ? (
                    <p className="text-center py-4 text-muted">No active coupons available</p>
                ) : (
                    <ListGroup>
                        {coupons.map((coupon) => (
                            <ListGroup.Item
                                key={coupon.code}
                                action
                                active={selectedCode === coupon.code}
                                onClick={() => handleSelect(coupon)}
                                className="d-flex justify-content-between align-items-center py-3"
                            >
                                <div>
                                    <strong className="fs-14">{coupon.code}</strong>
                                    <br />
                                    <small className="text-muted">
                                        {coupon.discountType === 'percentage'
                                            ? `${coupon.discountAmount}% off`
                                            : `$${coupon.discountAmount} off`}
                                    </small>
                                </div>
                                <div className="text-end">
                                    <span className="text-primary fw-medium">
                                        -$
                                        {calculateDiscount(subtotal, coupon.discountAmount, coupon.discountType)}
                                    </span>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="secondary" size="sm" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
