import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Icon from '../../common/Icon';

export interface PageHeaderProps {
    title: string;
    onRefresh?: () => void;
    onSyncData?: () => void;
    onExportPdf?: () => void;
    onExportExcel?: () => void;
    dateRangeLabel?: string;
}

const PageHeader = ({
    title,
    onRefresh,
    onSyncData,
    onExportPdf,
    onExportExcel,
    dateRangeLabel = '',
}: PageHeaderProps) => {
    return (
        <div className="d-flex align-items-center flex-wrap gap-3 mb-4">
            <div className="flex-grow-1">
                <h3 className="mb-0">
                    {`${title} `}
                    <Button
                        variant="white"
                        size="sm"
                        className="btn-icon rounded-circle ms-2"
                        onClick={onRefresh}
                        aria-label="refresh"
                    >
                        <Icon name="refresh-ccw" />
                    </Button>
                </h3>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
                <Button variant="white" className="d-inline-flex align-items-center" onClick={onSyncData}>
                    <Icon name="folder-sync" className="me-2" />
                    Sync Data
                </Button>

                <Dropdown>
                    <Dropdown.Toggle as={Button} variant="white" className="d-inline-flex align-items-center">
                        <Icon name="upload" className="me-2" />
                        Export
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" className="p-3">
                        <Dropdown.Item className="rounded" onClick={onExportPdf}>
                            Export as PDF
                        </Dropdown.Item>
                        <Dropdown.Item className="rounded" onClick={onExportExcel}>
                            Export as Excel
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>

                {/* The original date range picker relies on the daterangepicker jQuery
          plugin (assets/plugins/daterangepicker) — see limitations note below.
          This preserves the same visual placeholder. */}
                <div className="daterangepick custom-date form-control w-auto d-flex align-items-center justify-content-between">
                    <Icon name="calendar-fold" className="text-dark fs-14 me-2" />
                    <span className="reportrange-picker">{dateRangeLabel}</span>
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
