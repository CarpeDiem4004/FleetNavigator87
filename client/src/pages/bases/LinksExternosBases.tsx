/**
 * Página de links externos para bases
 * Esta página oferece acesso rápido aos URLs públicos de todas as bases
 * para compartilhamento com operadores externos
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  ExternalLink, 
  Copy, 
  Search, 
  Eye,
  CheckCircle,
  Wrench
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
  has_maintenance: boolean;
  basename?: string;
}

export default function LinksExternosBases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedUrls, setCopiedUrls] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Buscar TODAS as bases (ativas e inativas)
  const { data: basesResponse, isLoading, error } = useQuery({
    queryKey: ['/api/bases'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/bases');
      if (!res.ok) throw new Error('Erro ao carregar bases');
      return res.json();
    },
  });

  const bases = basesResponse?.data || [];

  // Mostrar TODAS as bases, incluindo inativas e de manutenção
  const externalBases = bases.filter((base: any) => {
    const matchesSearch = searchTerm === '' || base.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const generateBaseUrl = (base: Base) => {
    const currentUrl = window.location.origin;
    return `${currentUrl}/base/${base.id}/public`;
  };

  const copyToClipboard = async (base: Base) => {
    const url = generateBaseUrl(base);
    await navigator.clipboard.writeText(url);
    
    setCopiedUrls(prev => {
      const newSet = new Set(prev);
      newSet.add(base.id);
      return newSet;
    });

    toast({
      title: "Link copiado!",
      description: `Link da base ${base.name} foi copiado para a área de transferência.`,
    });

    // Reset visual feedback after 3 seconds
    setTimeout(() => {
      setCopiedUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(base.id);
        return newSet;
      });
    }, 3000);
  };

  const openPreview = (base: Base) => {
    const url = generateBaseUrl(base);
    window.open(url, '_blank');
  };

  // Calcular estatísticas
  const totalBases = bases?.length || 0;
  const activeBases = bases?.filter((base: any) => base.active === true).length || 0;
  const inactiveBases = totalBases - activeBases;
  const maintenanceBases = bases?.filter((base: any) => base.has_maintenance === true).length || 0;

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
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ExternalLink className="h-8 w-8" />
            Links Externos - Todas as Bases
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie links PWA externos para todas as {totalBases} bases do sistema
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Bases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                {totalBases}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bases Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {activeBases}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bases Inativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-orange-600" />
                {inactiveBases}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Manutenção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Wrench className="h-5 w-5 text-purple-600" />
                {maintenanceBases}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar bases por nome ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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

        {/* Bases Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Bases do Sistema</CardTitle>
            <CardDescription>
              Lista completa de todas as bases com links PWA individuais e status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Base</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Link PWA</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {externalBases.map((base: any) => {
                    const isCocaCola = base.name?.toLowerCase().includes('coca');
                    const isMercado = base.name?.toLowerCase().includes('mercado');
                    const isOxxo = base.name?.toLowerCase().includes('oxxo');
                    
                    return (
                      <TableRow key={base.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{base.name}</div>
                              <div className="text-xs text-muted-foreground">ID: {base.id}</div>
                            </div>
                            {isCocaCola && <Badge variant="outline" className="text-red-600 border-red-600">CC</Badge>}
                            {isMercado && <Badge variant="outline" className="text-yellow-600 border-yellow-600">ML</Badge>}
                            {isOxxo && <Badge variant="outline" className="text-green-600 border-green-600">OX</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{base.location || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={base.active === true ? "default" : "secondary"}>
                              {base.active === true ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {base.has_maintenance === true && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Manutenção
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-mono text-muted-foreground max-w-xs truncate">
                            {generateBaseUrl(base)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(base)}
                            >
                              {copiedUrls.has(base.id) ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPreview(base)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Abrir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {externalBases.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma base encontrada</h3>
              <p className="text-muted-foreground">
                Não há bases que correspondam aos critérios de busca.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Footer */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="text-sm font-medium mb-2">
                Total de bases: {totalBases} | Ativas: {activeBases} | Inativas: {inactiveBases}
              </div>
              <p className="text-xs text-muted-foreground">
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