import Icon from '@/components/common/Icon';
import type { OrderItemType } from '@/types';
import { memo } from 'react';

const KitchenOrderItemRow = ({ item }: { item: OrderItemType }) => {
    const { addons } = item;

    return (
        <div
            className="border-bottom-dashed mb-3 pb-3
                        "
        >
            <div className="orders text-dark mb-2">
                <p>
                    <span className="dot success"></span>
                    {item.itemName}
                    {item.sizeName ? ` - ${item.sizeName}` : ''}
                </p>
                <p className="text-dark">×{item.quantity}</p>
            </div>
            {item.kitchenNote && (
                <div className="bg-light rounded py-1 px-2">
                    <p className="mb-0 fw-medium d-flex align-items-center text-dark">
                        <Icon name="badge-info" className="me-1" />
                        Notes : {item.kitchenNote}
                    </p>
                </div>
            )}
            {addons.length > 0 && (
                <div className="bg-light rounded py-1 px-2 mt-2">
                    <p className="mb-0 fw-medium d-flex align-items-center text-dark">
                        <Icon name="badge-info" className="me-1" />
                        Addons :{' '}
                        {addons.map((addon) => (
                            <span className="mx-1">{addon.addonName}</span>
                        ))}
                    </p>
                </div>
            )}
        </div>
    );
};

export default memo(KitchenOrderItemRow);
