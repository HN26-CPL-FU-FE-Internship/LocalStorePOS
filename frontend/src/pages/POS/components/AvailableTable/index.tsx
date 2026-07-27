import tableImages from '@/assets/img/tables';
import Icon from '@/components/common/Icon';
import { useTables } from '@/hooks';
import usePOSCreateOrder from '@/stores/pos.store';
import { memo } from 'react';
import { Button, Image } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useShallow } from 'zustand/react/shallow';

const AvailableTable = () => {
    const { data: tables = [] } = useTables();
    const {
        orderActiveType,
        table: selectedTable,
        setTable,
    } = usePOSCreateOrder(
        useShallow((s) => ({
            orderActiveType: s.orderActiveType,
            table: s.table,
            setTable: s.setTable,
        })),
    );
    return (
        <>
            {orderActiveType === 'dine_in' && tables.length > 0 && (
                <div className="mb-4 pb-4 border-bottom">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <Icon name="wine" className="fs-5 text-success" />
                        <h5 className="mb-0">Available Tables</h5>
                        <span className="badge bg-success rounded-pill fs-12">{tables.length}</span>
                    </div>
                    <div className="d-flex justify-content-around flex-wrap gap-2">
                        <Swiper slidesPerView={4} spaceBetween={10}>
                            {tables.map((table) => {
                                const isSelected = selectedTable?.value === String(table.id);
                                return (
                                    <SwiperSlide key={table.id}>
                                        <Button
                                            key={table.id}
                                            variant={isSelected ? 'primary' : ''}
                                            className={`d-flex align-items-center justify-content-start gap-2 px-2 py-2 rounded-3 shadow-sm ${isSelected ? '' : 'bg-white'}`}
                                            onClick={() =>
                                                setTable(
                                                    isSelected ? null : { value: String(table.id), label: table.name },
                                                )
                                            }
                                            style={{
                                                width: '100%',
                                                transition: 'all 0.2s ease',
                                                border: '1px solid var(--border-color)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                }}
                                            >
                                                <Image
                                                    src={tableImages['tables-01']}
                                                    alt="table"
                                                    fluid
                                                    className="object-fit-cover h-100"
                                                />
                                            </div>
                                            <div className="d-flex flex-column align-items-start">
                                                <p className="fw-semibold fs-12 mb-0">{table.name}</p>
                                                <p className="mb-0">Area : {table.areaName}</p>
                                            </div>
                                        </Button>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    </div>
                </div>
            )}
            ;
        </>
    );
};

export default memo(AvailableTable);
