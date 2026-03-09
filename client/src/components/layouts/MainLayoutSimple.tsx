import React, { ReactNode } from 'react';

interface MainLayoutSimpleProps {
  children: ReactNode;
}

const MainLayoutSimple: React.FC<MainLayoutSimpleProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gray-50">
        <div className="container mx-auto py-8 px-4 sm:px-6">
          {children}
        </div>
      </div>
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Muricion Fleet - Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
};

export default MainLayoutSimple;