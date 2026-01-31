import { useLayoutEffect, useRef, useState } from 'react';

export default function Tooltip({ mousePos, children, show }) {
  const tooltipRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (show && tooltipRef.current) {
      const padding = 20;
      const minWidth = 200;
      
      let x = mousePos.x + 20;
      let y = mousePos.y + 20;
      let maxWidth = window.innerWidth - x - padding;

      // if space to the right too small then flip to the left
      if (maxWidth < minWidth && mousePos.x > minWidth + padding) {
        x = mousePos.x - minWidth - 20;
        maxWidth = minWidth;
      } else if (maxWidth < minWidth) {
        // if it cant fit well on either side constrain
        maxWidth = Math.max(maxWidth, minWidth);
      }

      // bottom boundary
      const rect = tooltipRef.current.getBoundingClientRect();
      if (y + rect.height > window.innerHeight - padding) {
        y = mousePos.y - rect.height - 20;
      }

      setCoords({ x, y, maxWidth });
    }
  }, [mousePos, show, children]);

  if (!show) return null;

  return (
    <div 
      ref={tooltipRef}
      className="fixed pointer-events-none bg-neutral-900/95 border border-neutral-800 px-3 py-1.5 text-neutral-500 text-xs font-mono z-50 shadow-2xl break-words text-left"
      style={{ left: coords.x, top: coords.y, maxWidth: coords.maxWidth }}
    >
      {children}
    </div>
  );
}
