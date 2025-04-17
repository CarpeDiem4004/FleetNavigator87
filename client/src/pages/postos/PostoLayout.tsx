import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, Truck, TruckIcon } from 'lucide-react';

// Layout principal para as páginas de postos
interface PostoLayoutProps {
  children: React.ReactNode;
  nomePosto: string;
}

const PostoLayout: React.FC<PostoLayoutProps> = ({ children, nomePosto }) => {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">Murícion Fleet</span>
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl font-bold text-center text-primary">
              Posto de Abastecimento - {nomePosto}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Área Administrativa
            </Link>
          </div>
        </div>
      </header>
      
      {/* Conteúdo principal */}
      <main className="container py-6">
        <Tabs defaultValue="abastecimento" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="abastecimento" className="flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Abastecimento
            </TabsTrigger>
            <TabsTrigger value="recebimento" className="flex items-center gap-2">
              <TruckIcon className="h-4 w-4" />
              Recebimento
            </TabsTrigger>
            <TabsTrigger value="patio" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Controle de Pátio
            </TabsTrigger>
          </TabsList>
          
          {children}
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-background py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
          <div className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Murícion Fleet. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PostoLayout;