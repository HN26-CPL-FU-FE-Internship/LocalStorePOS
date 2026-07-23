import { useCallback, useMemo, useState } from 'react';
import { Button, Col, Image, Modal, Row } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';

import Icon from '@/components/common/Icon';
import type { ItemAddon, POSItem } from '@/types';
import { getItemImageUrl } from '@/api/item.api';
import foodImages from '@/assets/img/food';
import { calcPriceWithTax } from '@/utils';
import usePOSCreateOrder, { type CartPayLoad } from '@/stores/pos.store';

interface ItemDetailModalProps {
    show: boolean;
    item: POSItem | null;
    onHide: () => void;
}
function getFoodImage(index: number): string {
    const keys = Object.keys(foodImages) as (keyof typeof foodImages)[];
    return foodImages[keys[index % keys.length]];
}

const ItemDetailModal = ({ show, item, onHide }: ItemDetailModalProps) => {
    const addToCart = usePOSCreateOrder((s) => s.addToCart);

    /* ---- state ---- */
    const [selectedVariationId, setSelectedVariationId] = useState<number | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<Set<ItemAddon>>(new Set());
    const [quantity, setQuantity] = useState(1);

    /* ---- init / reset when item changes ---- */
    const resetSelection = useCallback(() => {
        setSelectedVariationId(item?.variations[0]?.id ?? null);
        setSelectedAddons(new Set());
        setQuantity(1);
    }, [item]);

    const handleShow = useCallback(() => {
        resetSelection();
    }, [resetSelection]);

    /* ---- computed: selected variation ---- */
    const selectedVariation = useMemo(() => {
        if (!selectedVariationId) return null;
        return item?.variations.find((v) => v.id === selectedVariationId) ?? null;
    }, [item?.variations, selectedVariationId]);

    /* ---- computed: base item price with tax (use variation price if selected, else item price) ---- */
    const basePrice = useMemo(() => {
        const raw = selectedVariation ? Number(selectedVariation.price) : Number(item?.price ?? 0);
        return calcPriceWithTax(raw, item?.taxRate ?? null);
    }, [item?.price, item?.taxRate, selectedVariation]);

    /* ---- computed: selected add-ons total ---- */
    const addonsTotal = useMemo(() => {
        if (!item) return 0;
        return item.addons.filter((a) => selectedAddons.has(a)).reduce((sum, a) => sum + Number(a.price), 0);
    }, [item, selectedAddons]);

    /* ---- computed: final total ---- */
    const totalPrice = useMemo(() => {
        return (basePrice + addonsTotal) * quantity;
    }, [basePrice, addonsTotal, quantity]);

    /* ---- handlers ---- */
    const toggleAddon = useCallback((addon: ItemAddon) => {
        setSelectedAddons((prev) => {
            const next = new Set(prev);
            if (next.has(addon)) {
                next.delete(addon);
            } else {
                next.add(addon);
            }
            return next;
        });
    }, []);

    const handleQuantityChange = useCallback((delta: number) => {
        setQuantity((prev) => Math.max(1, prev + delta));
    }, []);

    const handleAddToCart = useCallback(() => {
        if (!item) return;
        const payload: CartPayLoad = {
            item: {
                ...item,
                addons: Array.from(selectedAddons),
            },
            variationId: selectedVariationId,
            variationName: selectedVariation?.sizeName ?? null,
            addonIds: Array.from(selectedAddons).map((addon) => addon.id),
            quantity,
            unitPrice: basePrice + addonsTotal,
            totalPrice,
        };
        addToCart(payload);
        onHide();
    }, [
        item,
        selectedVariationId,
        selectedVariation,
        selectedAddons,
        quantity,
        basePrice,
        addonsTotal,
        totalPrice,
        addToCart,
        onHide,
    ]);

    if (!item) return null;

    return (
        <Modal
            show={show}
            onHide={onHide}
            onEnter={handleShow}
            centered
            size="lg"
            dialogClassName="item-detail-modal-dialog"
        >
            <Modal.Body className="p-4">
                <Row className="g-4">
                    {/* ======== Left — Image ======== */}
                    <Col lg={6}>
                        <div className="items-img p-3 border rounded bg-light">
                            <Image
                                fluid
                                className="img-1"
                                alt={item.name}
                                src={getItemImageUrl(item.imagePath) ?? getFoodImage(Number(item.id))}
                            />
                        </div>
                    </Col>

                    {/* ======== Right — Content ======== */}
                    <Col lg={6} className="d-flex flex-column">
                        <div className="items-content-scroll">
                            {/* ---- Item Info ---- */}
                            <h4 className="mb-2">{item.name}</h4>
                            {item.description && <p className="mb-3">{item.description}</p>}

                            {/* ---- Sizes ---- */}
                            {item.variations.length > 0 && (
                                <div className="items-info mb-4 pb-4 border-bottom">
                                    <h6 className="fw-semibold mb-3">Sizes</h6>
                                    <div className="d-flex align-items-center flex-wrap gap-2 size-group">
                                        {item.variations.map((v) => (
                                            <div
                                                key={v.id}
                                                className={`size-tab ${selectedVariationId === v.id ? 'active' : ''}`}
                                                onClick={() => setSelectedVariationId(v.id)}
                                            >
                                                <button
                                                    type="button"
                                                    className="tag d-flex align-items-center justify-content-between gap-3"
                                                >
                                                    {v.sizeName}
                                                    <span>
                                                        $
                                                        {calcPriceWithTax(
                                                            Number(v.price),
                                                            item.taxRate,
                                                        ).toLocaleString()}
                                                    </span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ---- Add-ons ---- */}
                            {item.addons.length > 0 && (
                                <div className="mb-4 pb-4 border-bottom">
                                    <h6 className="fw-semibold mb-3">Add-ons &amp; Upgrades</h6>
                                    <div className="upgrade-slider-wrap">
                                        <Swiper slidesPerView={2} spaceBetween={12} className="mySwiper">
                                            {item.addons.map((addon) => {
                                                const isSelected = selectedAddons.has(addon);
                                                return (
                                                    <SwiperSlide key={addon.id}>
                                                        <div
                                                            className="slider-item"
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => toggleAddon(addon)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ')
                                                                    toggleAddon(addon);
                                                            }}
                                                        >
                                                            <div
                                                                className={`d-flex align-items-center gap-2 border p-2 rounded ${isSelected ? 'border-primary' : ''}`}
                                                            >
                                                                <div className="avatar rounded-circle border">
                                                                    <Image
                                                                        fluid
                                                                        className="img-1"
                                                                        alt={addon.name}
                                                                        src={getFoodImage(addon.id)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p className="fw-medium mb-1 text-dark">
                                                                        {addon.name}
                                                                    </p>
                                                                    <p className="mb-0 fw-medium">
                                                                        ${Number(addon.price).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </SwiperSlide>
                                                );
                                            })}
                                        </Swiper>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ---- Total & Actions — always at bottom ---- */}
                        <div className="items-content-actions">
                            <h5 className="mb-3 d-flex align-items-center justify-content-between">
                                Total <span>${totalPrice.toLocaleString()}</span>
                            </h5>
                            <div className="d-flex align-items-center gap-3">
                                <div className="price d-flex align-items-center justify-content-between flex gap-2">
                                    <p className="mb-0 text-dark fw-semibold">
                                        ${(basePrice + addonsTotal).toLocaleString()}
                                    </p>
                                    <div className="quantity-control">
                                        <button
                                            type="button"
                                            className="minus-btn"
                                            onClick={() => handleQuantityChange(-1)}
                                            disabled={quantity <= 1}
                                        >
                                            <Icon name="minus" />
                                        </button>
                                        <input
                                            className="quantity-input"
                                            aria-label="Quantity"
                                            type="text"
                                            value={quantity}
                                            readOnly
                                        />
                                        <button
                                            type="button"
                                            className="add-btn"
                                            onClick={() => handleQuantityChange(1)}
                                        >
                                            <Icon name="plus" />
                                        </button>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-100 d-flex align-items-center gap-2"
                                    onClick={handleAddToCart}
                                >
                                    <Icon name="shopping-bag" />
                                    Add to Cart
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
        </Modal>
    );
};

export default ItemDetailModal;
