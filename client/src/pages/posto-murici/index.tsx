import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, User, Truck, ArrowRight } from 'lucide-react';
import Dashboard from '@/components/dashboard/Dashboard';

const PostoMuriciIndex: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <Dashboard title="Posto Murici" subtitle="Sistema de Gestão de Abastecimentos">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl text-primary">
              <Fuel className="mr-2" size={24} />
              Operador de Posto
            </CardTitle>
            <CardDescription>
              Acesso para operadores do posto realizarem registros de abastecimentos
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Interface para registro de abastecimentos, monitoramento de tanques e operações diárias do posto.</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setLocation('/posto-murici/operador')}
              className="w-full"
            >
              Acessar <ArrowRight className="ml-2" size={16} />
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl text-primary">
              <Truck className="mr-2" size={24} />
              Formulário Público
            </CardTitle>
            <CardDescription>
              Acesso público para motoristas realizarem registros de abastecimento
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Formulário simplificado para motoristas registrarem abastecimentos sem necessidade de login.</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setLocation('/posto-murici/public')}
              variant="outline" 
              className="w-full"
            >
              Acessar <ArrowRight className="ml-2" size={16} />
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl text-primary">
              <User className="mr-2" size={24} />
              Admin
            </CardTitle>
            <CardDescription>
              Área administrativa do Posto Murici
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Acesso para administradores gerenciarem configurações, usuários e relatórios do posto.</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setLocation('/posto-murici/admin')}
              variant="secondary" 
              className="w-full"
            >
              Acessar <ArrowRight className="ml-2" size={16} />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Dashboard>
  );
};

export default PostoMuriciIndex;