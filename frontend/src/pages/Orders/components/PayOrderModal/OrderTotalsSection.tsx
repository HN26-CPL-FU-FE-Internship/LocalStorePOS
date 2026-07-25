import type { CouponOrder, DiscountType, OrderSummary } from '@/types';

interface OrderTotalsSectionProps {
    order: OrderSummary;
    discountValue: number;
    discountAmount: number;
    discountType: DiscountType;
    couponDiscount: number;
    tipAmount: number;
    selectedCoupon: CouponOrder | null;
}

const OrderTotalsSection = ({
    order,
    discountValue,
    discountAmount,
    discountType,
    couponDiscount,
    tipAmount,
    selectedCoupon,
}: OrderTotalsSectionProps) => (
    <div>
        <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
            Sub Total<span className="fw-medium text-dark">${order.subtotal}</span>
        </h6>

        {!!order.taxAmount && (
            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                Tax Amount
                <span className="fw-medium text-dark">${order.taxAmount}</span>
            </h6>
        )}

        {(discountValue > 0 || !!order.discountAmount) && (
            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                Discount
                {discountAmount > 0
                    ? ` (${discountType === 'percentage' ? discountAmount + '%' : '$' + discountAmount})`
                    : ` (${order.discountType === 'fixed_amount' ? '$' + order.discountAmount : order.discountAmount + '%'})`}
                <span className="fw-medium text-dark">-${discountValue}</span>
            </h6>
        )}

        {order.serviceCharge > 0 && (
            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                Service Charge <span className="fw-medium text-dark">${order.serviceCharge}</span>
            </h6>
        )}

        {order.deliveryCharge > 0 && (
            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                Delivery Charge <span className="fw-medium text-dark">${order.deliveryCharge}</span>
            </h6>
        )}

        {(couponDiscount > 0 || order.coupon) && (
            <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
                Coupon
                <span className="fw-medium text-danger">
                    -${couponDiscount}
                    {(selectedCoupon || order.coupon) && ` (${(selectedCoupon ?? order.coupon!).code})`}
                </span>
            </h6>
        )}

        <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-0">
            Tip <span className="fw-medium text-dark">${tipAmount > 0 ? tipAmount : order.tipAmount}</span>
        </h6>
    </div>
);

export default OrderTotalsSection;
