// Was previously duplicated verbatim for the "visible" and "collapsed" item lists,

import Icon from '@/components/common/Icon';
import ItemStatusBadge from '@/components/common/ItemStatusBadge';
import type { OrderItemType } from '@/types';
import { memo } from 'react';
import { Fragment } from 'react/jsx-runtime';

// with a copy/paste bug in the collapsed version (`'-'${o.sizeName}` instead of ` - ${o.sizeName}`).
interface OrderItemRowProps {
    item: OrderItemType;
    /** This line is the freshly-added portion of a menu item already in the kitchen. */
    isExtra?: boolean;
    /** This started line has a sibling "extra" line — shows the split at a glance. */
    inSplit?: boolean;
}

const OrderItemRow = ({ item, isExtra = false, inSplit = false }: OrderItemRowProps) => {
    const { status } = item;
    const itemStatus = ['pending', 'preparing'].includes(status) ? 'danger' : 'success';
    return (
        <Fragment>
            <div className={`orders text-dark mb-${item.kitchenNote ? '2' : '3'}`}>
                <p>
                    <span className={`dot ${itemStatus}`}></span>
                    {item.itemName}
                    {item.sizeName ? ` - ${item.sizeName}` : ''}
                    <ItemStatusBadge status={inSplit ? status : null} extra={isExtra} />
                </p>
                <span className="line"></span>
                <p className="text-dark me-2">x{item.quantity}</p>
            </div>

            {item.kitchenNote && (
                <div className="bg-light rounded py-1 px-2 mb-3">
                    <p className="mb-0 fw-medium d-flex align-items-center text-dark">
                        <Icon name="icon-badge-info" className="me-1" />
                        Notes : {item.kitchenNote}
                    </p>
                </div>
            )}
        </Fragment>
    );
};

export default memo(OrderItemRow);
