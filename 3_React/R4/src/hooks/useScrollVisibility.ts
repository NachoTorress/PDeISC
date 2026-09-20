import { useEffect, useState } from 'react';

/**
 * Watches the window scroll position and reports if an element should become visible.
 * Source: window.scrollY. Destination: boolean React state. Result: true after threshold pixels.
 */
export const useScrollVisibility = (threshold = 500) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > threshold);

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });

    return () => window.removeEventListener('scroll', updateVisibility);
  }, [threshold]);

  return isVisible;
};
