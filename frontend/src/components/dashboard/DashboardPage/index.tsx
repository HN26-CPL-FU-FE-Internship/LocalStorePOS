import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import PageHeader from '../../common/PageHeader';
import StatsRow from '../StatsRow';
import RevenueCard from '../RevenueCard';
import TopSellingCard from '../TopSellingCard';
import CategoryStatisticsCard from '../CategoryStatisticsCard';
import ActiveOrdersCard from '../ActiveOrdersCard';
import SalesPerformanceCard from '../SalesPerformanceCard';
import TrendingMenusCard from '../TrendingMenusCard';
import UserStatisticsCard from '../UserStatisticsCard';
import ReservationsCard from '../ReservationsCard';
import TablesAvailableCard from '../TablesAvailableCard';
import NotificationsLogCard from '../NotificationsLogCard';
import {
    dashboardStats,
    topSellingHighlight,
    topSellingItems,
    categoryStats,
    activeOrders,
    salesSummary,
    trendingMenus,
    newUserAvatars,
    topUser,
    reservations,
    availableTables,
    activityLog,
} from '../../../data/dashboardData';

/**
 * Direct port of index.html's <div class="content pb-0"> body.
 * Mount inside <AppLayout> (which already renders <div class="content pb-0">
 * as its content slot) — see pages/DashboardIndex.tsx for the composition.
 */
const DashboardPage = ({ onDateRangeChange }: { onDateRangeChange?: (from: Date, to: Date) => void }) => {
    return (
        <>
            <PageHeader title="Dashboard" onDateRangeChange={onDateRangeChange} />

            <StatsRow stats={dashboardStats} />

            <Row>
                <Col xxl={8} xl={7} lg={12} className="d-flex">
                    <RevenueCard totalRevenue="$3989" />
                </Col>
                <Col xxl={4} xl={5} lg={12} className="d-flex">
                    <TopSellingCard highlightText={topSellingHighlight} items={topSellingItems} />
                </Col>
            </Row>

            <Row>
                <Col lg={6} xxl={4} className="d-flex">
                    <CategoryStatisticsCard stats={categoryStats} />
                </Col>
                <Col lg={6} xxl={4} className="d-flex">
                    <ActiveOrdersCard orders={activeOrders} />
                </Col>
                <Col lg={12} xxl={4} className="d-flex">
                    <SalesPerformanceCard summary={salesSummary} />
                </Col>
            </Row>

            <Row>
                <Col lg={12} xxl={8} className="d-flex">
                    <TrendingMenusCard menus={trendingMenus} />
                </Col>
                <Col lg={12} xxl={4} className="d-flex">
                    <UserStatisticsCard topUser={topUser} newUserAvatars={newUserAvatars} />
                </Col>
            </Row>

            <Row>
                <Col xxl={4} lg={12} className="d-flex">
                    <ReservationsCard reservations={reservations} />
                </Col>
                <Col xxl={4} lg={6} className="d-flex">
                    <TablesAvailableCard tables={availableTables} />
                </Col>
                <Col xxl={4} lg={6} className="d-flex">
                    <NotificationsLogCard groups={activityLog} />
                </Col>
            </Row>
        </>
    );
};

export default DashboardPage;
