import { Button } from 'react-bootstrap';
import Icon from '../common/Icon';
import ExportButton from '../common/ExportButton';
import DateRangeLabel from '../common/DateRangeLabel';

function HeaderDashboard() {
    const handleSyncData = () => {};

    return (
        <>
            <Button variant="white" className="d-inline-flex align-items-center" onClick={handleSyncData}>
                <Icon name="folder-sync" className="me-2" />
                Sync Data
            </Button>

            <ExportButton />

            {/* The original date range picker relies on the daterangepicker jQuery
              plugin (assets/plugins/daterangepicker) — see limitations note below.
              This preserves the same visual placeholder. */}
            <DateRangeLabel />
        </>
    );
}

export default HeaderDashboard;
