import { Button } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import ExportButton from '@/components/common/ExportButton';
import DateRangePicker from '@/components/common/DateRangePicker';

function HeaderDashboard({ onDateRangeChange }: { onDateRangeChange?: (from: Date, to: Date) => void }) {
    const handleSyncData = () => {};

    return (
        <>
            <Button variant="white" className="d-inline-flex align-items-center" onClick={handleSyncData}>
                <Icon name="folder-sync" className="me-2" />
                Sync Data
            </Button>

            <ExportButton handleExportPdf={() => {}} handleExportExcel={() => {}} />

            {/* The original date range picker relies on the daterangepicker jQuery
              plugin (assets/plugins/daterangepicker) — see limitations note below.
              This preserves the same visual placeholder. */}
            <DateRangePicker onDateRangeChange={onDateRangeChange} />
        </>
    );
}

export default HeaderDashboard;
