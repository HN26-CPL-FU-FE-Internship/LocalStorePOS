import { useCallback, useState } from 'react';
import { Nav } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import PageHeader from '@/components/common/PageHeader';
import Card from 'react-bootstrap/Card';
import type { ReportType } from '@/types/report';
import EarningReportTab from './EarningReportTab';
import OrderReportTab from './OrderReportTab';
import SalesReportTab from './SalesReportTab';
import CustomerReportTab from './CustomerReportTab';
import AuditReportTab from './AuditReportTab';

const REPORT_TABS: { key: ReportType; label: string; icon: string }[] = [
    { key: 'earning', label: 'Earning Report', icon: 'badge-dollar-sign' },
    { key: 'orders', label: 'Order Report', icon: 'list-todo' },
    { key: 'sales', label: 'Sales Report', icon: 'shopping-bag' },
    { key: 'customers', label: 'Customer Report', icon: 'users' },
    { key: 'audit', label: 'Audit Logs', icon: 'hourglass' },
];

const Reports = () => {
    const [activeTab, setActiveTab] = useState<ReportType>('earning');

    const handleTabChange = useCallback((tab: ReportType) => {
        setActiveTab(tab);
    }, []);

    return (
        <>
            <PageHeader title="Reports" action={
                <div className="dropdown">
                    <a
                        href="#"
                        className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                    >
                        <Icon name="upload" className="me-1" /> Export
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                        <li><a href="#" className="dropdown-item rounded">Export as PDF</a></li>
                        <li><a href="#" className="dropdown-item rounded">Export as Excel</a></li>
                    </ul>
                </div>
            } />

            {/* Report Type Tabs */}
            <Nav
                as="ul"
                className="nav-tabs nav-bordered nav-bordered-primary mb-4"
                activeKey={activeTab}
                onSelect={(k) => k && handleTabChange(k as ReportType)}
            >
                {REPORT_TABS.map((tab) => (
                    <Nav.Item as="li" key={tab.key}>
                        <Nav.Link eventKey={tab.key} className="d-flex align-items-center">
                            <Icon name={tab.icon} className="me-2" />
                            {tab.label}
                        </Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>

            {/* Active tab — only this component is mounted, keeping data isolated */}
            <Card className="mb-0">
                {activeTab === 'earning' && <EarningReportTab />}
                {activeTab === 'orders' && <OrderReportTab />}
                {activeTab === 'sales' && <SalesReportTab />}
                {activeTab === 'customers' && <CustomerReportTab />}
                {activeTab === 'audit' && <AuditReportTab />}
            </Card>
        </>
    );
};

export default Reports;
