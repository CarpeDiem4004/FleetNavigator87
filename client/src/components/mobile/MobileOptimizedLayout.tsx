import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, X, Fuel, TruckIcon, History, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title: string;
  tabs?: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    content: React.ReactNode;
  }>;
}

const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({ 
  children, 
  title, 
  tabs = [] 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].id : '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 
                            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      if (isMobileDevice) {
        console.log('[Mobile] Dispositivo móvel detectado, aplicando otimizações');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  if (!isMobile) {
    return (
      <div className="w-full p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold truncate flex-1">{title}</h1>
          {tabs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
              className="ml-2"
            >
              {isTabMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </Button>
          )}
        </div>

        {/* Tab Selector Mobile */}
        {tabs.length > 0 && (
          <div className={cn(
            "border-t bg-white transition-all duration-200",
            isTabMenuOpen ? "max-h-96" : "max-h-0 overflow-hidden"
          )}>
            <div className="p-2 space-y-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className="w-full justify-start text-left"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsTabMenuOpen(false);
                  }}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Mobile */}
      <div className="p-4 pb-20">
        {tabs.length > 0 ? (
          <div className="space-y-4">
            {activeTabData && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <span className="mr-2">{activeTabData.icon}</span>
                    {activeTabData.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {activeTabData.content}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Fixed Bottom Navigation for Mobile */}
      {tabs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
          <div className="flex">
            {tabs.slice(0, 4).map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={cn(
                  "flex-1 h-16 rounded-none flex-col space-y-1 text-xs",
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : ""
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedLayout;