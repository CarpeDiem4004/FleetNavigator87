import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AlertCircle, CheckCircle2, CloudOff } from 'lucide-react';

interface AutoSaveFormProps {
  id?: string;
  title: string;
  description?: string;
  table: string;
  initialData?: Record<string, any>;
  onSave?: (data: any) => void;
}

export function AutoSaveForm({ 
  id = 'new', 
  title,
  description,
  table,
  initialData = {},
  onSave
}: AutoSaveFormProps) {
  const { toast } = useToast();
  const uniqueKey = `${table}_${id}`;
  
  // Usar o hook de auto salvamento
  const {
    data,
    updateData,
    save,
    saving,
    lastSaved,
    error,
    clearCache,
    isOnline,
    offlineChanges,
    syncOfflineData
  } = useAutoSave(table, uniqueKey, initialData, {
    debounceTime: 2000,
    onSaveSuccess: (savedData) => {
      console.log('Dados salvos com sucesso:', savedData);
    },
    onSaveError: (error) => {
      console.error('Erro ao salvar dados:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Seus dados estão sendo armazenados localmente e serão sincronizados quando a conexão for restaurada.',
        variant: 'destructive'
      });
    }
  });
  
  // Tentar sincronizar quando voltar online
  useEffect(() => {
    if (isOnline && offlineChanges > 0) {
      syncOfflineData();
    }
  }, [isOnline, offlineChanges, syncOfflineData]);

  // Função para formatar o timestamp de último salvamento
  const formatLastSaved = () => {
    if (!lastSaved) return 'Nunca salvo';
    
    const now = new Date();
    const diff = Math.round((now.getTime() - lastSaved.getTime()) / 1000);
    
    if (diff < 60) return `Salvo há ${diff} segundo${diff === 1 ? '' : 's'} atrás`;
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `Salvo há ${minutes} minuto${minutes === 1 ? '' : 's'} atrás`;
    }
    
    return `Salvo em ${lastSaved.toLocaleTimeString()}`;
  };
  
  // Função para salvar manualmente
  const handleSave = async () => {
    try {
      const result = await save();
      if (result.success) {
        toast({
          title: 'Salvo com sucesso',
          description: 'Todos os dados foram salvos no servidor.',
        });
        
        if (onSave) {
          onSave(data);
        }
      } else if (result.offline) {
        toast({
          title: 'Salvo offline',
          description: 'Seus dados foram armazenados localmente e serão sincronizados quando a conexão for restaurada.',
        });
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar os dados. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Online
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <CloudOff className="w-3 h-3 mr-1" /> Offline
              </Badge>
            )}
            
            {offlineChanges > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {offlineChanges} {offlineChanges === 1 ? 'alteração pendente' : 'alterações pendentes'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao salvar: {error.message || 'Erro desconhecido'}. 
              Seus dados estão sendo armazenados localmente.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            placeholder="Insira um título"
            value={data.title || ''}
            onChange={(e) => updateData({ title: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            placeholder="Insira uma descrição"
            rows={4}
            value={data.description || ''}
            onChange={(e) => updateData({ description: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Input
            id="priority"
            placeholder="Prioridade (Alta, Média, Baixa)"
            value={data.priority || ''}
            onChange={(e) => updateData({ priority: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="assignedTo">Responsável</Label>
          <Input
            id="assignedTo"
            placeholder="Nome do responsável"
            value={data.assignedTo || ''}
            onChange={(e) => updateData({ assignedTo: e.target.value })}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center border-t p-4">
        <div className="text-sm text-muted-foreground">
          {saving ? 'Salvando...' : formatLastSaved()}
          {offlineChanges > 0 && isOnline && (
            <Button 
              variant="link" 
              className="ml-2 p-0 h-auto text-sm text-blue-600" 
              onClick={syncOfflineData}
            >
              Sincronizar agora
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearCache}>
            Limpar Cache
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Agora'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}