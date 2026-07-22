import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Button, Col, Image, Nav, NavItem, NavLink, Row, Tab } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import Select from 'react-select';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper/types';
import { Link } from 'react-router-dom';

import Icon from '@/components/common/Icon';
import ImageWithSkeleton from '@/components/common/ImageWithSkeleton';
import AddCustomerModal from './components/AddCustomerModal';
import ItemDetailModal from './components/ItemDetailModal';
import OrderConfirmModal from './components/OrderConfirmModal';
import './components/ItemDetailModal/ItemDetailModal.scss';
import foodImages from '@/assets/img/food';
import itemImages from '@/assets/img/items';
import { KITCHEN_QUERY_KEYS, ORDER_TYPES, orderKeys } from '@/constants';
import { getCategoryImageUrl } from '@/api/category.api';
import { useRecentOrders, usePOSCategories, usePOSItems, useCustomers, useWaiters, useTables } from '@/hooks';
import type { CartItem, POSItem } from '@/types';
import { getItemImageUrl } from '@/api/item.api';
import { calcPriceWithTax, calculateDiscount, formatDateTimeKitchen, formatHourAndMinute, toTitleCase } from '@/utils';
import posService from '@/services/posService';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import { queryClient } from '@/lib';
import { POS_QUERY_KEYS } from '@/constants';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const ORDER_FILTERS = [
    { key: 'all', label: 'All Orders' },
    { key: 'dine_in', label: 'Dine In' },
    { key: 'take_away', label: 'Take Away' },
    { key: 'delivery', label: 'Delivery' },
] as const;

const staffOptions = [
    { value: 'waiter', label: 'Waiter' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'manager', label: 'Manager' },
];

const VAT_RATE = 0.1;
const SERVICE_TAX_RATE = 0.05;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function getFoodImage(index: number): string {
    const keys = Object.keys(foodImages) as (keyof typeof foodImages)[];
    return foodImages[keys[index % keys.length]];
}

function getItemImage(index: number): string {
    const keys = Object.keys(itemImages) as (keyof typeof itemImages)[];
    return itemImages[keys[index % keys.length]];
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
function POS() {
    const orderSwiperRef = useRef<SwiperType>(null);
    const categoriesSwiperRef = useRef<SwiperType>(null);
    const [orderActiveType, setOrderActiveType] = useState('dine_in');

    /* ---- data state ---- */
    const [activeCategory, setActiveCategory] = useState<number>(0); // 0 = "All"
    const [activeOrderFilter, setActiveOrderFilter] = useState('all');
    const [foodTypeFilter, setFoodTypeFilter] = useState<Set<string>>(new Set(['veg', 'non_veg', 'egg']));
    const [searchText, setSearchText] = useState('');
    const [selectedItem, setSelectedItem] = useState<POSItem | null>(null);
    const [showItemDetail, setShowItemDetail] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [expandedCartIds, setExpandedCartIds] = useState<Set<string>>(new Set());
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [showOrderConfirm, setShowOrderConfirm] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<{ value: string; label: string } | null>(null);
    const [selectedTable, setSelectedTable] = useState<{ value: string; label: string } | null>(null);
    const [itemQtys, setItemQtys] = useState<Record<number, number>>({});

    /* ---- hooks ---- */
    const { data: ordersPage, isLoading: ordersLoading } = useRecentOrders();
    const { data: categories = [], isLoading: categoriesLoading } = usePOSCategories();
    const { data: menuItems = [], isLoading: itemsLoading } = usePOSItems(activeCategory);
    const { data: waiters = [] } = useWaiters();
    const { data: customers = [] } = useCustomers();
    const { data: tables = [] } = useTables();

    const orders = ordersPage?.content ?? [];
    const isLoading = ordersLoading || categoriesLoading || itemsLoading;

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

    /* ---- cart handlers ---- */
    const handleAddToCart = useCallback(
        (payload: {
            item: POSItem;
            variationId: number | null;
            variationName: string | null;
            addonIds: number[];
            quantity: number;
            unitPrice: number;
            totalPrice: number;
        }) => {
            const cartId = `${payload.item.id}-${payload.variationId ?? 'base'}`;
            setCartItems((prev) => {
                const existing = prev.find((c) => c.id === cartId);
                if (existing) {
                    return prev.map((c) =>
                        c.id === cartId
                            ? {
                                  ...c,
                                  quantity: c.quantity + payload.quantity,
                                  totalPrice: (c.quantity + payload.quantity) * c.unitPrice,
                              }
                            : c,
                    );
                }
                return [
                    ...prev,
                    {
                        id: cartId,
                        item: payload.item,
                        variationId: payload.variationId,
                        variationName: payload.variationName,
                        addonIds: payload.addonIds,
                        quantity: payload.quantity,
                        unitPrice: payload.unitPrice,
                        totalPrice: payload.totalPrice,
                    },
                ];
            });
        },
        [],
    );

    const handleQuickAdd = useCallback(
        (item: POSItem) => {
            const defaultVariation = item.variations.length > 0 ? item.variations[0] : null;
            const basePrice = defaultVariation ? defaultVariation.price : item.price;
            const unitPrice = calcPriceWithTax(basePrice, item.taxRate);
            const qty = itemQtys[item.id] || 1;

            handleAddToCart({
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
        [handleAddToCart, itemQtys],
    );

    const handleItemQtyChange = useCallback((itemId: number, delta: number) => {
        setItemQtys((prev) => ({
            ...prev,
            [itemId]: Math.max(1, (prev[itemId] || 1) + delta),
        }));
    }, []);

    const getItemQty = useCallback((itemId: number) => itemQtys[itemId] || 1, [itemQtys]);

    const handleRemoveCartItem = useCallback((id: string) => {
        setCartItems((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const handleUpdateCartNote = useCallback((id: string, note: string) => {
        setCartItems((prev) => prev.map((c) => (c.id === id ? { ...c, note: note || undefined } : c)));
    }, []);

    const handleUpdateCartQty = useCallback((id: string, delta: number) => {
        setCartItems((prev) =>
            prev.map((c) =>
                c.id === id
                    ? {
                          ...c,
                          quantity: Math.max(1, c.quantity + delta),
                          totalPrice: Math.max(1, c.quantity + delta) * c.unitPrice,
                      }
                    : c,
            ),
        );
    }, []);

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

    const toggleCartItem = useCallback((id: string) => {
        setExpandedCartIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const { showToast } = useContextData(ToastContext);

    /* ---- place / cancel order ---- */
    const [placingOrder, setPlacingOrder] = useState(false);

    const waiterOptions = useMemo(() => waiters.map((w) => ({ value: String(w.id), label: w.name })), [waiters]);
    const customerOptions = useMemo(() => customers.map((c) => ({ value: String(c.id), label: c.name })), [customers]);
    const tableOptions = useMemo(() => tables.map((t) => ({ value: String(t.id), label: t.name })), [tables]);

    const handlePlaceOrder = useCallback(async () => {
        if (cartItems.length === 0 || placingOrder) return;
        setPlacingOrder(true);
        try {
            await posService.placeOrder({
                orderType: orderActiveType,
                customerId: selectedCustomer ? Number(selectedCustomer.value) : null,
                waiterId: null,
                tableId: selectedTable ? Number(selectedTable.value) : null,
                subtotal: Math.round(cartSubtotal * 100) / 100,
                vatAmount: VAT_RATE * 100,
                serviceTaxAmount: serviceTaxAmount,
                grandTotal: Math.round(orderTotal * 100) / 100,
                note: null,
                items: cartItems.map((c) => ({
                    itemId: c.item.id,
                    variationId: c.variationId,
                    itemName: c.item.name,
                    unitPrice: Math.round(c.unitPrice * 100) / 100,
                    quantity: c.quantity,
                    lineTotal: Math.round(c.totalPrice * 100) / 100,
                    kitchenNote: c.note || null,
                    addons: [],
                })),
            });
            queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.recentOrders() });
            queryClient.invalidateQueries({ queryKey: orderKeys.all });
            queryClient.invalidateQueries({ queryKey: KITCHEN_QUERY_KEYS.all });
            showToast('success', 'Order placed successfully!');
            setCartItems([]);
            setSelectedCustomer(null);
            setSelectedTable(null);
            setShowOrderConfirm(false);
        } catch {
            showToast('error', 'Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    }, [
        cartItems,
        placingOrder,
        orderActiveType,
        selectedCustomer,
        selectedTable,
        cartSubtotal,
        serviceTaxAmount,
        orderTotal,
        showToast,
    ]);

    const handleShowOrderConfirm = useCallback(() => {
        if (cartItems.length === 0) return;
        setShowOrderConfirm(true);
    }, [cartItems]);

    const handleHideOrderConfirm = useCallback(() => {
        if (!placingOrder) {
            setShowOrderConfirm(false);
        }
    }, [placingOrder]);

    const handleCancelOrder = useCallback(() => {
        setCartItems([]);
        setSelectedCustomer(null);
        setSelectedTable(null);
        showToast('info', 'Order cancelled');
    }, [showToast]);

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

    /* ---- filtered orders ---- */
    const filteredOrders = useMemo(() => {
        if (activeOrderFilter === 'all') return orders;
        return orders.filter((o) => o.orderType === activeOrderFilter);
    }, [activeOrderFilter, orders]);

    /* ---- order type badge icon ---- */
    const orderTypeIcon = (type: string): string => {
        const map: Record<string, string> = {
            dine_in: 'wine',
            take_away: 'shopping-bag',
            delivery: 'check-check',
        };
        return map[type] ?? 'circle';
    };

    return (
        <Row className="g-0">
            <Col lg={8} className="pos-left">
                {/* ======== Recent Orders Slider ======== */}
                <div className="slider-wrapper mb-4 pb-4 border-bottom">
                    <div className="d-flex align-items-center flex-wrap gap-3 mb-4">
                        <h3 className="mb-0">Recent Orders</h3>
                        <div className="d-flex align-items-center flex-wrap justify-content-between gap-2 flex-fill">
                            <Nav
                                as={'ul'}
                                className="nav-tabs nav-tabs-solid border-0 align-items-center flex-wrap gap-2"
                            >
                                {ORDER_FILTERS.map((f) => (
                                    <NavItem as={'li'} key={f.key}>
                                        <NavLink
                                            as={Button}
                                            className={`shadow-sm ${activeOrderFilter === f.key ? 'active' : ''}`}
                                            onClick={() => setActiveOrderFilter(f.key)}
                                        >
                                            {f.label}
                                        </NavLink>
                                    </NavItem>
                                ))}
                            </Nav>

                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    className="slick-arrow all-prev"
                                    variant="default"
                                    onClick={() => orderSwiperRef.current?.slidePrev()}
                                >
                                    <Icon name="arrow-left" />
                                </Button>
                                <Button
                                    className="slick-arrow all-next"
                                    variant="default"
                                    onClick={() => orderSwiperRef.current?.slideNext()}
                                >
                                    <Icon name="arrow-right" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="tab-content">
                        <div className="tab-pane fade active show">
                            {isLoading ? (
                                <div className="text-center py-4">
                                    <span className="text-muted">Loading recent orders...</span>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="text-center py-4">
                                    <span className="text-muted">No recent orders found</span>
                                </div>
                            ) : (
                                <Swiper
                                    modules={[Autoplay]}
                                    loop={filteredOrders.length > 3}
                                    slidesPerView={3}
                                    spaceBetween={5}
                                    autoplay={{
                                        delay: 2000,
                                        disableOnInteraction: false,
                                    }}
                                    onSwiper={(swiper) => {
                                        orderSwiperRef.current = swiper;
                                    }}
                                    className="mySwiper"
                                >
                                    {filteredOrders.map((order) => (
                                        <SwiperSlide key={order.id}>
                                            <div className="slide-item">
                                                <div className="order-item">
                                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                                                        <div>
                                                            <p className="fs-12 mb-1">{order.orderNumber}</p>
                                                            <h6 className="fs-14 fw-semibold mb-1">
                                                                {order.customerName}
                                                            </h6>
                                                            <p className="fs-13 mb-0">
                                                                {formatHourAndMinute(order.orderedAt)}
                                                                <span className="d-inline-block even-line mx-2"></span>
                                                                {order.tableNumber
                                                                    ? `Table ${order.tableNumber}`
                                                                    : 'Walk-in'}
                                                            </p>
                                                        </div>

                                                        <div className="text-end">
                                                            <span className="badge bg-light text-dark d-flex align-items-center mb-3">
                                                                <Icon
                                                                    name={orderTypeIcon(order.orderType)}
                                                                    className="text-dark me-1"
                                                                />
                                                                {toTitleCase(order.orderType)}
                                                            </span>
                                                            <div className="time badge rounded-pill fs-12 fw-normal bg-success">
                                                                <span className="me-1">
                                                                    <Icon name="clock-arrow-up" />
                                                                </span>
                                                                {order.estimatedMinutes ?? '--:--'} Mins
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center justify-content-between gap-3">
                                                        <div className="progress-item">
                                                            <div
                                                                className={`progress-bar ${
                                                                    order.kitchenStatus === 'completed'
                                                                        ? 'bg-success'
                                                                        : order.kitchenStatus === 'cooking'
                                                                          ? 'bg-warning'
                                                                          : 'bg-secondary'
                                                                }`}
                                                                style={{
                                                                    width:
                                                                        order.kitchenStatus === 'completed'
                                                                            ? '100%'
                                                                            : order.kitchenStatus === 'cooking'
                                                                              ? '50%'
                                                                              : '10%',
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <p className="mb-0 fs-10 fw-normal d-flex align-items-center">
                                                            <Icon name="clock" className="me-1" />
                                                            {order.kitchenStatus === 'new_order'
                                                                ? 'Pending'
                                                                : order.kitchenStatus === 'cooking'
                                                                  ? `${order.estimatedMinutes ?? '?'}:00`
                                                                  : 'Done'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            )}
                        </div>
                    </div>
                </div>

                {/* ======== Available Tables (Dine In only) ======== */}
                {orderActiveType === 'dine_in' && tables.length > 0 && (
                    <div className="mb-4 pb-4 border-bottom">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <Icon name="wine" className="fs-5 text-success" />
                            <h5 className="mb-0">Available Tables</h5>
                            <span className="badge bg-success rounded-pill fs-12">{tables.length}</span>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {tables.map((table) => {
                                const isSelected = selectedTable?.value === String(table.id);
                                return (
                                    <Button
                                        key={table.id}
                                        variant={isSelected ? 'primary' : 'outline-primary'}
                                        className={`d-flex align-items-center gap-1 px-3 py-2 rounded-3 shadow-sm ${isSelected ? '' : 'bg-white'}`}
                                        onClick={() =>
                                            setSelectedTable(
                                                isSelected ? null : { value: String(table.id), label: table.name },
                                            )
                                        }
                                        style={{
                                            minWidth: '80px',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <Icon name="wine" className="fs-6" />
                                        <span className="fw-semibold fs-14">{table.name}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ======== Menu Categories & Items ======== */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <h5 className="mb-0 me-2">Menu Categories</h5>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap orders-list">
                        <label className="d-flex align-items-center fs-14 text-dark">
                            <input
                                className="form-check-input m-0 me-2"
                                type="checkbox"
                                checked={foodTypeFilter.has('veg')}
                                onChange={() => toggleFoodType('veg')}
                            />
                            <span className="dot success me-1"></span>
                            Veg
                        </label>
                        <label className="d-flex align-items-center fs-14 text-dark">
                            <input
                                className="form-check-input m-0 me-2"
                                type="checkbox"
                                checked={foodTypeFilter.has('non_veg')}
                                onChange={() => toggleFoodType('non_veg')}
                            />
                            <span className="dot danger me-1"></span>
                            Non Veg
                        </label>
                        <label className="d-flex align-items-center fs-14 text-dark">
                            <input
                                className="form-check-input m-0 me-2"
                                type="checkbox"
                                checked={foodTypeFilter.has('egg')}
                                onChange={() => toggleFoodType('egg')}
                            />
                            <span className="dot warning me-1"></span>
                            Egg
                        </label>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="page-search">
                            <input
                                className="form-control form-control-sm"
                                placeholder="Search"
                                type="search"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <Icon
                                name="search"
                                className="fs-14"
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    right: '12px',
                                    border: '0',
                                    lineHeight: '0',
                                }}
                            />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <Button
                                className="slick-arrow all-prev"
                                variant="default"
                                onClick={() => categoriesSwiperRef.current?.slidePrev()}
                            >
                                <Icon name="arrow-left" />
                            </Button>
                            <Button
                                className="slick-arrow all-next"
                                variant="default"
                                onClick={() => categoriesSwiperRef.current?.slideNext()}
                            >
                                <Icon name="arrow-right" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Category Swiper */}
                <Swiper
                    onSwiper={(swiper) => (categoriesSwiperRef.current = swiper)}
                    slidesPerView={4}
                    spaceBetween={0}
                    loop={categories.length > 4}
                    className="nav nav-tabs nav-tabs-solid category-tab border-0 category-slider mb-2"
                    wrapperClass="mb-3"
                >
                    {categories.map((cat) => (
                        <SwiperSlide className="nav-item px-2" key={cat.id}>
                            <Button
                                className={`nav-link shadow w-100 ${activeCategory === cat.id ? 'active' : ''}`}
                                variant="default"
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                <div className="avatar avatar-lg rounded-circle flex-shrink-0">
                                    <Image
                                        src={
                                            'isAll' in cat && cat.isAll
                                                ? getFoodImage(0)
                                                : (getCategoryImageUrl(cat.imagePath) ?? getFoodImage(cat.id % 6))
                                        }
                                    />
                                </div>
                                <div>
                                    <h6 className="fs-14 fw-semibold mb-1">{cat.name}</h6>
                                    <p className="text-body fw-normal mb-0">{cat.itemCount} Menus</p>
                                </div>
                            </Button>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Menu Items Grid */}
                <div className="tab-content">
                    <div className="tab-pane fade active show">
                        {itemsLoading ? (
                            <div className="text-center py-4">
                                <span className="text-muted">Loading menu items...</span>
                            </div>
                        ) : filteredMenuItems.length === 0 ? (
                            <div className="text-center py-4">
                                <span className="text-muted">
                                    {searchText.trim()
                                        ? `No items match "${searchText}"`
                                        : 'No items match the selected filters'}
                                </span>
                            </div>
                        ) : (
                            <Row className="g-3">
                                {filteredMenuItems.map((item) => (
                                    <Col xl={3} md={4} sm={6} key={item.id}>
                                        <div className="food-grid-item">
                                            <div className="food-items">
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    className="d-block w-100 h-100"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowItemDetail(true);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setSelectedItem(item);
                                                            setShowItemDetail(true);
                                                        }
                                                    }}
                                                >
                                                    <ImageWithSkeleton
                                                        fluid
                                                        rounded
                                                        src={getItemImageUrl(item.imagePath) ?? getItemImage(item.id)}
                                                        alt={item.name}
                                                        className="w-100"
                                                    />
                                                </div>
                                                {item.badge === 'trending' && (
                                                    <span className="badge bg-danger">
                                                        <Icon name="crown" className="text-white" />
                                                        Trending
                                                    </span>
                                                )}
                                                {item.badge === 'must_try' && (
                                                    <span className="badge bg-indigo">
                                                        <Icon name="flame" className="text-white" />
                                                        Must Try
                                                    </span>
                                                )}
                                            </div>
                                            <div className="food-items-content">
                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                    <p className="fs-12 mb-0">{item.categoryName}</p>
                                                    <div>
                                                        <span className="d-flex align-items-center">
                                                            <Icon
                                                                name="square-dot"
                                                                className={`text-${item.foodType === 'veg' ? 'success' : item.foodType === 'non_veg' ? 'danger' : 'warning'} me-1`}
                                                            />
                                                            {item.foodType === 'veg'
                                                                ? 'Veg'
                                                                : item.foodType === 'non_veg'
                                                                  ? 'Non Veg'
                                                                  : 'Egg'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <h6 className="fs-14 fw-semibold text-truncate mb-2">
                                                    <Link
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#items_details"
                                                        to="/pos"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                </h6>

                                                <div className="price d-flex align-items-center justify-content-between flex gap-2">
                                                    <div>
                                                        <p className="mb-0 text-dark">
                                                            $
                                                            {Number(
                                                                calcPriceWithTax(item.price, item.taxRate),
                                                            ).toLocaleString()}
                                                        </p>
                                                        {item.taxRate && item.taxRate > 0 && (
                                                            <small className="fs-10 text-muted">
                                                                incl. {item.taxRate}%
                                                                {item.taxTitle ? ` ${item.taxTitle}` : ''}
                                                            </small>
                                                        )}
                                                    </div>
                                                    <div className="quantity-control">
                                                        <button
                                                            type="button"
                                                            className="minus-btn"
                                                            onClick={() => handleItemQtyChange(item.id, -1)}
                                                        >
                                                            <Icon name="minus" />
                                                        </button>
                                                        <input
                                                            className="quantity-input"
                                                            aria-label="Quantity"
                                                            type="text"
                                                            value={getItemQty(item.id)}
                                                            readOnly
                                                        />
                                                        <button
                                                            type="button"
                                                            className="add-btn"
                                                            onClick={() => handleQuickAdd(item)}
                                                        >
                                                            <Icon name="plus" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </div>
                </div>
            </Col>

            {/* ======== Item Detail Modal ======== */}
            <ItemDetailModal
                show={showItemDetail}
                item={selectedItem}
                onHide={() => setShowItemDetail(false)}
                onAddToCart={handleAddToCart}
            />

            {/* ======== Add Customer Modal ======== */}
            <AddCustomerModal
                show={showAddCustomer}
                onHide={() => setShowAddCustomer(false)}
                onCreated={(customer) => {
                    setSelectedCustomer({ value: String(customer.id), label: customer.name });
                }}
            />

            {/* ======== Order Confirm Modal ======== */}
            <OrderConfirmModal
                show={showOrderConfirm}
                onHide={handleHideOrderConfirm}
                onConfirm={handlePlaceOrder}
                isProcessing={placingOrder}
                orderType={orderActiveType}
                tableName={selectedTable?.label ?? null}
                customerName={selectedCustomer?.label ?? null}
                cartItems={cartItems}
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

                    <div className="item border-bottom">
                        <Tab.Container activeKey={orderActiveType} onSelect={(key) => key && setOrderActiveType(key)}>
                            <Nav
                                variant="tabs"
                                fill
                                className="nav-tabs nav-tabs-solid border-0 mb-3 align-items-center justify-content-between flex-wrap gap-1 pos-tab"
                            >
                                {ORDER_TYPES.map((item) => (
                                    <NavItem key={item.key} className="flex-fill">
                                        <NavLink eventKey={item.key} className="justify-content-center shadow-sm">
                                            <Icon name={item.icon} />
                                            {item.label}
                                        </NavLink>
                                    </NavItem>
                                ))}
                            </Nav>

                            <Tab.Content>
                                <Tab.Pane eventKey={'dine_in'}>
                                    <Row className="g-2">
                                        <Col lg={4}>
                                            <div className="common-select w-100">
                                                <Select
                                                    className="select"
                                                    options={tableOptions.length > 0 ? tableOptions : undefined}
                                                    placeholder="Select Table"
                                                    value={selectedTable}
                                                    onChange={(opt) => setSelectedTable(opt)}
                                                    isSearchable={true}
                                                    noOptionsMessage={() => 'No tables available'}
                                                />
                                            </div>
                                        </Col>
                                        <Col lg={4}>
                                            <div className="common-select w-100">
                                                <Select
                                                    className="select"
                                                    options={waiterOptions.length > 0 ? waiterOptions : staffOptions}
                                                    placeholder="Waiter"
                                                />
                                            </div>
                                        </Col>
                                        <Col lg={4}>
                                            <div className="input-item d-flex align-items-center gap-2">
                                                <div className="common-select w-100">
                                                    <Select
                                                        placeholder="Customer..."
                                                        options={
                                                            customerOptions.length > 0 ? customerOptions : undefined
                                                        }
                                                        isSearchable={true}
                                                        noOptionsMessage={() => 'No customers found'}
                                                        value={selectedCustomer}
                                                        onChange={(opt) => setSelectedCustomer(opt)}
                                                    />
                                                </div>
                                                <Button className="btn-icon" onClick={() => setShowAddCustomer(true)}>
                                                    <Icon name="plus" />
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey={'take_away'}>
                                    <Row className="g-2">
                                        <Col lg={11}>
                                            <div className="input-item d-flex align-items-center gap-2">
                                                <div className="common-select w-100">
                                                    <Select
                                                        placeholder="Search or select customer..."
                                                        options={
                                                            customerOptions.length > 0 ? customerOptions : undefined
                                                        }
                                                        isSearchable={true}
                                                        noOptionsMessage={() => 'No customers found'}
                                                        value={selectedCustomer}
                                                        onChange={(opt) => setSelectedCustomer(opt)}
                                                    />
                                                </div>
                                                <Button className="btn-icon" onClick={() => setShowAddCustomer(true)}>
                                                    <Icon name="plus" />
                                                </Button>
                                            </div>
                                        </Col>
                                        <Col lg={1}>
                                            <div className="d-flex align-items-center justify-content-end">
                                                <Button
                                                    className="border-0 btn btn-icon bg-transparent fs-16 text-dark"
                                                    data-bs-toggle="modal"
                                                >
                                                    <Icon name="pencil-line" />
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey={'delivery'}>
                                    <Row className="g-2">
                                        <Col lg={11}>
                                            <div className="input-item d-flex align-items-center gap-2">
                                                <div className="common-select w-100">
                                                    <Select
                                                        placeholder="Search or select customer..."
                                                        options={
                                                            customerOptions.length > 0 ? customerOptions : undefined
                                                        }
                                                        isSearchable={true}
                                                        noOptionsMessage={() => 'No customers found'}
                                                        value={selectedCustomer}
                                                        onChange={(opt) => setSelectedCustomer(opt)}
                                                    />
                                                </div>
                                                <Button className="btn-icon" onClick={() => setShowAddCustomer(true)}>
                                                    <Icon name="plus" />
                                                </Button>
                                            </div>
                                        </Col>
                                        <Col lg={1}>
                                            <div className="d-flex align-items-center justify-content-end">
                                                <Button
                                                    className="border-0 btn btn-icon bg-transparent fs-16 text-dark"
                                                    data-bs-toggle="modal"
                                                >
                                                    <Icon name="pencil-line" />
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                            </Tab.Content>
                        </Tab.Container>
                    </div>

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

                        {cartItems.length === 0 ? (
                            <div className="cart-empty-state">
                                <span>
                                    <Icon name="shopping-bag" />
                                </span>
                                <p className="text-muted mb-0">No items added yet</p>
                            </div>
                        ) : (
                            cartItems.map((cartItem) => (
                                <div key={cartItem.id} className="menu-item active p-2 rounded border shadow mb-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap flex-xl-nowrap gap-2">
                                        <Button
                                            variant="default"
                                            className="d-flex align-items-center overflow-hidden collapsed"
                                            onClick={() => toggleCartItem(cartItem.id)}
                                        >
                                            <div className="avatar avatar-lg flex-shrink-0 me-2">
                                                <Image
                                                    src={
                                                        getItemImageUrl(cartItem.item.imagePath) ??
                                                        getItemImage(cartItem.item.id)
                                                    }
                                                    fluid
                                                    rounded
                                                />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h6 className="mb-1 fs-13 fw-semibold text-truncate mb-2">
                                                    {cartItem.item.name}
                                                </h6>
                                                {cartItem.variationName && (
                                                    <p className="badge badge-sm bg-light text-dark mb-0">
                                                        {cartItem.variationName}
                                                    </p>
                                                )}
                                            </div>
                                        </Button>
                                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                            <div className="quantity-control">
                                                <button
                                                    className="minus-btn"
                                                    onClick={() => handleUpdateCartQty(cartItem.id, -1)}
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
                                                    onClick={() => handleUpdateCartQty(cartItem.id, 1)}
                                                >
                                                    <Icon name="plus" />
                                                </button>
                                            </div>
                                            <Button
                                                className="btn-xs btn-icon fs-12 btn-light close-icon rounded-circle"
                                                onClick={() => handleRemoveCartItem(cartItem.id)}
                                            >
                                                <Icon name="x" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div
                                        className={`cart-item-details ${expandedCartIds.has(cartItem.id) ? 'open' : ''}`}
                                    >
                                        <div className="cart-item-details-inner pt-2 mt-2 border-top">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="text-center">
                                                    <span className="fs-12 mb-1 d-block fw-medium text-dark">
                                                        Item Rate
                                                    </span>
                                                    <p className="mb-0 fs-14 fw-normal">
                                                        ${Number(cartItem.unitPrice).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <span className="fs-12 mb-1 d-block fw-medium text-dark">
                                                        Amount
                                                    </span>
                                                    <p className="mb-0 fs-14 fw-normal">
                                                        ${(cartItem.unitPrice * cartItem.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <span className="fs-12 mb-1 d-block fw-medium text-dark">
                                                        Total
                                                    </span>
                                                    <p className="mb-0 fs-14 fw-semibold text-dark">
                                                        ${cartItem.totalPrice.toLocaleString()}
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
                                                        onChange={(e) =>
                                                            handleUpdateCartNote(cartItem.id, e.target.value)
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

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
                        <Button
                            className="btn btn-primary w-100 mb-4"
                            disabled={cartItems.length === 0 || placingOrder}
                            onClick={handleShowOrderConfirm}
                        >
                            {placingOrder ? 'Placing Order...' : 'Place an Order'}
                        </Button>
                        <Row className="g-3">
                            <Col sm={4}>
                                <Button
                                    className="btn btn-outline-light btn-sm d-flex align-items-center gap-1 shadow-sm"
                                    disabled={cartItems.length === 0 || placingOrder}
                                    onClick={handleCancelOrder}
                                >
                                    <Icon name="x" />
                                    Cancel
                                </Button>
                            </Col>
                        </Row>
                    </div>
                </div>
            </Col>
        </Row>
    );
}

export default POS;
