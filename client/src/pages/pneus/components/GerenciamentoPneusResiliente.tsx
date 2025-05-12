/**
 * Componente de gerenciamento de pneus usando o sistema resiliente
 * Garante que todas as operações de pneus sejam persistidas no Supabase
 */

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { resilientApiClient } from '../../../services/resilientApiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Truck, RefreshCw, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PneuData {
  id: number;
  codigo: string;
  marca: string;
  modelo: string;
  status: string;
  dataAquisicao: string;
  baseId: number;
  baseNome: string;
  veiculoPlaca?: string;
  posicao?: string;
  profundidadeSulco?: number;
  pressao?: number;
  quilometragem?: number;
  _pending?: boolean;
}

/**
 * Componente principal de gerenciamento de pneus com persistência resiliente
 */
export default function GerenciamentoPneusResiliente() {
  const { toast } = useToast();
  const [pneus, setPneus] = useState<PneuData[]>([]);
  const [filtroBase, setFiltroBase] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSistema, setStatusSistema] = useState<any>(null);
  const [aba, setAba] = useState<string>('listagem');
  const [pneuSelecionado, setPneuSelecionado] = useState<PneuData | null>(null);
  const [formNovoPneu, setFormNovoPneu] = useState<Partial<PneuData>>({
    marca: '',
    modelo: '',
    baseId: 9, // Base Campinas
    baseNome: 'Campinas',
  });
  const [formMedicao, setFormMedicao] = useState({
    profundidadeSulco: 0,
    pressao: 0,
    observacao: ''
  });
  const [pendingOperations, setPendingOperations] = useState<number>(0);

  // Buscar status do sistema de persistência
  const buscarStatusSistema = async () => {
    try {
      const status = await resilientApiClient.checkStatus();
      setStatusSistema(status);
      setPendingOperations(status.pendingCount || 0);
    } catch (err) {
      console.error('Erro ao buscar status do sistema:', err);
    }
  };

  // Forçar processamento de operações pendentes
  const forcarProcessamento = async () => {
    try {
      setLoading(true);
      const resultado = await resilientApiClient.processOperations();
      toast({
        title: 'Processamento iniciado',
        description: `${resultado.processedCount} operações processadas.`,
        duration: 3000,
      });
      buscarStatusSistema();
      carregarPneus();
    } catch (err) {
      toast({
        title: 'Erro no processamento',
        description: 'Não foi possível processar operações pendentes.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar lista de pneus
  const carregarPneus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filtros: Record<string, any> = {};
      if (filtroBase) filtros.baseId = parseInt(filtroBase);
      if (filtroStatus) filtros.status = filtroStatus;
      
      const listaPneus = await resilientApiClient.getPneus(filtros);
      setPneus(listaPneus);
    } catch (err: any) {
      setError('Falha ao carregar pneus: ' + (err.message || 'Erro desconhecido'));
      console.error('Erro ao carregar pneus:', err);
    } finally {
      setLoading(false);
    }
  };

  // Registrar novo pneu
  const registrarPneu = async () => {
    try {
      if (!formNovoPneu.marca || !formNovoPneu.modelo) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos obrigatórios.',
          variant: 'destructive',
          duration: 3000,
        });
        return;
      }
      
      setLoading(true);
      
      const novoPneu = {
        ...formNovoPneu,
        status: 'disponivel',
        dataAquisicao: new Date().toISOString().split('T')[0],
        codigo: `PN-${Math.floor(Math.random() * 10000)}`
      };
      
      await resilientApiClient.registrarPneu(novoPneu);
      
      toast({
        title: 'Pneu registrado',
        description: 'O pneu foi registrado com sucesso.',
        duration: 3000,
      });
      
      setFormNovoPneu({
        marca: '',
        modelo: '',
        baseId: 9,
        baseNome: 'Campinas',
      });
      
      setAba('listagem');
      await carregarPneus();
      await buscarStatusSistema();
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar',
        description: err.message || 'Falha ao registrar o pneu.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Selecionar pneu para detalhes
  const selecionarPneu = async (pneu: PneuData) => {
    setPneuSelecionado(pneu);
    setAba('detalhes');
  };

  // Atualizar status do pneu
  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      setLoading(true);
      
      await resilientApiClient.atualizarStatusPneu(id, novoStatus);
      
      toast({
        title: 'Status atualizado',
        description: `O pneu agora está "${novoStatus}".`,
        duration: 3000,
      });
      
      if (pneuSelecionado && pneuSelecionado.id === id) {
        setPneuSelecionado({ ...pneuSelecionado, status: novoStatus, _pending: true });
      }
      
      await carregarPneus();
      await buscarStatusSistema();
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err.message || 'Falha ao atualizar o status.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Registrar medição para o pneu
  const registrarMedicao = async () => {
    if (!pneuSelecionado) return;
    
    try {
      setLoading(true);
      
      await resilientApiClient.registrarMedicaoPneu(
        pneuSelecionado.id,
        formMedicao.profundidadeSulco,
        formMedicao.pressao,
        formMedicao.observacao
      );
      
      toast({
        title: 'Medição registrada',
        description: 'A medição foi registrada com sucesso.',
        duration: 3000,
      });
      
      setFormMedicao({
        profundidadeSulco: 0,
        pressao: 0,
        observacao: ''
      });
      
      await buscarStatusSistema();
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar',
        description: err.message || 'Falha ao registrar medição.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    buscarStatusSistema();
    carregarPneus();
    
    // Polling para verificar status do sistema
    const intervalId = setInterval(() => {
      buscarStatusSistema();
    }, 30000); // a cada 30 segundos
    
    return () => clearInterval(intervalId);
  }, []);

  // Efeito para recarregar quando os filtros mudam
  useEffect(() => {
    carregarPneus();
  }, [filtroBase, filtroStatus]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Pneus</h1>
        
        <div className="flex items-center gap-2">
          {pendingOperations > 0 && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              {pendingOperations} operações pendentes
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forcarProcessamento}
            disabled={loading || pendingOperations === 0}
          >
            <Database className="h-4 w-4 mr-1" />
            Sincronizar dados
          </Button>
        </div>
      </div>

      {statusSistema && statusSistema.connected ? (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Conectado ao Supabase</AlertTitle>
          <AlertDescription>
            Sistema de persistência funcionando normalmente.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Modo offline</AlertTitle>
          <AlertDescription>
            Sistema operando em modo local. Os dados serão sincronizados automaticamente quando a conexão for restabelecida.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={aba} onValueChange={setAba} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="listagem">Listagem de Pneus</TabsTrigger>
          <TabsTrigger value="cadastro">Cadastrar Novo</TabsTrigger>
          {pneuSelecionado && (
            <TabsTrigger value="detalhes">Detalhes do Pneu</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="listagem">
          <Card>
            <CardHeader>
              <CardTitle>Pneus Cadastrados</CardTitle>
              <CardDescription>Gerenciamento resiliente de pneus</CardDescription>
              
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="filtroBase">Filtrar por Base</Label>
                  <Select value={filtroBase} onValueChange={setFiltroBase}>
                    <SelectTrigger id="filtroBase">
                      <SelectValue placeholder="Todas as bases" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as bases</SelectItem>
                      <SelectItem value="9">Campinas</SelectItem>
                      <SelectItem value="10">Goiânia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="filtroStatus">Filtrar por Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger id="filtroStatus">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="em_uso">Em uso</SelectItem>
                      <SelectItem value="em_manutencao">Em manutenção</SelectItem>
                      <SelectItem value="descartado">Descartado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => carregarPneus()}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert className="mb-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {loading ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : pneus.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  Nenhum pneu encontrado com os filtros selecionados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pneus.map((pneu) => (
                    <Card key={pneu.id} className={`${pneu._pending ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-md">{pneu.codigo}</CardTitle>
                          <Badge variant={pneu.status === 'disponivel' ? 'outline' : 
                                          pneu.status === 'em_uso' ? 'default' : 
                                          pneu.status === 'em_manutencao' ? 'secondary' : 'destructive'}>
                            {pneu.status === 'disponivel' ? 'Disponível' : 
                             pneu.status === 'em_uso' ? 'Em uso' : 
                             pneu.status === 'em_manutencao' ? 'Em manutenção' : 'Descartado'}
                          </Badge>
                        </div>
                        <CardDescription>{pneu.marca} - {pneu.modelo}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <p className="text-sm"><strong>Base:</strong> {pneu.baseNome}</p>
                        {pneu.veiculoPlaca && (
                          <div className="flex items-center mt-1 text-sm">
                            <Truck className="h-3 w-3 mr-1" />
                            <span><strong>Veículo:</strong> {pneu.veiculoPlaca}</span>
                            {pneu.posicao && <span className="ml-2">({pneu.posicao})</span>}
                          </div>
                        )}
                        {pneu._pending && (
                          <Badge variant="outline" className="mt-2 bg-yellow-100 border-yellow-300 text-yellow-800">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Sincronizando...
                          </Badge>
                        )}
                      </CardContent>
                      
                      <CardFooter>
                        <Button variant="secondary" size="sm" className="w-full" onClick={() => selecionarPneu(pneu)}>
                          Ver detalhes
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cadastro">
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Novo Pneu</CardTitle>
              <CardDescription>Adicione um novo pneu ao sistema</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="marca">Marca*</Label>
                    <Input 
                      id="marca" 
                      value={formNovoPneu.marca} 
                      onChange={(e) => setFormNovoPneu({...formNovoPneu, marca: e.target.value})}
                      placeholder="Ex: Goodyear"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="modelo">Modelo*</Label>
                    <Input 
                      id="modelo" 
                      value={formNovoPneu.modelo} 
                      onChange={(e) => setFormNovoPneu({...formNovoPneu, modelo: e.target.value})}
                      placeholder="Ex: KMAX EXTREME"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="base">Base*</Label>
                  <Select 
                    value={formNovoPneu.baseId?.toString()} 
                    onValueChange={(value) => {
                      const baseId = parseInt(value);
                      const baseNome = baseId === 9 ? 'Campinas' : baseId === 10 ? 'Goiânia' : '';
                      setFormNovoPneu({...formNovoPneu, baseId, baseNome});
                    }}
                  >
                    <SelectTrigger id="base">
                      <SelectValue placeholder="Selecione a base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">Campinas</SelectItem>
                      <SelectItem value="10">Goiânia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setAba('listagem')}>Cancelar</Button>
              <Button onClick={registrarPneu} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : 'Cadastrar Pneu'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {pneuSelecionado && (
          <TabsContent value="detalhes">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Detalhes do Pneu {pneuSelecionado.codigo}</CardTitle>
                  <Badge variant={pneuSelecionado.status === 'disponivel' ? 'outline' : 
                                  pneuSelecionado.status === 'em_uso' ? 'default' : 
                                  pneuSelecionado.status === 'em_manutencao' ? 'secondary' : 'destructive'}>
                    {pneuSelecionado.status === 'disponivel' ? 'Disponível' : 
                     pneuSelecionado.status === 'em_uso' ? 'Em uso' : 
                     pneuSelecionado.status === 'em_manutencao' ? 'Em manutenção' : 'Descartado'}
                  </Badge>
                </div>
                <CardDescription>Informações detalhadas e ações</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Marca</p>
                    <p>{pneuSelecionado.marca}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Modelo</p>
                    <p>{pneuSelecionado.modelo}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Base</p>
                    <p>{pneuSelecionado.baseNome}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Data de Aquisição</p>
                    <p>{new Date(pneuSelecionado.dataAquisicao).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                {pneuSelecionado.veiculoPlaca && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Veículo</p>
                      <p>{pneuSelecionado.veiculoPlaca}</p>
                    </div>
                    
                    {pneuSelecionado.posicao && (
                      <div>
                        <p className="text-sm font-medium">Posição</p>
                        <p>{pneuSelecionado.posicao}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">Registrar Medição</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="profundidadeSulco">Profundidade do Sulco (mm)</Label>
                      <Input 
                        id="profundidadeSulco" 
                        type="number"
                        value={formMedicao.profundidadeSulco} 
                        onChange={(e) => setFormMedicao({...formMedicao, profundidadeSulco: parseFloat(e.target.value)})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pressao">Pressão (psi)</Label>
                      <Input 
                        id="pressao" 
                        type="number"
                        value={formMedicao.pressao} 
                        onChange={(e) => setFormMedicao({...formMedicao, pressao: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="observacao">Observação</Label>
                    <Input 
                      id="observacao" 
                      value={formMedicao.observacao} 
                      onChange={(e) => setFormMedicao({...formMedicao, observacao: e.target.value})}
                      placeholder="Observações sobre a medição"
                    />
                  </div>
                  
                  <Button onClick={registrarMedicao} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : 'Registrar Medição'}
                  </Button>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-wrap justify-between gap-2">
                <Button variant="outline" onClick={() => setAba('listagem')}>Voltar para Listagem</Button>
                
                <div className="flex gap-2">
                  {pneuSelecionado.status !== 'em_manutencao' && (
                    <Button 
                      variant="secondary"
                      onClick={() => atualizarStatus(pneuSelecionado.id, 'em_manutencao')}
                      disabled={loading}
                    >
                      Enviar para Manutenção
                    </Button>
                  )}
                  
                  {pneuSelecionado.status !== 'disponivel' && (
                    <Button 
                      variant="secondary"
                      onClick={() => atualizarStatus(pneuSelecionado.id, 'disponivel')}
                      disabled={loading}
                    >
                      Marcar como Disponível
                    </Button>
                  )}
                  
                  {pneuSelecionado.status !== 'descartado' && (
                    <Button 
                      variant="destructive"
                      onClick={() => atualizarStatus(pneuSelecionado.id, 'descartado')}
                      disabled={loading}
                    >
                      Descartar Pneu
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}