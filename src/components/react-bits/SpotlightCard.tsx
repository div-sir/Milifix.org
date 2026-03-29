/**
 * React Bits — SpotlightCard
 * Source: https://github.com/DavidHDev/react-bits (MIT)
 * Docs: https://reactbits.dev
 */
import { useRef, type ReactNode } from 'react';
import './SpotlightCard.css';

export interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.12)',
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = divRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);
    el.style.setProperty('--spotlight-color', spotlightColor);
  }

  return (
    <div
      ref={divRef}
      className={`card-spotlight ${className}`.trim()}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
}
