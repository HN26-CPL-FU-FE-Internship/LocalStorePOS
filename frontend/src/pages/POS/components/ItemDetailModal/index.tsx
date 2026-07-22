import { useCallback, useMemo, useState } from 'react';
import { Button, Col, Image, Modal, Row } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';

import Icon from '@/components/common/Icon';
import type { POSItem } from '@/types';
import { getItemImageUrl } from '@/api/item.api';
import foodImages from '@/assets/img/food';
import { calcPriceWithTax } from '@/utils';

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */
interface ItemDetailModalProps {
    show: boolean;
    item: POSItem | null;
    onHide: () => void;
    onAddToCart?: (payload: CartPayload) => void;
}

export interface CartPayload {
    item: POSItem;
    variationId: number | null;
    variationName: string | null;
    addonIds: number[];
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function getFoodImage(index: number): string {
    const keys = Object.keys(foodImages) as (keyof typeof foodImages)[];
    return foodImages[keys[index % keys.length]];
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
const ItemDetailModal = ({ show, item, onHide, onAddToCart }: ItemDetailModalProps) => {
    /* ---- state ---- */
    const [selectedVariationId, setSelectedVariationId] = useState<number | null>(null);
    const [selectedAddonIds, setSelectedAddonIds] = useState<Set<number>>(new Set());
    const [quantity, setQuantity] = useState(1);

    /* ---- init / reset when item changes ---- */
    const resetSelection = useCallback(() => {
        setSelectedVariationId(item?.variations[0]?.id ?? null);
        setSelectedAddonIds(new Set());
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
        return item.addons
            .filter((a) => selectedAddonIds.has(a.id))
            .reduce((sum, a) => sum + Number(a.price), 0);
    }, [item, selectedAddonIds]);

    /* ---- computed: final total ---- */
    const totalPrice = useMemo(() => {
        return (basePrice + addonsTotal) * quantity;
    }, [basePrice, addonsTotal, quantity]);

    /* ---- handlers ---- */
    const toggleAddon = useCallback((addonId: number) => {
        setSelectedAddonIds((prev) => {
            const next = new Set(prev);
            if (next.has(addonId)) {
                next.delete(addonId);
            } else {
                next.add(addonId);
            }
            return next;
        });
    }, []);

    const handleQuantityChange = useCallback((delta: number) => {
        setQuantity((prev) => Math.max(1, prev + delta));
    }, []);

    const handleAddToCart = useCallback(() => {
        if (!item) return;
        const payload: CartPayload = {
            item,
            variationId: selectedVariationId,
            variationName: selectedVariation?.sizeName ?? null,
            addonIds: Array.from(selectedAddonIds),
            quantity,
            unitPrice: basePrice + addonsTotal,
            totalPrice,
        };
        onAddToCart?.(payload);
        onHide();
    }, [item, selectedVariationId, selectedVariation, selectedAddonIds, quantity, basePrice, addonsTotal, totalPrice, onAddToCart, onHide]);

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
                            {item.description && (
                                <p className="mb-3">{item.description}</p>
                            )}

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
                                                    <span>${calcPriceWithTax(Number(v.price), item.taxRate).toLocaleString()}</span>
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
                                        <Swiper
                                            slidesPerView={2}
                                            spaceBetween={12}
                                            className="mySwiper"
                                        >
                                            {item.addons.map((addon) => {
                                                const isSelected = selectedAddonIds.has(addon.id);
                                                return (
                                                    <SwiperSlide key={addon.id}>
                                                        <div
                                                            className="slider-item"
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => toggleAddon(addon.id)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') toggleAddon(addon.id);
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
                                                                    <p className="fw-medium mb-1 text-dark">{addon.name}</p>
                                                                    <p className="mb-0 fw-medium">${Number(addon.price).toLocaleString()}</p>
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
