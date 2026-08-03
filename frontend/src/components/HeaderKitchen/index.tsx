import type { KitchenOrderStat, KitchenStatus } from '@/types';
import Icon from '../common/Icon';
import { useMemo } from 'react';
import { toTitleCase } from '@/utils';
import { KITCHEN_STATUSES } from '@/constants';

const HeaderKitchen = ({ data }: { data: KitchenOrderStat | undefined }) => {
    const statsEntries = useMemo(() => Object.entries(data ?? {}), [data]) as [KitchenStatus, number][];
    return (
        <>
            <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                {statsEntries.map(([status, value]) => (
                    <div className="d-inline-flex align-items-center justify-content-between rounded-pill bg-white ps-2 pe-3 py-2 gap-3 border">
                        <div className="d-flex align-items-center gap-2">
                            <div className={`avatar avatar-sm rounded-circle ${KITCHEN_STATUSES[status].background}`}>
                                <Icon name={`${KITCHEN_STATUSES[status].icon}`} className="fs-14" />
                            </div>
                            <p className="mb-0 text-dark fw-medium">{toTitleCase(status)}</p>
                        </div>
                        <h5 className="fs-18px fw-semibold mb-0">{value}</h5>
                    </div>
                ))}
            </div>
        </>
    );
};

export default HeaderKitchen;
