import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Factory, CheckCircle, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Base } from '@shared/schema';

const COCA_COLA_BASES = [
  {
    name: "BASE COCA-COLA ABC - OPERAÇÃO COCA-COLA",
    location: "São Paulo",
    operation: "COCA-COLA",
    active: true
  },
  {
    name: "BASE COCA-COLA IPATINGA - OPERAÇÃO COCA-COLA",
    location: "Minas Gerais",
    operation: "COCA-COLA",
    active: true
  },
  {
    name: "BASE COCA-COLA JUNDIAÍ - OPERAÇÃO COCA-COLA",
    location: "São Paulo",
    operation: "COCA-COLA",
    active: true
  },
  {
    name: "BASE COCA-COLA SÃO PAULO - OPERAÇÃO COCA-COLA",
    location: "São Paulo",
    operation: "COCA-COLA", 
    active: true
  }
];

interface CocaColaBasesListProps {
  existingBases: Base[];
  onComplete: () => void;
}

export default function CocaColaBasesList({ existingBases, onComplete }: CocaColaBasesListProps) {
  const [importingBases, setImportingBases] = useState<string[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filtrar bases já existentes pelo nome
  const existingBaseNames = existingBases.map(base => base.name);
  const basesToImport = COCA_COLA_BASES.filter(base => !existingBaseNames.includes(base.name));

  // Mutation para criar uma nova base
  const createBaseMutation = useMutation({
    mutationFn: async (base: typeof COCA_COLA_BASES[0]) => {
      const response = await apiRequest('POST', '/api/bases', base);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bases'] });
    }
  });

  const importBases = async () => {
    if (basesToImport.length === 0) {
      toast({
        title: "Importação concluída",
        description: "Todas as bases da Coca-Cola já estão cadastradas.",
        variant: "default"
      });
      onComplete();
      return;
    }

    setIsImporting(true);
    setImportingBases([]);
    setCompleted([]);
    setFailed([]);

    // Importar bases uma por uma
    for (const base of basesToImport) {
      try {
        setImportingBases(prev => [...prev, base.name]);
        
        // Fazer requisição para criar a base
        await createBaseMutation.mutateAsync(base);
        
        // Atualizar status de sucesso
        setCompleted(prev => [...prev, base.name]);
        
        toast({
          title: "Base importada com sucesso",
          description: `Base ${base.name} foi importada com sucesso.`,
          variant: "default"
        });
      } catch (error) {
        console.error(`Erro ao importar base ${base.name}:`, error);
        
        // Atualizar status de falha
        setFailed(prev => [...prev, base.name]);
        
        toast({
          title: "Erro ao importar base",
          description: `Não foi possível importar a base ${base.name}.`,
          variant: "destructive"
        });
      } finally {
        // Remover da lista de importando
        setImportingBases(prev => prev.filter(name => name !== base.name));
      }
    }

    setIsImporting(false);
    queryClient.invalidateQueries({ queryKey: ['/api/bases'] });
    
    // Verificar se todas foram importadas com sucesso
    if (failed.length === 0) {
      toast({
        title: "Importação concluída",
        description: `${completed.length} bases foram importadas com sucesso.`,
        variant: "default"
      });
      onComplete();
    } else {
      toast({
        title: "Importação concluída com erros",
        description: `${completed.length} bases importadas com sucesso, ${failed.length} falhas.`,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Bases Coca-Cola</CardTitle>
        <CardDescription>
          Importe bases padronizadas para operação Coca-Cola
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {basesToImport.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Todas as bases da Coca-Cola já estão cadastradas no sistema.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {basesToImport.map((base) => (
                <div key={base.name} className="flex items-center justify-between p-3 border rounded-md bg-background">
                  <div className="flex flex-col">
                    <div className="font-medium">{base.name}</div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1" />
                      {base.location}
                      <Factory className="w-4 h-4 ml-3 mr-1" />
                      {base.operation}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {importingBases.includes(base.name) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                    )}
                    {completed.includes(base.name) && (
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    )}
                    {failed.includes(base.name) && (
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    )}
                    
                    <Badge variant={base.active ? "default" : "outline"}>
                      {base.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onComplete}>
          Cancelar
        </Button>
        
        <Button 
          onClick={importBases} 
          disabled={isImporting || basesToImport.length === 0}
        >
          {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isImporting ? "Importando..." : "Importar Bases"}
        </Button>
      </CardFooter>
    </Card>
  );
}