import '@testing-library/jest-dom';

// jsdom does not implement pointer capture; FloorMap and PositionPicker call
// setPointerCapture in their pointer handlers while dragging tables. Provide
// minimal no-op stubs.
if (typeof Element !== 'undefined' && !Element.prototype.setPointerCapture) {
    (Element.prototype as unknown as { setPointerCapture: (pointerId: number) => void }).setPointerCapture =
        () => {};
    (Element.prototype as unknown as { releasePointerCapture: (pointerId: number) => void }).releasePointerCapture =
        () => {};
    (Element.prototype as unknown as { hasPointerCapture: (pointerId: number) => boolean }).hasPointerCapture =
        () => false;
}

// jsdom does not implement ResizeObserver; PositionPicker measures its
// container width with it. Provide a minimal no-op polyfill.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
    class ResizeObserverMock {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;
}

// jsdom does not implement matchMedia; react-bootstrap's Offcanvas uses it via
// @restart/hooks useMediaQuery. Provide a minimal no-op polyfill.
if (typeof window !== 'undefined' && !window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
    });
}
