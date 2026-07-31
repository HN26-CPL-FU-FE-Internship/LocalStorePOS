import Fetching from '@/components/common/Fetching';
import Loading from '@/components/common/Loading';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import useGetReservation from '@/hooks/reservation/useGetReservation';
import { Row } from 'react-bootstrap';
import ReservationCard from './components/ReservationCard';

const Reservation = () => {
    const { data: reservations, isLoading, isFetching, isError } = useGetReservation();
    console.log(reservations);

    if (isLoading) return <Loading />;
    if (isError) return <div>Error</div>;
    return (
        <>
            <Fetching isBackgroundFetching={isFetching}>
                <PageHeader title="Reservations" />

                <Row>
                    {reservations?.map((reservation) => (
                        <ReservationCard reservation={reservation} />
                    ))}
                </Row>

                <div className="mt-4">
                    <Pagination totalItems={0} currentPage={1} onPageChange={() => {}} pageSize={10} />
                </div>
            </Fetching>
        </>
    );
};

export default Reservation;
