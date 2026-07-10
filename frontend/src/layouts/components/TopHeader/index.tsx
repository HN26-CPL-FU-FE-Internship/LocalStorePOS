import Button from 'react-bootstrap/Button';
import Icon from '@/components/common/Icon';

import logo from '@/assets/img/logo.svg';
import smallLogo from '@/assets/img/logo-small.svg';
import whiteLogo from '@/assets/img/logo-white.svg';
import QuickLinkHeader from '../QuickLinkHeader';
import type { ThemeContextType } from '@/provider/ThemeProvider/ThemeContext';
import ThemeContext from '@/provider/ThemeProvider/ThemeContext';
import useContextData from '@/hooks/useContextData';
import { useState } from 'react';
import handleChangeTheme from '@/utils/handleChangeTheme';
import type { ThemeType } from '@/types';

export interface TopHeaderProps {
    logoHref?: string;
    onOpenSearch: () => void;
    onToggleTheme: () => void;
    onOpenMobileSidebar: () => void;
}

/**
 * Equivalent of <header class="navbar-header">.
 * Uses plain react-bootstrap Button/anchor primitives rather than <Navbar>
 * because the original markup isn't a typical collapsing navbar — it's a
 * fixed topbar with independent icon-button clusters.
 */
const TopHeader = ({ logoHref = '#', onOpenSearch, onOpenMobileSidebar }: TopHeaderProps) => {
    const { toggleTheme } = useContextData<ThemeContextType>(ThemeContext);
    const [iconName, setIconName] = useState<ThemeType>('moon');

    return (
        <header className="navbar-header">
            <div className="topbar-menu">
                <div className="d-flex align-items-center gap-2">
                    <a href={logoHref} className="logo">
                        <span className="logo-light">
                            <span className="logo-lg">
                                <img src={logo} alt="logo" />
                            </span>
                            <span className="logo-sm">
                                <img src={smallLogo} alt="small logo" />
                            </span>
                        </span>
                        <span className="logo-dark">
                            <span className="logo-lg">
                                <img src={whiteLogo} alt="dark logo" />
                            </span>
                        </span>
                    </a>

                    {/* Mobile sidebar toggle */}
                    <Button
                        variant="link"
                        id="mobile_btn"
                        className="mobile-btn"
                        onClick={onOpenMobileSidebar}
                        aria-label="open sidebar"
                    >
                        <Icon name="menu" className="fs-24" />
                    </Button>

                    {/* Quick links */}
                    <div className="header-links d-lg-flex d-none">
                        <QuickLinkHeader />
                    </div>
                </div>

                <div className="d-flex align-items-center header-list">
                    {/* Upgrade */}
                    <div className="header-item d-none d-sm-flex">
                        <Button
                            variant="primary"
                            size="sm"
                            href="lorem ipsum"
                            className="d-inline-flex align-items-center"
                        >
                            <Icon name="crown" className="me-1" />
                            Upgrade
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="header-item d-flex">
                        <Button
                            variant="light"
                            className="topbar-link btn-icon"
                            aria-label="search"
                            onClick={onOpenSearch}
                        >
                            <Icon name="search" className="fs-16" />
                        </Button>
                    </div>

                    {/* Report */}
                    <div className="header-item d-none d-sm-flex">
                        <a href="lorem ipsum" className="topbar-link btn btn-icon" aria-label="report" title="Report">
                            <Icon name="chart-column-stacked" className="fs-16" />
                            <span className="position-absolute report-badge bg-success" />
                        </a>
                    </div>

                    {/* Light/Dark mode */}
                    <div className="header-item d-flex">
                        <Button
                            variant="light"
                            className="topbar-link btn-icon light-dark-mode"
                            aria-label="light/dark mode"
                            title="Dark/Light Mode"
                            onClick={() => handleChangeTheme(toggleTheme, setIconName)}
                        >
                            <Icon name={iconName} className="fs-16" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopHeader;
