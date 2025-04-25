import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

/**
 * Hook personalizado que funciona como useState, mas previne
 * atualizações de estado em componentes desmontados
 */
export function useSafeState<T>(initialState: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialState);
  const mountedRef = useRef<boolean>(true);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  const setSafeState: Dispatch<SetStateAction<T>> = (value) => {
    if (mountedRef.current) {
      setState(value);
    }
  };
  
  return [state, setSafeState];
}