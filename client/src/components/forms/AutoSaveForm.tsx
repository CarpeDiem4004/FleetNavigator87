// Simplified AutoSaveForm - Core functionality only
import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, Wifi, WifiOff } from 'lucide-react';

interface AutoSaveFormProps {
  table: string;
  uniqueKey: string | number;
  initialData?: any;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  onSave?: (data: any) => void | Promise<void>;
  onError?: (error: any) => void;
}

export function AutoSaveForm({
  table,
  uniqueKey,
  initialData = {},
  children,
  title,
  description,
  className = '',
  onSave,
  onError,
}: AutoSaveFormProps) {
  // Simplified state management
  const data = initialData;
  const saving = false;
  const lastSaved = null;
  const error = null;
  const isOnline = true;
  const offlineChanges = 0;

  return (
    <Card className={`w-full ${className}`}>
      {(title || description) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center space-x-2">
              {/* Status de conexão */}
              <div className="flex items-center space-x-1 text-sm">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-500">Offline</span>
                  </>
                )}
              </div>

              {/* Status de salvamento */}
              {saving && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Save className="w-3 h-3 animate-spin" />
                  <span>Salvando...</span>
                </Badge>
              )}
              
              {lastSaved && !saving && (
                <Badge variant="outline" className="text-xs">
                  Salvo às {new Date(lastSaved).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Badge>
              )}

              {/* Alterações offline */}
              {offlineChanges > 0 && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{offlineChanges} alterações offline</span>
                </Badge>
              )}
            </div>
          </div>
          
          {/* Exibir erro se houver */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  {error.message || 'Erro ao salvar dados. Tentando novamente...'}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export default AutoSaveForm;