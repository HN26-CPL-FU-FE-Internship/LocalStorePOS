import Button from 'react-bootstrap/Button';
import Icon from '../Icon';
import HeaderDashboard from '@/components/HeaderDashboard';
import HeaderOrders from '@/components/HeaderOrders';

export interface PageHeaderProps {
    title: string;
    onRefresh?: () => void;
}

const PageHeader = ({ title, onRefresh }: PageHeaderProps) => {
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
                {title === 'Dashboard' ? <HeaderDashboard /> : ''}
                {title === 'Orders' ? <HeaderOrders /> : ''}
            </div>
        </div>
    );
};

export default PageHeader;
