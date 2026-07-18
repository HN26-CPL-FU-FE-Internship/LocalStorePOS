import PageHeader from '@/components/common/PageHeader';
import Search from '@/components/common/Search';
import HeaderKitchen from '@/components/HeaderKitchen';

const Kitchen = () => {
    return (
        <>
            <PageHeader title="Kitchen" action={<HeaderKitchen />} />
            <Search />
        </>
    );
};

export default Kitchen;
