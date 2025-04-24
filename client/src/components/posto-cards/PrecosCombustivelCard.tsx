import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Droplet, Fuel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import PrecosCombustivelDialog from '../posto-dialogs/PrecosCombustivelDialog';

interface PrecosCombustivel {
  diesel: { id: number; valor_litro: number; updated_at: string };
  arla: { id: number; valor_litro: number; updated_at: string };
}

interface PrecosCombustivelCardProps {
  // Se dialogControl for fornecido, usaremos controle externo para o diálogo
  dialogControl?: {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
  };
}

export default function PrecosCombustivelCard({ dialogControl }: PrecosCombustivelCardProps) {
  const [precos, setPrecos] = useState<PrecosCombustivel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Estado interno do diálogo (usado apenas se dialogControl não for fornecido)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Verificar se o usuário é administrador
  const isAdmin = user?.role === 'admin';

  // Detectar se estamos usando controle interno ou externo para o diálogo
  const useExternalControl = !!dialogControl;
  
  // Funções para controlar o diálogo
  const openDialog = () => {
    if (useExternalControl) {
      dialogControl.onOpen();
    } else {
      setIsDialogOpen(true);
    }
  };
  
  const closeDialog = () => {
    if (useExternalControl) {
      dialogControl.onClose();
    } else {
      setIsDialogOpen(false);
    }
  };
  
  const isDialogCurrentlyOpen = useExternalControl 
    ? dialogControl.isOpen 
    : isDialogOpen;

  // Função para buscar preços atuais
  const fetchPrecos = async () => {
    setIsLoading(true);
    try {
      const dieselResponse = await apiRequest('GET', '/api/precos-combustivel/Diesel');
      const arlaResponse = await apiRequest('GET', '/api/precos-combustivel/ARLA');
      
      const dieselData = await dieselResponse.json();
      const arlaData = await arlaResponse.json();
      
      if (dieselData.success && arlaData.success) {
        setPrecos({
          diesel: dieselData.data,
          arla: arlaData.data
        });
      } else {
        throw new Error('Falha ao buscar preços de combustível');
      }
    } catch (error) {
      console.error('Erro ao buscar preços de combustível:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os preços de combustível.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar preços ao carregar o componente
  useEffect(() => {
    fetchPrecos();
  }, []);

  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center">
            <Fuel className="mr-2 h-5 w-5 text-primary" />
            Preços de Combustível
          </CardTitle>
          <CardDescription>
            Preços atuais por litro para abastecimento
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : precos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card de preço do Diesel */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Fuel className="h-5 w-5 text-amber-600 mr-2" />
                    <span className="font-medium text-amber-800">Diesel</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-amber-800">
                    R$ {typeof precos.diesel.valor_litro === 'number' ? precos.diesel.valor_litro.toFixed(2) : '0.00'}
                  </span>
                  <p className="text-xs text-amber-700 mt-1">
                    Atualizado em: {formatDate(precos.diesel.updated_at)}
                  </p>
                </div>
              </div>
              
              {/* Card de preço do ARLA */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplet className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">ARLA</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-blue-800">
                    R$ {typeof precos.arla.valor_litro === 'number' ? precos.arla.valor_litro.toFixed(2) : '0.00'}
                  </span>
                  <p className="text-xs text-blue-700 mt-1">
                    Atualizado em: {formatDate(precos.arla.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-6 text-gray-500">Não foi possível carregar os preços</p>
          )}
        </CardContent>
        
        {isAdmin && (
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center" 
              onClick={openDialog}
              data-precos-combustivel-btn
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurar Preços
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Sempre renderizar o diálogo, mas controlar sua visibilidade via props */}
      {!useExternalControl && (
        <PrecosCombustivelDialog 
          isOpen={isDialogOpen}
          onClose={closeDialog}
          onSave={fetchPrecos}
        />
      )}
    </>
  );
}