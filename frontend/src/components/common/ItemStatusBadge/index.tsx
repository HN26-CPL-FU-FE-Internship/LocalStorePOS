import { itemKitchenStatusBadge } from '@/utils';

export interface ItemStatusBadgeProps {
    /** Kitchen status of the order-item line (preparing/ready/served). */
    status?: string | null;
    /** Render the amber "Extra" tag (freshly-added line of a split). */
    extra?: boolean;
    /** Extra classes appended to each badge element. */
    className?: string;
}

/**
 * Status badge for order-item lines: shows the kitchen status label
 * (Cooking / Ready / Served) via {@link itemKitchenStatusBadge} and/or the
 * amber "Extra" tag for the freshly-added portion of a split. Renders
 * nothing when the line has no started status and {@code extra} is false.
 */
const ItemStatusBadge = ({ status, extra = false, className = '' }: ItemStatusBadgeProps) => {
    const statusBadge = itemKitchenStatusBadge(status);

    return (
        <>
            {statusBadge && (
                <span className={`badge bg-${statusBadge.variant} fs-11 ms-1 ${className}`.trim()}>
                    {statusBadge.label}
                </span>
            )}
            {extra && (
                <span className={`badge bg-warning text-dark fs-11 ms-1 ${className}`.trim()}>Extra</span>
            )}
        </>
    );
};

export default ItemStatusBadge;
