import Icon from '@/components/common/Icon';
import { headerQuickLinks } from '@/data/navigationData';
import { Link } from 'react-router-dom';

const QuickLinkHeader = () => {
    return (
        <>
            {headerQuickLinks.map((link) => (
                <Link key={link.id} to={link.href} className="d-inline-flex align-items-center">
                    <Icon name={link.icon} className="me-1" />
                    {link.label}
                </Link>
            ))}
        </>
    );
};

export default QuickLinkHeader;
