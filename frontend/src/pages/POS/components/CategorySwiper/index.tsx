import { getAssetUrl } from '@/lib';
import { usePOSCategories } from '@/hooks';
import usePOSCreateOrder from '@/stores/pos.store';
import { getFoodImage } from '@/utils';
import { memo } from 'react';
import { Button, Image } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper/types';
import { useShallow } from 'zustand/react/shallow';

const CategorySwiper = ({ categoriesSwiperRef }: { categoriesSwiperRef: React.RefObject<SwiperType | null> }) => {
    const { data: categories = [] } = usePOSCategories();
    const { activeCategory, setActiveCategory } = usePOSCreateOrder(
        useShallow((s) => ({
            activeCategory: s.activeCategory,
            setActiveCategory: s.setActiveCategory,
        })),
    );
    return (
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
                                        : (getAssetUrl(cat.imagePath) ?? getFoodImage(cat.id % 6))
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
    );
};

export default memo(CategorySwiper);
