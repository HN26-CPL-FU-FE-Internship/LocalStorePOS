import { memo } from 'react';

const TopProgressBar = memo(function TopProgressBar({ active }: { active: boolean }) {
    if (!active) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: 3,
                zIndex: 2000,
                overflow: 'hidden',
                backgroundColor: 'rgba(24, 119, 242, 0.15)',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    height: '100%',
                    width: '30%',
                    borderRadius: 2,
                    backgroundColor: '#1877f2',
                    animation: 'top-progress-slide 1.1s ease-in-out infinite',
                }}
            />
            <style>
                {`
                    @keyframes top-progress-slide {
                        0% { left: -30%; }
                        55% { left: 60%; }
                        100% { left: 100%; }
                    }
                `}
            </style>
        </div>
    );
});

export default TopProgressBar;
