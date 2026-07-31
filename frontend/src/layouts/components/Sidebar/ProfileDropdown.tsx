import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import Icon from '@/components/common/Icon';
import type { ProfileMenuItem } from '@/types';
import useAuth from '@/hooks/useAuth';
import { ROUTE_PERMISSION_MAP } from '@/types/permission';
import { Link } from 'react-router-dom';

export interface ProfileDropdownProps {
    menuItems: ProfileMenuItem[];
    logoutHref: string;
}

const ProfileDropdown = ({ menuItems }: ProfileDropdownProps) => {
    const { user, logout, canView } = useAuth();

    // Filter menu items based on permissions
    const visibleMenuItems = menuItems.filter((item) => {
        const module = ROUTE_PERMISSION_MAP[item.href];
        return !module || canView(module);
    });

    return (
        <Dropdown drop="end" className="dropdown">
            <Dropdown.Toggle as="a" href="#" bsPrefix="avatar avatar-sm profile-toggle">
                {user?.avatarPath ? (
                    <img src={user.avatarPath} alt="user" className="img-fluid rounded-circle" />
                ) : (
                    <div className="avatar-letter rounded-circle d-flex align-items-center justify-content-center bg-primary text-white w-100 h-100">
                        {user?.firstName?.charAt(0)?.toUpperCase()}
                    </div>
                )}
            </Dropdown.Toggle>
            <Dropdown.Menu className="p-0 dropdown-menu-end dropdown-menu-md">
                <div className="dropdown-header border-bottom p-3">
                    <div className="d-flex align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center">
                            <div className="avatar avatar-lg avatar-rounded border border-success">
                                {user?.avatarPath ? (
                                    <img src={user.avatarPath} className="rounded-circle" alt="user" />
                                ) : (
                                    <div className="avatar-letter rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fs-5 w-100">
                                        {user?.firstName?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="ms-2">
                                <h5 className="mb-1 fs-14 fw-semibold">
                                    {user?.firstName} {user?.lastName}
                                </h5>
                                <span className="d-block fs-13">{user?.role}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-3">
                    {visibleMenuItems.map((item) => (
                        <Dropdown.Item as={Link} key={item.id} to={item.href} className="d-flex align-items-center">
                            <Icon name={item.icon} className="me-2 fs-16" />
                            <span>{item.label}</span>
                        </Dropdown.Item>
                    ))}
                </div>
                <div className="p-3 border-top">
                    <Button variant="white" size="sm" className="w-100" onClick={logout}>
                        <Icon name="log-in" className="me-1" />
                        Logout
                    </Button>
                </div>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default ProfileDropdown;
