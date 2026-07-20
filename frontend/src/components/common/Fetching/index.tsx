import type { ReactNode } from 'react';

const Fetching = ({ children, isBackgroundFetching }: { children: ReactNode; isBackgroundFetching: boolean }) => {
    return (
        <div style={{ position: 'relative' }}>
            <div
                style={{
                    opacity: isBackgroundFetching ? 0.5 : 1,
                    pointerEvents: isBackgroundFetching ? 'none' : 'auto',
                    transition: 'opacity 0.15s ease-in-out',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default Fetching;
