import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, Filter, Search, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, TrendingDown, DollarSign, Download, Plus, Trash2, Truck, History, FileText, AlertTriangle, BarChart3, Image, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import FuelCardRequestForm from '@/components/FuelCardRequestForm';
import WhatsAppResponseButton from '@/components/WhatsAppResponseButton';
import LineHaulWhatsAppButton from '@/components/LineHaulWhatsAppButton';
import TwilioWhatsAppButton from '@/components/TwilioWhatsAppButton';
import { useLocation } from 'wouter';
import { generateBatchApprovalMessage, openWhatsAppWeb, isValidPhoneNumber } from '@/lib/whatsapp-utils';
import { cleanBaseName, normalizeBaseName } from '@/lib/base-utils';

// Função auxiliar para converter data corretamente (evita bug de timezone UTC)
const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // Se a data vier no formato YYYY-MM-DD, forçar interpretação como local
  if (dateString.includes('-') && !dateString.includes('T')) {
    const [year, month, day] = dateString.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    
    // DEBUG: Log detalhado
    console.log('🔍 [parseLocalDate] DEBUG:', {
      input: dateString,
      year, month, day,
      parsedDate: parsedDate.toString(),
      formatted: format(parsedDate, 'dd/MM/yyyy')
    });
    
    return parsedDate;
  }
  
  // Fallback para outras strings de data
  const fallbackDate = new Date(dateString);
  console.log('⚠️ [parseLocalDate] FALLBACK usado:', dateString, '→', fallbackDate.toString());
  return fallbackDate;
};

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
  provedor_cartao?: string; // Provedor do cartão (Ticket, Veloe Go, etc)
  observacoes?: string;
  status: 'Pendente' | 'pendente' | 'Em Análise' | 'em_analise' | 'Recarga Efetuada' | 'atendido' | 'Negado';
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
  data_uso?: string; // Data prevista de uso do saldo
  turno?: string; // Turno AM ou PM
  motivo_negacao?: string | null; // Motivo da negação quando status for "Negado"
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
  // Campos de fotos das solicitações Line Haul
  foto_painel_path?: string;
  foto_cartao_path?: string;
  // Timestamp real da criação da solicitação
  created_at?: string;
  placa_cartao?: string;
}

const FuelCardRequestsPanel: React.FC = () => {
  const [solicitations, setSolicitations] = useState<FuelCardSolicitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolicitation, setSelectedSolicitation] = useState<FuelCardSolicitation | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [fuelDateFilter, setFuelDateFilter] = useState<string>(''); // Filtro por data de abastecimento
  const [horarioFilter, setHorarioFilter] = useState<string>('all'); // Filtro por horário de abastecimento
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [baseFilter, setBaseFilter] = useState<string>('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [editedStatus, setEditedStatus] = useState<string>('');
  const [motivoNegacao, setMotivoNegacao] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false);
  const [approvingBatch, setApprovingBatch] = useState(false);
  
  // Estados para WhatsApp em lote
  const [batchWhatsAppDialogOpen, setBatchWhatsAppDialogOpen] = useState(false);
  const [approvedBatchSolicitations, setApprovedBatchSolicitations] = useState<FuelCardSolicitation[]>([]);
  const [gestorPhone, setGestorPhone] = useState<string>('');
  const [batchWhatsAppMessage, setBatchWhatsAppMessage] = useState<string>('');
  
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
  
  // Estado para notificação de novas mensagens WhatsApp
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  // Verificar parâmetros da URL para modo Line Haul
  const urlParams = new URLSearchParams(window.location.search);
  const isLineHaulMode = urlParams.get('mode') === 'linehaul';
  const initialTab = isLineHaulMode ? 'linehaul_pendentes' : (urlParams.get('tab') || 'pendentes');
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // Estados para paginação - OTIMIZAÇÃO
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Debug: log user role para verificar permissões
  useEffect(() => {
    if (user) {
      console.log('[FUEL-CARD-PANEL] Usuário logado:', { 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        roleNormalized: user.role?.toLowerCase(),
        isLineHall: user.role?.toLowerCase() === 'line_hall',
        isAdmin: user.role?.toLowerCase() === 'admin',
        isGestorCombustivel: user.role?.toLowerCase() === 'gestor_combustivel'
      });
    }
  }, [user]);
  
  useEffect(() => {
    fetchSolicitations();
    fetchProjects();
  }, []);

  // OTIMIZAÇÃO: Recarregar dados quando a página mudar
  useEffect(() => {
    if (currentPage > 1) {
      fetchSolicitations(currentPage, itemsPerPage);
    }
  }, [currentPage, itemsPerPage]);

  // Recarregar dados quando a aba ativa mudar
  useEffect(() => {
    console.log('[FUEL-CARD-PANEL] Aba ativa mudou para:', activeTab);
    setCurrentPage(1); // Reset para página 1
    fetchSolicitations(1, itemsPerPage);
  }, [activeTab]);

  // Recarregar dados quando filtros mudarem (com debounce para searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[FUEL-CARD-PANEL] Filtros mudaram, recarregando...');
      setCurrentPage(1); // Reset para página 1
      fetchSolicitations(1, itemsPerPage);
    }, searchQuery ? 500 : 0); // Debounce de 500ms apenas para search
    
    return () => clearTimeout(timer);
  }, [baseFilter, searchQuery, fuelDateFilter]);

  useEffect(() => {
    if (solicitations.length > 0) {
      loadSolicitudeCounts();
    }
  }, [solicitations]);

  // Reset base filter when project changes
  useEffect(() => {
    setBaseFilter('all');
  }, [projectFilter]);

  // Verificar novas mensagens WhatsApp periodicamente
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const response = await fetch('/api/whatsapp/messages?limit=100', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const unread = data.data.filter((msg: any) => !msg.respondido && !msg.is_outgoing).length;
            setUnreadMessagesCount(unread);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar mensagens:', error);
      }
    };

    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 30000); // A cada 30 segundos
    return () => clearInterval(interval);
  }, []);

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

  // Função para detectar placas com múltiplas solicitações no mesmo dia (por data de uso)
  // Regra especial: Diesel + Arla no mesmo dia NÃO conta como repetição
  const getDailyPlateRepeats = () => {
    const dailyRepeats: Record<string, Record<string, number>> = {};
    const dailyCombustibles: Record<string, Record<string, Set<string>>> = {};
    
    solicitations.forEach(solicitation => {
      // Usar data_uso ao invés de data_solicitacao para detectar duplicatas
      const dataUso = solicitation.data_uso || solicitation.data_solicitacao;
      const date = new Date(dataUso).toDateString();
      const placa = solicitation.placa;
      const combustivel = (solicitation.tipo_combustivel || '').toLowerCase().trim();
      
      if (!dailyRepeats[placa]) {
        dailyRepeats[placa] = {};
      }
      
      if (!dailyCombustibles[placa]) {
        dailyCombustibles[placa] = {};
      }
      
      if (!dailyRepeats[placa][date]) {
        dailyRepeats[placa][date] = 0;
      }
      
      if (!dailyCombustibles[placa][date]) {
        dailyCombustibles[placa][date] = new Set();
      }
      
      dailyRepeats[placa][date]++;
      if (combustivel) {
        dailyCombustibles[placa][date].add(combustivel);
      }
    });
    
    // Aplicar regra: se tem apenas Diesel + Arla, não considerar como repetição
    Object.keys(dailyRepeats).forEach(placa => {
      Object.keys(dailyRepeats[placa]).forEach(date => {
        const combustiveis = dailyCombustibles[placa]?.[date] || new Set();
        const count = dailyRepeats[placa][date];
        
        // Verificar se é caso de Diesel + Arla (exatamente 2 solicitações com esses dois combustíveis)
        if (count === 2 && combustiveis.size === 2) {
          const tipos = Array.from(combustiveis);
          const temDiesel = tipos.some(t => t.includes('diesel') || t.includes('s10') || t.includes('s500'));
          const temArla = tipos.some(t => t.includes('arla'));
          
          if (temDiesel && temArla) {
            // Não é repetição - zerar contagem para 1 (cada um conta como único)
            dailyRepeats[placa][date] = 1;
          }
        }
      });
    });
    
    return dailyRepeats;
  };

  // Memorização da função para obter a última solicitação de uma placa
  const getLastRequestForPlate = useCallback((placa: string): FuelCardSolicitation | null => {
    const plateSolicitations = solicitations
      .filter(s => s.placa === placa)
      .sort((a, b) => new Date(b.created_at || b.data_solicitacao).getTime() - new Date(a.created_at || a.data_solicitacao).getTime());
    
    return plateSolicitations.length > 0 ? plateSolicitations[0] : null;
  }, [solicitations]);

  // Memorização da função para calcular diferença de km entre solicitações do Line Haul
  const getKmDifferenceForLineHaul = useCallback((currentSolicitation: FuelCardSolicitation): number | null => {
    if (currentSolicitation.origem_tipo !== 'line_hall') return null;
    
    const currentKm = currentSolicitation.km_total || currentSolicitation.km_veiculo || (currentSolicitation as any).km || 0;
    
    // Buscar solicitações anteriores da mesma placa do Line Haul
    const previousSolicitations = solicitations
      .filter(s => 
        s.placa === currentSolicitation.placa && 
        s.origem_tipo === 'line_hall' &&
        s.id !== currentSolicitation.id &&
        new Date(s.data_solicitacao) < new Date(currentSolicitation.data_solicitacao)
      )
      .sort((a, b) => new Date(b.created_at || b.data_solicitacao).getTime() - new Date(a.created_at || a.data_solicitacao).getTime());
    
    if (previousSolicitations.length === 0) return null;
    
    const previousKm = previousSolicitations[0].km_total || previousSolicitations[0].km_veiculo || (previousSolicitations[0] as any).km || 0;
    return currentKm - previousKm;
  }, [solicitations]);

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

  // Memorização das listas filtradas para melhor performance
  const filteredSolicitations = useMemo(() => {
    return solicitations.filter(sol => {
      // Filtro por status
      if (statusFilter !== 'all' && sol.status !== statusFilter) {
        return false;
      }
      
      // Filtro por data de solicitação (convertendo para timezone do Brasil)
      if (dateFilter) {
        // Extrair apenas a parte da data (YYYY-MM-DD) da string de solicitação
        const solDateStr = sol.data_solicitacao.split('T')[0];
        
        if (solDateStr !== dateFilter) {
          return false;
        }
      }
      
      // Filtro por data de abastecimento (data_uso) - com conversão para timezone brasileiro
      if (fuelDateFilter) {
        if (!sol.data_uso) {
          return false; // Se não tem data de abastecimento, não passa no filtro
        }
        
        // Converter para data local do Brasil usando parseLocalDate
        const localDate = parseLocalDate(sol.data_uso);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const fuelDate = `${year}-${month}-${day}`;
        
        if (fuelDate !== fuelDateFilter) {
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
      
      // Filtro por base (normalizar ambos os lados para garantir match)
      if (baseFilter !== 'all' && normalizeBaseName(sol.base) !== baseFilter) {
        return false;
      }
      
      // Filtro por horário de abastecimento
      if (horarioFilter !== 'all') {
        if (!sol.horario_abastecimento) {
          return false;
        }
        if (sol.horario_abastecimento !== horarioFilter) {
          return false;
        }
      }
      
      // Filtro por busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          sol.placa?.toLowerCase().includes(query) ||
          sol.motorista?.toLowerCase().includes(query) ||
          sol.solicitante?.toLowerCase().includes(query) ||
          sol.requested_by?.toLowerCase().includes(query) ||
          sol.atendido_por?.toLowerCase().includes(query) ||
          sol.base?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [solicitations, searchQuery, statusFilter, projectFilter, baseFilter, dateFilter, fuelDateFilter, horarioFilter, projects]);

  // Agora os dados já vêm filtrados do backend por aba
  const pendingSolicitations = useMemo(() => {
    // Se estamos na aba de pendentes, todos os dados já são pendentes
    if (activeTab === 'pendentes') {
      return solicitations;
    }
    // Fallback para compatibilidade (filtro local)
    return solicitations.filter(s => 
      s.status === 'Pendente' || s.status === 'pendente' || 
      s.status === 'Em Análise' || s.status === 'em_analise'
    );
  }, [solicitations, activeTab]);

  const completedSolicitations = useMemo(() => {
    // Se estamos na aba de atendidas, todos os dados já são atendidos
    if (activeTab === 'atendidas') {
      return solicitations;
    }
    // Fallback para compatibilidade (filtro local)
    return solicitations.filter(s => 
      s.status === 'Recarga Efetuada' || s.status === 'atendido'
    );
  }, [solicitations, activeTab]);

  const deniedSolicitations = useMemo(() => {
    // Se estamos na aba de negadas, todos os dados já são negados
    if (activeTab === 'negadas') {
      return solicitations;
    }
    // Fallback para compatibilidade (filtro local)
    return solicitations.filter(s => 
      s.status === 'Negado'
    );
  }, [solicitations, activeTab]);

  const lineHaulSolicitations = useMemo(() => {
    // Ordenar por data de criação (mais recentes primeiro)
    const sortByCreatedAt = (list: FuelCardSolicitation[]) => 
      [...list].sort((a, b) => new Date(b.created_at || b.data_solicitacao).getTime() - new Date(a.created_at || a.data_solicitacao).getTime());
    
    // SEMPRE filtrar por origem_tipo = 'line_hall' para abas Line Haul
    let filtered = solicitations.filter(s => s.origem_tipo === 'line_hall');
    
    // Aplicar filtro de data de solicitação se definido
    if (dateFilter) {
      filtered = filtered.filter(s => {
        // Extrair apenas a parte da data (YYYY-MM-DD) da string de solicitação
        const solDateStr = s.data_solicitacao.split('T')[0];
        return solDateStr === dateFilter;
      });
    }
    
    // Aplicar filtro de data de abastecimento se definido
    if (fuelDateFilter) {
      filtered = filtered.filter(s => {
        if (!s.data_uso) return false;
        const localDate = parseLocalDate(s.data_uso);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const fuelDate = `${year}-${month}-${day}`;
        return fuelDate === fuelDateFilter;
      });
    }
    
    // Aplicar filtro de horário de abastecimento se definido
    if (horarioFilter !== 'all') {
      filtered = filtered.filter(s => {
        if (!s.horario_abastecimento) return false;
        return s.horario_abastecimento === horarioFilter;
      });
    }
    
    return sortByCreatedAt(filtered);
  }, [solicitations, dateFilter, fuelDateFilter, horarioFilter]);

  // Filtros Line Haul por status
  const lineHaulPendentes = useMemo(() => 
    lineHaulSolicitations.filter(s => s.status === 'Pendente' || s.status === 'pendente'),
  [lineHaulSolicitations]);

  const lineHaulAtendidas = useMemo(() => 
    lineHaulSolicitations.filter(s => s.status === 'Recarga Efetuada' || s.status === 'atendido' || s.status === 'aprovada'),
  [lineHaulSolicitations]);

  const lineHaulNegadas = useMemo(() => 
    lineHaulSolicitations.filter(s => s.status === 'Negado' || s.status === 'rejeitada' || s.status === 'rejeitado'),
  [lineHaulSolicitations]);

  // Função legacy para compatibilidade
  const getPendingSolicitations = useCallback(() => pendingSolicitations, [pendingSolicitations]);
  const getCompletedSolicitations = useCallback(() => completedSolicitations, [completedSolicitations]);
  const getLineHallSolicitations = useCallback(() => lineHaulSolicitations, [lineHaulSolicitations]);

  // Memorização da verificação de solicitações novas do Line Haul (últimas 24h)
  const hasNewLineHallRequests = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return lineHaulSolicitations.some(s => {
      const solicitationDate = new Date(s.data_solicitacao);
      return solicitationDate > yesterday && (s.status === 'Pendente' || s.status === 'pendente');
    });
  }, [lineHaulSolicitations]);

  // Memorização de cálculos de valor para melhor performance
  const getTotalValue = useCallback((solicitations: FuelCardSolicitation[]) => {
    return solicitations.reduce((total, s) => {
      const valor = s.valor_solicitado || s.valor_calculado || 0;
      return total + Number(valor);
    }, 0);
  }, []);

  // Função para calcular valores por tipo de cartão (provedor)
  const getValuesByCardType = useCallback((solicitations: FuelCardSolicitation[]) => {
    const ticket = solicitations
      .filter(s => s.provedor_cartao?.toLowerCase() === 'ticket')
      .reduce((total, s) => total + Number(s.valor_solicitado || s.valor_calculado || 0), 0);
    
    const veloeGo = solicitations
      .filter(s => s.provedor_cartao?.toLowerCase() === 'veloe go')
      .reduce((total, s) => total + Number(s.valor_solicitado || s.valor_calculado || 0), 0);
    
    return { ticket, veloeGo, alelo: veloeGo, total: ticket + veloeGo };
  }, []);

  const getApprovedValue = useCallback((solicitations: FuelCardSolicitation[]) => {
    return solicitations
      .filter(s => s.status === 'Recarga Efetuada' || s.status === 'atendido')
      .reduce((total, s) => {
        const valor = s.valor_solicitado || s.valor_calculado || 0;
        return total + Number(valor);
      }, 0);
  }, []);

  // OTIMIZAÇÃO: Funções de navegação de páginas
  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset to first page
    fetchSolicitations(1, newSize);
  };

  const handleGoToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };



  const fetchSolicitations = async (page: number = currentPage, limit: number = itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir query params com filtros
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      // Adicionar filtros se presentes
      // Mapear activeTab para status correto
      if (activeTab === 'pendentes') {
        params.append('status', 'Pendente');
      } else if (activeTab === 'atendidas') {
        params.append('status', 'Recarga Efetuada');
      } else if (activeTab === 'negadas') {
        params.append('status', 'Negado');
      } else if (activeTab === 'linehaul' || activeTab === 'linehaul_pendentes' || activeTab === 'linehaul_atendidas' || activeTab === 'linehaul_negadas') {
        // Line Haul - filtrar apenas registros com origem_tipo = 'line_hall'
        params.append('origem_tipo', 'line_hall');
      }
      
      if (baseFilter && baseFilter !== 'all') {
        params.append('base', baseFilter);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (fuelDateFilter) {
        params.append('fuelDate', fuelDateFilter);
      }
      
      // Cache-busting para garantir dados atualizados
      params.append('_t', Date.now().toString());
      
      console.log('[FUEL-CARD-PANEL] Buscando com filtros:', {
        activeTab,
        baseFilter,
        searchQuery,
        fuelDateFilter,
        page,
        limit
      });
      
      // OTIMIZAÇÃO: Usar endpoint público com paginação e filtros (sem cache)
      const response = await fetch(`/api/public/fuel-card/solicitations?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('[FUEL-CARD-PANEL] Dados recebidos:', data.data.length, data.fromCache ? '(cache)' : '(fresh)');
        console.log('[FUEL-CARD-PANEL] Paginação:', data.pagination || 'Sem paginação');
        
        setSolicitations(data.data);
        
        // Atualizar estados de paginação se disponível
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalCount(data.pagination.totalCount);
          setTotalPages(data.pagination.totalPages);
          setHasNextPage(data.pagination.hasNextPage);
          setHasPrevPage(data.pagination.hasPrevPage);
        } else {
          // Fallback para compatibilidade
          setTotalCount(data.count || data.data.length);
          setTotalPages(1);
          setHasNextPage(false);
          setHasPrevPage(false);
        }
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
      // Usar endpoint público para projetos com cache-busting
      const response = await fetch(`/api/public/projects-with-bases?_t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // FORÇA TIMESTAMP NO STATE PARA FORÇAR RE-RENDER
        const projectsWithTimestamp = data.data.map((p: any) => ({
          ...p,
          _loadedAt: Date.now()
        }));
        setProjects(projectsWithTimestamp);
        
        // DEBUG: Log de bases carregadas
        const totalBases = data.data.reduce((acc: number, proj: any) => acc + (proj.bases?.length || 0), 0);
        const mercadoLivre = data.data.find((p: any) => p.id === 3);
        const vespasiano = mercadoLivre?.bases?.find((b: any) => b.base_name.includes('VESPASIANO'));
        console.log('🔥 [FUEL-CARD] ATUALIZADO!', {
          projetos: data.data.length,
          totalBases,
          mercadoLivreBases: mercadoLivre?.bases?.length || 0,
          vespasiano: vespasiano ? `ENCONTRADA: ${vespasiano.display_name}` : 'NÃO ENCONTRADA'
        });
      }
    } catch (err) {
      console.error('Erro ao buscar projetos:', err);
    }
  };
  
  const handleOpenSolicitation = (solicitation: FuelCardSolicitation) => {
    setSelectedSolicitation(solicitation);
    setEditedStatus(solicitation.status);
    // Pré-preencher motivo de negação se existir
    setMotivoNegacao(solicitation.motivo_negacao || '');
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
    
    // Validar motivo de negação se o status for "Negado"
    if (editedStatus === 'Negado' && !motivoNegacao.trim()) {
      toast({
        variant: 'destructive',
        title: 'Motivo obrigatório',
        description: 'Por favor, informe o motivo da negação.'
      });
      return;
    }
    
    try {
      setUpdatingStatus(true);
      
      const updateData = {
        id: selectedSolicitation.id,
        status: editedStatus,
        origem_tipo: selectedSolicitation.origem_tipo,
        atendido_por: user?.name,
        observacoes: selectedSolicitation.observacoes,
        motivo_negacao: editedStatus === 'Negado' ? motivoNegacao : null
      };
      
      const response = await apiRequest('PUT', `/api/fuel-card-solicitations/${selectedSolicitation.id}/status`, updateData);
      const data = await response.json();
      
      if (data.success) {
        // Atualizar a lista de solicitações
        setSolicitations(solicitations.map(sol => 
          sol.id === selectedSolicitation.id ? {
            ...sol, 
            status: editedStatus as FuelCardSolicitation['status'], 
            atendido_por: user?.name, 
            data_atendimento: new Date().toISOString(),
            motivo_negacao: editedStatus === 'Negado' ? motivoNegacao : null
          } : sol
        ));
        
        setSelectedSolicitation({
          ...selectedSolicitation,
          status: editedStatus as any,
          atendido_por: user?.name,
          data_atendimento: new Date().toISOString(),
          motivo_negacao: editedStatus === 'Negado' ? motivoNegacao : null
        });
        
        // Limpar o motivo após salvar
        setMotivoNegacao('');
        
        // Navegar automaticamente para a aba correspondente após atualizar
        const isLineHallRequest = selectedSolicitation.origem_tipo === 'line_hall';
        if (isLineHallRequest) {
          if (editedStatus === 'Recarga Efetuada') {
            setActiveTab('linehaul_atendidas');
          } else if (editedStatus === 'Negado') {
            setActiveTab('linehaul_negadas');
          }
        } else {
          if (editedStatus === 'Recarga Efetuada') {
            setActiveTab('atendidas');
          } else if (editedStatus === 'Negado') {
            setActiveTab('negadas');
          }
        }
        
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

  // Função para exportar solicitações Veloe no formato "Carga Complementar Massiva"
  const handleExportVeloe = async (onlyLineHall: boolean = false) => {
    if (!startDate || !endDate) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione as datas de início e fim para exportar Veloe',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('[EXPORT-VELOE] Iniciando exportação Veloe...', { onlyLineHall });
      
      const queryParams = new URLSearchParams({
        data_inicio: startDate,
        data_fim: endDate,
        ...(onlyLineHall && { origem: 'line_hall' })
      });

      const response = await apiRequest('GET', `/api/fuel-card-solicitations/export-veloe?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `veloe_${onlyLineHall ? 'line_hall_' : ''}carga_complementar_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: `Exportação Veloe ${onlyLineHall ? 'Line Haul ' : ''}concluída`,
          description: `Planilha Veloe ${onlyLineHall ? 'Line Haul ' : ''}gerada com sucesso`,
        });
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      console.error('[EXPORT-VELOE] Erro:', error);
      
      let errorMessage = 'Não foi possível gerar a planilha Veloe';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Sessão expirada. Faça logout e login novamente.';
        }
      }
      
      toast({
        title: 'Erro na exportação Veloe',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Função para exportar solicitações Ticket (pendentes filtradas por data)
  const handleExportTicket = async (onlyLineHall: boolean = false) => {
    if (!startDate || !endDate) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione as datas de início e fim para exportar Ticket',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('[EXPORT-TICKET] Iniciando exportação Ticket...', { onlyLineHall });
      
      const queryParams = new URLSearchParams({
        data_inicio: startDate,
        data_fim: endDate,
        ...(onlyLineHall && { origem: 'line_hall' })
      });

      const response = await apiRequest('GET', `/api/fuel-card-solicitations/export-ticket?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket_${onlyLineHall ? 'line_hall_' : ''}recarga_${startDate}_${endDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: `Exportação Ticket ${onlyLineHall ? 'Line Haul ' : ''}concluída`,
          description: `Planilha Ticket ${onlyLineHall ? 'Line Haul ' : ''}gerada com sucesso`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar planilha');
      }
    } catch (error: any) {
      console.error('[EXPORT-TICKET] Erro:', error);
      
      let errorMessage = error.message || 'Não foi possível gerar a planilha Ticket';
      if (error.message?.includes('401')) {
        errorMessage = 'Sessão expirada. Faça logout e login novamente.';
      }
      
      toast({
        title: 'Erro na exportação Ticket',
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
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-cartao-combustivel-${startDate}-${endDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        const formatDateBR = (dateStr: string) => {
          const [year, month, day] = dateStr.split('-');
          return `${day}/${month}/${year}`;
        };
        
        toast({
          title: 'Relatório baixado com sucesso',
          description: `Relatório do período ${formatDateBR(startDate)} a ${formatDateBR(endDate)} gerado`,
        });
      } else if (response.status === 404) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Não há solicitações no período e filtros selecionados',
          variant: 'destructive',
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

  const handleDownloadByFuelDate = async () => {
    if (!fuelDateFilter) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione uma data de abastecimento para exportar',
        variant: 'destructive',
      });
      return;
    }

    setDownloadingReport(true);
    try {
      const queryParams = new URLSearchParams({
        fuelDate: fuelDateFilter,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(projectFilter !== 'all' && { projectId: projectFilter }),
        ...(baseFilter !== 'all' && { base: baseFilter })
      });

      const response = await apiRequest('GET', `/api/fuel-card-solicitations/export-by-fuel-date?${queryParams}`);
      
      if (response.ok) {
        // Criar URL para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solicitacoes-abastecimento-${fuelDateFilter}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Exportação concluída',
          description: `Solicitações de ${format(new Date(fuelDateFilter), 'dd/MM/yyyy')} exportadas com sucesso`,
        });
      } else {
        const errorText = await response.text();
        console.error('[EXPORT-FUEL-DATE] Erro na resposta:', errorText);
        throw new Error('Erro ao gerar relatório por data de abastecimento');
      }
    } catch (error) {
      console.error('[EXPORT-FUEL-DATE] Erro:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar as solicitações para a data selecionada',
        variant: 'destructive',
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleBatchApproval = async () => {
    console.log('🔄 [BATCH-APPROVAL] Iniciando aprovação em lote');
    console.log('📊 [BATCH-APPROVAL] Base selecionada:', baseFilter);
    console.log('📊 [BATCH-APPROVAL] Total de solicitações:', solicitations.length);
    
    if (baseFilter === 'all') {
      console.error('❌ [BATCH-APPROVAL] Base "all" não permitida');
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione uma base específica para aprovar solicitações em lote'
      });
      return;
    }

    try {
      setApprovingBatch(true);
      
      // Buscar solicitações pendentes da base selecionada (normalizar para garantir match)
      const pendingSolicitations = solicitations.filter(sol => 
        normalizeBaseName(sol.base) === baseFilter && 
        (sol.status === 'Pendente' || sol.status === 'pendente' || 
         sol.status === 'Em Análise' || sol.status === 'em_analise')
      );
      
      console.log(`🔍 [BATCH-APPROVAL] Solicitações pendentes encontradas: ${pendingSolicitations.length}`);
      console.log('📝 [BATCH-APPROVAL] Solicitações:', pendingSolicitations.map(s => ({ id: s.id, placa: s.placa, status: s.status, base: s.base })));
      
      if (pendingSolicitations.length === 0) {
        console.warn('⚠️ [BATCH-APPROVAL] Nenhuma solicitação pendente encontrada');
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
        console.log('❌ [BATCH-APPROVAL] Aprovação cancelada pelo usuário');
        return;
      }

      console.log('✅ [BATCH-APPROVAL] Confirmado! Iniciando aprovação...');

      // Aprovar todas as solicitações pendentes
      const approvalPromises = pendingSolicitations.map(async (sol) => {
        const updateData = {
          id: sol.id,
          status: 'Recarga Efetuada',
          origem_tipo: sol.origem_tipo,
          atendido_por: user?.name,
          observacoes: sol.observacoes
        };
        
        console.log(`📤 [BATCH-APPROVAL] Enviando UPDATE para ID: ${sol.id}, Status: Recarga Efetuada, Origem: ${sol.origem_tipo}`);
        return apiRequest('PUT', `/api/fuel-card-solicitations/${sol.id}/status`, updateData);
      });

      console.log(`⏳ [BATCH-APPROVAL] Aguardando ${approvalPromises.length} requisições...`);
      const results = await Promise.allSettled(approvalPromises);
      console.log('📊 [BATCH-APPROVAL] Resultados:', results);
      
      // Contar sucessos e falhas
      const successes = results.filter(result => result.status === 'fulfilled').length;
      const failures = results.filter(result => result.status === 'rejected').length;

      if (successes > 0) {
        // Armazenar solicitações aprovadas para WhatsApp
        const approvedSols = pendingSolicitations.slice(0, successes);
        setApprovedBatchSolicitations(approvedSols);
        
        // Extrair telefone automaticamente das solicitações
        let autoPhone = '';
        for (const sol of approvedSols) {
          if (sol.telefone_celular) {
            autoPhone = sol.telefone_celular;
            break;
          } else if (sol.telefone_motorista) {
            autoPhone = sol.telefone_motorista;
            break;
          }
        }
        
        // Se encontrou telefone, preencher automaticamente
        if (autoPhone) {
          setGestorPhone(autoPhone);
        }
        
        // Gerar mensagem do WhatsApp
        const message = generateBatchApprovalMessage(approvedSols, baseFilter);
        setBatchWhatsAppMessage(message);
        
        // Atualizar a lista local (normalizar para garantir match)
        setSolicitations(solicitations.map(sol => {
          if (normalizeBaseName(sol.base) === baseFilter && (sol.status === 'Pendente' || sol.status === 'pendente' || 
                                         sol.status === 'Em Análise' || sol.status === 'em_analise')) {
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
        
        // Abrir dialog para envio de WhatsApp
        setBatchWhatsAppDialogOpen(true);
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
  
  const handleSendBatchWhatsApp = () => {
    if (!gestorPhone.trim()) {
      toast({
        title: 'Telefone obrigatório',
        description: 'Por favor, informe o número de telefone do gestor',
        variant: 'destructive'
      });
      return;
    }

    if (!isValidPhoneNumber(gestorPhone)) {
      toast({
        title: 'Número inválido',
        description: 'Por favor, verifique o formato do número de telefone',
        variant: 'destructive'
      });
      return;
    }

    try {
      openWhatsAppWeb(gestorPhone, batchWhatsAppMessage);
      
      toast({
        title: 'WhatsApp aberto',
        description: 'A mensagem consolidada foi aberta no WhatsApp Web. Confira e envie.',
      });
      
      setBatchWhatsAppDialogOpen(false);
      setGestorPhone('');
    } catch (error) {
      toast({
        title: 'Erro ao abrir WhatsApp',
        description: 'Não foi possível abrir o WhatsApp Web. Verifique se o serviço está disponível.',
        variant: 'destructive'
      });
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
      
      // Filtro por projeto (normalizar para garantir match)
      if (projectFilter !== 'all') {
        // Buscar o projeto selecionado e suas bases
        const selectedProject = projects.find(p => p.id.toString() === projectFilter);
        if (selectedProject) {
          const projectBases = selectedProject.bases?.map((b: any) => normalizeBaseName(b.base_name)) || [];
          if (!projectBases.includes(normalizeBaseName(sol.base))) {
            return false;
          }
        }
      }

      // Filtro por base (normalizar para garantir match)
      if (baseFilter !== 'all') {
        if (normalizeBaseName(sol.base) !== baseFilter) {
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
      case 'atendido':
      case 'aprovada':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Recarga Efetuada</Badge>;
      case 'Negado':
      case 'rejeitado':
      case 'rejeitada':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Negado</Badge>;
      case 'Em Análise':
      case 'em_analise':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" /> Em Análise</Badge>;
      case 'Pendente':
      case 'pendente':
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

  // Função para detectar placas repetidas no mesmo dia (qualquer dia, não apenas hoje)
  const getRepeatedPlacasToday = (solicitacoes: any[]) => {
    // Agrupar por placa e data de solicitação
    const placasByDate: Record<string, number> = {};
    
    solicitacoes.forEach(sol => {
      const dataStr = sol.data_solicitacao || sol.created_at;
      if (!dataStr || !sol.placa) return;
      
      try {
        const solDate = new Date(dataStr);
        const solDateStr = format(solDate, 'yyyy-MM-dd');
        
        // Conta todas as solicitações por placa+data (qualquer dia)
        const key = `${sol.placa}_${solDateStr}`;
        placasByDate[key] = (placasByDate[key] || 0) + 1;
      } catch (e) {
        // Ignora erros de parsing
      }
    });
    
    // Retorna placas que aparecem mais de uma vez no mesmo dia
    const repeated = new Set<string>();
    Object.entries(placasByDate).forEach(([key, count]) => {
      if (count > 1) {
        const placa = key.split('_')[0];
        repeated.add(placa);
      }
    });
    
    return repeated;
  };

  // Detectar placas repetidas Line Haul pendentes
  const repeatedPlacasLineHaul = getRepeatedPlacasToday(lineHaulPendentes);

  // Funções para calcular estatísticas
  // Get filtered bases based on selected project
  const getFilteredBases = () => {
    console.log('🔍 [getFilteredBases] CHAMADA! Filter:', projectFilter, 'Projetos:', projects.length);
    
    if (projectFilter === 'all') {
      // Return all unique bases from solicitations + projects
      const allBases = new Map<string, string>(); // base_name -> display_name
      
      // Add bases from solicitations (real data from database)
      solicitations.forEach(sol => {
        if (sol.base && sol.base.trim() !== '') {
          // NORMALIZAR usando função compartilhada para eliminar duplicatas e acentos
          const normalizedBase = normalizeBaseName(sol.base);
          if (normalizedBase && !allBases.has(normalizedBase)) {
            allBases.set(normalizedBase, normalizedBase);
          }
        }
      });
      
      // Also add bases from projects for completeness
      projects.forEach(project => {
        if (project.bases) {
          project.bases.forEach((base: any) => {
            if (base.base_name) {
              // NORMALIZAR usando função compartilhada
              const normalizedBase = normalizeBaseName(base.base_name);
              if (normalizedBase) {
                allBases.set(normalizedBase, base.display_name || normalizedBase);
              }
            }
          });
        }
      });
      
      const result = Array.from(allBases.entries())
        .map(([base_name, display_name]) => ({ base_name, display_name }))
        .sort((a, b) => a.display_name.localeCompare(b.display_name));
      
      const vespasiano = result.filter(b => b.base_name.includes('VESPASIANO'));
      console.log('📊 [ALL] Total bases:', result.length);
      console.log('📊 [VESPASIANO DUPLICATAS?]', vespasiano.length, 'encontradas:', vespasiano);
      console.log('📊 [TODAS AS BASES]:', result.map(b => ({ name: b.base_name, display: b.display_name })));
      return result;
    } else {
      // Return bases from selected project + solicitations matching that project
      const selectedProject = projects.find(p => p.id.toString() === projectFilter);
      const projectBases = new Map<string, string>(); // base_name -> display_name
      
      console.log('📂 [PROJETO] Selecionado:', selectedProject?.name, 'Bases do projeto:', selectedProject?.bases?.length || 0);
      
      // Add bases from the selected project
      if (selectedProject && selectedProject.bases) {
        selectedProject.bases.forEach((base: any) => {
          if (base.base_name) {
            // NORMALIZAR usando função compartilhada
            const normalizedBase = normalizeBaseName(base.base_name);
            if (normalizedBase) {
              projectBases.set(normalizedBase, base.display_name || normalizedBase);
            }
          }
        });
      }
      
      // Add bases from solicitations that belong to this project
      solicitations.forEach(sol => {
        if (sol.base && sol.base.trim() !== '') {
          // NORMALIZAR base da solicitação usando função compartilhada
          const normalizedSolBase = normalizeBaseName(sol.base);
          // Check if this solicitation's base belongs to the selected project
          if (selectedProject && selectedProject.bases && normalizedSolBase) {
            const belongsToProject = selectedProject.bases.some((base: any) => {
              const normalizedProjectBase = normalizeBaseName(base.base_name);
              return normalizedProjectBase === normalizedSolBase;
            });
            if (belongsToProject && !projectBases.has(normalizedSolBase)) {
              projectBases.set(normalizedSolBase, normalizedSolBase);
            }
          }
        }
      });
      
      const result = Array.from(projectBases.entries())
        .map(([base_name, display_name]) => ({ base_name, display_name }))
        .sort((a, b) => a.display_name.localeCompare(b.display_name));
      
      const vespasiano = result.find(b => b.base_name.includes('VESPASIANO'));
      console.log('📊 [PROJETO] Total bases filtradas:', result.length, 'VESPASIANO?', vespasiano ? `SIM: ${vespasiano.display_name}` : 'NÃO');
      return result;
    }
  };

  const getStatistics = () => {
    const pendentes = solicitations.filter(s => 
      s.status === 'Pendente' || s.status === 'pendente' || 
      s.status === 'Em Análise' || s.status === 'em_analise'
    ).length;
    const atendidas = solicitations.filter(s => s.status === 'Recarga Efetuada' || s.status === 'atendido').length;
    
    // Calcular valor total atendido com validação numérica - incluindo ambos os status
    const valorTotalAtendido = solicitations
      .filter(s => s.status === 'Recarga Efetuada' || s.status === 'atendido')
      .reduce((total, s) => {
        const valor = parseFloat(s.valor_solicitado?.toString() || '0');
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
    
    // Calcular placas com múltiplas solicitações no mesmo dia (por data de uso)
    const placasRepetidas = solicitations.filter(s => 
      hasMultipleRequestsToday(s.placa, s.data_uso || s.data_solicitacao)
    ).length;
    
    return { pendentes, atendidas, valorTotalAtendido, placasRepetidas };
  };
  
  const statistics = getStatistics();
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">
            <CreditCard className="inline-block mr-2" />
            Painel de Solicitações
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            {(user?.role === 'admin' || user?.role === 'gestor_combustivel') && (
              <>
                <Button 
                  variant="secondary" 
                  className="flex items-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200"
                  onClick={() => setLocation('/fuel-card/analytics')}
                  data-testid="button-analytics"
                >
                  <BarChart3 className="h-4 w-4" />
                  Análise de Consumo
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200"
                  onClick={() => setLocation('/terceiros/gerenciamento')}
                >
                  <Truck className="h-4 w-4" />
                  Gerenciamento Terceiros
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex items-center gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 relative"
                  onClick={() => setLocation('/painel-atendimento-saldo')}
                >
                  <MessageSquare className="h-4 w-4" />
                  Atendimento de Saldo
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-bold">
                        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                      </span>
                    </span>
                  )}
                </Button>
              </>
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

            <Button 
              onClick={() => handleExportVeloe(false)} 
              variant="outline" 
              className="flex items-center gap-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
              disabled={!startDate || !endDate}
              data-testid="button-export-veloe"
            >
              <Download className="h-4 w-4" />
              Veloe (Bases)
            </Button>

            <Button 
              onClick={() => handleExportVeloe(true)} 
              variant="outline" 
              className="flex items-center gap-2 bg-emerald-50 border-emerald-400 text-emerald-700 hover:bg-emerald-100"
              disabled={!startDate || !endDate}
              data-testid="button-export-veloe-linehall"
            >
              <Download className="h-4 w-4" />
              Veloe Line Haul
            </Button>

            <Button 
              onClick={() => handleExportTicket(false)} 
              variant="outline" 
              className="flex items-center gap-2 bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
              disabled={!startDate || !endDate}
              data-testid="button-export-ticket"
            >
              <Download className="h-4 w-4" />
              Ticket (Bases)
            </Button>

            <Button 
              onClick={() => handleExportTicket(true)} 
              variant="outline" 
              className="flex items-center gap-2 bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100"
              disabled={!startDate || !endDate}
              data-testid="button-export-ticket-linehall"
            >
              <Download className="h-4 w-4" />
              Ticket Line Haul
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
        
        {/* Informações de Paginação e Performance - OTIMIZAÇÃO */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance e Navegação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Informações de Paginação */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">Navegação</Label>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevPage} 
                    disabled={!hasPrevPage || loading}
                    className="px-3"
                  >
                    ←
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[100px] text-center">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextPage} 
                    disabled={!hasNextPage || loading}
                    className="px-3"
                  >
                    →
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Mostrando {solicitations.length} de {totalCount.toLocaleString()} registros
                </div>
              </div>

              {/* Itens por Página */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">Itens por Página</Label>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 registros</SelectItem>
                    <SelectItem value="100">100 registros</SelectItem>
                    <SelectItem value="200">200 registros</SelectItem>
                    <SelectItem value="500">500 registros</SelectItem>
                    <SelectItem value="1000">1000 registros</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500">
                  Páginas otimizadas para performance
                </div>
              </div>

              {/* Indicadores de Performance */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">Performance</Label>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Cache Ativo</span>
                  </div>
                  {loading && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-600">Carregando...</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {totalCount > 2000 ? 'Dados paginados' : 'Dataset completo'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                <Label htmlFor="date-filter">Data Solicitação</Label>
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
                <Label htmlFor="fuel-date-filter">Data Abastecimento</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="fuel-date-filter" 
                    type="date"
                    value={fuelDateFilter}
                    onChange={(e) => setFuelDateFilter(e.target.value)}
                    placeholder="dd/mm/aaaa"
                    data-testid="input-fuel-date-filter"
                    className="flex-1"
                  />
                  {fuelDateFilter && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDownloadByFuelDate}
                        className="whitespace-nowrap"
                        data-testid="button-download-fuel-date"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setFuelDateFilter('')}
                        data-testid="button-clear-fuel-date"
                      >
                        Limpar
                      </Button>
                    </>
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
                <Combobox
                  options={[
                    { value: 'all', label: 'Todas as Bases' },
                    ...getFilteredBases().map((base: { base_name: string, display_name: string }) => ({
                      value: base.base_name,
                      label: base.display_name
                    }))
                  ]}
                  value={baseFilter}
                  onChange={setBaseFilter}
                  placeholder="Todas as Bases"
                  emptyMessage="Nenhuma base encontrada."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario-filter">Horário Abastecimento</Label>
                <Select value={horarioFilter} onValueChange={setHorarioFilter}>
                  <SelectTrigger id="horario-filter" data-testid="select-horario-filter">
                    <SelectValue placeholder="Todos os Horários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Horários</SelectItem>
                    <SelectItem value="08:00">08:00</SelectItem>
                    <SelectItem value="10:00">10:00</SelectItem>
                    <SelectItem value="12:00">12:00</SelectItem>
                    <SelectItem value="14:00">14:00</SelectItem>
                    <SelectItem value="16:00">16:00</SelectItem>
                    <SelectItem value="Após 18h">Após 18h</SelectItem>
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
            {isLineHaulMode ? (
              /* Modo Line Haul - abas separadas por status */
              <TabsList className="grid w-auto grid-cols-3">
                <TabsTrigger value="linehaul_pendentes" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Pendentes ({lineHaulPendentes.length})
                </TabsTrigger>
                <TabsTrigger value="linehaul_atendidas" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Atendidas ({lineHaulAtendidas.length})
                </TabsTrigger>
                <TabsTrigger value="linehaul_negadas" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Negadas ({lineHaulNegadas.length})
                </TabsTrigger>
              </TabsList>
            ) : (
              /* Modo normal - todas as abas */
              <TabsList className="grid w-auto grid-cols-7">
                <TabsTrigger value="pendentes" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pendentes ({getPendingSolicitations().length})
                </TabsTrigger>
                <TabsTrigger value="atendidas" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Atendidas ({getCompletedSolicitations().length})
                </TabsTrigger>
                <TabsTrigger value="negadas" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Negadas ({deniedSolicitations.length})
                </TabsTrigger>
                <TabsTrigger value="linehaul" className={`flex items-center gap-2 ${
                  hasNewLineHallRequests ? 'animate-pulse bg-blue-100 border-blue-300' : ''
                }`}>
                  <Truck className="h-4 w-4" />
                  Line Haul ({getLineHallSolicitations().length})
                  {hasNewLineHallRequests && (
                    <div className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  )}
                </TabsTrigger>
                <TabsTrigger value="linehaul_pendentes" className="flex items-center gap-2 bg-orange-50">
                  <Clock className="h-4 w-4 text-orange-600" />
                  LH Pend ({lineHaulPendentes.length})
                </TabsTrigger>
                <TabsTrigger value="linehaul_atendidas" className="flex items-center gap-2 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  LH Atend ({lineHaulAtendidas.length})
                </TabsTrigger>
                <TabsTrigger value="linehaul_negadas" className="flex items-center gap-2 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  LH Neg ({lineHaulNegadas.length})
                </TabsTrigger>
              </TabsList>
            )}
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
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  {(() => {
                    const values = getValuesByCardType(getPendingSolicitations());
                    
                    return (
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(values.total)}
                        </div>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-green-600 font-medium">💳 Ticket:</span>
                            <span className="font-bold text-green-700">{formatCurrency(values.ticket)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-600 font-medium">💳 Veloe Go:</span>
                            <span className="font-bold text-purple-700">{formatCurrency(values.alelo)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Valor pendente de aprovação</p>
                      </div>
                    );
                  })()}
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
                        hasMultipleRequestsToday(solicitacao.placa, solicitacao.data_uso || solicitacao.data_solicitacao)
                          ? 'bg-red-50 border-red-300 border-l-4 border-l-red-500 shadow-md' // Destaque especial para repetições
                          : index < 5 
                            ? (solicitacao.status === 'Pendente' || solicitacao.status === 'pendente') 
                              ? 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-400' 
                              : 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-400'
                            : (solicitacao.status === 'Pendente' || solicitacao.status === 'pendente') 
                              ? 'bg-yellow-25 border-yellow-100' 
                              : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Placa e Indicador - 1 col */}
                        <div className="col-span-1">
                          <div className="flex items-center">
                            {index < 5 && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>}
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {solicitacao.placa}
                              </p>
                              <p className="text-xs text-gray-600">{solicitacao.tipo_combustivel || '-'}</p>
                              {hasMultipleRequestsToday(solicitacao.placa, solicitacao.data_uso || solicitacao.data_solicitacao) && (
                                <Badge variant="destructive" className="text-xs bg-red-500 text-white">
                                  {getDailyRequestCount(solicitacao.placa, solicitacao.data_uso || solicitacao.data_solicitacao)}x
                                </Badge>
                              )}
                              {solicitudeCounts[solicitacao.placa] > 1 && !hasMultipleRequestsToday(solicitacao.placa, solicitacao.data_uso || solicitacao.data_solicitacao) && (
                                <Badge variant="secondary" className="text-xs">
                                  {solicitudeCounts[solicitacao.placa]}x
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dados do Solicitante - 2 cols */}
                        <div className="col-span-2 border-2 border-red-500 bg-red-50 p-2 rounded h-full">
                          <p className="text-xs text-red-600 font-bold mb-1">👤 DADOS DO SOLICITANTE</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{solicitacao.solicitante || solicitacao.requested_by || 'Nome não informado'}</p>
                          <p className="text-xs text-gray-700 font-medium truncate">{solicitacao.telefone_celular || (solicitacao as any).driver_phone || 'Telefone não informado'}</p>
                        </div>

                        {/* Dados do Motorista do Veículo - 2 cols */}
                        <div className="col-span-2 border-2 border-blue-500 bg-blue-50 p-2 rounded h-full">
                          <p className="text-xs text-blue-600 font-bold mb-1">🚛 MOTORISTA DO VEÍCULO</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{solicitacao.motorista || (solicitacao as any).driver_name || 'Motorista não informado'}</p>
                          <p className="text-xs text-gray-700 font-medium">{formatCurrency(solicitacao.valor_solicitado)} - {solicitacao.km_total || solicitacao.km_veiculo || (solicitacao as any).km || '-'} km</p>
                        </div>

                        {/* Operação e Base - 1 col */}
                        <div className="col-span-1 text-center">
                          <Badge variant="outline" className={
                            solicitacao.origem_tipo === 'line_hall' 
                              ? "bg-blue-100 text-blue-800 mb-1" 
                              : "bg-green-100 text-green-800 mb-1"
                          }>
                            {solicitacao.origem_tipo === 'line_hall' ? 'Line Hall' : 'Tradicional'}
                          </Badge>
                          <p className="text-xs text-gray-500 truncate">{solicitacao.base || '-'}</p>
                        </div>

                        {/* Data de Abastecimento - 2 cols */}
                        <div className="col-span-2 border-2 border-orange-500 bg-orange-50 p-2 rounded h-full">
                          <p className="text-xs text-orange-600 font-bold mb-1">📅 DATA DE ABASTECIMENTO</p>
                          {solicitacao.data_uso ? (
                            <p className="text-sm font-bold text-orange-900">
                              {format(parseLocalDate(solicitacao.data_uso), 'dd/MM/yyyy', { locale: ptBR })}
                              {solicitacao.turno && ` - ${solicitacao.turno}`}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">Não informada</p>
                          )}
                        </div>

                        {/* Status - 1 col */}
                        <div className="col-span-1 text-center">
                          {getStatusBadge(solicitacao.status)}
                          <p className="text-xs text-gray-500 mt-1">{formatDate(solicitacao.created_at || solicitacao.data_solicitacao)}</p>
                          {solicitacao.horario_abastecimento && (
                            <p className="text-xs text-blue-600">Horário: {solicitacao.horario_abastecimento === 'antes_17h' ? 'Antes 17h' : solicitacao.horario_abastecimento === 'apos_18h' ? 'Após 18h' : solicitacao.horario_abastecimento}</p>
                          )}
                        </div>

                        {/* Ações - 2 cols */}
                        <div className="col-span-2 text-right">
                          <div className="flex gap-2">
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
                            
                            {/* Badge do Provedor do Cartão */}
                            {solicitacao.provedor_cartao && (
                              <Badge 
                                variant="outline"
                                className={
                                  solicitacao.provedor_cartao.toLowerCase().includes('veloe') 
                                    ? 'bg-purple-100 text-purple-700 border-purple-300 font-medium'
                                    : solicitacao.provedor_cartao.toLowerCase().includes('ticket')
                                      ? 'bg-green-100 text-green-700 border-green-300 font-medium'
                                      : 'bg-gray-100 text-gray-700 border-gray-300 font-medium'
                                }
                              >
                                💳 {solicitacao.provedor_cartao.toLowerCase().includes('veloe') ? 'Veloe' : 
                                    solicitacao.provedor_cartao.toLowerCase().includes('ticket') ? 'Ticket' : 
                                    solicitacao.provedor_cartao}
                              </Badge>
                            )}
                            
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
              {(() => {
                const values = getValuesByCardType(getCompletedSolicitations());
                
                return (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(values.total)}
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 font-medium">💳 Ticket:</span>
                        <span className="font-bold text-green-700">{formatCurrency(values.ticket)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-600 font-medium">💳 Veloe Go:</span>
                        <span className="font-bold text-purple-700">{formatCurrency(values.alelo)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Valor total das recargas aprovadas</p>
                  </div>
                );
              })()}
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
                      {getDailyRequestCount(solicitacao.placa, solicitacao.data_solicitacao) > 1 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-xs">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-semibold">ATENÇÃO:</span>
                            <span>Esta placa teve {getDailyRequestCount(solicitacao.placa, solicitacao.data_solicitacao)} solicitações no mesmo dia</span>
                            <span className="ml-auto font-mono">{solicitudeCounts[solicitacao.placa] || 0} total</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Placa */}
                        <div className="flex-shrink-0" style={{minWidth: '120px'}}>
                          <p className="font-medium text-lg">
                            {solicitacao.placa}
                            {solicitacao.tipo_combustivel && (
                              <span className="font-medium text-lg"> - {solicitacao.tipo_combustivel}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">Placa</p>
                        </div>

                        {/* Motorista */}
                        <div className="border-2 border-blue-500 bg-blue-50 p-2 rounded flex-shrink-0" style={{minWidth: '200px'}}>
                          <p className="text-xs text-blue-600 font-bold mb-1">🚛 MOTORISTA</p>
                          <p className="text-sm text-gray-900 truncate">{solicitacao.motorista || (solicitacao as any).nome_motorista || 'Motorista não informado'}</p>
                          <p className="text-xs text-gray-700 font-medium">{formatCurrency(solicitacao.valor_solicitado)} - {solicitacao.km_total || solicitacao.km_veiculo || (solicitacao as any).km || '-'} km</p>
                        </div>

                        {/* Operação e Base */}
                        <div className="flex-shrink-0" style={{minWidth: '120px'}}>
                          <Badge variant="outline" className={
                            solicitacao.origem_tipo === 'line_hall' 
                              ? "bg-blue-100 text-blue-800 mb-1" 
                              : "bg-green-100 text-green-800 mb-1"
                          }>
                            {solicitacao.origem_tipo === 'line_hall' ? 'Line Hall' : 'Tradicional'}
                          </Badge>
                          <p className="text-xs text-gray-500 truncate">{solicitacao.base || '-'}</p>
                        </div>

                        {/* Data de Abastecimento */}
                        <div className="border-2 border-orange-500 bg-orange-50 p-2 rounded flex-shrink-0" style={{minWidth: '160px'}}>
                          <p className="text-xs text-orange-600 font-bold mb-1">📅 DATA DE ABASTECIMENTO</p>
                          {solicitacao.data_uso ? (
                            <p className="text-sm font-bold text-orange-900">
                              {format(parseLocalDate(solicitacao.data_uso), 'dd/MM/yyyy', { locale: ptBR })}
                              {solicitacao.turno && ` - ${solicitacao.turno}`}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">Não informada</p>
                          )}
                        </div>

                        {/* Status e Data */}
                        <div className="flex-shrink-0">
                          {getStatusBadge(solicitacao.status)}
                          <p className="text-xs text-gray-500 mt-1">{formatDate(solicitacao.created_at || solicitacao.data_solicitacao)}</p>
                          {solicitacao.data_atendimento && (
                            <p className="text-xs text-green-600 font-medium">Atendido: {formatDate(solicitacao.data_atendimento).split(',')[0]}</p>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex-shrink-0 ml-auto">
                          <div className="flex gap-2">
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
                            
                            {/* Badge do Provedor do Cartão */}
                            {solicitacao.provedor_cartao && (
                              <Badge 
                                variant="outline"
                                className={
                                  solicitacao.provedor_cartao.toLowerCase().includes('veloe') 
                                    ? 'bg-purple-100 text-purple-700 border-purple-300 font-medium'
                                    : solicitacao.provedor_cartao.toLowerCase().includes('ticket')
                                      ? 'bg-green-100 text-green-700 border-green-300 font-medium'
                                      : 'bg-gray-100 text-gray-700 border-gray-300 font-medium'
                                }
                              >
                                💳 {solicitacao.provedor_cartao.toLowerCase().includes('veloe') ? 'Veloe' : 
                                    solicitacao.provedor_cartao.toLowerCase().includes('ticket') ? 'Ticket' : 
                                    solicitacao.provedor_cartao}
                              </Badge>
                            )}
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

      {/* Aba de Solicitações Negadas */}
      <TabsContent value="negadas" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Negadas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{deniedSolicitations.length}</div>
              <p className="text-xs text-muted-foreground">Solicitações negadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Negado</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {(() => {
                const values = getValuesByCardType(deniedSolicitations);
                
                return (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(values.total)}
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 font-medium">💳 Ticket:</span>
                        <span className="font-bold text-green-700">{formatCurrency(values.ticket)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-600 font-medium">💳 Veloe Go:</span>
                        <span className="font-bold text-purple-700">{formatCurrency(values.alelo)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Valor das solicitações negadas</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Rejeição</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(deniedSolicitations.length + getCompletedSolicitations().length) > 0 
                  ? Math.round((deniedSolicitations.length / (deniedSolicitations.length + getCompletedSolicitations().length)) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Percentual de negações</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Solicitações Negadas</CardTitle>
                <CardDescription>
                  Mostrando {deniedSolicitations.length} solicitações negadas
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
            ) : deniedSolicitations.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nenhuma solicitação negada encontrada.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[600px] overflow-y-auto">
                  {deniedSolicitations.map((solicitacao, index) => (
                    <div 
                      key={`${solicitacao.id}-${solicitacao.origem_tipo}-${index}`} 
                      className="p-4 rounded-lg border bg-red-50 border-red-200 border-l-4 border-l-red-500 transition-all duration-200 hover:shadow-md"
                    >
                      {getDailyRequestCount(solicitacao.placa, solicitacao.data_solicitacao) > 1 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-xs">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-semibold">ATENÇÃO:</span>
                            <span>Esta placa teve {getDailyRequestCount(solicitacao.placa, solicitacao.data_solicitacao)} solicitações no mesmo dia</span>
                            <span className="ml-auto font-mono">{solicitudeCounts[solicitacao.placa] || 0} total</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Placa */}
                        <div className="flex-shrink-0" style={{minWidth: '120px'}}>
                          <p className="font-medium text-lg">
                            {solicitacao.placa}
                            {solicitacao.tipo_combustivel && (
                              <span className="font-medium text-lg"> - {solicitacao.tipo_combustivel}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">Placa</p>
                        </div>

                        {/* Motorista */}
                        <div className="border-2 border-blue-500 bg-blue-50 p-2 rounded flex-shrink-0" style={{minWidth: '200px'}}>
                          <p className="text-xs text-blue-600 font-bold mb-1">🚛 MOTORISTA</p>
                          <p className="text-sm text-gray-900 truncate">{solicitacao.motorista || (solicitacao as any).nome_motorista || 'Motorista não informado'}</p>
                          <p className="text-xs text-gray-700 font-medium">{formatCurrency(solicitacao.valor_solicitado)} - {solicitacao.km_total || solicitacao.km_veiculo || (solicitacao as any).km || '-'} km</p>
                        </div>

                        {/* Operação e Base */}
                        <div className="flex-shrink-0" style={{minWidth: '120px'}}>
                          <Badge variant="outline" className={
                            solicitacao.origem_tipo === 'line_hall' 
                              ? "bg-blue-100 text-blue-800 mb-1" 
                              : "bg-green-100 text-green-800 mb-1"
                          }>
                            {solicitacao.origem_tipo === 'line_hall' ? 'Line Hall' : 'Tradicional'}
                          </Badge>
                          <p className="text-xs text-gray-500 truncate">{solicitacao.base || '-'}</p>
                        </div>

                        {/* Data de Abastecimento */}
                        <div className="border-2 border-orange-500 bg-orange-50 p-2 rounded flex-shrink-0" style={{minWidth: '160px'}}>
                          <p className="text-xs text-orange-600 font-bold mb-1">📅 DATA DE ABASTECIMENTO</p>
                          {solicitacao.data_uso ? (
                            <p className="text-sm font-bold text-orange-900">
                              {format(parseLocalDate(solicitacao.data_uso), 'dd/MM/yyyy', { locale: ptBR })}
                              {solicitacao.turno && ` - ${solicitacao.turno}`}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">Não informada</p>
                          )}
                        </div>

                        {/* Status e Data */}
                        <div className="flex-shrink-0">
                          {getStatusBadge(solicitacao.status)}
                          <p className="text-xs text-gray-500 mt-1">{formatDate(solicitacao.created_at || solicitacao.data_solicitacao)}</p>
                          {solicitacao.data_atendimento && (
                            <p className="text-xs text-red-600 font-medium">Negado: {formatDate(solicitacao.data_atendimento).split(',')[0]}</p>
                          )}
                        </div>

                        {/* Motivo de Negação */}
                        {solicitacao.motivo_negacao && (
                          <div className="flex-1 min-w-[200px]">
                            <div className="p-2 bg-red-100 border border-red-300 rounded">
                              <p className="text-xs text-red-700 font-bold mb-1">MOTIVO DA NEGAÇÃO:</p>
                              <p className="text-sm text-red-900">{solicitacao.motivo_negacao}</p>
                            </div>
                          </div>
                        )}

                        {/* Ações */}
                        <div className="flex-shrink-0 ml-auto">
                          <div className="flex gap-2">
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
                              <History className="h-3 w-3" />
                            </Button>
                            
                            {(user?.role === 'admin' || user?.role === 'gestor_combustivel') && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteSolicitation(solicitacao)}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Excluir solicitação"
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
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Aba de Solicitações Line Haul */}
      <TabsContent value="linehaul" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Line Haul</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{getLineHallSolicitations().length}</div>
              <p className="text-xs text-muted-foreground">Solicitações do Line Haul</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Pendente</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {(() => {
                const values = getValuesByCardType(lineHaulPendentes);
                return (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(values.total)}
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-600 font-medium">Ticket:</span>
                        <span className="font-bold text-orange-700">{formatCurrency(values.ticket)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 font-medium">Veloe Go:</span>
                        <span className="font-bold text-green-700">{formatCurrency(values.veloeGo)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Valor pendente de aprovação</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes Line Haul</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {lineHaulPendentes.length}
              </div>
              <p className="text-xs text-muted-foreground">Aguardando processamento</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Solicitações Line Haul Pendentes</CardTitle>
                <CardDescription>
                  Mostrando {lineHaulPendentes.length} solicitações pendentes do Line Haul
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
            ) : lineHaulPendentes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nenhuma solicitação pendente do Line Haul.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[600px] overflow-y-auto">
                  {lineHaulPendentes.map((solicitacao, index) => (
                    <div 
                      key={`${solicitacao.id}-${solicitacao.origem_tipo}-${index}`} 
                      className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md bg-blue-50 border-blue-200 border-l-4 border-l-blue-500"
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
                          <p className="text-sm text-gray-600">{solicitacao.motorista || 'Motorista não informado'}</p>
                          <p className="text-xs text-gray-700 font-medium">{formatCurrency(solicitacao.valor_calculado || solicitacao.valor_solicitado)} - {solicitacao.km_total || '-'} km</p>
                          {solicitacao.rota_origem && solicitacao.rota_destino && (
                            <p className="text-xs text-blue-600">
                              {solicitacao.rota_origem} → {solicitacao.rota_destino}
                            </p>
                          )}
                        </div>

                        {/* Operação e Base */}
                        <div className="lg:col-span-2">
                          <div className="flex flex-wrap gap-1 mb-1">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Line Haul
                            </Badge>
                            {solicitacao.provedor_cartao && (
                              <Badge 
                                variant="outline" 
                                className={solicitacao.provedor_cartao?.toLowerCase().includes('veloe') 
                                  ? 'bg-green-100 text-green-800 border-green-300' 
                                  : 'bg-orange-100 text-orange-800 border-orange-300'}
                              >
                                {solicitacao.provedor_cartao?.toLowerCase().includes('veloe') ? 'Veloe' : 'Ticket'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{solicitacao.base || '-'}</p>
                          {solicitacao.veiculo_modelo && (
                            <p className="text-xs text-gray-600">{solicitacao.veiculo_modelo}</p>
                          )}
                        </div>

                        {/* Status e Data */}
                        <div className="lg:col-span-2">
                          {getStatusBadge(solicitacao.status)}
                          <p className="text-xs text-gray-500 mt-1">{formatDate(solicitacao.created_at || solicitacao.data_solicitacao)}</p>
                          {solicitacao.data_atendimento && (
                            <p className="text-xs text-green-600 font-medium">Atendido: {formatDate(solicitacao.data_atendimento).split(',')[0]}</p>
                          )}
                          {solicitacao.horario_abastecimento && (
                            <p className="text-xs text-blue-600">Horário: {solicitacao.horario_abastecimento}</p>
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
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Visualizar
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewFuelHistory(solicitacao.placa)}
                              className="text-xs"
                            >
                              <History className="w-3 h-3 mr-1" />
                              Histórico
                            </Button>
                            
                            {/* Botão WhatsApp para avisar saldo no cartão - Line Haul */}
                            <LineHaulWhatsAppButton 
                              solicitation={solicitacao}
                              variant="outline"
                              size="sm"
                            />
                            
                            {/* Botão Excluir - apenas para admin */}
                            {user?.role === 'admin' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteSolicitation(solicitacao)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Excluir solicitação"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Informações Adicionais do Line Haul */}
                        {solicitacao.calculo_detalhes && (
                          <div className="lg:col-span-12 mt-4 p-3 bg-gray-50 rounded">
                            <div className="text-xs text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div><strong>KM Rota:</strong> {solicitacao.calculo_detalhes.km_rota}</div>
                              <div><strong>KM Acréscimo:</strong> {solicitacao.calculo_detalhes.km_acrescimo}</div>
                              <div><strong>Consumo Médio:</strong> {solicitacao.calculo_detalhes.consumo_medio}</div>
                              <div><strong>Litros:</strong> {solicitacao.calculo_detalhes.litros_necessarios}</div>
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
      </TabsContent>

      {/* Abas separadas Line Haul - Pendentes */}
      <TabsContent value="linehaul_pendentes" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes Line Haul</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lineHaulPendentes.length}</div>
              <p className="text-xs text-muted-foreground">Aguardando processamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Pendente</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {(() => {
                const values = getValuesByCardType(lineHaulPendentes);
                return (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(values.total)}
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-600 font-medium">Ticket:</span>
                        <span className="font-bold text-orange-700">{formatCurrency(values.ticket)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 font-medium">Veloe Go:</span>
                        <span className="font-bold text-green-700">{formatCurrency(values.veloeGo)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Valor pendente de aprovação</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Line Haul</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{lineHaulSolicitations.length}</div>
              <p className="text-xs text-muted-foreground">Todas as solicitações</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Solicitações Pendentes - Line Haul</CardTitle>
                <CardDescription>Mostrando {lineHaulPendentes.length} solicitações pendentes</CardDescription>
              </div>
              <Button onClick={fetchSolicitations} variant="outline" size="sm">Atualizar</Button>
            </div>
          </CardHeader>
          <CardContent>
            {lineHaulPendentes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">Nenhuma solicitação pendente.</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {lineHaulPendentes.map((solicitacao, index) => (
                  <div key={`${solicitacao.id}-pending-${index}`} className="p-4 rounded-lg border bg-orange-50 border-orange-200 border-l-4 border-l-orange-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      <div className="lg:col-span-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg">{solicitacao.placa}</p>
                          {repeatedPlacasLineHaul.has(solicitacao.placa) && (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 animate-pulse">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Repetida Hoje
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{solicitacao.motorista || 'Motorista não informado'}</p>
                        <p className="text-xs text-gray-700 font-medium">{formatCurrency(solicitacao.valor_calculado || solicitacao.valor_solicitado)} - {solicitacao.km_total || '-'} km</p>
                        {solicitacao.rota_origem && solicitacao.rota_destino && (
                          <p className="text-xs text-blue-600">{solicitacao.rota_origem} → {solicitacao.rota_destino}</p>
                        )}
                      </div>
                      <div className="lg:col-span-2">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">Line Haul</Badge>
                          {solicitacao.provedor_cartao && (
                            <Badge variant="outline" className={solicitacao.provedor_cartao?.toLowerCase().includes('veloe') ? 'bg-green-100 text-green-800 border-green-300' : 'bg-orange-100 text-orange-800 border-orange-300'}>
                              {solicitacao.provedor_cartao?.toLowerCase().includes('veloe') ? 'Veloe' : 'Ticket'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{solicitacao.veiculo_modelo || '-'}</p>
                      </div>
                      <div className="lg:col-span-2">
                        {getStatusBadge(solicitacao.status)}
                        <p className="text-xs text-gray-500 mt-1">{formatDate(solicitacao.created_at || solicitacao.data_solicitacao)}</p>
                        {solicitacao.horario_abastecimento && (
                          <p className="text-xs text-blue-600">Horário: {solicitacao.horario_abastecimento}</p>
                        )}
                      </div>
                      <div className="lg:col-span-5">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenSolicitation(solicitacao)} className="text-xs">Visualizar</Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewFuelHistory(solicitacao.placa)} className="text-xs"><History className="w-3 h-3 mr-1" />Histórico</Button>
                          <LineHaulWhatsAppButton solicitation={solicitacao} variant="outline" size="sm" />
                          {user?.role === 'admin' && (
                            <Button variant="outline" size="sm" onClick={() => handleDeleteSolicitation(solicitacao)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-3 w-3" /></Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Abas separadas Line Haul - Atendidas */}
      <TabsContent value="linehaul_atendidas" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atendidas Line Haul</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{lineHaulAtendidas.length}</div>
              <p className="text-xs text-muted-foreground">Recargas efetuadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Atendido</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {(() => {
                const values = getValuesByCardType(lineHaulAtendidas);
                return (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(values.total)}
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-600 font-medium">Ticket:</span>
                        <span className="font-bold text-orange-700">{formatCurrency(values.ticket)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 font-medium">Veloe Go:</span>
                        <span className="font-bold text-green-700">{formatCurrency(values.veloeGo)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Valor das recargas</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Line Haul</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{lineHaulSolicitations.length}</div>
              <p className="text-xs text-muted-foreground">Todas as solicitações</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Solicitações Atendidas - Line Haul</CardTitle>
                <CardDescription>Mostrando {lineHaulAtendidas.length} solicitações atendidas</CardDescription>
              </div>
              <Button onClick={fetchSolicitations} variant="outline" size="sm">Atualizar</Button>
            </div>
          </CardHeader>
          <CardContent>
            {lineHaulAtendidas.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">Nenhuma solicitação atendida.</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {lineHaulAtendidas.map((solicitacao, index) => (
                  <div key={`${solicitacao.id}-attended-${index}`} className="p-4 rounded-lg border bg-green-50 border-green-200 border-l-4 border-l-green-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      <div className="lg:col-span-3">
                        <p className="font-medium text-lg">{solicitacao.placa}</p>
                        <p className="text-sm text-gray-600">{solicitacao.motorista || 'Motorista não informado'}</p>
                        <p className="text-xs text-gray-700 font-medium">{formatCurrency(solicitacao.valor_calculado || solicitacao.valor_solicitado)} - {solicitacao.km_total || '-'} km</p>
                      </div>
                      <div className="lg:col-span-2">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <Badge variant="outline" className="bg-green-100 text-green-800">Atendida</Badge>
                          {solicitacao.provedor_cartao && (
                            <Badge variant="outline" className={solicitacao.provedor_cartao?.toLowerCase().includes('veloe') ? 'bg-green-100 text-green-800 border-green-300' : 'bg-orange-100 text-orange-800 border-orange-300'}>
                              {solicitacao.provedor_cartao?.toLowerCase().includes('veloe') ? 'Veloe' : 'Ticket'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{solicitacao.veiculo_modelo || '-'}</p>
                      </div>
                      <div className="lg:col-span-2">
                        {getStatusBadge(solicitacao.status)}
                        <p className="text-xs text-gray-500 mt-1">{formatDate(solicitacao.created_at || solicitacao.data_solicitacao)}</p>
                        {solicitacao.data_atendimento && (
                          <p className="text-xs text-green-600 font-medium">Atendido: {formatDate(solicitacao.data_atendimento).split(',')[0]}</p>
                        )}
                      </div>
                      <div className="lg:col-span-5">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenSolicitation(solicitacao)} className="text-xs">Visualizar</Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewFuelHistory(solicitacao.placa)} className="text-xs"><History className="w-3 h-3 mr-1" />Histórico</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Abas separadas Line Haul - Negadas */}
      <TabsContent value="linehaul_negadas" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negadas Line Haul</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lineHaulNegadas.length}</div>
              <p className="text-xs text-muted-foreground">Solicitações negadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Negado</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(getTotalValue(lineHaulNegadas))}</div>
              <p className="text-xs text-muted-foreground">Valor das negações</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Line Haul</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{lineHaulSolicitations.length}</div>
              <p className="text-xs text-muted-foreground">Todas as solicitações</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Solicitações Negadas - Line Haul</CardTitle>
                <CardDescription>Mostrando {lineHaulNegadas.length} solicitações negadas</CardDescription>
              </div>
              <Button onClick={fetchSolicitations} variant="outline" size="sm">Atualizar</Button>
            </div>
          </CardHeader>
          <CardContent>
            {lineHaulNegadas.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">Nenhuma solicitação negada.</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {lineHaulNegadas.map((solicitacao, index) => (
                  <div key={`${solicitacao.id}-denied-${index}`} className="p-4 rounded-lg border bg-red-50 border-red-200 border-l-4 border-l-red-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      <div className="lg:col-span-3">
                        <p className="font-medium text-lg">{solicitacao.placa}</p>
                        <p className="text-sm text-gray-600">{solicitacao.motorista || 'Motorista não informado'}</p>
                        <p className="text-xs text-gray-700 font-medium">{formatCurrency(solicitacao.valor_calculado || solicitacao.valor_solicitado)} - {solicitacao.km_total || '-'} km</p>
                      </div>
                      <div className="lg:col-span-2">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <Badge variant="outline" className="bg-red-100 text-red-800">Negada</Badge>
                          {solicitacao.provedor_cartao && (
                            <Badge variant="outline" className={solicitacao.provedor_cartao?.toLowerCase().includes('veloe') ? 'bg-green-100 text-green-800 border-green-300' : 'bg-orange-100 text-orange-800 border-orange-300'}>
                              {solicitacao.provedor_cartao?.toLowerCase().includes('veloe') ? 'Veloe' : 'Ticket'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{solicitacao.veiculo_modelo || '-'}</p>
                      </div>
                      <div className="lg:col-span-2">
                        {getStatusBadge(solicitacao.status)}
                        <p className="text-xs text-gray-500 mt-1">{formatDate(solicitacao.created_at || solicitacao.data_solicitacao)}</p>
                        {solicitacao.motivo_negacao && (
                          <p className="text-xs text-red-600 font-medium">Motivo: {solicitacao.motivo_negacao}</p>
                        )}
                      </div>
                      <div className="lg:col-span-5">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenSolicitation(solicitacao)} className="text-xs">Visualizar</Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewFuelHistory(solicitacao.placa)} className="text-xs"><History className="w-3 h-3 mr-1" />Histórico</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                  
                  {/* Provedor de Cartão (Ticket ou Veloe Go) */}
                  {selectedSolicitation.provedor_cartao && (
                    <div>
                      <Label>Provedor de Cartão</Label>
                      <div className={`text-lg font-bold p-3 rounded border-2 ${
                        selectedSolicitation.provedor_cartao?.toLowerCase() === 'ticket' 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : 'bg-purple-100 text-purple-800 border-purple-300'
                      }`}>
                        {selectedSolicitation.provedor_cartao?.toLowerCase() === 'ticket' ? '💳 TICKET' : '💳 VELOE GO'}
                      </div>
                    </div>
                  )}
                  
                  {(selectedSolicitation.placa_cartao || selectedSolicitation.numero_cartao || selectedSolicitation.cartao_combustivel) && (
                    <div>
                      <Label>Placa do Cartão de Combustível</Label>
                      <div className="text-lg font-medium font-mono bg-blue-50 p-2 rounded border border-blue-200">
                        <CreditCard className="inline mr-2 h-4 w-4 text-blue-600" />
                        {selectedSolicitation.placa_cartao || selectedSolicitation.numero_cartao || selectedSolicitation.cartao_combustivel}
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
                  
                  {/* Seção de Fotos (Line Haul) */}
                  {(selectedSolicitation.foto_painel_path || selectedSolicitation.foto_cartao_path) && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <Label className="text-purple-800 font-semibold flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Fotos Anexadas
                      </Label>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedSolicitation.foto_painel_path && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-purple-700">Foto do Painel:</p>
                            <a 
                              href={selectedSolicitation.foto_painel_path.startsWith('/') || selectedSolicitation.foto_painel_path.startsWith('http') ? selectedSolicitation.foto_painel_path : `/${selectedSolicitation.foto_painel_path}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img 
                                src={selectedSolicitation.foto_painel_path.startsWith('/') || selectedSolicitation.foto_painel_path.startsWith('http') ? selectedSolicitation.foto_painel_path : `/${selectedSolicitation.foto_painel_path}`} 
                                alt="Foto do Painel" 
                                className="w-full h-40 object-cover rounded-lg border border-purple-300 hover:opacity-80 transition-opacity cursor-pointer"
                                onError={(e) => { 
                                  const img = e.target as HTMLImageElement;
                                  const parent = img.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-40 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300 text-gray-500 text-sm">Foto não disponível</div>';
                                  }
                                }}
                              />
                            </a>
                          </div>
                        )}
                        {selectedSolicitation.foto_cartao_path && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-purple-700">Foto do Cartão:</p>
                            <a 
                              href={selectedSolicitation.foto_cartao_path.startsWith('/') || selectedSolicitation.foto_cartao_path.startsWith('http') ? selectedSolicitation.foto_cartao_path : `/${selectedSolicitation.foto_cartao_path}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img 
                                src={selectedSolicitation.foto_cartao_path.startsWith('/') || selectedSolicitation.foto_cartao_path.startsWith('http') ? selectedSolicitation.foto_cartao_path : `/${selectedSolicitation.foto_cartao_path}`} 
                                alt="Foto do Cartão" 
                                className="w-full h-40 object-cover rounded-lg border border-purple-300 hover:opacity-80 transition-opacity cursor-pointer"
                                onError={(e) => { 
                                  const img = e.target as HTMLImageElement;
                                  const parent = img.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-40 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300 text-gray-500 text-sm">Foto não disponível</div>';
                                  }
                                }}
                              />
                            </a>
                          </div>
                        )}
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
                  
                  {/* Seção de Controle de Status - Sempre visível pois página já é protegida */}
                  {true && (
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                      <h3 className="font-semibold text-lg text-gray-900">Controle de Status</h3>
                      
                      {/* Verificar se o status já é final (Recarga Efetuada ou Negado) */}
                      {(selectedSolicitation.status === 'Recarga Efetuada' || selectedSolicitation.status === 'Negado') ? (
                        <div className="space-y-3">
                          {/* Status bloqueado - exibir apenas informação */}
                          <div className={`p-4 rounded-lg border-2 ${selectedSolicitation.status === 'Negado' ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {selectedSolicitation.status === 'Negado' ? (
                                <span className="text-red-700 font-semibold">🔴 Status: Negado</span>
                              ) : (
                                <span className="text-green-700 font-semibold">🟢 Status: Recarga Efetuada</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              O status desta solicitação já foi definido e não pode mais ser alterado.
                            </p>
                          </div>
                          
                          {/* Exibir motivo de negação se existir */}
                          {selectedSolicitation.motivo_negacao && (
                            <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-md">
                              <Label className="text-sm font-medium text-red-700">Motivo da Negação Registrado</Label>
                              <p className="text-sm text-red-900">{selectedSolicitation.motivo_negacao}</p>
                            </div>
                          )}
                          
                          {/* Botões WhatsApp disponíveis */}
                          <div className="flex gap-2 justify-end">
                            {/* Botão Z-API - Resposta Automática via WhatsApp */}
                            {selectedSolicitation.telefone_celular && (
                              <TwilioWhatsAppButton
                                phone={selectedSolicitation.telefone_celular}
                                placa={selectedSolicitation.placa}
                                motorista={selectedSolicitation.motorista}
                                valorSolicitado={selectedSolicitation.valor_solicitado}
                                status={selectedSolicitation.status === 'Negado' ? 'negado' : 'aprovado'}
                                observacoes={selectedSolicitation.motivo_negacao}
                                provedor={selectedSolicitation.provedor_cartao}
                                dataUso={selectedSolicitation.data_abastecimento}
                                size="lg"
                                className="px-4"
                              />
                            )}
                            
                            {/* Botão WhatsApp Manual (backup) */}
                            {selectedSolicitation.origem_tipo === 'line_hall' ? (
                              <LineHaulWhatsAppButton 
                                solicitation={selectedSolicitation}
                                variant="outline"
                                size="lg"
                                className="px-4"
                              />
                            ) : (
                              <WhatsAppResponseButton 
                                solicitation={selectedSolicitation}
                                variant="outline"
                                size="lg"
                                className="px-4"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
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
                          
                          {/* Campo de Motivo da Negação - aparece quando status for "Negado" */}
                          {editedStatus === 'Negado' && (
                            <div className="space-y-2">
                              <Label htmlFor="motivo-negacao" className="text-sm font-medium text-red-700">
                                Motivo da Negação *
                              </Label>
                              <textarea
                                id="motivo-negacao"
                                value={motivoNegacao}
                                onChange={(e) => setMotivoNegacao(e.target.value)}
                                className="w-full min-h-[100px] p-3 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                                placeholder="Descreva o motivo da negação desta solicitação..."
                              />
                              <p className="text-xs text-red-600">* Campo obrigatório para negação</p>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleStatusUpdate} 
                              className="flex-1 bg-blue-600 hover:bg-blue-700" 
                              disabled={updatingStatus || editedStatus === selectedSolicitation.status}
                              size="lg"
                            >
                              {updatingStatus ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                            
                            {/* Botão Z-API - Resposta Automática via WhatsApp */}
                            {selectedSolicitation.telefone_celular && (
                              <TwilioWhatsAppButton
                                phone={selectedSolicitation.telefone_celular}
                                placa={selectedSolicitation.placa}
                                motorista={selectedSolicitation.motorista}
                                valorSolicitado={selectedSolicitation.valor_solicitado}
                                status={editedStatus === 'Negado' ? 'negado' : 'aprovado'}
                                observacoes={motivoNegacao}
                                provedor={selectedSolicitation.provedor_cartao}
                                dataUso={selectedSolicitation.data_abastecimento}
                                size="lg"
                                className="px-4"
                              />
                            )}
                            
                            {/* Botão WhatsApp Manual (backup) */}
                            {selectedSolicitation.origem_tipo === 'line_hall' ? (
                              <LineHaulWhatsAppButton 
                                solicitation={selectedSolicitation}
                                variant="outline"
                                size="lg"
                                className="px-4"
                              />
                            ) : (
                              <WhatsAppResponseButton 
                                solicitation={selectedSolicitation}
                                variant="outline"
                                size="lg"
                                className="px-4"
                              />
                            )}
                          </div>
                        </div>
                      )}
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
        <Dialog 
          open={historyModalOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setHistoryModalOpen(false);
              setLoadingHistory(false);
              setFuelHistory([]);
              setSelectedPlaca('');
            }
          }}
        >
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
                                  (item.status === 'Pendente' || item.status === 'pendente') ? 'bg-yellow-100 text-yellow-800' :
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
                        <div className={`grid grid-cols-1 gap-4 ${isCardRequest ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
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
                              {isCardRequest ? 'Quilometragem' : 'Quilometragem'}
                            </Label>
                            <div className="font-medium">
                              {isCardRequest 
                                ? (item.km_total || item.km_veiculo || item.km || 'Não informado')
                                : (item.km_atual || item.km_veiculo || 'Não informado')
                              }
                            </div>
                          </div>

                          {/* Nova coluna para Base/Projeto nas solicitações */}
                          {isCardRequest && (
                            <div>
                              <Label className="text-xs text-gray-500">Base/Projeto</Label>
                              <div className="font-medium">
                                {item.base || 'Não informado'}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Rota Line Haul - mostrar para todas solicitações de recarga Line Haul */}
                        {isCardRequest && item.origem_tipo === 'line_hall' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500">Rota:</span>
                              <span className="font-medium text-blue-600">
                                {item.rota_origem || 'Não informado'} → {item.rota_destino || 'Não informado'}
                              </span>
                            </div>
                          </div>
                        )}

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
        
        {/* Modal de WhatsApp em Lote */}
        <Dialog open={batchWhatsAppDialogOpen} onOpenChange={setBatchWhatsAppDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-green-700">
                <CheckCircle2 className="h-6 w-6 mr-2" />
                Notificação WhatsApp - Aprovação em Lote
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Resumo das aprovações */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  ✅ {approvedBatchSolicitations.length} solicitações aprovadas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {approvedBatchSolicitations.map((sol, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <span className="font-medium text-green-700">{sol.placa}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Input de telefone */}
              <div className="space-y-2">
                <Label htmlFor="gestor-phone" className="flex items-center">
                  📱 Telefone do Gestor/Responsável *
                </Label>
                <Input
                  id="gestor-phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={gestorPhone}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cleanValue = value.replace(/[^\d\(\)\s\-]/g, '');
                    setGestorPhone(cleanValue);
                  }}
                  className="font-mono"
                  data-testid="input-gestor-phone-batch"
                />
                <p className="text-xs text-gray-500">
                  Formato: (11) 99999-9999 ou 11999999999
                </p>
              </div>
              
              {/* Preview da mensagem */}
              <div className="space-y-2">
                <Label htmlFor="batch-message">Mensagem (pré-visualização)</Label>
                <Textarea
                  id="batch-message"
                  value={batchWhatsAppMessage}
                  onChange={(e) => setBatchWhatsAppMessage(e.target.value)}
                  rows={12}
                  className="resize-none font-mono text-sm"
                  data-testid="textarea-batch-message"
                />
                <p className="text-xs text-gray-500">
                  Você pode editar a mensagem antes de enviar
                </p>
              </div>
              
              {/* Botões de ação */}
              <div className="flex justify-between gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBatchWhatsAppDialogOpen(false);
                    setGestorPhone('');
                  }}
                  className="flex-1"
                  data-testid="button-cancel-batch-whatsapp"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSendBatchWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-send-batch-whatsapp"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Enviar WhatsApp
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default FuelCardRequestsPanel;