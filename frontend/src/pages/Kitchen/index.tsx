import Loading from '@/components/common/Loading';
import PageHeader from '@/components/common/PageHeader';
import HeaderKitchen from '@/components/HeaderKitchen';
import useStatsKitchenStatus from '@/hooks/kitchen/useStatsKitchenStatus';
import { Row } from 'react-bootstrap';
import OrderKitchenCard from './components/OrderKitchenCard';

const Kitchen = () => {
    const { data: stats, isLoading, error } = useStatsKitchenStatus();

    if (isLoading) return <Loading />;
    if (error) return <div>Error</div>;

    return (
        <>
            <PageHeader title="Kitchen" action={<HeaderKitchen data={stats?.result} />} />

            <Row className="g-4">
                <OrderKitchenCard />
            </Row>
        </>
    );
};

export default Kitchen;
