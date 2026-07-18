import DateRangePicker from '@/components/common/DateRangePicker';
import AddNewButton from '@/components/common/AddNewButton';
import { useNavigate } from 'react-router-dom';
import configs from '@/configs';

function HeaderOrders({ onDateRangeChange }: { onDateRangeChange?: (from: Date, to: Date) => void }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(configs.routes.pos);
    };

    return (
        <>
            {/* The original date range picker relies on the daterangepicker jQuery
              plugin (assets/plugins/daterangepicker) — see limitations note below.
              This preserves the same visual placeholder. */}
            <DateRangePicker className="calendar-orders" onDateRangeChange={onDateRangeChange} />

            <AddNewButton name="circle-plus" onClick={handleClick} />
        </>
    );
}

export default HeaderOrders;
