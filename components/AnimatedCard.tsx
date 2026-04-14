"use client";
import React from 'react';
import { useInView } from '@/hooks/useInView';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;        // ms delay for staggered entrance
  className?: string;
  animation?: 'card-enter' | 'slide-left' | 'fade-in';
}

/**
 * Wraps any card in an IntersectionObserver-powered animation.
 * Starts invisible, then plays the animation once scrolled into view.
 */
export default function AnimatedCard({ children, delay = 0, className = '', animation = 'card-enter' }: AnimatedCardProps) {
  const { ref, inView } = useInView({ threshold: 0.1 });

  const animationClass = {
    'card-enter': 'animate-card-enter',
    'slide-left': 'animate-slide-left',
    'fade-in': 'animate-fade-in',
  }[animation];

  return (
    <div
      ref={ref}
      className={`${className} ${inView ? animationClass : 'opacity-0'} hover-tilt`}
      style={inView ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
