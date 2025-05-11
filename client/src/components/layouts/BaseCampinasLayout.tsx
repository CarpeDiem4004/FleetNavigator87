import React, { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BaseCampinasLayoutProps {
  children: ReactNode;
}

const BaseCampinasLayout: React.FC<BaseCampinasLayoutProps> = ({ children }) => {
  const [location, navigate] = useLocation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/bases/campinas')}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
      {children}
    </div>
  );
};

export default BaseCampinasLayout;