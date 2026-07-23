import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Col, Row } from 'react-bootstrap';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper/types';

import AddCustomerModal from './components/AddCustomerModal';
import ItemDetailModal from './components/ItemDetailModal';
import OrderConfirmModal from './components/OrderConfirmModal';
import './components/ItemDetailModal/ItemDetailModal.scss';
import { SERVICE_TAX_RATE, VAT_RATE } from '@/constants';
import { usePOSItems } from '@/hooks';
import type { POSItem } from '@/types';
import { calcPriceWithTax, calculateDiscount, formatDateTimeKitchen } from '@/utils';
import POSRecentOrder from './components/POSRecentOrder';
import AvailableTable from './components/AvailableTable';
import MenuCategory from './components/MenuCategory';
import CategorySwiper from './components/CategorySwiper';
import MenuItemsGrid from './components/MenuItemsGrid';
import OrderTypeTab from './components/OrderTypeTab';
import CartItemList from './components/CartItemList';
import usePOSCreateOrder from '@/stores/pos.store';
import { useShallow } from 'zustand/react/shallow';
import PlaceOrder from './components/PlaceOrder';

function POS() {
    const categoriesSwiperRef = useRef<SwiperType>(null);
    const { activeCategory, searchText, addToCart, cartItems, placingOrder } = usePOSCreateOrder(
        useShallow((s) => ({
            activeCategory: s.activeCategory,
            searchText: s.searchText,
            addToCart: s.addToCart,
            cartItems: s.cartItems,
            placingOrder: s.placingOrder,
        })),
    );
    /* ---- data state ---- */
    const [foodTypeFilter, setFoodTypeFilter] = useState<Set<string>>(new Set(['veg', 'non_veg', 'egg']));
    const [selectedItem, setSelectedItem] = useState<POSItem | null>(null);
    const [showItemDetail, setShowItemDetail] = useState(false);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [showOrderConfirm, setShowOrderConfirm] = useState(false);
    const [itemQtys, setItemQtys] = useState<Record<number, number>>({});

    /* ---- hooks ---- */
    const { data: menuItems = [], isLoading: itemsLoading } = usePOSItems(activeCategory);

    /* ---- filtered menu items ---- */
    const filteredMenuItems = useMemo(() => {
        return menuItems.filter((item) => {
            // Food type filter
            if (!foodTypeFilter.has(item.foodType)) return false;
            // Search text filter
            if (searchText.trim()) {
                const q = searchText.trim().toLowerCase();
                const matchesName = item.name.toLowerCase().includes(q);
                const matchesCategory = item.categoryName.toLowerCase().includes(q);
                if (!matchesName && !matchesCategory) return false;
            }
            return true;
        });
    }, [menuItems, foodTypeFilter, searchText]);

    const handleQuickAdd = useCallback(
        (item: POSItem) => {
            const defaultVariation = item.variations.length > 0 ? item.variations[0] : null;
            const basePrice = defaultVariation ? defaultVariation.price : item.price;
            const unitPrice = calcPriceWithTax(basePrice, item.taxRate);
            const qty = itemQtys[item.id] || 1;

            addToCart({
                item,
                variationId: defaultVariation?.id ?? null,
                variationName: defaultVariation?.sizeName ?? null,
                addonIds: [],
                quantity: qty,
                unitPrice,
                totalPrice: unitPrice * qty,
            });

            // Reset qty display to 1 after adding
            setItemQtys((prev) => ({ ...prev, [item.id]: 1 }));
        },
        [addToCart, itemQtys],
    );

    const handleItemQtyChange = useCallback((itemId: number, delta: number) => {
        setItemQtys((prev) => ({
            ...prev,
            [itemId]: Math.max(1, (prev[itemId] || 1) + delta),
        }));
    }, []);

    const getItemQty = useCallback(
        (itemId: number) => {
            return itemQtys[itemId] || 1;
        },
        [itemQtys],
    );

    const cartSubtotal = useMemo(() => {
        return cartItems.reduce((sum, c) => sum + c.totalPrice, 0);
    }, [cartItems]);

    const vatAmount = useMemo(() => calculateDiscount(cartSubtotal, VAT_RATE * 100, 'percentage'), [cartSubtotal]);
    const serviceTaxAmount = useMemo(
        () => calculateDiscount(cartSubtotal, SERVICE_TAX_RATE * 100, 'percentage'),
        [cartSubtotal],
    );
    const orderTotal = useMemo(
        () => cartSubtotal + vatAmount + serviceTaxAmount,
        [cartSubtotal, vatAmount, serviceTaxAmount],
    );

    const cartTotalQty = useMemo(() => {
        return cartItems.reduce((sum, c) => sum + c.quantity, 0);
    }, [cartItems]);

    /* ---- cart badge animation ---- */
    const [cartBadgePulse, setCartBadgePulse] = useState(false);
    const prevCartQty = useRef(0);

    useEffect(() => {
        if (cartTotalQty > prevCartQty.current) {
            setCartBadgePulse(true);
            const timer = setTimeout(() => setCartBadgePulse(false), 500);
            prevCartQty.current = cartTotalQty;
            return () => clearTimeout(timer);
        }
        prevCartQty.current = cartTotalQty;
    }, [cartTotalQty]);

    /* ---- place / cancel order ---- */

    const handleShowOrderConfirm = useCallback(() => {
        if (cartItems.length === 0) return;
        setShowOrderConfirm(true);
    }, [cartItems]);

    const handleHideOrderConfirm = useCallback(() => {
        if (!placingOrder) {
            setShowOrderConfirm(false);
        }
    }, [placingOrder]);

    /* ---- toggle food type ---- */
    const toggleFoodType = useCallback((type: string) => {
        setFoodTypeFilter((prev) => {
            const next = new Set(prev);
            if (next.has(type)) {
                if (next.size === 1) return prev; // keep at least one active
                next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
    }, []);

    return (
        <Row className="g-0">
            <Col lg={8} className="pos-left">
                {/* ======== Recent Orders Slider ======== */}
                <POSRecentOrder />
                {/* ======== Available Tables (Dine In only) ======== */}
                <AvailableTable />

                {/* ======== Menu Categories & Items ======== */}
                <MenuCategory
                    categoriesSwiperRef={categoriesSwiperRef}
                    foodTypeFilter={foodTypeFilter}
                    toggleFoodType={toggleFoodType}
                />
                {/* Category Swiper */}
                <CategorySwiper categoriesSwiperRef={categoriesSwiperRef} />
                {/* Menu Items Grid */}

                <MenuItemsGrid
                    filteredMenuItems={filteredMenuItems}
                    itemsLoading={itemsLoading}
                    setSelectedItem={setSelectedItem}
                    setShowItemDetail={setShowItemDetail}
                    getItemQty={getItemQty}
                    handleItemQtyChange={handleItemQtyChange}
                    handleQuickAdd={handleQuickAdd}
                />
            </Col>

            {/* ======== Item Detail Modal ======== */}
            <ItemDetailModal show={showItemDetail} item={selectedItem} onHide={() => setShowItemDetail(false)} />

            {/* ======== Add Customer Modal ======== */}
            <AddCustomerModal show={showAddCustomer} onHide={() => setShowAddCustomer(false)} />

            {/* ======== Order Confirm Modal ======== */}
            <OrderConfirmModal
                show={showOrderConfirm}
                onHide={handleHideOrderConfirm}
                subtotal={cartSubtotal}
                vatAmount={vatAmount}
                serviceTaxAmount={serviceTaxAmount}
                total={orderTotal}
            />

            {/* ======== Right Sidebar — Order Cart ======== ======== */}
            <Col lg={4}>
                <div className="pos-right">
                    <div className="p-3 d-flex align-items-center justify-content-between flex-wrap border-bottom">
                        <h6 className="mb-0">New Order</h6>
                        <p className="mb-0">{formatDateTimeKitchen(new Date().toISOString())}</p>
                    </div>

                    <OrderTypeTab setShowAddCustomer={setShowAddCustomer} />

                    <div className="p-3 border-bottom cart-items-list">
                        <div className="d-flex align-items-center justify-content-between mb-4 gap-2 flex-wrap">
                            <h6 className="mb-0">Ordered Menus</h6>
                            <p className="mb-0 d-flex align-items-center text-dark">
                                Total Menus :
                                <span
                                    className={`d-flex align-items-center justify-content-center fs-14 btn btn-icon btn-xs rounded-circle border flex-shrink-0 ms-1 text-dark${cartBadgePulse ? ' cart-badge-pulse' : ''}`}
                                >
                                    {cartTotalQty}
                                </span>
                            </p>
                        </div>

                        <CartItemList />

                        {cartItems.length > 0 && (
                            <div className="price-item">
                                <h6 className="mb-3">Payment Summary</h6>
                                <p className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-0">
                                    Sub Total
                                    <span className="fw-medium text-dark">${cartSubtotal.toLocaleString()}</span>
                                </p>
                                <p className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-0 mt-1">
                                    VAT ({(VAT_RATE * 100).toFixed(0)}%)
                                    <span className="fw-medium text-dark">${vatAmount.toLocaleString()}</span>
                                </p>
                                <p className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-0 mt-1">
                                    Service Tax ({(SERVICE_TAX_RATE * 100).toFixed(0)}%)
                                    <span className="fw-medium text-dark">${serviceTaxAmount.toLocaleString()}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-bottom d-flex align-items-center justify-content-between gap-2 flex-wrap">
                        <h5 className="mb-0">Amount to be Paid</h5>
                        <h5 className="mb-0">${orderTotal.toLocaleString()}</h5>
                    </div>

                    <div className="p-3">
                        <PlaceOrder onShow={handleShowOrderConfirm} />
                    </div>
                </div>
            </Col>
        </Row>
    );
}

export default POS;
