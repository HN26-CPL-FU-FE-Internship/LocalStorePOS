import type { ReactNode } from 'react';
import POSHeader from '../components/POSHeader';

const POSLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="pos-page">
            <div className="main-wrapper pos-wrapper">
                <POSHeader />
                <div className="page-wrapper">{children}</div>
            </div>
        </div>
    );
};

export default POSLayout;
