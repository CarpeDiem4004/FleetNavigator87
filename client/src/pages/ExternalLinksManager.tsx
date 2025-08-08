import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ExternalLink, Copy, CheckCircle, Power, PowerOff } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useToast } from '@/hooks/use-toast';

const ExternalLinksManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as bases (ativas e inativas)
  const { data: basesResponse, isLoading, error } = useQuery({
    queryKey: ['/api/bases'],
    queryFn: async () => {
      const response = await fetch('/api/bases');
      if (!response.ok) {
        throw new Error('Erro ao carregar bases');
      }
      return response.json();
    }
  });

  const bases = basesResponse?.data || [];

  // Filtrar bases para acesso externo (excluir apenas bases de manutenção)
  const externalBases = bases.filter((base: any) => 
    !base.has_maintenance && 
    base.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gerar URL externa para cada base
  const generateExternalUrl = (base: any): string => {
    const baseUrl = window.location.origin;
    const baseName = base.basename || base.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${baseUrl}/bases/${baseName}`;
  };

  // Mutation para ativar/desativar base
  const toggleBaseMutation = useMutation({
    mutationFn: async ({ baseId, active }: { baseId: number; active: boolean }) => {
      const response = await fetch(`/api/bases/${baseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar base');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bases'] });
      toast({
        title: variables.active ? "Base ativada!" : "Base desativada!",
        description: `Base ${data.data?.name} foi ${variables.active ? 'ativada' : 'desativada'} com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status da base",
        variant: "destructive"
      });
    }
  });

  // Copiar link para clipboard
  const copyToClipboard = async (url: string, baseName: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      toast({
        title: "Link copiado!",
        description: `Link da base ${baseName} copiado para a área de transferência.`,
      });
      
      // Remover indicador após 3 segundos
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6 px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Links Externos PWA</h1>
            <p className="text-gray-500">
              Gerenciamento de links externos para acesso às bases - Progressive Web App
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total de Bases</div>
                  <div className="text-2xl font-bold text-blue-600">{externalBases.length}</div>
                </div>
                <ExternalLink className="h-8 w-8 text-blue-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Bases GP (Grupo Pereira)</div>
                  <div className="text-2xl font-bold text-green-600">
                    {externalBases.filter((b: any) => b.basename?.startsWith('GP')).length}
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">GP</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Bases SC (Shopee)</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {externalBases.filter((b: any) => b.name?.startsWith('SC (')).length}
                  </div>
                </div>
                <Badge variant="outline" className="text-purple-600 border-purple-600">SC</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sistema de busca */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar base por nome ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabela de bases e links */}
        <Card>
          <CardHeader>
            <CardTitle>Bases com Acesso Externo PWA</CardTitle>
            <CardDescription>
              Lista completa de bases com links PWA individuais para acesso externo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando bases...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-500">
                Erro ao carregar bases: {error.message}
              </div>
            )}

            {!isLoading && !error && externalBases.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma base encontrada
              </div>
            )}

            {!isLoading && !error && externalBases.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Link PWA</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {externalBases.map((base: any) => {
                    const externalUrl = generateExternalUrl(base);
                    const isGP = base.basename?.startsWith('GP');
                    const isSC = base.name?.startsWith('SC (');
                    const isCocaCola = base.name?.startsWith('COCA COLA');
                    
                    return (
                      <TableRow key={base.id}>
                        <TableCell className="font-medium">{base.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {base.name}
                            {isGP && <Badge variant="outline" className="text-green-600 border-green-600">GP</Badge>}
                            {isSC && <Badge variant="outline" className="text-purple-600 border-purple-600">SC</Badge>}
                            {isCocaCola && <Badge variant="outline" className="text-red-600 border-red-600">CC</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{base.location || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={base.active}
                              onCheckedChange={(checked) => 
                                toggleBaseMutation.mutate({ baseId: base.id, active: checked })
                              }
                              disabled={toggleBaseMutation.isPending}
                            />
                            <Badge variant={base.active ? "default" : "secondary"}>
                              {base.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded max-w-xs overflow-hidden">
                            {externalUrl}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(externalUrl, base.name)}
                              className="flex items-center gap-1"
                            >
                              {copiedLink === externalUrl ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {copiedLink === externalUrl ? 'Copiado' : 'Copiar'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(externalUrl, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Abrir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Links importantes destacados */}
        <Card>
          <CardHeader>
            <CardTitle>Links GP (Grupo Pereira) - Principais</CardTitle>
            <CardDescription>
              Links dos acessos do Grupo Pereira para facilitar o compartilhamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {externalBases
                .filter((b: any) => b.basename?.startsWith('GP'))
                .map((base: any) => {
                  const url = generateExternalUrl(base);
                  return (
                    <Card key={base.id} className="border-green-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold text-green-800">{base.basename}</h3>
                          <p className="text-sm text-gray-600 mb-3">{base.location}</p>
                          <div className="space-y-2">
                            <code className="text-xs bg-green-50 px-2 py-1 rounded block break-all">
                              {url}
                            </code>
                            <Button
                              size="sm"
                              onClick={() => copyToClipboard(url, base.basename)}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              {copiedLink === url ? 'Copiado!' : 'Copiar Link'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayoutSimple>
  );
};

export default ExternalLinksManager;