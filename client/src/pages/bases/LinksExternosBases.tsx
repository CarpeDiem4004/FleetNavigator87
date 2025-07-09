/**
 * Página de links externos para bases
 * Esta página oferece acesso rápido aos URLs públicos de todas as bases ativas
 * para compartilhamento com operadores externos
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  ExternalLink, 
  Copy, 
  Search, 
  Eye,
  Filter,
  MapPin,
  Wrench,
  Shield,
  Fuel,
  CheckCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';

interface Base {
  id: number;
  name: string;
  location: string;
  operation: string;
  type: string;
  active: boolean;
}

export default function LinksExternosBases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState('');
  const [copiedUrls, setCopiedUrls] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Buscar bases ativas
  const { data: bases, isLoading, error } = useQuery<Base[]>({
    queryKey: ['/api/bases'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/bases');
      const data = await res.json();
      
      // Filtragem local dos dados retornados
      if (Array.isArray(data.data)) {
        return data.data.filter((base: Base) => base.active);
      }
      return [];
    },
  });

  // Filtrar bases baseado na pesquisa e filtros
  const filteredBases = bases?.filter(base => {
    const matchesSearch = base.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         base.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOperation = !operationFilter || base.operation === operationFilter;
    return matchesSearch && matchesOperation;
  }) || [];

  // Obter operações únicas para o filtro
  const uniqueOperations = Array.from(new Set(bases?.map(base => base.operation) || []));

  const generateBaseUrl = (base: Base) => {
    const currentUrl = window.location.origin;
    return `${currentUrl}/base/${base.id}/public`;
  };

  const copyToClipboard = (base: Base) => {
    const url = generateBaseUrl(base);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrls(prev => new Set([...prev, base.id]));
      toast({
        title: "Link copiado!",
        description: `URL da base ${base.name} copiada para a área de transferência.`
      });
      
      // Remover indicador de copiado após 3 segundos
      setTimeout(() => {
        setCopiedUrls(prev => {
          const newSet = new Set(prev);
          newSet.delete(base.id);
          return newSet;
        });
      }, 3000);
    });
  };

  const openInNewTab = (base: Base) => {
    const url = generateBaseUrl(base);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando bases...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">Erro ao carregar bases</div>
            <p className="text-muted-foreground">Não foi possível carregar a lista de bases.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ExternalLink className="h-8 w-8" />
              Links Externos - Bases
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e compartilhe links de acesso público para as bases ativas
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">
              {filteredBases.length} bases encontradas
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar bases</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome ou localização..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="operation">Filtrar por operação</Label>
                <select
                  id="operation"
                  value={operationFilter}
                  onChange={(e) => setOperationFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Todas as operações</option>
                  {uniqueOperations.map(operation => (
                    <option key={operation} value={operation}>
                      {operation}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
              Como usar os links externos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 dark:text-blue-300">
            <ul className="space-y-2 text-sm">
              <li>• <strong>Copiar Link:</strong> Clique no botão "Copiar" para copiar o URL e compartilhar</li>
              <li>• <strong>Visualizar:</strong> Clique em "Abrir" para ver como a página aparece publicamente</li>
              <li>• <strong>Acesso Público:</strong> Estes links funcionam sem necessidade de login</li>
              <li>• <strong>Compartilhamento:</strong> Ideal para operadores externos e parceiros</li>
            </ul>
          </CardContent>
        </Card>

        {/* Bases List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBases.map((base) => (
            <Card key={base.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {base.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{base.location}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {base.operation}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Base Info */}
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Tipo:</span> {base.type}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">ID:</span> {base.id}
                    </div>
                  </div>

                  {/* URL Preview */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Link público:</div>
                    <div className="text-xs bg-muted p-2 rounded font-mono break-all">
                      {generateBaseUrl(base)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(base)}
                      className="flex-1"
                    >
                      {copiedUrls.has(base.id) ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInNewTab(base)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Abrir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredBases.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma base encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || operationFilter 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Não há bases ativas disponíveis no momento.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Total de bases ativas:</strong> {bases?.length || 0}
              </p>
              <p>
                Os links externos permitem acesso público às páginas das bases sem necessidade de autenticação.
                Ideal para compartilhar com operadores externos e parceiros.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}