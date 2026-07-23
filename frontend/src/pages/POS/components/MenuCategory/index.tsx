import Icon from '@/components/common/Icon';
import usePOSCreateOrder from '@/stores/pos.store';
import { memo } from 'react';
import { Button } from 'react-bootstrap';
import type { Swiper as SwiperType } from 'swiper/types';
import { useShallow } from 'zustand/react/shallow';

const MenuCategory = ({
    toggleFoodType,
    foodTypeFilter,
    categoriesSwiperRef,
}: {
    toggleFoodType: (value: string) => void;
    foodTypeFilter: Set<string>;
    categoriesSwiperRef: React.RefObject<SwiperType | null>;
}) => {
    const { searchText, setSearchText } = usePOSCreateOrder(
        useShallow((s) => ({
            searchText: s.searchText,
            setSearchText: s.setSearchText,
        })),
    );
    return (
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
    );
};

export default memo(MenuCategory);
