import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Building2, 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  FileText,
  DollarSign,
  Wrench,
  AlertCircle,
  Lock,
  ShieldCheck,
  User
} from 'lucide-react';

interface Orcamento {
  id: number;
  valor_estimado: number;
  valor_pecas: number;
  valor_mao_obra: number;
  itens: any;
  aprovado: boolean;
  aprovado_por?: string;
  aprovado_em?: string;
  gestor_id?: string;
  data_orcamento: string;
  observacao?: string;
  status_aprovacao?: 'pendente' | 'aprovado' | 'reprovado';
}

interface OficinaHistorico {
  id: number;
  manutencao_id: number;
  oficina_nome: string;
  oficina_id: number | null;
  data_envio: string;
  data_retorno: string | null;
  km_envio: number | null;
  motivo_troca: string | null;
  status: string;
  orcamentos: Orcamento[] | null;
  is_virtual?: boolean;
  valor_orcamento?: number;
  valor_negociado?: number;
}

interface ManutencaoTimelineProps {
  manutencaoId: number;
  placa: string;
  oficinasDisponiveis?: { id: number; nome: string }[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

export function ManutencaoTimeline({ manutencaoId, placa, oficinasDisponiveis = [] }: ManutencaoTimelineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTrocarModal, setShowTrocarModal] = useState(false);
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false);
  const [selectedOficinaId, setSelectedOficinaId] = useState<number | null>(null);
  const [trocarData, setTrocarData] = useState({
    motivo_troca: '',
    nova_oficina_nome: '',
    nova_oficina_id: null as number | null,
    km_envio: ''
  });
  const [orcamentoData, setOrcamentoData] = useState({
    valor_estimado: '',
    valor_pecas: '',
    valor_mao_obra: '',
    observacao: '',
    itens: [] as { nome: string; valor: number }[]
  });
  const [showAprovarModal, setShowAprovarModal] = useState(false);
  const [selectedOrcamentoAprovar, setSelectedOrcamentoAprovar] = useState<Orcamento | null>(null);
  const [aprovarData, setAprovarData] = useState({
    email: '',
    senha: ''
  });
  const [showReprovarModal, setShowReprovarModal] = useState(false);
  const [selectedOrcamentoReprovar, setSelectedOrcamentoReprovar] = useState<Orcamento | null>(null);
  const [reprovarData, setReprovarData] = useState({
    email: '',
    senha: '',
    motivo: ''
  });

  const { data: historicoData, isLoading } = useQuery({
    queryKey: ['/api/manutencao-historico', manutencaoId, 'historico'],
    queryFn: async () => {
      const res = await fetch(`/api/manutencao-historico/${manutencaoId}/historico`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Erro ao buscar histórico');
      return res.json();
    },
    enabled: !!manutencaoId
  });

  const trocarOficinaMutation = useMutation({
    mutationFn: async (data: typeof trocarData & { oficinaId: number }) => {
      const res = await fetch(`/api/manutencao-historico/oficina/${data.oficinaId}/trocar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Erro ao trocar oficina');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Oficina trocada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/manutencao-historico', manutencaoId] });
      setShowTrocarModal(false);
      setTrocarData({ motivo_troca: '', nova_oficina_nome: '', nova_oficina_id: null, km_envio: '' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const addOrcamentoMutation = useMutation({
    mutationFn: async (data: { oficinaId: number; orcamento: typeof orcamentoData }) => {
      const res = await fetch(`/api/manutencao-historico/oficina/${data.oficinaId}/orcamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          valor_estimado: parseFloat(data.orcamento.valor_estimado) || 0,
          valor_pecas: parseFloat(data.orcamento.valor_pecas) || 0,
          valor_mao_obra: parseFloat(data.orcamento.valor_mao_obra) || 0,
          observacao: data.orcamento.observacao,
          itens: data.orcamento.itens
        })
      });
      if (!res.ok) throw new Error('Erro ao adicionar orçamento');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Orçamento registrado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/manutencao-historico', manutencaoId] });
      setShowOrcamentoModal(false);
      setOrcamentoData({ valor_estimado: '', valor_pecas: '', valor_mao_obra: '', observacao: '', itens: [] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const reprovarOrcamentoMutation = useMutation({
    mutationFn: async (data: { orcamentoId: number; email: string; senha: string; motivo: string }) => {
      const res = await fetch(`/api/manutencao-historico/orcamento/${data.orcamentoId}/reprovar-com-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.email, senha: data.senha, motivo: data.motivo })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Erro ao reprovar orçamento');
      return result;
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Sucesso', 
        description: data.message || 'Orçamento reprovado com sucesso!' 
      });
      setShowReprovarModal(false);
      setSelectedOrcamentoReprovar(null);
      setReprovarData({ email: '', senha: '', motivo: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/manutencao-historico', manutencaoId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const aprovarComSenhaMutation = useMutation({
    mutationFn: async (data: { orcamentoId: number; email: string; senha: string }) => {
      const res = await fetch(`/api/manutencao-historico/orcamento/${data.orcamentoId}/aprovar-com-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.email, senha: data.senha })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Erro ao aprovar orçamento');
      return result;
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Orçamento Aprovado!', 
        description: data.message || 'Orçamento aprovado com sucesso!'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manutencao-historico', manutencaoId] });
      setShowAprovarModal(false);
      setSelectedOrcamentoAprovar(null);
      setAprovarData({ email: '', senha: '' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro na Aprovação', description: error.message, variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Carregando histórico...
          </div>
        </CardContent>
      </Card>
    );
  }

  const oficinas: OficinaHistorico[] = historicoData?.data?.oficinas || [];
  const resumo = historicoData?.data?.resumo || {};
  const oficinaAtiva = oficinas.find(o => o.status === 'ativa');

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Histórico de Oficinas - {placa}
            </CardTitle>
            <div className="flex gap-2">
              {oficinaAtiva && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedOficinaId(oficinaAtiva.id);
                      setShowOrcamentoModal(true);
                    }}
                    data-testid="button-add-orcamento"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Orçamento
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedOficinaId(oficinaAtiva.id);
                      setShowTrocarModal(true);
                    }}
                    data-testid="button-trocar-oficina"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-1" />
                    Trocar Oficina
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {resumo.total_orcamentos > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Orçamentos</p>
                <p className="font-bold">{resumo.total_orcamentos}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Aprovados</p>
                <p className="font-bold text-green-600">{resumo.aprovados || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Valor Aprovado</p>
                <p className="font-bold text-green-600">{formatCurrency(resumo.total_aprovado || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Valor Reprovado</p>
                <p className="font-bold text-red-500">{formatCurrency(resumo.total_reprovado || 0)}</p>
              </div>
            </div>
          )}

          {oficinas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum registro de oficina encontrado</p>
              <p className="text-sm">O histórico será criado quando enviar para uma oficina</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-6">
                {oficinas.map((oficina, index) => (
                  <div key={oficina.id} className="relative pl-10">
                    <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      oficina.status === 'ativa' 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-gray-200 border-gray-300'
                    }`}>
                      <Building2 className="h-3 w-3" />
                    </div>
                    
                    <div className="bg-card border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {oficina.oficina_nome}
                            {(oficina.status === 'ativo' || oficina.is_virtual) && (
                              <Badge className="text-xs bg-emerald-700 text-white font-bold px-2 py-0.5 shadow-sm">Atual</Badge>
                            )}
                          </h4>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span>Enviado: {formatDate(oficina.data_envio)}</span>
                            {oficina.data_retorno && (
                              <span> → Retorno: {formatDate(oficina.data_retorno)}</span>
                            )}
                            {oficina.km_envio && (
                              <span className="ml-2">• KM: {oficina.km_envio.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        {oficina.motivo_troca && (
                          <Badge variant="secondary" className="text-xs">
                            {oficina.motivo_troca}
                          </Badge>
                        )}
                      </div>

                      {/* Exibir valores se disponíveis */}
                      {((oficina.valor_orcamento ?? 0) > 0 || (oficina.valor_negociado ?? 0) > 0) && (
                        <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-md border">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div className="flex gap-4 text-sm">
                            {(oficina.valor_orcamento ?? 0) > 0 && (
                              <div>
                                <span className="text-muted-foreground">Orçamento: </span>
                                <span className="font-semibold text-green-600">{formatCurrency(oficina.valor_orcamento ?? 0)}</span>
                              </div>
                            )}
                            {(oficina.valor_negociado ?? 0) > 0 && (
                              <div>
                                <span className="text-muted-foreground">Negociado: </span>
                                <span className="font-semibold text-blue-600">{formatCurrency(oficina.valor_negociado ?? 0)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {oficina.orcamentos && oficina.orcamentos.length > 0 && (
                        <div className="border-t pt-3 space-y-2">
                          <h5 className="text-sm font-medium flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Orçamentos ({oficina.orcamentos.length})
                          </h5>
                          <div className="space-y-2">
                            {oficina.orcamentos.map((orc) => (
                              <div 
                                key={orc.id} 
                                className={`p-3 rounded-md border ${
                                  orc.aprovado 
                                    ? 'bg-green-50 border-green-300' 
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <DollarSign className={`h-4 w-4 ${orc.status_aprovacao === 'aprovado' || orc.aprovado ? 'text-green-600' : orc.status_aprovacao === 'reprovado' ? 'text-red-600' : 'text-gray-500'}`} />
                                    <div>
                                      <p className="font-semibold">{formatCurrency(orc.valor_estimado)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Peças: {formatCurrency(orc.valor_pecas)} | 
                                        M.O.: {formatCurrency(orc.valor_mao_obra)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {orc.status_aprovacao === 'aprovado' || orc.aprovado ? (
                                      <div className="flex flex-col items-end">
                                        <Badge className="bg-green-600 text-white font-bold px-3 py-1">
                                          <ShieldCheck className="h-3 w-3 mr-1" />
                                          APROVADO
                                        </Badge>
                                        {orc.aprovado_por && (
                                          <div className="text-xs text-green-700 mt-1 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span>Por: {orc.aprovado_por}</span>
                                            {orc.aprovado_em && (
                                              <span className="text-muted-foreground ml-1">
                                                em {new Date(orc.aprovado_em).toLocaleDateString('pt-BR')} às {new Date(orc.aprovado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : orc.status_aprovacao === 'reprovado' ? (
                                      <div className="flex flex-col items-end">
                                        <Badge className="bg-red-600 text-white font-bold px-3 py-1">
                                          <XCircle className="h-3 w-3 mr-1" />
                                          REPROVADO
                                        </Badge>
                                        {orc.aprovado_por && (
                                          <div className="text-xs text-red-700 mt-1 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span>Por: {orc.aprovado_por}</span>
                                            {orc.aprovado_em && (
                                              <span className="text-muted-foreground ml-1">
                                                em {new Date(orc.aprovado_em).toLocaleDateString('pt-BR')} às {new Date(orc.aprovado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex gap-1">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="h-7 text-xs text-green-600 hover:bg-green-50 border-green-300"
                                          onClick={() => {
                                            setSelectedOrcamentoAprovar(orc);
                                            setShowAprovarModal(true);
                                          }}
                                          data-testid={`button-aprovar-${orc.id}`}
                                        >
                                          <Lock className="h-3 w-3 mr-1" />
                                          Aprovar
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="h-7 text-xs text-red-500 hover:bg-red-50"
                                          onClick={() => {
                                            setSelectedOrcamentoReprovar(orc);
                                            setShowReprovarModal(true);
                                          }}
                                          disabled={reprovarOrcamentoMutation.isPending}
                                          data-testid={`button-reprovar-${orc.id}`}
                                        >
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Reprovar
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {orc.observacao && (
                                  <p className="text-xs text-muted-foreground mt-2">{orc.observacao}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(orc.data_orcamento)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showTrocarModal} onOpenChange={setShowTrocarModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Trocar de Oficina
            </DialogTitle>
            <DialogDescription>
              Registre a troca de oficina e o motivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo da Troca *</Label>
              <Select 
                value={trocarData.motivo_troca}
                onValueChange={(val) => setTrocarData({...trocarData, motivo_troca: val})}
              >
                <SelectTrigger data-testid="select-motivo-troca">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Orçamento alto">Orçamento alto</SelectItem>
                  <SelectItem value="Prazo longo">Prazo longo</SelectItem>
                  <SelectItem value="Falta de peças">Falta de peças</SelectItem>
                  <SelectItem value="Qualidade insatisfatória">Qualidade insatisfatória</SelectItem>
                  <SelectItem value="Problemas de comunicação">Problemas de comunicação</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nova Oficina *</Label>
              <Input 
                value={trocarData.nova_oficina_nome}
                onChange={(e) => setTrocarData({...trocarData, nova_oficina_nome: e.target.value})}
                placeholder="Nome da nova oficina"
                data-testid="input-nova-oficina"
              />
            </div>
            <div className="space-y-2">
              <Label>KM Atual</Label>
              <Input 
                type="number"
                value={trocarData.km_envio}
                onChange={(e) => setTrocarData({...trocarData, km_envio: e.target.value})}
                placeholder="Quilometragem atual"
                data-testid="input-km-troca"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrocarModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedOficinaId && trocarData.motivo_troca && trocarData.nova_oficina_nome) {
                  trocarOficinaMutation.mutate({
                    ...trocarData,
                    oficinaId: selectedOficinaId
                  });
                }
              }}
              disabled={!trocarData.motivo_troca || !trocarData.nova_oficina_nome || trocarOficinaMutation.isPending}
              data-testid="button-confirmar-troca"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              {trocarOficinaMutation.isPending ? 'Trocando...' : 'Confirmar Troca'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrcamentoModal} onOpenChange={setShowOrcamentoModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Adicionar Orçamento
            </DialogTitle>
            <DialogDescription>
              Registre um novo orçamento recebido da oficina
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Peças (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={orcamentoData.valor_pecas}
                  onChange={(e) => {
                    const pecas = parseFloat(e.target.value) || 0;
                    const maoObra = parseFloat(orcamentoData.valor_mao_obra) || 0;
                    setOrcamentoData({
                      ...orcamentoData, 
                      valor_pecas: e.target.value,
                      valor_estimado: (pecas + maoObra).toString()
                    });
                  }}
                  placeholder="0,00"
                  data-testid="input-valor-pecas"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Mão de Obra (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={orcamentoData.valor_mao_obra}
                  onChange={(e) => {
                    const maoObra = parseFloat(e.target.value) || 0;
                    const pecas = parseFloat(orcamentoData.valor_pecas) || 0;
                    setOrcamentoData({
                      ...orcamentoData, 
                      valor_mao_obra: e.target.value,
                      valor_estimado: (pecas + maoObra).toString()
                    });
                  }}
                  placeholder="0,00"
                  data-testid="input-valor-mao-obra"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input 
                type="number"
                step="0.01"
                value={orcamentoData.valor_estimado}
                onChange={(e) => setOrcamentoData({...orcamentoData, valor_estimado: e.target.value})}
                placeholder="0,00"
                className="font-bold"
                data-testid="input-valor-total"
              />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <textarea 
                className="w-full min-h-[80px] p-3 border rounded-md bg-background"
                value={orcamentoData.observacao}
                onChange={(e) => setOrcamentoData({...orcamentoData, observacao: e.target.value})}
                placeholder="Detalhes do orçamento..."
                data-testid="textarea-observacao-orcamento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrcamentoModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedOficinaId) {
                  addOrcamentoMutation.mutate({
                    oficinaId: selectedOficinaId,
                    orcamento: orcamentoData
                  });
                }
              }}
              disabled={addOrcamentoMutation.isPending}
              data-testid="button-salvar-orcamento"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addOrcamentoMutation.isPending ? 'Salvando...' : 'Salvar Orçamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Aprovação com Senha */}
      <Dialog open={showAprovarModal} onOpenChange={(open) => {
        setShowAprovarModal(open);
        if (!open) {
          setSelectedOrcamentoAprovar(null);
          setAprovarData({ email: '', senha: '' });
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Aprovar Orçamento
            </DialogTitle>
            <DialogDescription>
              Para aprovar este orçamento, confirme sua identidade com sua senha de gestor.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrcamentoAprovar && (
            <div className="py-4 space-y-4">
              {/* Resumo do Orçamento */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Valor Total do Orçamento</span>
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(selectedOrcamentoAprovar.valor_estimado)}
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Peças: {formatCurrency(selectedOrcamentoAprovar.valor_pecas)} | 
                  M.O.: {formatCurrency(selectedOrcamentoAprovar.valor_mao_obra)}
                </div>
              </div>

              {/* Campos de Autenticação */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-aprovar">E-mail do Gestor</Label>
                  <Input 
                    id="email-aprovar"
                    type="email"
                    value={aprovarData.email}
                    onChange={(e) => setAprovarData({...aprovarData, email: e.target.value})}
                    placeholder="seu.email@empresa.com"
                    data-testid="input-email-aprovar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha-aprovar">Senha</Label>
                  <Input 
                    id="senha-aprovar"
                    type="password"
                    value={aprovarData.senha}
                    onChange={(e) => setAprovarData({...aprovarData, senha: e.target.value})}
                    placeholder="Digite sua senha"
                    data-testid="input-senha-aprovar"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Atenção</p>
                    <p className="text-xs mt-1">
                      Após a aprovação, este orçamento não poderá ser editado. 
                      A aprovação será registrada com seu nome e data/hora.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAprovarModal(false);
                setSelectedOrcamentoAprovar(null);
                setAprovarData({ email: '', senha: '' });
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedOrcamentoAprovar && aprovarData.email && aprovarData.senha) {
                  aprovarComSenhaMutation.mutate({
                    orcamentoId: selectedOrcamentoAprovar.id,
                    email: aprovarData.email,
                    senha: aprovarData.senha
                  });
                }
              }}
              disabled={!aprovarData.email || !aprovarData.senha || aprovarComSenhaMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirmar-aprovacao"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {aprovarComSenhaMutation.isPending ? 'Aprovando...' : 'Confirmar Aprovação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reprovação com Senha */}
      <Dialog open={showReprovarModal} onOpenChange={(open) => {
        setShowReprovarModal(open);
        if (!open) {
          setSelectedOrcamentoReprovar(null);
          setReprovarData({ email: '', senha: '', motivo: '' });
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reprovar Orçamento
            </DialogTitle>
            <DialogDescription>
              Para reprovar este orçamento, confirme sua identidade com sua senha de gestor.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrcamentoReprovar && (
            <div className="py-4 space-y-4">
              {/* Resumo do Orçamento */}
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Valor do Orçamento</span>
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(selectedOrcamentoReprovar.valor_estimado)}
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Peças: {formatCurrency(selectedOrcamentoReprovar.valor_pecas)} | 
                  M.O.: {formatCurrency(selectedOrcamentoReprovar.valor_mao_obra)}
                </div>
              </div>

              {/* Campos de Autenticação */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-reprovar">E-mail do Gestor</Label>
                  <Input 
                    id="email-reprovar"
                    type="email"
                    value={reprovarData.email}
                    onChange={(e) => setReprovarData({...reprovarData, email: e.target.value})}
                    placeholder="seu.email@empresa.com"
                    data-testid="input-email-reprovar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha-reprovar">Senha</Label>
                  <Input 
                    id="senha-reprovar"
                    type="password"
                    value={reprovarData.senha}
                    onChange={(e) => setReprovarData({...reprovarData, senha: e.target.value})}
                    placeholder="Digite sua senha"
                    data-testid="input-senha-reprovar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motivo-reprovar">Motivo da Reprovação</Label>
                  <Input 
                    id="motivo-reprovar"
                    type="text"
                    value={reprovarData.motivo}
                    onChange={(e) => setReprovarData({...reprovarData, motivo: e.target.value})}
                    placeholder="Ex: Valor acima do mercado"
                    data-testid="input-motivo-reprovar"
                  />
                </div>
              </div>

              <div className="p-3 bg-red-50 rounded-md border border-red-200 text-sm text-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Atenção</p>
                    <p className="text-xs mt-1">
                      A reprovação será registrada com seu nome, data/hora e motivo informado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReprovarModal(false);
                setSelectedOrcamentoReprovar(null);
                setReprovarData({ email: '', senha: '', motivo: '' });
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedOrcamentoReprovar && reprovarData.email && reprovarData.senha) {
                  reprovarOrcamentoMutation.mutate({
                    orcamentoId: selectedOrcamentoReprovar.id,
                    email: reprovarData.email,
                    senha: reprovarData.senha,
                    motivo: reprovarData.motivo
                  });
                }
              }}
              disabled={!reprovarData.email || !reprovarData.senha || reprovarOrcamentoMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirmar-reprovacao"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {reprovarOrcamentoMutation.isPending ? 'Reprovando...' : 'Confirmar Reprovação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ManutencaoTimeline;
