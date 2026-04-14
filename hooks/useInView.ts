"use client";
import { useEffect, useRef, useState } from 'react';

/**
 * IntersectionObserver hook — returns a ref and a boolean.
 * Attach `ref` to any element; `inView` becomes true once it scrolls into view.
 * By default it triggers only once (triggerOnce = true).
 */
export function useInView(options?: { threshold?: number; triggerOnce?: boolean }) {
  const { threshold = 0.15, triggerOnce = true } = options || {};
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) observer.unobserve(el);
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return { ref, inView };
}
