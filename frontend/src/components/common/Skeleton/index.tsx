export interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Reusable skeleton placeholder with shimmer animation.
 * Matches the project's existing .image-skeleton shimmer aesthetic
 * but is a standalone block element (no absolute positioning).
 */
const Skeleton = ({ width = '100%', height = 20, borderRadius = '6px', className = '', style }: SkeletonProps) => (
    <div
        className={`skeleton-block ${className}`}
        style={{ width, height, borderRadius, ...style }}
    />
);

export default Skeleton;
