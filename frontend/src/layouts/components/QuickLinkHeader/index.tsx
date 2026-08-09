import { useMemo } from 'react';
import Icon from '@/components/common/Icon';
import { headerQuickLinks } from '@/data/navigationData';
import useAuth from '@/hooks/useAuth';
import { filterQuickLinks } from '@/utils/navigation';
import { Link, useLocation } from 'react-router-dom';

const QuickLinkHeader = () => {
    const { pathname } = useLocation();
    const { canView } = useAuth();

    const visibleLinks = useMemo(() => filterQuickLinks(headerQuickLinks, canView), [canView]);

    return (
        <>
            {visibleLinks.map((link) => (
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
