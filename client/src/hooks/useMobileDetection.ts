/**
 * Hook para detecção mobile robusta sem dependência de window.innerWidth
 * Evita problemas de renderização condicional em dispositivos móveis
 */

import { useState, useEffect } from 'react';

interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export function useMobileDetection(): MobileDetectionResult {
  const [detection, setDetection] = useState<MobileDetectionResult>(() => {
    // Detecção inicial baseada em User Agent (não window.innerWidth)
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTabletUA = /iPad|Android(?=.*(?:Tablet|Tab))|PlayBook|Silk/i.test(userAgent);
    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Usar viewport width ao invés de window.innerWidth
    const screenWidth = typeof window !== 'undefined' ? window.screen.width : 1024;
    
    const isMobile = isMobileUA || (screenWidth < 768 && isTouchDevice);
    const isTablet = isTabletUA || (screenWidth >= 768 && screenWidth < 1024 && isTouchDevice);
    const isDesktop = !isMobile && !isTablet;
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenWidth,
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
    };
  });

  useEffect(() => {
    const updateDetection = () => {
      const userAgent = navigator.userAgent;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTabletUA = /iPad|Android(?=.*(?:Tablet|Tab))|PlayBook|Silk/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Usar screen.width para consistência em mobile
      const screenWidth = window.screen.width;
      
      const isMobile = isMobileUA || (screenWidth < 768 && isTouchDevice);
      const isTablet = isTabletUA || (screenWidth >= 768 && screenWidth < 1024 && isTouchDevice);
      const isDesktop = !isMobile && !isTablet;
      
      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenWidth,
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
      });
    };

    // Atualizar na mudança de orientação (importante para mobile)
    window.addEventListener('orientationchange', updateDetection);
    window.addEventListener('resize', updateDetection);
    
    return () => {
      window.removeEventListener('orientationchange', updateDetection);
      window.removeEventListener('resize', updateDetection);
    };
  }, []);

  return detection;
}