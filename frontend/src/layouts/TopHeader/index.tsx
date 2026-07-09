import Button from "react-bootstrap/Button";
import Icon from "@/components/common/Icon";
import { headerQuickLinks } from "@/data/navigationData";

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
const TopHeader = ({
  logoHref = "lorem ipsum",
  onOpenSearch,
  onToggleTheme,
  onOpenMobileSidebar,
}: TopHeaderProps) => {
  return (
    <header className="navbar-header">
      <div className="topbar-menu">
        <div className="d-flex align-items-center gap-2">
          {/* Logo */}
          <a href={logoHref} className="logo">
            <span className="logo-light">
              <span className="logo-lg">
                <img src="/assets/img/logo.svg" alt="logo" />
              </span>
              <span className="logo-sm">
                <img src="/assets/img/logo-small.svg" alt="small logo" />
              </span>
            </span>
            <span className="logo-dark">
              <span className="logo-lg">
                <img src="/assets/img/logo-white.svg" alt="dark logo" />
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
            {headerQuickLinks.map((link) => (
              <a key={link.id} href={link.href} className="d-inline-flex align-items-center">
                <Icon name={link.icon} className="me-1" />
                {link.label}
              </a>
            ))}
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
            <a
              href="lorem ipsum"
              className="topbar-link btn btn-icon"
              aria-label="report"
              title="Report"
            >
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
              onClick={onToggleTheme}
            >
              <Icon name="moon" className="fs-16" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
