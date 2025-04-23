import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const CartaoAbastecimentoPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Cartão de Abastecimento</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Cartões de Abastecimento</CardTitle>
            <CardDescription>
              Visualize e gerencie os cartões de abastecimento da frota.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Atenção</AlertTitle>
              <AlertDescription className="text-amber-700">
                Funcionalidade em desenvolvimento. Em breve você poderá gerenciar os cartões de abastecimento aqui.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CartaoAbastecimentoPage;