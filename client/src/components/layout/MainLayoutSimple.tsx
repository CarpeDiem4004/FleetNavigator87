import React, { ReactNode } from 'react';

interface MainLayoutSimpleProps {
  children: ReactNode;
}

const MainLayoutSimple: React.FC<MainLayoutSimpleProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gray-50">
        <div className="container mx-auto py-6 px-4 sm:px-6">
          {children}
        </div>
      </div>
      <footer className="bg-gradient-to-r from-primary-900/5 to-primary-800/5 border-t border-primary-100/20 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Muricion Fleet - Todos os direitos reservados
          <br />
          <span className="text-xs text-gray-400">
            Desenvolvido por Carpe Diem 4004 | suporte 11 970558053
          </span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayoutSimple;