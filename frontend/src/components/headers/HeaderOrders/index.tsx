import DateRangeLabel from '@/components/common/DateRangeLabel';
import AddNewButton from '@/components/common/AddNewButton';
import { useNavigate } from 'react-router-dom';
import configs from '@/configs';

function HeaderOrders() {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(configs.routes.pos);
    };

    return (
        <>
            {/* The original date range picker relies on the daterangepicker jQuery
              plugin (assets/plugins/daterangepicker) — see limitations note below.
              This preserves the same visual placeholder. */}
            <DateRangeLabel />

            <AddNewButton name="circle-plus" onClick={handleClick} />
        </>
    );
}

export default HeaderOrders;
