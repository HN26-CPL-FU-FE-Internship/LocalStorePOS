import Icon from '../Icon';

function DateRangeLabel({ dateRangeLabel = '09 Jul 26 - 09 Jul 26' }) {
    return (
        <div className="daterangepick custom-date form-control w-auto d-flex align-items-center justify-content-between">
            <Icon name="calendar-fold" className="text-dark fs-14 me-2" />
            <span className="reportrange-picker">{dateRangeLabel}</span>
        </div>
    );
}

export default DateRangeLabel;
