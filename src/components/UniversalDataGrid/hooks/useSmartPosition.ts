import { useState, useLayoutEffect } from 'react';

export const useSmartPosition = (anchorRect: DOMRect | null, width: number, height: number) => {
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });

    useLayoutEffect(() => {
        if (!anchorRect) return;
        let left = anchorRect.left;
        let top = anchorRect.top;
        if (left + width > window.innerWidth) left = window.innerWidth - width - 20;
        if (left < 0) left = 10;
        if (top + height > window.innerHeight) {
            const spaceAbove = anchorRect.top;
            if (spaceAbove > height) top = anchorRect.top - height;
            else top = window.innerHeight - height - 10;
        }
        setStyle({ top, left, width: `${width}px`, height: `${height}px`, opacity: 1, transition: 'opacity 0.1s ease-in' });
    }, [anchorRect, width, height]);

    return style;
};
