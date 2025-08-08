// PWA utilities for Line Haul application

export interface PWAInstallPrompt extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export class PWAManager {
  private static instance: PWAManager;
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private isStandalone = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  private init(): void {
    // Check if app is running in standalone mode
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check if app is installed
    this.isInstalled = this.isStandalone || (window.navigator as any).standalone === true;

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e as PWAInstallPrompt;
      this.showInstallButton();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.showInstallSuccessMessage();
    });

    // Register service worker
    this.registerServiceWorker();
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        
        console.log('[PWA] Service Worker registered successfully:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available');
                this.showUpdateAvailableMessage();
              }
            });
          }
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('[PWA] Message from service worker:', event.data);
        });

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      console.log('[PWA] User choice:', choiceResult);
      
      if (choiceResult.outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  public getInstallationStatus(): {
    canInstall: boolean;
    isInstalled: boolean;
    isStandalone: boolean;
  } {
    return {
      canInstall: !!this.deferredPrompt,
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone
    };
  }

  private showInstallButton(): void {
    // Dispatch custom event to show install button
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  }

  private hideInstallButton(): void {
    // Dispatch custom event to hide install button
    window.dispatchEvent(new CustomEvent('pwa-install-completed'));
  }

  private showInstallSuccessMessage(): void {
    // Dispatch custom event for install success
    window.dispatchEvent(new CustomEvent('pwa-install-success'));
  }

  private showUpdateAvailableMessage(): void {
    // Dispatch custom event for update available
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  }

  public async syncOfflineData(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('checklist-sync');
        console.log('[PWA] Background sync registered');
      } catch (error) {
        console.error('[PWA] Background sync registration failed:', error);
      }
    }
  }

  public async requestPushNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('[PWA] Push notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  public showLocalNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
    }
  }

  public async getNetworkStatus(): Promise<{
    online: boolean;
    effectiveType?: string;
    downlink?: number;
  }> {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink
    };
  }

  public enableOfflineMode(): void {
    // Store offline mode flag
    localStorage.setItem('pwa-offline-mode', 'true');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-offline-mode-enabled'));
  }

  public disableOfflineMode(): void {
    // Remove offline mode flag
    localStorage.removeItem('pwa-offline-mode');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-offline-mode-disabled'));
  }

  public isOfflineModeEnabled(): boolean {
    return localStorage.getItem('pwa-offline-mode') === 'true';
  }
}

// Global PWA instance
export const pwaManager = PWAManager.getInstance();

// Utility functions
export const checkPWASupport = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const isPWAInstalled = (): boolean => {
  return pwaManager.getInstallationStatus().isInstalled;
};

export const canInstallPWA = (): boolean => {
  return pwaManager.getInstallationStatus().canInstall;
};