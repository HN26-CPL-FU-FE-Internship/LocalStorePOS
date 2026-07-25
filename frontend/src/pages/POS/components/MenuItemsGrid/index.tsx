import { getCategoryImageUrl } from '@/api/category.api';
import Icon from '@/components/common/Icon';
import ImageWithSkeleton from '@/components/common/ImageWithSkeleton';
import usePOSCreateOrder from '@/stores/pos.store';
import type { POSItem } from '@/types';
import { getItemImage } from '@/utils';
import { memo } from 'react';
import { Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

const MenuItemsGrid = ({
    itemsLoading,
    filteredMenuItems,
    setSelectedItem,
    setShowItemDetail,
    handleItemQtyChange,
    getItemQty,
    handleQuickAdd,
}: {
    itemsLoading: boolean;
    filteredMenuItems: POSItem[];
    setSelectedItem: React.Dispatch<React.SetStateAction<POSItem | null>>;
    setShowItemDetail: React.Dispatch<React.SetStateAction<boolean>>;
    handleItemQtyChange: (itemId: number, delta: number) => void;
    getItemQty: (value: number) => number;
    handleQuickAdd: (item: POSItem) => void;
}) => {
    const { searchText } = usePOSCreateOrder(
        useShallow((s) => ({
            searchText: s.searchText,
        })),
    );

    return (
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
                                                src={getCategoryImageUrl(item.imagePath) ?? getItemImage(item.id)}
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
                                            <Link data-bs-toggle="modal" data-bs-target="#items_details" to="/pos">
                                                {item.name}
                                            </Link>
                                        </h6>

                                        <div className="price d-flex align-items-center justify-content-between flex gap-2">
                                            <div>
                                                <p className="mb-0 text-dark">${Number(item.price).toLocaleString()}</p>
                                                {item.taxRate && item.taxRate > 0 && (
                                                    <small className="fs-10 text-muted">
                                                        excl. {item.taxRate}%{item.taxTitle ? ` ${item.taxTitle}` : ''}
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
    );
};

export default memo(MenuItemsGrid);
