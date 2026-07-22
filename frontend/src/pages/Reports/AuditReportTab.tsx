import { Card } from 'react-bootstrap';
import Icon from '@/components/common/Icon';

const AuditReportTab = () => {
    return (
        <Card.Body>
            <div className="text-center py-5">
                <div className="mb-3">
                    <span className="avatar avatar-xxl rounded-circle bg-light d-inline-flex align-items-center justify-content-center">
                        <Icon name="hourglass" className="fs-2 text-muted" />
                    </span>
                </div>
                <h5 className="mb-2">Audit Logs</h5>
                <p className="text-muted mb-0">Audit logs feature coming soon.</p>
            </div>
        </Card.Body>
    );
};

export default AuditReportTab;
