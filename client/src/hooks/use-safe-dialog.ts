import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para lidar com o ciclo de vida seguro de diálogos.
 * Evita erros de "removeChild on Node" garantindo que o estado do diálogo 
 * não seja manipulado após a desmontagem do componente.
 */
export function useSafeDialog(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const isMountedRef = useRef(true);
  
  // Configurar a referência de montagem e limpá-la na desmontagem
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Funções seguras para manipular o estado do diálogo
  const safeSetOpen = (state: boolean) => {
    if (isMountedRef.current) {
      setIsOpen(state);
    }
  };
  
  const open = () => safeSetOpen(true);
  const close = () => safeSetOpen(false);
  
  return {
    isOpen,
    setIsOpen: safeSetOpen,
    open,
    close,
    isMounted: isMountedRef.current,
  };
}

export default useSafeDialog;