import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { AlertTriangle, Home } from 'lucide-react';
import { NOME_POSTO_SOCORRO } from '@/constants/postos';

const SocorroPublic: React.FC = () => {
  return (
    <div className="container py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{NOME_POSTO_SOCORRO} - Posto Descontinuado</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Posto Desativado</AlertTitle>
            <AlertDescription>
              Este posto foi descontinuado em Maio/2025 e não está mais disponível para operações.
            </AlertDescription>
          </Alert>
          
          <p className="mb-6 text-muted-foreground">
            Por favor, utilize outro posto de abastecimento para registrar suas operações.
            Se precisar de assistência, entre em contato com o administrador do sistema.
          </p>
          
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/postos">
                <Home className="mr-2 h-4 w-4" />
                Voltar para lista de postos
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocorroPublic;