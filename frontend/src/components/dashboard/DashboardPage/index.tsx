import { useState, useCallback } from 'react';
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
    useDashboardStats,
    useDashboardRevenueChart,
    useDashboardTopItems,
    useDashboardCategoryStats,
    useDashboardActiveOrders,
    useDashboardSalesPerformance,
    useDashboardTrendingMenus,
    useDashboardUserStatistics,
    useDashboardReservations,
    useDashboardAvailableTables,
    useDashboardActivityLogs,
} from '@/hooks/dashboard';
import { type DashboardFilterRequest } from '@/api/dashboard.api';
import { type TimePeriod, getDateFilterForPeriod } from '@/utils/dashboardFilter';
import HeaderDashboard from '@/components/headers/HeaderDashboard';
import Fetching from '@/components/common/Fetching';
import TopProgressBar from '@/components/common/TopProgressBar';

// ── Helpers ──────────────────────────────────────────────────────

/** Wraps error text: returns the message if `isError` is true, else undefined. */
const errorMsg = (isError: boolean, label: string) => (isError ? `Failed to load ${label}` : undefined);

/** Default fallback for topUser when data is not yet loaded. */
const DEFAULT_TOP_USER = {
    name: 'N/A',
    avatarUrl: '',
    grandTotal: '$0.00',
    totalNewUsers: '0',
    newUsersChange: '0%',
};

// ── Grid column constants ────────────────────────────────────────

const CARD_COL = 'dashboard-card-col d-flex';

// ── Component ────────────────────────────────────────────────────

const DashboardPage = ({ onDateRangeChange }: { onDateRangeChange?: (from: Date, to: Date) => void }) => {
    const [dateFilter, setDateFilter] = useState<DashboardFilterRequest>({});
    const [activePeriod, setActivePeriod] = useState<TimePeriod>('Weekly');

    const handleDateRangeChange = useCallback(
        (from: Date, to: Date) => {
            setActivePeriod('Custom');
            setDateFilter({
                fromDate: from.toISOString().slice(0, 10),
                toDate: to.toISOString().slice(0, 10),
            });
            onDateRangeChange?.(from, to);
        },
        [onDateRangeChange],
    );

    const handlePeriodChange = useCallback((period: TimePeriod) => {
        setActivePeriod(period);
        setDateFilter(getDateFilterForPeriod(period));
    }, []);

    // ── Hooks ─────────────────────────────────────────────────────
    const {
        data: statsData,
        isLoading: statsLoading,
        isError: statsError,
        isFetching: statsFetching,
    } = useDashboardStats(dateFilter);
    const {
        data: revenueData,
        totalRevenue,
        isLoading: revenueLoading,
        isError: revenueError,
        isFetching: revenueFetching,
    } = useDashboardRevenueChart(dateFilter);

    const {
        data: topItemsData,
        highlightText,
        isLoading: topItemsLoading,
        isError: topItemsError,
        isFetching: topItemsFetching,
    } = useDashboardTopItems(dateFilter);
    const {
        data: categoryStatsData,
        isLoading: categoryStatsLoading,
        isError: categoryStatsError,
        isFetching: categoryStatsFetching,
    } = useDashboardCategoryStats(dateFilter);
    const {
        data: activeOrdersData,
        isLoading: activeOrdersLoading,
        isError: activeOrdersError,
        isFetching: activeOrdersFetching,
    } = useDashboardActiveOrders();
    const {
        data: salesPerfData,
        isLoading: salesPerfLoading,
        isError: salesPerfError,
        isFetching: salesPerFetching,
    } = useDashboardSalesPerformance(dateFilter);
    const {
        data: trendingMenusData,
        isLoading: trendingMenusLoading,
        isError: trendingMenusError,
        isFetching: trendingMenusFetching,
    } = useDashboardTrendingMenus(dateFilter);
    const {
        data: userStatsData,
        isLoading: userStatsLoading,
        isError: userStatsError,
        isFetching: userStatsFetching,
    } = useDashboardUserStatistics(dateFilter);
    const {
        data: reservationsData,
        isLoading: reservationsLoading,
        isError: reservationsError,
        isFetching: reservationsFetching,
    } = useDashboardReservations();
    const {
        data: availableTablesData,
        isLoading: tablesLoading,
        isError: tablesError,
        isFetching: tablesFetching,
    } = useDashboardAvailableTables();
    const {
        data: activityLogGroups,
        isLoading: activityLoading,
        isError: activityError,
        isFetching: activityFetching,
    } = useDashboardActivityLogs(dateFilter);

    const isInitLoading =
        statsLoading &&
        revenueLoading &&
        topItemsLoading &&
        categoryStatsLoading &&
        activeOrdersLoading &&
        salesPerfLoading &&
        trendingMenusLoading &&
        userStatsLoading &&
        reservationsLoading &&
        tablesLoading &&
        activityLoading;

    const isBackgroundLoading =
        !isInitLoading &&
        (statsFetching ||
            topItemsFetching ||
            categoryStatsFetching ||
            activeOrdersFetching ||
            salesPerFetching ||
            trendingMenusFetching ||
            userStatsFetching ||
            reservationsFetching ||
            tablesFetching ||
            activityFetching ||
            revenueFetching);

    return (
        <div className="dashboard-wrapper">
            <TopProgressBar active={isBackgroundLoading} />
            <PageHeader title="Dashboard" action={<HeaderDashboard onDateRangeChange={handleDateRangeChange} />} />

            <Fetching isBackgroundFetching={isBackgroundLoading}>
                <StatsRow stats={statsData} isLoading={statsLoading} errorMessage={errorMsg(statsError, 'stats')} />

                <Row className="dashboard-row-1 g-3 mb-3">
                    <Col xxl={8} xl={7} lg={12} md={12} className={CARD_COL}>
                        <RevenueCard
                            totalRevenue={totalRevenue}
                            chartData={revenueData}
                            activeFilter={activePeriod}
                            onFilterChange={handlePeriodChange}
                            isLoading={revenueLoading}
                            errorMessage={errorMsg(revenueError, 'revenue')}
                        />
                    </Col>
                    <Col xxl={4} xl={5} lg={12} md={12} className={CARD_COL}>
                        <TopSellingCard
                            highlightText={highlightText}
                            items={topItemsData}
                            isLoading={topItemsLoading}
                            errorMessage={errorMsg(topItemsError, 'top items')}
                        />
                    </Col>
                </Row>

                <Row className="dashboard-row-2 g-3 mb-3">
                    <Col md={6} lg={6} xxl={4} className={CARD_COL}>
                        <CategoryStatisticsCard
                            stats={categoryStatsData}
                            activeFilter={activePeriod}
                            onFilterChange={handlePeriodChange}
                            isLoading={categoryStatsLoading}
                            errorMessage={errorMsg(categoryStatsError, 'category stats')}
                        />
                    </Col>
                    <Col md={6} lg={6} xxl={4} className={CARD_COL}>
                        <ActiveOrdersCard
                            orders={activeOrdersData}
                            isLoading={activeOrdersLoading}
                            errorMessage={errorMsg(activeOrdersError, 'active orders')}
                        />
                    </Col>
                    <Col md={12} lg={12} xxl={4} className={CARD_COL}>
                        <SalesPerformanceCard
                            summary={salesPerfData}
                            activeFilter={activePeriod}
                            onFilterChange={handlePeriodChange}
                            isLoading={salesPerfLoading}
                            errorMessage={errorMsg(salesPerfError, 'sales performance')}
                        />
                    </Col>
                </Row>

                <Row className="dashboard-row-3 g-3 mb-3">
                    <Col md={12} lg={12} xxl={8} className={CARD_COL}>
                        <TrendingMenusCard
                            menus={trendingMenusData}
                            isLoading={trendingMenusLoading}
                            errorMessage={errorMsg(trendingMenusError, 'trending menus')}
                        />
                    </Col>
                    <Col md={12} lg={12} xxl={4} className={CARD_COL}>
                        <UserStatisticsCard
                            topUser={userStatsData?.topUser ?? DEFAULT_TOP_USER}
                            newUserAvatars={userStatsData?.newUserAvatars ?? []}
                            newUsersChart={userStatsData?.newUsersChart ?? []}
                            activeFilter={activePeriod}
                            onFilterChange={handlePeriodChange}
                            isLoading={userStatsLoading}
                            errorMessage={errorMsg(userStatsError, 'user statistics')}
                        />
                    </Col>
                </Row>

                <Row className="dashboard-row-4 g-3">
                    <Col md={12} lg={12} xxl={4} className={CARD_COL}>
                        <ReservationsCard
                            reservations={reservationsData ?? []}
                            isLoading={reservationsLoading}
                            errorMessage={errorMsg(reservationsError, 'reservations')}
                        />
                    </Col>
                    <Col md={6} lg={6} xxl={4} className={CARD_COL}>
                        <TablesAvailableCard
                            tables={availableTablesData}
                            isLoading={tablesLoading}
                            errorMessage={errorMsg(tablesError, 'tables')}
                        />
                    </Col>
                    <Col md={6} lg={6} xxl={4} className={CARD_COL}>
                        <NotificationsLogCard
                            groups={activityLogGroups ?? []}
                            isLoading={activityLoading}
                            errorMessage={errorMsg(activityError, 'activity logs')}
                        />
                    </Col>
                </Row>
            </Fetching>
        </div>
    );
};

export default DashboardPage;
