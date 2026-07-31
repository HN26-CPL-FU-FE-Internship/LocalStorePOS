import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { Image } from 'react-bootstrap';

type ImageProps = ComponentProps<typeof Image>;

interface ImageWithSkeletonProps extends ImageProps {
    containerClassName?: string;
}

const ImageWithSkeleton = ({ containerClassName, ...imgProps }: ImageWithSkeletonProps) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    /* ---- handle already-cached images ---- */
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!imgProps.src) {
            setError(true);
            setLoaded(true);
            return;
        }
        const img = new window.Image();
        img.src = typeof imgProps.src === 'string' ? imgProps.src : '';
        if (img.complete) {
            setLoaded(true);
        }
    }, [imgProps.src]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const showSkeleton = !loaded && !error;

    return (
        <div className={`position-relative w-100 h-100 ${containerClassName ?? ''}`}>
            {showSkeleton && <div className="image-skeleton" />}
            <Image
                {...imgProps}
                className={`${imgProps.className ?? ''} ${loaded ? 'food-image-loaded' : ''}`}
                style={{
                    ...(imgProps.style ?? {}),
                    ...(showSkeleton ? { display: 'none' } : {}),
                }}
                onLoad={() => setLoaded(true)}
                onError={() => {
                    setError(true);
                    setLoaded(true);
                }}
            />
        </div>
    );
};

export default ImageWithSkeleton;
