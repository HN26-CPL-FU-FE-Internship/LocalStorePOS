import './GlobalStyles.scss';
import '../dashboard/_dashboard.scss';
import type { ReactNode } from 'react';

function GlobalStyles({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

export default GlobalStyles;
