import { getAssetUrl } from '@/lib';
import Icon from '@/components/common/Icon';
import ItemStatusBadge from '@/components/common/ItemStatusBadge';
import usePOSCreateOrder from '@/stores/pos.store';
import {
    calcPriceWithTax,
    calculateLineTotalPrice,
    formatAddonNote,
    getItemImage,
    isItemStarted,
} from '@/utils';
import { memo } from 'react';
import { Button, Image } from 'react-bootstrap';
import { useShallow } from 'zustand/react/shallow';

const CartItemList = () => {
    const { cartItems, removeCartItem, toggleExpandCartItem, expandCartIds, updateCartNote, updateCartQuantity } =
        usePOSCreateOrder(
            useShallow((s) => ({
                cartItems: s.cartItems,
                expandCartIds: s.expandCartIds,
                removeCartItem: s.removeCartItem,
                toggleExpandCartItem: s.toggleExpandCartItem,
                updateCartNote: s.updateCartNote,
                updateCartQuantity: s.updateCartQuantity,
            })),
        );

    return (
        <>
            {cartItems.length === 0 ? (
                <div className="cart-empty-state">
                    <span>
                        <Icon name="shopping-bag" />
                    </span>
                    <p className="text-muted mb-0">No items added yet</p>
                </div>
            ) : (
                cartItems.map((cartItem) => {
                    const isStarted = isItemStarted(cartItem.status);
                    return (
                    <div key={cartItem.id} className="menu-item active p-2 rounded border shadow mb-3">
                        <div className="d-flex align-items-center justify-content-between flex-wrap flex-xl-nowrap gap-2">
                            <Button
                                variant="default"
                                className="d-flex align-items-center overflow-hidden collapsed"
                                onClick={() => toggleExpandCartItem(cartItem.id)}
                            >
                                <div className="avatar avatar-lg flex-shrink-0 me-2">
                                    <Image
                                        src={getAssetUrl(cartItem.item.imagePath) ?? getItemImage(cartItem.item.id)}
                                        fluid
                                        rounded
                                    />
                                </div>
                                <div className="overflow-hidden text-start">
                                    <h6 className="text-start mb-1 fs-13 fw-semibold text-truncate mb-2">
                                        {cartItem.item.name}
                                        <ItemStatusBadge status={cartItem.status} />
                                    </h6>
                                    {cartItem.variationName && (
                                        <p className="badge badge-sm bg-light text-dark mb-0 me-1">
                                            {cartItem.variationName}
                                        </p>
                                    )}

                                    {cartItem.item.addons.map((a) => (
                                        <p key={a.id} className="badge badge-sm bg-light text-dark mb-0 me-1">
                                            {formatAddonNote(a.name, a.quantity)}
                                        </p>
                                    ))}
                                </div>
                            </Button>
                            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                <div className="quantity-control">
                                    <button
                                        className="minus-btn"
                                        onClick={() => updateCartQuantity(cartItem.id, -1)}
                                        disabled={cartItem.quantity <= 1}
                                    >
                                        <Icon name="minus" />
                                    </button>
                                    <input
                                        className="quantity-input"
                                        aria-label="Quantity"
                                        type="text"
                                        value={cartItem.quantity}
                                        readOnly
                                    />
                                    <button
                                        className="add-btn"
                                        onClick={() => updateCartQuantity(cartItem.id, 1)}
                                        disabled={isStarted}
                                        title={
                                            isStarted
                                                ? 'Already started in the kitchen — add more from the menu so the extra amount stays a new pending line'
                                                : undefined
                                        }
                                    >
                                        <Icon name="plus" />
                                    </button>
                                </div>
                                <Button
                                    className="btn-xs btn-icon fs-12 btn-light close-icon rounded-circle"
                                    onClick={() => removeCartItem(cartItem.id)}
                                >
                                    <Icon name="x" />
                                </Button>
                            </div>
                        </div>

                        <div className={`cart-item-details ${expandCartIds.has(cartItem.id) ? 'open' : ''}`}>
                            <div className="cart-item-details-inner pt-2 mt-2 border-top">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="text-center">
                                        <span className="fs-12 mb-1 d-block fw-medium text-dark">Item Rate</span>
                                        <p className="mb-0 fs-14 fw-normal">
                                            ${Number(cartItem.unitPrice).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <span className="fs-12 mb-1 d-block fw-medium text-dark">Amount</span>
                                        <p className="mb-0 fs-14 fw-normal">
                                            ${(cartItem.unitPrice * cartItem.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <span className="fs-12 mb-1 d-block fw-medium text-dark">TAX</span>
                                        <p className="mb-0 fs-14 fw-normal">{cartItem.item.taxRate ?? 0}%</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="fs-12 mb-1 d-block fw-medium text-dark">Total</span>
                                        <p className="mb-0 fs-14 fw-semibold text-dark">
                                            $
                                            {calcPriceWithTax(
                                                calculateLineTotalPrice(cartItem.unitPrice, cartItem.quantity),
                                                cartItem.item.taxRate,
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text bg-light border">
                                            <Icon name="file-text" />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Add a note..."
                                            value={cartItem.note || ''}
                                            onChange={(e) => updateCartNote(cartItem.id, e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })
            )}
        </>
    );
};

export default memo(CartItemList);
