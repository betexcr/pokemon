// Optional React helpers (safe in React & Next.js client)
// Guard all browser APIs for SSR compatibility.

import * as React from 'react';

export function useThrottleRender(limitMs: number = 50) {
  const last = React.useRef(0);
  const [allowed, setAllowed] = React.useState(true);

  React.useEffect(() => {
    const now = Date.now();
    const delta = now - last.current;
    if (delta < limitMs) {
      setAllowed(false);
      const id = setTimeout(() => {
        last.current = Date.now();
        setAllowed(true);
      }, limitMs - delta);
      return () => clearTimeout(id);
    } else {
      last.current = now;
      setAllowed(true);
    }
  });

  return allowed;
}

// Usage:
// const canRender = useThrottleRender(50);
// if (!canRender) return null;


