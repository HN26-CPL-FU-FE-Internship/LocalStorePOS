import Icon from '@/components/common/Icon';
import { headerQuickLinks } from '@/data/navigationData';
import { Link, useLocation } from 'react-router-dom';

const QuickLinkHeader = () => {
    const { pathname } = useLocation();

    return (
        <>
            {headerQuickLinks.map((link) => (
                <Link
                    key={link.id}
                    to={link.href}
                    className={`d-inline-flex align-items-center ${pathname === link.href ? 'active' : ''}`}
                >
                    <Icon name={link.icon} className="me-1" />
                    {link.label}
                </Link>
            ))}
        </>
    );
};

export default QuickLinkHeader;
