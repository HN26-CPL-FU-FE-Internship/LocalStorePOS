import configs from '@/configs';
import { Link } from 'react-router-dom';

import logo from '@/assets/img/logo.svg';
import whiteLogo from '@/assets/img/logo-white.svg';
import Icon from '@/components/common/Icon';
import styles from './POSHeader.module.scss';
import { bindCx } from '@/utils';
import { Button, Container } from 'react-bootstrap';
import QuickLinkHeader from '../QuickLinkHeader';
import NotificationsDropdown from '../Sidebar/NotificationsDropdown';
import { notificationGroups } from '@/data/dashboardData';
import ProfileDropdown from '../Sidebar/ProfileDropdown';
import { currentUser, logoutHref, profileMenuItems } from '@/data/navigationData';
import useContextData from '@/hooks/useContextData';
import type { ThemeContextType } from '@/provider/ThemeProvider/ThemeContext';
import ThemeContext from '@/provider/ThemeProvider/ThemeContext';
import { useState } from 'react';
import handleChangeTheme from '@/utils/handleChangeTheme';
import type { ThemeType } from '@/types';

const cx = bindCx(styles);

const POSHeader = () => {
    const { routes } = configs;
    const [iconName, setIconName] = useState<ThemeType>('moon');
    const { toggleTheme } = useContextData<ThemeContextType>(ThemeContext);

    return (
        <header className="header">
            <Container fluid className={cx('container-fluid')}>
                <div className="header-menu">
                    <div className="header-logo">
                        <Link to={routes.dashboard} className="logo-dark">
                            <img src={logo} alt="logo" className="img-fluid" />
                        </Link>
                        <Link to={routes.dashboard} className="logo-light">
                            <img src={whiteLogo} alt="logo" className="img-fluid" />
                        </Link>
                    </div>
                    <div className="navbar-header">
                        <Link to={routes.dashboard} className="toggle-btn me-2">
                            <Icon name="grip" />
                        </Link>

                        <div className="header-links d-lg-flex d-none">
                            <QuickLinkHeader />
                        </div>
                        <ul className="header-notification">
                            <li className="d-none d-sm-flex">
                                <Link to={routes['customer-reports']} className="btn btn-icon">
                                    <Icon name="chart-column-stacked" />
                                </Link>
                            </li>
                            <li className="header-item d-flex">
                                <div className="header-item d-flex">
                                    <Button
                                        variant="light"
                                        className={cx('topbar-link btn-icon light-dark-mode')}
                                        id={cx('light-mode-toggle')}
                                        aria-label="light/dark mode"
                                        title="Dark/Light Mode"
                                        onClick={() => handleChangeTheme(toggleTheme, setIconName)}
                                    >
                                        <Icon name={iconName} className="fs-16" />
                                    </Button>
                                </div>
                            </li>
                            <li>
                                <NotificationsDropdown
                                    className="notification btn-icon"
                                    groups={notificationGroups}
                                    unreadCount={4}
                                />
                            </li>
                            <li>
                                <Link to={routes['tax-settings']} className="btn-icon">
                                    <Icon name="cog" />
                                </Link>
                            </li>
                            <li>
                                <div>
                                    <ProfileDropdown
                                        user={currentUser}
                                        menuItems={profileMenuItems}
                                        logoutHref={logoutHref}
                                    />
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </Container>
        </header>
    );
};

export default POSHeader;
