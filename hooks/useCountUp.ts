"use client";
import { useEffect, useState } from 'react';

/**
 * Animates a number from 0 to `end` using requestAnimationFrame.
 * Only starts counting when `start` is true (connect to useInView).
 */
export function useCountUp(end: number, start: boolean, duration = 800): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start || end === 0) {
      if (start) setValue(end);
      return;
    }

    let startTime: number | null = null;
    let frameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [end, start, duration]);

  return value;
}
