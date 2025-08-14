import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, Filter, Search, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, TrendingDown, DollarSign, Download, Plus, Trash2, Truck, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import FuelCardRequestForm from '@/components/FuelCardRequestForm';
import WhatsAppResponseButton from '@/components/WhatsAppResponseButton';
import { useLocation } from 'wouter';

interface FuelCardSolicitation {
  id: number;
  placa: string;
  motorista: string;
  solicitante?: string; // Nome da pessoa que fez a solicitação
  requested_by?: string; // Campo alternativo para o solicitante
  telefone_celular?: string; // Telefone do solicitante
  valor_solicitado: number;
  km_veiculo?: number;
  tipo_cartao?: string;
  observacoes?: string;
  status: 'Pendente' | 'Em Análise' | 'Recarga Efetuada' | 'Negado';
  data_solicitacao: string;
  atendido_por?: string;
  data_atendimento?: string;
  base?: string;
  origem_tipo?: string;
  numero_cartao?: string;
  cartao_combustivel?: string; // Cartão vinculado ao veículo
  id_rota?: string;
  tipo_combustivel?: string;
  litros_solicitados?: number;
  // Campos do Line Hall Shopee
  veiculo_modelo?: string;
  rota_origem?: string;
  rota_destino?: string;
  km_total?: number;
  horario_abastecimento?: string;
  telefone_motorista?: string;
  valor_calculado?: number;
  calculo_detalhes?: {
    km_rota: number;
    km_acrescimo: number;
    km_total: number;
    consumo_medio: number;
    litros_necessarios: string;
    valor_por_litro: number;
    valor_total: string;
  };
}

const FuelCardRequestsPanel: React.FC = () => {
  const [solicitations, setSolicitations] = useState<FuelCardSolicitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolicitation, setSelectedSolicitation] = useState<FuelCardSolicitation | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [baseFilter, setBaseFilter] = useState<string>('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [editedStatus, setEditedStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false);
  const [approvingBatch, setApprovingBatch] = useState(false);
  
  // Estados para relatório por data
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [downloadingReport, setDownloadingReport] = useState(false);
  
  // Estados para o modal de histórico de abastecimentos
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPlaca, setSelectedPlaca] = useState('');
  const [fuelHistory, setFuelHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [solicitudeCounts, setSolicitudeCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<string>('pendentes');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    fetchSolicitations();
    fetchProjects();
  }, []);

  // OTIMIZAÇÃO: Debounce para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery || statusFilter !== 'all' || projectFilter !== 'all' || baseFilter !== 'all') {
        // Aplicar filtros com delay para evitar muitas re-renderizações
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, projectFilter, baseFilter]);

  useEffect(() => {
    if (solicitations.length > 0) {
      loadSolicitudeCounts();
    }
  }, [solicitations]);

  // Reset base filter when project changes
  useEffect(() => {
    setBaseFilter('all');
  }, [projectFilter]);

  const loadSolicitudeCounts = async () => {
    try {
      const uniquePlates = Array.from(new Set(solicitations.map(s => s.placa)));
      const counts: Record<string, number> = {};
      
      // OTIMIZAÇÃO: Batch request em vez de múltiplas requisições
      if (uniquePlates.length > 0) {
        try {
          const response = await fetch('/api/fuel-card-solicitations-counts', {
            method: 'POST',
            body: JSON.stringify({ plates: uniquePlates }),
            headers: { 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.counts) {
              Object.assign(counts, data.counts);
              setSolicitudeCounts(counts);
            }
          }
        } catch (batchError) {
          console.warn('Batch count request failed, falling back to individual requests');
          
          // Fallback para requisições individuais (máximo 5 para evitar sobrecarga)
          const limitedPlates = uniquePlates.slice(0, 5);
          for (const plate of limitedPlates) {
            try {
              const response = await fetch(`/fuel-requests-count/${encodeURIComponent(plate)}`);
              if (response.ok) {
                const data = await response.json();
                if (data.success) {
                  counts[plate] = data.data.total_solicitations || 0;
                }
              }
            } catch (error) {
              console.warn(`Failed to get count for plate ${plate}:`, error);
            }
          }
        }
      }
      
      setSolicitudeCounts(counts);
    } catch (error) {
      console.error('Erro ao carregar contagens:', error);
    }
  };

  // Função para detectar placas com múltiplas solicitações no mesmo dia
  const getDailyPlateRepeats = () => {
    const dailyRepeats: Record<string, Record<string, number>> = {};
    
    solicitations.forEach(solicitation => {
      const date = new Date(solicitation.data_solicitacao).toDateString();
      const placa = solicitation.placa;
      
      if (!dailyRepeats[placa]) {
        dailyRepeats[placa] = {};
      }
      
      if (!dailyRepeats[placa][date]) {
        dailyRepeats[placa][date] = 0;
      }
      
      dailyRepeats[placa][date]++;
    });
    
    return dailyRepeats;
  };

  // Verificar se uma placa tem múltiplas solicitações em um dia específico
  const hasMultipleRequestsToday = (placa: string, dataString: string) => {
    const date = new Date(dataString).toDateString();
    const dailyRepeats = getDailyPlateRepeats();
    return dailyRepeats[placa] && dailyRepeats[placa][date] > 1;
  };

  // Contar quantas solicitações uma placa teve em um dia específico
  const getDailyRequestCount = (placa: string, dataString: string) => {
    const date = new Date(dataString).toDateString();
    const dailyRepeats = getDailyPlateRepeats();
    return dailyRepeats[placa]?.[date] || 1;
  };

  // Funções para calcular totais por aba
  const getPendingSolicitations = () => {
    return filteredSolicitations.filter(s => 
      s.status === 'Pendente' || s.status === 'Em Análise'
    );
  };

  const getCompletedSolicitations = () => {
    return filteredSolicitations.filter(s => 
      s.status === 'Recarga Efetuada' || s.status === 'Negado'
    );
  };

  const getTotalValue = (solicitations: FuelCardSolicitation[]) => {
    return solicitations.reduce((total, s) => {
      const valor = s.valor_solicitado || s.valor_calculado || 0;
      return total + Number(valor);
    }, 0);
  };

  const getApprovedValue = (solicitations: FuelCardSolicitation[]) => {
    return solicitations
      .filter(s => s.status === 'Recarga Efetuada')
      .reduce((total, s) => {
        const valor = s.valor_solicitado || s.valor_calculado || 0;
        return total + Number(valor);
      }, 0);
  };



  const fetchSolicitations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // OTIMIZAÇÃO: Parâmetros de paginação e cache
      const page = 1;
      const limit = 50;
      const response = await apiRequest('GET', `/api/fuel-card-solicitations?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('[FUEL-CARD-PANEL] Dados recebidos:', data.data.length, data.fromCache ? '(cache)' : '(fresh)');
        setSolicitations(data.data);
      } else {
        setError(data.message || 'Erro ao carregar solicitações');
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data.message || 'Falha ao carregar solicitações'
        });
      }
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
      setError('Erro ao conectar ao servidor');
      toast({
        variant: 'destructive',
        title: 'Erro de Conexão',
        description: 'Não foi possível conectar ao servidor'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiRequest('GET', '/api/projects-with-bases');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar projetos:', err);
    }
  };
  
  const handleOpenSolicitation = (solicitation: FuelCardSolicitation) => {
    setSelectedSolicitation(solicitation);
    setEditedStatus(solicitation.status);
    setIsSheetOpen(true);
  };

  const handleDeleteSolicitation = async (solicitacao: FuelCardSolicitation) => {
    if (!user || user.role !== 'admin') {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem excluir solicitações.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a solicitação de ${solicitacao.motorista} (${solicitacao.placa})?`
    );

    if (!confirmed) return;

    try {
      let endpoint = '';
      
      // Determinar endpoint baseado no tipo de origem
      if (solicitacao.origem_tipo === 'line_hall') {
        endpoint = `/api/line-hall/fuel-requests/${solicitacao.id}`;
      } else {
        endpoint = `/api/fuel-card-solicitations/${solicitacao.id}`;
      }

      const response = await apiRequest('DELETE', endpoint);
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Solicitação excluída',
          description: 'A solicitação foi removida com sucesso.',
        });
        
        // Remover da lista local
        setSolicitations(prev => prev.filter(s => 
          !(s.id === solicitacao.id && s.origem_tipo === solicitacao.origem_tipo)
        ));
      } else {
        throw new Error(data.message || 'Erro ao excluir solicitação');
      }
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleViewFuelHistory = async (placa: string) => {
    setSelectedPlaca(placa);
    setLoadingHistory(true);
    setHistoryModalOpen(true);
    
    try {
      // Buscar abastecimentos
      const fuelResponse = await fetch(`/fuel-data/${encodeURIComponent(placa)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Buscar solicitações de recarga do cartão
      const cardResponse = await fetch(`/api/fuel-card-solicitations`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      let combinedHistory = [];
      
      // Processar dados de abastecimentos
      if (fuelResponse.ok) {
        const fuelData = await fuelResponse.json();
        if (fuelData.success && fuelData.data) {
          const fuelRecords = fuelData.data
            .filter((item: any) => item.placa === placa)
            .map((item: any) => ({
              ...item,
              tipo_registro: 'abastecimento',
              data_evento: item.data_abastecimento || item.data,
              valor_evento: item.valor,
              descricao: `Abastecimento - ${item.posto || item.local || 'Posto não informado'}`
            }));
          combinedHistory.push(...fuelRecords);
        }
      }
      
      // Processar dados de solicitações de recarga
      if (cardResponse.ok) {
        const cardData = await cardResponse.json();
        if (cardData.success && cardData.data) {
          const cardRecords = cardData.data
            .filter((item: any) => item.placa === placa)
            .map((item: any) => ({
              ...item,
              tipo_registro: 'solicitacao_recarga',
              data_evento: item.data_solicitacao,
              valor_evento: item.valor_solicitado,
              descricao: `Solicitação de Recarga - ${item.status}`,
              posto: `Solicitação (${item.origem_tipo === 'line_hall' ? 'Line Hall' : 'Base System'})`,
              litros: item.litros_solicitados
            }));
          combinedHistory.push(...cardRecords);
        }
      }
      
      // Ordenar por data (mais recente primeiro)
      combinedHistory.sort((a, b) => {
        const dateA = new Date(a.data_evento);
        const dateB = new Date(b.data_evento);
        return dateB.getTime() - dateA.getTime();
      });
      
      setFuelHistory(combinedHistory);
      
    } catch (error) {
      console.error('Erro ao buscar histórico completo:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      setFuelHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  const handleStatusUpdate = async () => {
    if (!selectedSolicitation) return;
    
    try {
      setUpdatingStatus(true);
      
      const updateData = {
        id: selectedSolicitation.id,
        status: editedStatus,
        origem_tipo: selectedSolicitation.origem_tipo,
        atendido_por: user?.name,
        observacoes: selectedSolicitation.observacoes
      };
      
      const response = await apiRequest('PUT', `/api/fuel-card-solicitations/${selectedSolicitation.id}/status`, updateData);
      const data = await response.json();
      
      if (data.success) {
        // Atualizar a lista de solicitações
        setSolicitations(solicitations.map(sol => 
          sol.id === selectedSolicitation.id ? {...sol, status: editedStatus as FuelCardSolicitation['status'], atendido_por: user?.name, data_atendimento: new Date().toISOString()} : sol
        ));
        
        setSelectedSolicitation({
          ...selectedSolicitation,
          status: editedStatus as any,
          atendido_por: user?.name,
          data_atendimento: new Date().toISOString()
        });
        
        toast({
          title: 'Sucesso',
          description: 'Status da solicitação atualizado com sucesso'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data.message || 'Falha ao atualizar status'
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o status'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      console.log('[EXPORT] Iniciando exportação de relatório Excel...');
      
      // Verificar se há token de autenticação
      const authToken = localStorage.getItem('authToken');
      console.log('[EXPORT] Token disponível:', !!authToken);
      
      // Usar GET para evitar problema de payload grande
      const response = await apiRequest('GET', '/api/fuel-card-solicitations/export');
      
      console.log('[EXPORT] Resposta recebida:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });
      
      if (response.ok) {
        // Criar URL para download
        const blob = await response.blob();
        console.log('[EXPORT] Blob criado:', blob.size, 'bytes');
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solicitacoes-cartao-combustivel-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('[EXPORT] Download iniciado com sucesso');
        toast({
          title: 'Exportação concluída',
          description: 'Relatório Excel gerado com sucesso',
        });
      } else {
        const errorText = await response.text();
        console.error('[EXPORT] Erro na resposta:', errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('[EXPORT] Erro na exportação:', error);
      
      let errorMessage = 'Não foi possível gerar o arquivo Excel';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Sem permissão para exportar relatórios.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Erro no servidor. Tente novamente em alguns minutos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro na exportação',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDownloadByDateRange = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione as datas de início e fim para gerar o relatório',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: 'Erro de validação',
        description: 'A data de início deve ser anterior à data de fim',
        variant: 'destructive',
      });
      return;
    }

    setDownloadingReport(true);
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(projectFilter !== 'all' && { projectId: projectFilter }),
        ...(baseFilter !== 'all' && { base: baseFilter })
      });

      const response = await apiRequest('GET', `/api/fuel-card-solicitations/export-by-date?${queryParams}`);
      
      if (response.ok) {
        // Criar URL para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-cartao-combustivel-${startDate}-${endDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Relatório baixado com sucesso',
          description: `Relatório do período ${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')} gerado`,
        });
      } else {
        throw new Error('Erro ao gerar relatório por data');
      }
    } catch (error) {
      toast({
        title: 'Erro ao baixar relatório',
        description: 'Não foi possível gerar o relatório para o período selecionado',
        variant: 'destructive',
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleBatchApproval = async () => {
    if (baseFilter === 'all') {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione uma base específica para aprovar solicitações em lote'
      });
      return;
    }

    try {
      setApprovingBatch(true);
      
      // Buscar solicitações pendentes da base selecionada
      const pendingSolicitations = solicitations.filter(sol => 
        sol.base === baseFilter && 
        (sol.status === 'Pendente' || sol.status === 'Em Análise')
      );
      
      if (pendingSolicitations.length === 0) {
        toast({
          title: 'Informação',
          description: 'Não há solicitações pendentes para esta base'
        });
        return;
      }

      // Confirmar com o usuário
      const confirmed = window.confirm(
        `Deseja aprovar ${pendingSolicitations.length} solicitação(ões) pendente(s) da base "${baseFilter}"?`
      );

      if (!confirmed) {
        return;
      }

      // Aprovar todas as solicitações pendentes
      const approvalPromises = pendingSolicitations.map(async (sol) => {
        const updateData = {
          id: sol.id,
          status: 'Recarga Efetuada',
          origem_tipo: sol.origem_tipo,
          atendido_por: user?.name,
          observacoes: sol.observacoes
        };
        
        return apiRequest('PUT', `/api/fuel-card-solicitations/${sol.id}/status`, updateData);
      });

      const results = await Promise.allSettled(approvalPromises);
      
      // Contar sucessos e falhas
      const successes = results.filter(result => result.status === 'fulfilled').length;
      const failures = results.filter(result => result.status === 'rejected').length;

      if (successes > 0) {
        // Atualizar a lista local
        setSolicitations(solicitations.map(sol => {
          if (sol.base === baseFilter && (sol.status === 'Pendente' || sol.status === 'Em Análise')) {
            return {
              ...sol,
              status: 'Recarga Efetuada' as FuelCardSolicitation['status'],
              atendido_por: user?.name,
              data_atendimento: new Date().toISOString()
            };
          }
          return sol;
        }));

        toast({
          title: 'Aprovação em Lote Concluída',
          description: `${successes} solicitação(ões) aprovada(s) com sucesso${failures > 0 ? ` (${failures} falha(s))` : ''}`
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível aprovar as solicitações'
        });
      }

    } catch (error) {
      console.error('Erro na aprovação em lote:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha na aprovação em lote'
      });
    } finally {
      setApprovingBatch(false);
    }
  };
  
  const getFilteredSolicitations = () => {
    return solicitations.filter(sol => {
      // Filtro por status
      if (statusFilter !== 'all' && sol.status !== statusFilter) {
        return false;
      }
      
      // Filtro por data
      if (dateFilter) {
        const solDate = new Date(sol.data_solicitacao).toISOString().split('T')[0];
        if (solDate !== dateFilter) {
          return false;
        }
      }
      
      // Filtro por projeto
      if (projectFilter !== 'all') {
        // Buscar o projeto selecionado e suas bases
        const selectedProject = projects.find(p => p.id.toString() === projectFilter);
        if (selectedProject) {
          const projectBases = selectedProject.bases?.map((b: any) => b.base_name) || [];
          if (!projectBases.includes(sol.base)) {
            return false;
          }
        }
      }

      // Filtro por base
      if (baseFilter !== 'all') {
        if (sol.base !== baseFilter) {
          return false;
        }
      }
      
      // Filtro por busca (placa ou motorista)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          sol.placa.toLowerCase().includes(query) ||
          sol.motorista.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Recarga Efetuada':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Recarga Efetuada</Badge>;
      case 'Negado':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Negado</Badge>;
      case 'Em Análise':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" /> Em Análise</Badge>;
      case 'Pendente':
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertCircle className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      // Se já está no formato brasileiro (DD/MM/YYYY HH:MM), retorna como está
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/)) {
        return dateString;
      }
      
      // Tenta converter outras datas
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Retorna original se não conseguir converter
      }
      
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      console.warn('Erro ao formatar data:', dateString, error);
      return dateString; // Retorna a string original em caso de erro
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Funções para calcular estatísticas
  // Get filtered bases based on selected project
  const getFilteredBases = () => {
    if (projectFilter === 'all') {
      // Return all unique bases from solicitations + projects
      const allBases = new Set<string>();
      
      // Add bases from solicitations (real data from database)
      solicitations.forEach(sol => {
        if (sol.base && sol.base.trim() !== '') {
          allBases.add(sol.base);
        }
      });
      
      // Also add bases from projects for completeness
      projects.forEach(project => {
        if (project.bases) {
          project.bases.forEach((base: any) => {
            if (base.base_name) {
              allBases.add(base.base_name);
            }
          });
        }
      });
      
      return Array.from(allBases).sort();
    } else {
      // Return bases from selected project + solicitations matching that project
      const selectedProject = projects.find(p => p.id.toString() === projectFilter);
      const projectBases = new Set<string>();
      
      // Add bases from the selected project
      if (selectedProject && selectedProject.bases) {
        selectedProject.bases.forEach((base: any) => {
          if (base.base_name) {
            projectBases.add(base.base_name);
          }
        });
      }
      
      // Add bases from solicitations that belong to this project
      solicitations.forEach(sol => {
        if (sol.base && sol.base.trim() !== '') {
          // Check if this solicitation's base belongs to the selected project
          if (selectedProject && selectedProject.bases) {
            const belongsToProject = selectedProject.bases.some((base: any) => base.base_name === sol.base);
            if (belongsToProject) {
              projectBases.add(sol.base);
            }
          }
        }
      });
      
      return Array.from(projectBases).sort();
    }
  };

  const getStatistics = () => {
    const pendentes = solicitations.filter(s => s.status === 'Pendente' || s.status === 'Em Análise').length;
    const atendidas = solicitations.filter(s => s.status === 'Recarga Efetuada').length;
    
    // Debug: verificar estrutura dos dados
    console.log('Debugging valor calculation:', {
      totalSolicitations: solicitations.length,
      recargasEfetuadas: solicitations.filter(s => s.status === 'Recarga Efetuada'),
      sampleData: solicitations.slice(0, 2)
    });
    
    // Calcular valor total atendido com validação numérica
    const valorTotalAtendido = solicitations
      .filter(s => s.status === 'Recarga Efetuada')
      .reduce((total, s) => {
        const valor = parseFloat(s.valor_solicitado?.toString() || '0');
        console.log('Processing value:', { 
          status: s.status, 
          valor_solicitado: s.valor_solicitado, 
          parsed: valor 
        });
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
    
    console.log('Final valorTotalAtendido:', valorTotalAtendido);
    
    // Calcular placas com múltiplas solicitações no mesmo dia
    const placasRepetidas = solicitations.filter(s => 
      hasMultipleRequestsToday(s.placa, s.data_solicitacao)
    ).length;
    
    return { pendentes, atendidas, valorTotalAtendido, placasRepetidas };
  };
  
  const statistics = getStatistics();
  const filteredSolicitations = getFilteredSolicitations();
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            <CreditCard className="inline-block mr-2" />
            Painel de Solicitações de Cartão de Abastecimento
          </h1>
          <div className="flex items-center gap-3">
            {(user?.role === 'admin' || user?.role === 'gestor_combustivel') && (
              <Button 
                variant="secondary" 
                className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200"
                onClick={() => setLocation('/terceiros/gerenciamento')}
              >
                <Truck className="h-4 w-4" />
                Gerenciamento Terceiros
              </Button>
            )}
            
            {/* Controles para relatório por data */}
            <div className="flex items-center gap-2 border rounded-lg p-2 bg-gray-50">
              <Calendar className="h-4 w-4 text-gray-600" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36 h-8"
                placeholder="Data início"
              />
              <span className="text-gray-400">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36 h-8"
                placeholder="Data fim"
              />
              <Button 
                onClick={handleDownloadByDateRange} 
                variant="outline" 
                size="sm"
                disabled={downloadingReport || !startDate || !endDate}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                {downloadingReport ? 'Gerando...' : 'Relatório'}
              </Button>
            </div>
            
            <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Baixar Relatório Excel
            </Button>
          </div>
        </div>
        
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.pendentes}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando processamento
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitações Atendidas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.atendidas}</div>
              <p className="text-xs text-muted-foreground">
                Recargas efetuadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Placas Repetindo</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.placasRepetidas}</div>
              <p className="text-xs text-muted-foreground">
                Múltiplas solicitações por dia
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Atendido</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(statistics.valorTotalAtendido)}</div>
              <p className="text-xs text-muted-foreground">
                Soma das recargas efetuadas
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Análise">Em Análise</SelectItem>
                    <SelectItem value="Recarga Efetuada">Recarga Efetuada</SelectItem>
                    <SelectItem value="Negado">Negado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date-filter">Data</Label>
                <div className="flex items-center">
                  <Input 
                    id="date-filter" 
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    placeholder="dd/mm/aaaa"
                  />
                  {dateFilter && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDateFilter('')}
                      className="ml-2"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-filter">Projeto</Label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger id="project-filter">
                    <SelectValue placeholder="Todos os Projetos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Projetos</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base-filter">Base</Label>
                <Select value={baseFilter} onValueChange={setBaseFilter}>
                  <SelectTrigger id="base-filter">
                    <SelectValue placeholder="Todas as Bases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Bases</SelectItem>
                    {getFilteredBases().map((baseName: string) => (
                      <SelectItem key={baseName} value={baseName}>
                        {baseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="search-filter">Buscar (Placa/Motorista)</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-filter"
                    placeholder="Buscar solicitação..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Sistema de Abas com Cards de Resumo */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="pendentes" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendentes ({getPendingSolicitations().length})
              </TabsTrigger>
              <TabsTrigger value="atendidas" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Atendidas ({getCompletedSolicitations().length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Cards de resumo específicos para cada aba */}
          <TabsContent value="pendentes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pendentes</CardTitle>
                  <FileText className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{getPendingSolicitations().length}</div>
                  <p className="text-xs text-muted-foreground">Aguardando processamento</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total Pendente</CardTitle>
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(getTotalValue(getPendingSolicitations()))}
                  </div>
                  <p className="text-xs text-muted-foreground">Valor pendente de aprovação</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Placas Repetindo</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{statistics.placasRepetidas}</div>
                  <p className="text-xs text-muted-foreground">Múltiplas solicitações por dia</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between">
                  <div>
                    <CardTitle>Solicitações Pendentes</CardTitle>
                    <CardDescription>
                      Mostrando {getPendingSolicitations().length} solicitações pendentes
                    </CardDescription>
                  </div>
              <div className="flex gap-2">
                {baseFilter !== 'all' && (user?.role === 'admin' || user?.role === 'gestor_combustivel') && (
                  <Button 
                    onClick={handleBatchApproval} 
                    variant="default" 
                    size="sm"
                    disabled={approvingBatch}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {approvingBatch ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Aprovando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprovar Base
                      </>
                    )}
                  </Button>
                )}
                {(user?.role === 'admin' || user?.role === 'gestor_combustivel') && (
                  <Button onClick={fetchSolicitations} variant="outline" size="sm">
                    Atualizar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">
                <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                <p>{error}</p>
                <Button onClick={fetchSolicitations} className="mt-4">
                  Tentar novamente
                </Button>
              </div>
            ) : filteredSolicitations.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nenhuma solicitação encontrada com os filtros atuais.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[600px] overflow-y-auto">
                  {getPendingSolicitations().map((solicitacao, index) => (
                    <div 
                      key={`${solicitacao.id}-${solicitacao.origem_tipo}-${index}`} 
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        hasMultipleRequestsToday(solicitacao.placa, solicitacao.data_solicitacao)
                          ? 'bg-red-50 border-red-300 border-l-4 border-l-red-500 shadow-md' // Destaque especial para repetições
                          : index < 5 
                            ? solicitacao.status === 'Pendente' 
                              ? 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-400' 
                              : 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-400'
                            : solicitacao.status === 'Pendente' 
                              ? 'bg-yellow-25 border-yellow-100' 
                              : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        {/* Placa e Indicador */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center">
                            {index < 5 && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>}
                            <div>
                              <p className="text-sm font-bold text-gray-900">{solicitacao.placa}</p>
                              <p className="text-xs text-gray-500">Placa</p>
                              
                              {/* Alerta para placas com múltiplas solicitações no mesmo dia */}
                              {hasMultipleRequestsToday(solicitacao.placa, solicitacao.data_solicitacao) && (
                                <div className="flex items-center mt-1">
                                  <Badge variant="destructive" className="text-xs mr-1 bg-red-500 text-white">
                                    ⚠️ REPETINDO
                                  </Badge>
                                  <span className="text-xs text-red-600 font-medium">
                                    {getDailyRequestCount(solicitacao.placa, solicitacao.data_solicitacao)}x hoje
                                  </span>
                                </div>
                              )}
                              
                              {/* Badge de contagem total geral */}
                              {solicitudeCounts[solicitacao.placa] > 1 && !hasMultipleRequestsToday(solicitacao.placa, solicitacao.data_solicitacao) && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {solicitudeCounts[solicitacao.placa]}x total
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dados do Solicitante */}
                        <div className="lg:col-span-2 border-2 border-red-500 bg-red-50 p-2 rounded">
                          <p className="text-xs text-red-600 font-bold mb-1">👤 DADOS DO SOLICITANTE</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{solicitacao.solicitante || solicitacao.requested_by || 'Nome não informado'}</p>
                          <p className="text-xs text-gray-700 font-medium">{solicitacao.telefone_celular || (solicitacao as any).driver_phone || 'Telefone não informado'}</p>
                        </div>

                        {/* Dados do Motorista do Veículo */}
                        <div className="lg:col-span-2 border-2 border-blue-500 bg-blue-50 p-2 rounded">
                          <p className="text-xs text-blue-600 font-bold mb-1">🚛 MOTORISTA DO VEÍCULO</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{solicitacao.motorista || (solicitacao as any).driver_name || 'Motorista não informado'}</p>
                          <p className="text-xs text-gray-700 font-medium">{formatCurrency(solicitacao.valor_solicitado)} - {solicitacao.km_total || solicitacao.km_veiculo || '-'} km</p>
                        </div>

                        {/* Operação e Base */}
                        <div className="lg:col-span-2">
                          <Badge variant="outline" className={
                            solicitacao.origem_tipo === 'line_hall' 
                              ? "bg-blue-100 text-blue-800 mb-1" 
                              : "bg-green-100 text-green-800 mb-1"
                          }>
                            {solicitacao.origem_tipo === 'line_hall' ? 'Line Hall' : 'Tradicional'}
                          </Badge>
                          <p className="text-xs text-gray-500 truncate">{solicitacao.base || '-'}</p>
                        </div>

                        {/* Status e Data */}
                        <div className="lg:col-span-2">
                          {getStatusBadge(solicitacao.status)}
                          <p className="text-xs text-gray-500 mt-1">{formatDate(solicitacao.data_solicitacao).split(',')[0]}</p>
                        </div>

                        {/* Ações */}
                        <div className="lg:col-span-2">
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenSolicitation(solicitacao)}
                              className="text-xs"
                            >
                              Visualizar
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewFuelHistory(solicitacao.placa)}
                              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title={`Ver histórico de abastecimentos da placa ${solicitacao.placa}`}
                            >
                              <History className="h-3 w-3 mr-1" />
                              Histórico
                            </Button>
                            
                            <WhatsAppResponseButton 
                              solicitation={solicitacao}
                              variant="outline"
                              size="sm"
                            />
                            
                            {(user?.role === 'admin' || user?.role === 'gestor_combustivel') && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteSolicitation(solicitacao)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Indicador visual das primeiras 5 solicitações */}
                {filteredSolicitations.length > 5 && (
                  <div className="mt-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-blue-700">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Primeiras 5 solicitações destacadas
                      </div>
                      <div className="text-blue-600">
                        Total: {filteredSolicitations.length} solicitações
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Aba de Solicitações Atendidas */}
      <TabsContent value="atendidas" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Atendidas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{getCompletedSolicitations().length}</div>
              <p className="text-xs text-muted-foreground">Solicitações processadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Atendido</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(getApprovedValue(getCompletedSolicitations()))}
              </div>
              <p className="text-xs text-muted-foreground">Valor total das recargas aprovadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {getCompletedSolicitations().length > 0 
                  ? Math.round((getCompletedSolicitations().filter(s => s.status === 'Recarga Efetuada').length / getCompletedSolicitations().length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Solicitações aprovadas vs negadas</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Solicitações Atendidas</CardTitle>
                <CardDescription>
                  Mostrando {getCompletedSolicitations().length} solicitações atendidas
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {(user?.role === 'admin' || user?.role === 'gestor_combustivel') && (
                  <Button onClick={fetchSolicitations} variant="outline" size="sm">
                    Atualizar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">
                <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                <p>{error}</p>
                <Button onClick={fetchSolicitations} className="mt-4">
                  Tentar novamente
                </Button>
              </div>
            ) : getCompletedSolicitations().length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nenhuma solicitação atendida encontrada.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[600px] overflow-y-auto">
                  {getCompletedSolicitations().map((solicitacao, index) => (
                    <div 
                      key={`${solicitacao.id}-${solicitacao.origem_tipo}-${index}`} 
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        solicitacao.status === 'Recarga Efetuada' 
                          ? 'bg-green-50 border-green-200 border-l-4 border-l-green-500' 
                          : 'bg-red-50 border-red-200 border-l-4 border-l-red-500'
                      }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        {/* Repetição do solicitante */}
                        {getDailyRequestCount(solicitacao.placa, solicitacao.data_solicitacao) > 1 && (
                          <div className="lg:col-span-12 mb-2">
                            <div className="flex items-center gap-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-xs">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-semibold">ATENÇÃO:</span>
                              <span>Esta placa teve {getDailyRequestCount(solicitacao.placa, solicitacao.data_solicitacao)} solicitações no mesmo dia</span>
                              <span className="ml-auto font-mono">{solicitudeCounts[solicitacao.placa] || 0} total</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Placa e Motorista */}
                        <div className="lg:col-span-3">
                          <p className="font-medium text-lg">{solicitacao.placa}</p>
                          <p className="text-sm text-gray-600">{solicitacao.motorista || (solicitacao as any).nome_motorista || 'Motorista não informado'}</p>
                          <p className="text-xs text-gray-700 font-medium">{formatCurrency(solicitacao.valor_solicitado)} - {solicitacao.km_total || solicitacao.km_veiculo || '-'} km</p>
                        </div>

                        {/* Operação e Base */}
                        <div className="lg:col-span-2">
                          <Badge variant="outline" className={
                            solicitacao.origem_tipo === 'line_hall' 
                              ? "bg-blue-100 text-blue-800 mb-1" 
                              : "bg-green-100 text-green-800 mb-1"
                          }>
                            {solicitacao.origem_tipo === 'line_hall' ? 'Line Hall' : 'Tradicional'}
                          </Badge>
                          <p className="text-xs text-gray-500 truncate">{solicitacao.base || '-'}</p>
                        </div>

                        {/* Status e Data */}
                        <div className="lg:col-span-2">
                          {getStatusBadge(solicitacao.status)}
                          <p className="text-xs text-gray-500 mt-1">{formatDate(solicitacao.data_solicitacao).split(',')[0]}</p>
                          {solicitacao.data_atendimento && (
                            <p className="text-xs text-green-600 font-medium">Atendido: {formatDate(solicitacao.data_atendimento).split(',')[0]}</p>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="lg:col-span-3">
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenSolicitation(solicitacao)}
                              className="text-xs"
                            >
                              Visualizar
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewFuelHistory(solicitacao.placa)}
                              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title={`Ver histórico de abastecimentos da placa ${solicitacao.placa}`}
                            >
                              <History className="h-3 w-3 mr-1" />
                              Histórico
                            </Button>
                            
                            <WhatsAppResponseButton 
                              solicitation={solicitacao}
                              variant="outline"
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
        
        {/* Painel Lateral */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto max-h-screen">
            {selectedSolicitation ? (
              <div className="space-y-6 pb-6">
                <SheetHeader>
                  <SheetTitle>Detalhes da Solicitação</SheetTitle>
                  <SheetDescription>
                    Solicitation ID: #{selectedSolicitation.id}
                  </SheetDescription>
                </SheetHeader>
                
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Placa do Veículo</Label>
                      <div className="text-lg font-medium">{selectedSolicitation.placa}</div>
                    </div>
                    <div>
                      <Label>Solicitante</Label>
                      <div className="text-lg font-medium bg-blue-50 p-2 rounded border border-blue-200">
                        {selectedSolicitation.solicitante || selectedSolicitation.requested_by || 'Não informado'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Telefone do Solicitante */}
                  <div>
                    <Label>Telefone do Solicitante</Label>
                    <div className="text-lg font-medium bg-green-50 p-2 rounded border border-green-200">
                      {selectedSolicitation.telefone_celular || (selectedSolicitation as any).driver_phone || 'Não informado'}
                    </div>
                  </div>
                  
                  {/* Campo do nome do motorista sempre visível */}
                  <div>
                    <Label>Nome do Motorista</Label>
                    <div className="text-lg font-medium bg-purple-50 p-2 rounded border border-purple-200">
                      {selectedSolicitation.motorista || (selectedSolicitation as any).nome_motorista || 'Não informado'}
                    </div>
                  </div>
                  
                  {selectedSolicitation.veiculo_modelo && (
                    <div>
                      <Label>Modelo do Veículo</Label>
                      <div className="text-lg font-medium">{selectedSolicitation.veiculo_modelo}</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor Solicitado</Label>
                      <div className="text-lg font-medium">{formatCurrency(selectedSolicitation.valor_solicitado)}</div>
                    </div>
                    <div>
                      <Label>Quilometragem</Label>
                      <div className="text-lg font-medium">{selectedSolicitation.km_veiculo || 'Não informado'}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Cartão</Label>
                      <div className="text-lg font-medium">{selectedSolicitation.tipo_cartao || 'Padrão'}</div>
                    </div>
                    <div>
                      <Label>Status Atual</Label>
                      <div className="mt-1">{getStatusBadge(selectedSolicitation.status)}</div>
                    </div>
                  </div>
                  
                  {(selectedSolicitation.numero_cartao || selectedSolicitation.cartao_combustivel) && (
                    <div>
                      <Label>Cartão de Combustível Vinculado</Label>
                      <div className="text-lg font-medium font-mono bg-blue-50 p-2 rounded border border-blue-200">
                        <CreditCard className="inline mr-2 h-4 w-4 text-blue-600" />
                        {selectedSolicitation.cartao_combustivel || selectedSolicitation.numero_cartao}
                      </div>
                    </div>
                  )}
                  
                  {/* ID da Rota e Quantidade de Litros */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSolicitation.id_rota && (
                      <div>
                        <Label>ID da Rota</Label>
                        <div className="text-lg font-medium bg-blue-50 p-2 rounded border border-blue-200">
                          {selectedSolicitation.id_rota}
                        </div>
                      </div>
                    )}
                    {(selectedSolicitation.litros_solicitados != null && selectedSolicitation.litros_solicitados !== undefined && selectedSolicitation.litros_solicitados > 0) && (
                      <div>
                        <Label>Quantidade de Litros</Label>
                        <div className="text-lg font-medium bg-green-50 p-2 rounded border border-green-200">
                          {selectedSolicitation.litros_solicitados} L
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tipo de Combustível */}
                  {selectedSolicitation.tipo_combustivel && (
                    <div>
                      <Label>Tipo de Combustível</Label>
                      <div className="text-lg font-medium bg-yellow-50 p-2 rounded border border-yellow-200 capitalize">
                        {selectedSolicitation.tipo_combustivel}
                      </div>
                    </div>
                  )}
                  
                  {/* Seção específica do Line Hall Shopee */}
                  {selectedSolicitation.rota_origem && selectedSolicitation.rota_destino && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <Label className="text-blue-800 font-semibold">Detalhes da Rota (Line Hall)</Label>
                      <div className="mt-2 space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Rota:</span> {selectedSolicitation.rota_origem} → {selectedSolicitation.rota_destino}
                        </div>
                        {selectedSolicitation.km_total && (
                          <div className="text-sm">
                            <span className="font-medium">KM da Rota:</span> {selectedSolicitation.km_total} km
                          </div>
                        )}
                        {selectedSolicitation.telefone_motorista && (
                          <div className="text-sm">
                            <span className="font-medium">Telefone:</span> {selectedSolicitation.telefone_motorista}
                          </div>
                        )}
                        {selectedSolicitation.horario_abastecimento && (
                          <div className="text-sm">
                            <span className="font-medium">Horário Abastecimento:</span> {selectedSolicitation.horario_abastecimento === 'antes_17h' ? 'Antes das 17h' : 'Após as 18h'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Detalhes do Cálculo */}
                  {selectedSolicitation.calculo_detalhes && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <Label className="text-green-800 font-semibold">Detalhes do Cálculo</Label>
                      <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">KM da Rota:</span> {selectedSolicitation.calculo_detalhes.km_rota} km
                          </div>
                          <div>
                            <span className="font-medium">KM Adicional:</span> {selectedSolicitation.calculo_detalhes.km_acrescimo} km
                          </div>
                          <div>
                            <span className="font-medium">Total KM:</span> {selectedSolicitation.calculo_detalhes.km_total} km
                          </div>
                          <div>
                            <span className="font-medium">Consumo Médio:</span> {selectedSolicitation.calculo_detalhes.consumo_medio} km/l
                          </div>
                          <div>
                            <span className="font-medium">Litros Necessários:</span> {selectedSolicitation.calculo_detalhes.litros_necessarios} L
                          </div>
                          <div>
                            <span className="font-medium">Valor por Litro:</span> R$ {selectedSolicitation.calculo_detalhes.valor_por_litro.toFixed(2)}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-green-300">
                          <div className="text-lg font-bold text-green-800">
                            <span className="font-medium">Valor Total:</span> R$ {selectedSolicitation.calculo_detalhes.valor_total}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Observações</Label>
                    <div className="bg-gray-50 p-3 rounded-md mt-1 min-h-[80px]">
                      {selectedSolicitation.observacoes || 'Nenhuma observação registrada.'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data da Solicitação</Label>
                      <div className="text-sm">{formatDate(selectedSolicitation.data_solicitacao)}</div>
                    </div>
                    <div>
                      <Label>Atendido por</Label>
                      <div className="text-sm">{selectedSolicitation.atendido_por || '-'}</div>
                    </div>
                  </div>
                  
                  {selectedSolicitation.data_atendimento && (
                    <div>
                      <Label>Data de Atendimento</Label>
                      <div className="text-sm">{formatDate(selectedSolicitation.data_atendimento)}</div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* Seção de Controle de Status */}
                  {(user?.role === 'admin' || user?.role === 'gestor_combustivel') && (
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                      <h3 className="font-semibold text-lg text-gray-900">Controle de Status</h3>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="status" className="text-sm font-medium">Alterar Status da Solicitação</Label>
                          <Select value={editedStatus} onValueChange={setEditedStatus}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o novo status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendente">🟡 Pendente</SelectItem>
                              <SelectItem value="Em Análise">🔵 Em Análise</SelectItem>
                              <SelectItem value="Recarga Efetuada">🟢 Recarga Efetuada</SelectItem>
                              <SelectItem value="Negado">🔴 Negado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleStatusUpdate} 
                            className="flex-1 bg-blue-600 hover:bg-blue-700" 
                            disabled={updatingStatus || editedStatus === selectedSolicitation.status}
                            size="lg"
                          >
                            {updatingStatus ? 'Salvando...' : 'Salvar Alterações'}
                          </Button>
                          
                          <WhatsAppResponseButton 
                            solicitation={selectedSolicitation}
                            variant="outline"
                            size="lg"
                            className="px-4"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Modal de Histórico Completo (Abastecimentos + Solicitações de Recarga) */}
        <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <History className="mr-2 h-5 w-5 text-blue-600" />
                Histórico Completo - Placa {selectedPlaca}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Mostrando abastecimentos e solicitações de recarga de cartão combinados
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : fuelHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum registro encontrado
                  </h3>
                  <p className="text-gray-500">
                    Não há registros de abastecimentos ou solicitações de recarga para a placa {selectedPlaca}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-4 flex items-center justify-between">
                    <span>Total de registros encontrados: {fuelHistory.length}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                        <span>Abastecimentos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span>Solicitações de Recarga</span>
                      </div>
                    </div>
                  </div>
                  
                  {fuelHistory.map((item, index) => {
                    const isCardRequest = item.tipo_registro === 'solicitacao_recarga';
                    return (
                      <div 
                        key={index} 
                        className={`p-4 border rounded-lg transition-colors ${
                          isCardRequest 
                            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {/* Header do Registro */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {isCardRequest ? (
                              <CreditCard className="h-4 w-4 text-green-600" />
                            ) : (
                              <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                                <path d="M3 4a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1H3zM3 10a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1H3zM9 4a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1zM9 10a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z"/>
                              </svg>
                            )}
                            <Badge 
                              variant="outline" 
                              className={
                                isCardRequest 
                                  ? 'bg-green-100 text-green-800 border-green-300' 
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                              }
                            >
                              {isCardRequest ? 'Solicitação de Recarga' : 'Abastecimento'}
                            </Badge>
                            {isCardRequest && (
                              <Badge 
                                variant="outline" 
                                className={
                                  item.status === 'Recarga Efetuada' ? 'bg-green-100 text-green-800' :
                                  item.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                                  item.status === 'Negado' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }
                              >
                                {item.status}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(item.data_evento || item.data_abastecimento || item.data_solicitacao)}
                          </div>
                        </div>

                        {/* Conteúdo Principal */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">
                              {isCardRequest ? 'Origem' : 'Posto/Local'}
                            </Label>
                            <div className="font-medium">
                              {item.posto || item.local || item.nome_posto || 'Não informado'}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-gray-500">Valor</Label>
                            <div className="font-medium text-green-600">
                              {item.valor_evento 
                                ? formatCurrency(parseFloat(item.valor_evento.toString())) 
                                : (item.valor ? formatCurrency(parseFloat(item.valor.toString())) : 'Não informado')
                              }
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-gray-500">Litros</Label>
                            <div className="font-medium">
                              {item.litros ? `${item.litros}L` : 'Não informado'}
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-gray-500">
                              {isCardRequest ? 'Base/Projeto' : 'Quilometragem'}
                            </Label>
                            <div className="font-medium">
                              {isCardRequest 
                                ? (item.base || 'Não informado') 
                                : (item.km_atual || item.km_veiculo || 'Não informado')
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Informações Adicionais */}
                        {(item.motorista || item.observacoes || (isCardRequest && item.tipo_cartao)) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {item.motorista && (
                                <div>
                                  <span className="text-gray-500">Motorista:</span> {item.motorista}
                                </div>
                              )}
                              {isCardRequest && item.tipo_cartao && (
                                <div>
                                  <span className="text-gray-500">Tipo do Cartão:</span> {item.tipo_cartao}
                                </div>
                              )}
                              {item.observacoes && (
                                <div className="md:col-span-2">
                                  <span className="text-gray-500">Observações:</span> {item.observacoes}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default FuelCardRequestsPanel;