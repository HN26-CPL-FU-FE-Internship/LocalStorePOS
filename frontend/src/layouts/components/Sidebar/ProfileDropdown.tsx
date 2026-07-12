import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Icon from '@/components/common/Icon';
import type { ProfileMenuItem, UserProfile } from '@/types';
import { Link, useNavigate } from 'react-router-dom';
import { tokenUtils } from '@/utils/token';
import configs from '@/configs';
import { useLogout } from '@/hooks/auth';

export interface ProfileDropdownProps {
    user: UserProfile;
    menuItems: ProfileMenuItem[];
    logoutHref: string;
}

const ProfileDropdown = ({ user, menuItems }: ProfileDropdownProps) => {
    const navigate = useNavigate();

    const logoutMutation = useLogout();
    const handleLogout = async () => {
        const refreshToken = tokenUtils.getRefreshToken();

        logoutMutation.mutate(refreshToken!, {
            onSuccess: () => {
                tokenUtils.clearTokens();
                navigate(configs.routes.login, {
                    replace: true,
                });
            },
        });
    };

    return (
        <Dropdown drop="end" className="dropdown">
            <Dropdown.Toggle as="a" href="#" bsPrefix="avatar avatar-sm profile-toggle">
                <img src={user.avatarUrl} alt="user" className="img-fluid rounded-circle" />
            </Dropdown.Toggle>
            <Dropdown.Menu className="p-0 dropdown-menu-end dropdown-menu-md">
                <div className="dropdown-header border-bottom p-3">
                    <div className="d-flex align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center">
                            <div className="avatar avatar-lg avatar-rounded border border-success">
                                <img src={user.avatarUrl} className="rounded-circle" alt="user" />
                            </div>
                            <div className="ms-2">
                                <h5 className="mb-1 fs-14 fw-semibold">{user.name}</h5>
                                <span className="d-block fs-13">{user.role}</span>
                            </div>
                        </div>
                        {user.plan && (
                            <Badge bg="" className="badge-soft-success">
                                {user.plan}
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="p-3">
                    {menuItems.map((item) => (
                        <Dropdown.Item as={Link} key={item.id} to={item.href} className="d-flex align-items-center">
                            <Icon name={item.icon} className="me-2 fs-16" />
                            <span>{item.label}</span>
                        </Dropdown.Item>
                    ))}
                </div>
                <div className="p-3 border-top">
                    <Button variant="white" size="sm" className="w-100" onClick={handleLogout}>
                        <Icon name="log-in" className="me-1" />
                        Logout
                    </Button>
                </div>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default ProfileDropdown;
