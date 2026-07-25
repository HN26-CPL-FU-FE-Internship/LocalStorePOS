import Icon from '@/components/common/Icon';
import type { OrderItemType } from '@/types';
import { formatAddonNote } from '@/utils';
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
                    <div className="mb-0 fw-medium text-dark d-flex flex-column align-items-start">
                        <p className="d-flex align-items-center mb-1">
                            <Icon name="badge-info" className="me-1" />
                            <span>Addons : </span>
                        </p>
                        <ul className="mb-1">
                            {addons.map((addon) => {
                                return (
                                    <li className="ms-1 mb-1" key={addon.id}>
                                        {formatAddonNote(addon.addonName, addon.quantity)}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(KitchenOrderItemRow);
