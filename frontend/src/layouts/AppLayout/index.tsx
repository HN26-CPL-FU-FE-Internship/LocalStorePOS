import { useState, type PropsWithChildren } from 'react';
import TopHeader from '../components/TopHeader';
import SearchModal from '../components/SearchModal';
import Sidebar from '../components/Sidebar';

/**
 * Equivalent of the outer <div class="main-wrapper"> ... <div class="page-wrapper"> shell
 * repeated at the top of every page in the original template. Wrap each page's
 * content with <AppLayout>{...}</AppLayout>.
 */
const AppLayout = ({ children }: PropsWithChildren) => {
    const [showSearch, setShowSearch] = useState(false);
    // The original template shows/hides the sidebar on mobile by toggling a
    // class on <body> (see assets/js/script.js). Mirrored here with one flag
    // instead of conditionally mounting/unmounting <Sidebar>.
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const handleToggleTheme = () => {
        // The original theme-script.js toggles a data-bs-theme attribute on <html>.
        // Re-implement with your preferred state/store; left as a stub here.
        document.documentElement.toggleAttribute('data-bs-theme-dark');
    };

    return (
        <div className={`main-wrapper ${mobileSidebarOpen ? 'menu-opened' : ''}`}>
            <TopHeader
                onOpenSearch={() => setShowSearch(true)}
                onToggleTheme={handleToggleTheme}
                onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            />

            <SearchModal show={showSearch} onHide={() => setShowSearch(false)} />

            <Sidebar onClose={() => setMobileSidebarOpen(false)} />

            <div className="page-wrapper">
                <div className="content pb-0">{children}</div>
            </div>
        </div>
    );
};

export default AppLayout;
