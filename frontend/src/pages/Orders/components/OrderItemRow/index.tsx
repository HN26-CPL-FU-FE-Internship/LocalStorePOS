// Was previously duplicated verbatim for the "visible" and "collapsed" item lists,

import Icon from '@/components/common/Icon';
import type { OrderItemType } from '@/types';
import { memo } from 'react';
import { Fragment } from 'react/jsx-runtime';

// with a copy/paste bug in the collapsed version (`'-'${o.sizeName}` instead of ` - ${o.sizeName}`).
const OrderItemRow = ({ item }: { item: OrderItemType }) => (
    <Fragment>
        <div className={`orders text-dark mb-${item.kitchenNote ? '2' : '3'}`}>
            <p>
                <span className="dot"></span>
                {item.itemName}
                {item.sizeName ? ` - ${item.sizeName}` : ''}
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

export default memo(OrderItemRow);
