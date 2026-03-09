import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  touchSupport: boolean;
}

export const useMobileDetection = (): MobileDetection => {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: '',
    screenWidth: 0,
    screenHeight: 0,
    touchSupport: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Detectar suporte a touch
      const touchSupport = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 || 
                          (navigator as any).msMaxTouchPoints > 0;

      // Detectar tipos de dispositivo
      const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const tabletRegex = /iPad|Android(?=.*Mobile)|Tablet/i;
      
      const isMobileUserAgent = mobileRegex.test(userAgent);
      const isTabletUserAgent = tabletRegex.test(userAgent);
      
      // Detectar por tamanho da tela
      const isMobileScreen = screenWidth <= 768;
      const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;
      
      // Combinar detecções
      const isMobile = isMobileUserAgent || (isMobileScreen && touchSupport);
      const isTablet = isTabletUserAgent || (isTabletScreen && touchSupport && !isMobile);
      const isDesktop = !isMobile && !isTablet;

      const newDetection: MobileDetection = {
        isMobile,
        isTablet,
        isDesktop,
        userAgent,
        screenWidth,
        screenHeight,
        touchSupport,
      };

      setDetection(newDetection);

      // Log para diagnóstico
      console.log('[Mobile Detection]', {
        device: isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop',
        screenSize: `${screenWidth}x${screenHeight}`,
        touchSupport,
        userAgent: userAgent.substring(0, 50) + '...',
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return detection;
};

export default useMobileDetection;