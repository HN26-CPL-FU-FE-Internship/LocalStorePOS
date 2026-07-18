import { Button, Dropdown } from 'react-bootstrap';
import Icon from '../Icon';

function ExportButton({ handleExportPdf, handleExportExcel }: { handleExportPdf?: () => void, handleExportExcel?: () => void }) {
    return (
        <Dropdown>
            <Dropdown.Toggle as={Button} variant="white" className="d-inline-flex align-items-center">
                <Icon name="upload" className="me-2" />
                Export
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" className="p-3">
                <Dropdown.Item className="rounded" onClick={handleExportPdf}>
                    Export as PDF
                </Dropdown.Item>
                <Dropdown.Item className="rounded" onClick={handleExportExcel}>
                    Export as Excel
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default ExportButton;
