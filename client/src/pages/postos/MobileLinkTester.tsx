import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Smartphone, 
  Wifi,
  Clock,
  ExternalLink 
} from 'lucide-react';
import { MobilePostoLinkValidator } from '@/utils/mobilePostoLinkValidator';

interface PostoLinkValidation {
  id: string;
  nome: string;
  url: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  responseTime: number;
  mobileOptimized: boolean;
  errors: string[];
  recommendations: string[];
}

const MobileLinkTester: React.FC = () => {
  const [validations, setValidations] = useState<PostoLinkValidation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPosto, setSelectedPosto] = useState<string | null>(null);

  const postos = [
    { id: 'osasco_v2', nome: 'Osasco V2', url: '/posto/osasco_v2/public' },
    { id: 'alair_v2', nome: 'Alair V2', url: '/posto/alair_v2/public' },
    { id: 'campinas_v2', nome: 'Campinas V2', url: '/posto/campinas_v2/public' },
    { id: 'abc_v2', nome: 'ABC V2', url: '/posto/abc_v2/public' },
    { id: 'socorro_v2', nome: 'Socorro V2', url: '/posto/socorro_v2/public' },
    { id: 'sorocaba_v2', nome: 'Sorocaba V2', url: '/posto/sorocaba_v2/public' },
  ];

  const validator = MobilePostoLinkValidator.getInstance();

  const testSingleLink = async (posto: any) => {
    setIsLoading(true);
    try {
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}${posto.url}`;
      const validation = await validator.validatePostoLink(posto.id, posto.nome, fullUrl);
      
      setValidations(prev => {
        const filtered = prev.filter(v => v.id !== posto.id);
        return [...filtered, validation];
      });
    } catch (error) {
      console.error('Erro ao testar link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAllLinks = async () => {
    setIsLoading(true);
    setValidations([]);
    
    try {
      for (const posto of postos) {
        await testSingleLink(posto);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Erro ao testar todos os links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const openPostoLink = (url: string) => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}${url}`;
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="mr-2" />
            Teste de Links Externos Mobile - Postos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button onClick={testAllLinks} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar Todos os Links'
              )}
            </Button>
            
            <Button variant="outline" onClick={() => validator.clearCache()}>
              Limpar Cache
            </Button>
          </div>

          {/* Resumo dos Resultados */}
          {validations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {validations.filter(v => v.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Sucessos</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {validations.filter(v => v.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">Erros</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {validations.filter(v => v.mobileOptimized).length}
                  </div>
                  <div className="text-sm text-gray-600">Mobile OK</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {Math.round(validations.reduce((sum, v) => sum + v.responseTime, 0) / validations.length) || 0}ms
                  </div>
                  <div className="text-sm text-gray-600">Tempo Médio</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Postos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {postos.map((posto) => {
          const validation = validations.find(v => v.id === posto.id);
          
          return (
            <Card key={posto.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{posto.nome}</CardTitle>
                  <div className="flex items-center gap-2">
                    {validation && getStatusBadge(validation.status)}
                    {validation && getStatusIcon(validation.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {posto.url}
                    </code>
                  </div>

                  {validation && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{validation.responseTime}ms</span>
                        </div>
                        <div className="flex items-center">
                          <Smartphone className="w-4 h-4 mr-1" />
                          <span className={validation.mobileOptimized ? 'text-green-600' : 'text-red-600'}>
                            {validation.mobileOptimized ? 'Otimizado' : 'Não otimizado'}
                          </span>
                        </div>
                      </div>

                      {validation.errors.length > 0 && (
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <div className="text-sm font-medium text-red-800 mb-1">Erros:</div>
                          {validation.errors.map((error, index) => (
                            <div key={index} className="text-xs text-red-600">
                              • {error}
                            </div>
                          ))}
                        </div>
                      )}

                      {validation.recommendations.length > 0 && (
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <div className="text-sm font-medium text-yellow-800 mb-1">Recomendações:</div>
                          {validation.recommendations.map((rec, index) => (
                            <div key={index} className="text-xs text-yellow-700">
                              • {rec}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => testSingleLink(posto)}
                      disabled={isLoading}
                    >
                      Testar
                    </Button>
                    
                    <Button 
                      size="sm"
                      onClick={() => openPostoLink(posto.url)}
                    >
                      Abrir Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MobileLinkTester;