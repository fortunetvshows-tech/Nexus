import { useEffect, useState } from 'react';

/**
 * useHasMounted - React hook to detect client-side mount for hydration error prevention.
 * Returns true only after the component has mounted on the client.
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
}


