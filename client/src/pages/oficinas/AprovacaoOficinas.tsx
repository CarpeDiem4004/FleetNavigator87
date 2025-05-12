import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, AlertTriangle, Clock, UserCheck, Ban } from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Oficina {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  ramoAtuacao: string;
  dataCadastro: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  observacoes?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: string;
}

const AprovacaoOficinas: React.FC = () => {
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [loading, setLoading] = useState(true);
  const [oficinaAtual, setOficinaAtual] = useState<Oficina | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [dialogRejeitarAberto, setDialogRejeitarAberto] = useState(false);
  const [dialogSucessoAberto, setDialogSucessoAberto] = useState(false);
  const [ultimaAcao, setUltimaAcao] = useState<{ tipo: 'aprovacao' | 'rejeicao', oficina: string } | null>(null);
  const [filtro, setFiltro] = useState('');
  
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  
  // Verifica se o usuário tem permissão para acessar esta página
  const podeAprovar = hasPermission(['admin', 'gestor_frota']);
  
  useEffect(() => {
    async function carregarOficinas() {
      try {
        setLoading(true);
        const response = await apiRequest('/api/workshops/pending');
        const data = await response.json();
        setOficinas(data);
      } catch (error) {
        console.error('Erro ao carregar oficinas:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a lista de oficinas pendentes.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    carregarOficinas();
  }, [toast]);
  
  const handleAprovar = async (id: number) => {
    try {
      const oficina = oficinas.find(o => o.id === id);
      if (!oficina) return;
      
      await apiRequest(`/api/workshops/${id}/approve`, {
        method: 'POST'
      });
      
      // Atualiza a lista de oficinas
      setOficinas(prev => prev.map(o => 
        o.id === id ? { ...o, status: 'aprovado' } : o
      ));
      
      // Configura mensagem de sucesso
      setUltimaAcao({
        tipo: 'aprovacao',
        oficina: oficina.nome
      });
      
      setDialogSucessoAberto(true);
      
    } catch (error) {
      console.error('Erro ao aprovar oficina:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar a oficina.',
        variant: 'destructive'
      });
    }
  };
  
  const handleRejeitarDialog = (oficina: Oficina) => {
    setOficinaAtual(oficina);
    setMotivoRejeicao('');
    setDialogRejeitarAberto(true);
  };
  
  const handleRejeitar = async () => {
    if (!oficinaAtual) return;
    
    try {
      await apiRequest(`/api/workshops/${oficinaAtual.id}/reject`, {
        method: 'POST',
        data: { motivo: motivoRejeicao }
      });
      
      // Atualiza a lista de oficinas
      setOficinas(prev => prev.map(o => 
        o.id === oficinaAtual.id ? { ...o, status: 'rejeitado' } : o
      ));
      
      // Configura mensagem de sucesso
      setUltimaAcao({
        tipo: 'rejeicao',
        oficina: oficinaAtual.nome
      });
      
      // Fecha o dialog de rejeição e abre o de sucesso
      setDialogRejeitarAberto(false);
      setDialogSucessoAberto(true);
      
    } catch (error) {
      console.error('Erro ao rejeitar oficina:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar a oficina.',
        variant: 'destructive'
      });
    }
  };
  
  // Filtra as oficinas por texto na busca e por status
  const filtrarOficinas = (status?: string) => {
    return oficinas.filter(o => {
      // Filtro por texto
      const matchTexto = filtro === '' || 
        o.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        o.cnpj.includes(filtro) ||
        o.ramoAtuacao.toLowerCase().includes(filtro.toLowerCase());
      
      // Filtro por status
      const matchStatus = !status || o.status === status;
      
      return matchTexto && matchStatus;
    });
  };
  
  const oficinasPendentes = filtrarOficinas('pendente');
  const oficinasAprovadas = filtrarOficinas('aprovado');
  const oficinasRejeitadas = filtrarOficinas('rejeitado');
  
  if (!podeAprovar) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página. Esta funcionalidade é restrita 
            a administradores e gestores de frota.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Aprovação de Oficinas</CardTitle>
          <CardDescription>
            Gerencie o cadastro de novas oficinas no sistema. Você pode aprovar ou rejeitar 
            as solicitações de cadastro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="filtro">Buscar oficina</Label>
            <Input 
              id="filtro" 
              placeholder="Buscar por nome, CNPJ ou ramo de atuação..." 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <Tabs defaultValue="pendentes">
            <TabsList>
              <TabsTrigger value="pendentes">
                Pendentes <Badge variant="secondary" className="ml-2">{oficinasPendentes.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="aprovadas">
                Aprovadas <Badge variant="secondary" className="ml-2">{oficinasAprovadas.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejeitadas">
                Rejeitadas <Badge variant="secondary" className="ml-2">{oficinasRejeitadas.length}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pendentes">
              {loading ? (
                <div className="text-center py-8">Carregando oficinas pendentes...</div>
              ) : oficinasPendentes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Não há oficinas pendentes de aprovação.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {oficinasPendentes.map(oficina => (
                    <Card key={oficina.id} className="overflow-hidden">
                      <div className="flex items-center px-6 py-3 bg-muted">
                        <div className="flex-1">
                          <h3 className="font-medium">{oficina.nome}</h3>
                          <p className="text-sm text-muted-foreground">CNPJ: {oficina.cnpj}</p>
                        </div>
                        <Badge className="bg-amber-500">Pendente</Badge>
                      </div>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Contato</h4>
                            <p className="text-sm">{oficina.telefone}</p>
                            <p className="text-sm">{oficina.email}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Endereço</h4>
                            <p className="text-sm">{oficina.endereco}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Ramo de Atuação</h4>
                            <p className="text-sm">{oficina.ramoAtuacao}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Data de Cadastro</h4>
                            <p className="text-sm">{new Date(oficina.dataCadastro).toLocaleDateString('pt-BR')}</p>
                          </div>
                          {oficina.banco && (
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-medium mb-1">Dados Bancários</h4>
                              <p className="text-sm">
                                {oficina.banco} - Agência: {oficina.agencia}, Conta: {oficina.conta} ({oficina.tipoConta})
                              </p>
                            </div>
                          )}
                          {oficina.observacoes && (
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-medium mb-1">Observações</h4>
                              <p className="text-sm">{oficina.observacoes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-6">
                          <Button 
                            variant="outline" 
                            onClick={() => handleRejeitarDialog(oficina)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar
                          </Button>
                          <Button 
                            onClick={() => handleAprovar(oficina.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aprovar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="aprovadas">
              {loading ? (
                <div className="text-center py-8">Carregando oficinas aprovadas...</div>
              ) : oficinasAprovadas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Não há oficinas aprovadas.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {oficinasAprovadas.map(oficina => (
                    <Card key={oficina.id}>
                      <div className="flex items-center px-6 py-3 bg-muted">
                        <div className="flex-1">
                          <h3 className="font-medium">{oficina.nome}</h3>
                          <p className="text-sm text-muted-foreground">CNPJ: {oficina.cnpj}</p>
                        </div>
                        <Badge className="bg-green-600">Aprovada</Badge>
                      </div>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Contato</h4>
                            <p className="text-sm">{oficina.telefone}</p>
                            <p className="text-sm">{oficina.email}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Endereço</h4>
                            <p className="text-sm">{oficina.endereco}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rejeitadas">
              {loading ? (
                <div className="text-center py-8">Carregando oficinas rejeitadas...</div>
              ) : oficinasRejeitadas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Ban className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Não há oficinas rejeitadas.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {oficinasRejeitadas.map(oficina => (
                    <Card key={oficina.id}>
                      <div className="flex items-center px-6 py-3 bg-muted">
                        <div className="flex-1">
                          <h3 className="font-medium">{oficina.nome}</h3>
                          <p className="text-sm text-muted-foreground">CNPJ: {oficina.cnpj}</p>
                        </div>
                        <Badge variant="destructive">Rejeitada</Badge>
                      </div>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Contato</h4>
                            <p className="text-sm">{oficina.telefone}</p>
                            <p className="text-sm">{oficina.email}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Data de Cadastro</h4>
                            <p className="text-sm">{new Date(oficina.dataCadastro).toLocaleDateString('pt-BR')}</p>
                          </div>
                          {oficina.observacoes && (
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-medium mb-1">Motivo da Rejeição</h4>
                              <p className="text-sm">{oficina.observacoes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Dialog de Rejeição */}
      <Dialog open={dialogRejeitarAberto} onOpenChange={setDialogRejeitarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro de Oficina</DialogTitle>
            <DialogDescription>
              Informe um motivo para a rejeição do cadastro da oficina {oficinaAtual?.nome}.
              Essa informação será enviada por e-mail para o solicitante.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="motivo_rejeicao">Motivo da rejeição</Label>
            <Textarea
              id="motivo_rejeicao"
              placeholder="Informe o motivo da rejeição..."
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogRejeitarAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRejeitar}
              disabled={!motivoRejeicao.trim()}
              variant="destructive"
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Sucesso */}
      <Dialog open={dialogSucessoAberto} onOpenChange={setDialogSucessoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {ultimaAcao?.tipo === 'aprovacao' ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Cadastro Aprovado
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <XCircle className="w-5 h-5 mr-2" />
                  Cadastro Rejeitado
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {ultimaAcao?.tipo === 'aprovacao' ? (
                <>
                  O cadastro da oficina <strong>{ultimaAcao?.oficina}</strong> foi aprovado com sucesso.
                  Uma notificação foi enviada para o e-mail do responsável.
                </>
              ) : (
                <>
                  O cadastro da oficina <strong>{ultimaAcao?.oficina}</strong> foi rejeitado.
                  O motivo da rejeição foi enviado para o e-mail do responsável.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button onClick={() => setDialogSucessoAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AprovacaoOficinas;