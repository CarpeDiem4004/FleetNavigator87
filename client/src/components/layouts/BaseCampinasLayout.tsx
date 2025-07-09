import React from 'react';

interface BaseCampinasLayoutProps {
  children: React.ReactNode;
}

const BaseCampinasLayout: React.FC<BaseCampinasLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-sm text-gray-600">
            <span>Sistema de Gestão de Frotas</span>
            <span className="mx-2">→</span>
            <span>Base Campinas</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default BaseCampinasLayout;