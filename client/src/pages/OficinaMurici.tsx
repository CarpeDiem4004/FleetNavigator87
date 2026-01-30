import React, { useState, useEffect } from 'react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, Plus, Search, FileEdit, Trash2, Download as FileDownload, Upload as FileUp, Calendar, Truck, Wrench as Tool, Clock, CheckCircle, AlertCircle, XCircle, Printer } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase-compat';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import * as XLSX from 'xlsx';
import SeletorPecasEstoque from '@/components/SeletorPecasEstoque';

// Função para formatar moeda brasileira
const formatCurrency = (value: number | string): string => {
  const numberValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

// Interface para a manutenção
interface Manutencao {
  id?: number;
  placa: string;
  km: number;
  prazo: string;
  descricao_manutencao: string;
  status: 'em_andamento' | 'aguardando_peca' | 'finalizado';
  mecanico: string;
  data_hora_inicio?: string;
  data_hora_fim?: string;
  custo_total?: number;
  observacoes?: string;
  peças_utilizadas?: string;
  // Campos de oficina parceira
  mechanic_name?: string;
  used_partner_workshop?: boolean;
  partner_workshop_name?: string;
  labor_cost?: number;
  // Campos específicos para "Aguardando Peça"
  pendingPartDescription?: string;
  pendingPartValue?: string;
  pendingPartSupplier?: string;
  pendingPartPhone?: string;
  pendingPartDeadline?: string;
  peca_descricao?: string;
  peca_valor?: number;
  fornecedor_nome?: string;
  fornecedor_telefone?: string;
  prazo_entrega?: string;
}

const statusOptions = [
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'aguardando_peca', label: 'Aguardando Peça', color: 'bg-blue-100 text-blue-800' },
  { value: 'finalizado', label: 'Finalizado', color: 'bg-green-100 text-green-800' }
];

// Interface para OS recebidas do time de manutenção
interface OSRecebida {
  id: number;
  placa: string;
  base_origem: string;
  urgencia: string;
  relato_problema: string;
  odometro: number;
  oficina_direcionada: string;
  data_agendamento: string;
  hora_agendamento: string;
  instrucoes: string;
  observacoes: string;
  status: string;
  created_at: string;
  telefone_contato?: string;
}

const OficinaMurici: React.FC = () => {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [osRecebidas, setOsRecebidas] = useState<OSRecebida[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusOriginal, setStatusOriginal] = useState<string | null>(null);
  
  // Estados para edição de OS recebida
  const [isOsEditDialogOpen, setIsOsEditDialogOpen] = useState(false);
  const [currentOsEdit, setCurrentOsEdit] = useState<OSRecebida | null>(null);
  const [osEditForm, setOsEditForm] = useState({
    status_manutencao: 'em_andamento',
    pecas_utilizadas: '',
    valor_pecas: '',
    valor_mao_obra: '',
    mecanico_responsavel: '',
    observacoes_oficina: '',
    data_finalizacao: ''
  });
  
  // Lista de peças individuais
  const [pecasLista, setPecasLista] = useState<{nome: string; valor: string}[]>([]);
  
  // Hook de autenticação para verificar permissões
  const { user } = useAuth();
  const [currentManutencao, setCurrentManutencao] = useState<Manutencao>({
    placa: '',
    km: 0,
    prazo: new Date().toISOString().split('T')[0],
    descricao_manutencao: '',
    status: 'em_andamento',
    mecanico: '',
    custo_total: 0
  });

  // Estado para controlar as peças selecionadas do estoque
  const [pecasSelecionadas, setPecasSelecionadas] = useState<any[]>([]);
  
  const { toast } = useToast();
  
  // Carregar dados da API e preencher datas de finalização ausentes
  useEffect(() => {
    backfillDataFinalizacao();
    fetchManutencoes();
    fetchOsRecebidas();
  }, []);

  // Buscar OS direcionadas para Oficina Murici
  const fetchOsRecebidas = async () => {
    try {
      const response = await fetch('/api/maintenance-requests');
      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas OS direcionadas para Oficina Murici
        const osMurici = (data.data || []).filter((os: OSRecebida) => 
          os.oficina_direcionada && os.oficina_direcionada.toLowerCase().includes('murici')
        );
        setOsRecebidas(osMurici);
      }
    } catch (error) {
      console.error('Erro ao carregar OS recebidas:', error);
    }
  };

  // Abrir modal de edição de OS recebida
  const handleEditOsRecebida = (os: OSRecebida) => {
    setCurrentOsEdit(os);
    const osAny = os as any;
    
    // Carregar peças existentes do texto
    const pecasExistentes: {nome: string; valor: string}[] = [];
    if (osAny.pecas_utilizadas) {
      const linhas = osAny.pecas_utilizadas.split('\n');
      linhas.forEach((linha: string) => {
        const match = linha.match(/^(.+?)\s*-\s*R\$\s*([\d.,]+)/);
        if (match) {
          pecasExistentes.push({ nome: match[1].trim(), valor: match[2].replace(',', '.') });
        }
      });
    }
    setPecasLista(pecasExistentes.length > 0 ? pecasExistentes : []);
    
    setOsEditForm({
      status_manutencao: osAny.status_manutencao || 'em_andamento',
      pecas_utilizadas: osAny.pecas_utilizadas || '',
      valor_pecas: osAny.valor_pecas?.toString() || '',
      valor_mao_obra: osAny.valor_mao_obra?.toString() || '',
      mecanico_responsavel: osAny.mecanico_responsavel || '',
      observacoes_oficina: osAny.observacoes_oficina || '',
      data_finalizacao: osAny.data_finalizacao || ''
    });
    setIsOsEditDialogOpen(true);
  };

  // Adicionar nova peça à lista
  const handleAddPeca = () => {
    setPecasLista(prev => [...prev, { nome: '', valor: '' }]);
  };

  // Remover peça da lista
  const handleRemovePeca = (index: number) => {
    setPecasLista(prev => prev.filter((_, i) => i !== index));
  };

  // Atualizar peça na lista
  const handleUpdatePeca = (index: number, field: 'nome' | 'valor', value: string) => {
    setPecasLista(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  // Calcular valor total das peças
  const calcularTotalPecas = () => {
    return pecasLista.reduce((total, p) => total + (parseFloat(p.valor) || 0), 0);
  };

  // Salvar edição de OS recebida
  const handleSaveOsEdit = async () => {
    if (!currentOsEdit) return;

    // Formatar lista de peças como texto
    const pecasTexto = pecasLista
      .filter(p => p.nome.trim())
      .map(p => `${p.nome} - R$ ${parseFloat(p.valor || '0').toFixed(2)}`)
      .join('\n');
    
    const totalPecas = calcularTotalPecas();

    try {
      const response = await fetch(`/api/maintenance-requests/${currentOsEdit.id}/oficina-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_manutencao: osEditForm.status_manutencao,
          pecas_utilizadas: pecasTexto,
          valor_pecas: totalPecas,
          valor_mao_obra: parseFloat(osEditForm.valor_mao_obra) || 0,
          mecanico_responsavel: osEditForm.mecanico_responsavel,
          observacoes_oficina: osEditForm.observacoes_oficina,
          data_finalizacao: osEditForm.data_finalizacao || null
        })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'OS atualizada com sucesso!'
        });
        setIsOsEditDialogOpen(false);
        fetchOsRecebidas();
      } else {
        throw new Error('Erro ao atualizar');
      }
    } catch (error) {
      console.error('Erro ao salvar OS:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive'
      });
    }
  };
  
  // Preencher datas de finalização para registros finalizados que não têm
  const backfillDataFinalizacao = async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Buscar registros finalizados sem data_hora_fim
      const { data: registrosSemData, error: fetchError } = await supabase
        .from('oficina_murici_manutencoes')
        .select('id')
        .eq('status', 'finalizado')
        .is('data_hora_fim', null);
      
      if (fetchError) {
        console.error('Erro ao buscar registros para backfill:', fetchError);
        return;
      }
      
      if (registrosSemData && registrosSemData.length > 0) {
        console.log(`[Backfill] Encontrados ${registrosSemData.length} registros finalizados sem data de finalização`);
        
        // Atualizar cada registro com a data atual
        const { error: updateError } = await supabase
          .from('oficina_murici_manutencoes')
          .update({ data_hora_fim: new Date().toISOString() })
          .eq('status', 'finalizado')
          .is('data_hora_fim', null);
        
        if (updateError) {
          console.error('Erro ao fazer backfill de datas:', updateError);
        } else {
          console.log(`[Backfill] ${registrosSemData.length} registros atualizados com data de finalização`);
        }
      }
    } catch (error) {
      console.error('Erro no backfill de datas de finalização:', error);
    }
  };
  
  const fetchManutencoes = async () => {
    setIsLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('oficina_murici_manutencoes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setManutencoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar manutenções:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível obter as manutenções da oficina.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Converter OS Coca-Cola para formato de manutenção para exibir nas abas corretas
  const osConvertidas = osRecebidas
    .filter((os: any) => os.status_manutencao && os.status_manutencao !== 'pendente')
    .map((os: any) => ({
      id: `coca_${os.id}`,
      placa: os.placa,
      km: 0,
      descricao_manutencao: os.relato_problema || 'OS Coca-Cola',
      status: os.status_manutencao,
      mecanico: os.mecanico_responsavel || '-',
      prazo: os.data_agendamento,
      data_hora_inicio: os.created_at,
      data_hora_fim: os.data_conclusao,
      custo_total: (parseFloat(os.valor_pecas) || 0) + (parseFloat(os.valor_mao_obra) || 0),
      labor_cost: os.valor_mao_obra || 0,
      observacoes: os.observacoes || '',
      peças_utilizadas: os.pecas_utilizadas || '',
      is_coca_cola: true,
      original_os: os
    }));
  
  // Combinar manutenções regulares com OS Coca-Cola convertidas
  const todasManutencoes = [...manutencoes, ...osConvertidas];
  
  // Filtragem de manutenções
  const filteredManutencoes = todasManutencoes.filter((m: any) => {
    // Filtro por busca
    const matchesSearch = 
      m.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.mecanico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.descricao_manutencao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por tab
    const matchesTab = 
      activeTab === 'todas' || 
      (activeTab === 'em_andamento' && m.status === 'em_andamento') ||
      (activeTab === 'aguardando_peca' && m.status === 'aguardando_peca') ||
      (activeTab === 'finalizadas' && m.status === 'finalizado');
    
    return matchesSearch && matchesTab;
  });
  
  // Handlers para formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentManutencao(prev => ({
      ...prev,
      [name]: name === 'km' || name === 'custo_total' ? Number(value) : value
    }));
  };
  
  const handleSelectChange = (name: string, value: string | boolean) => {
    setCurrentManutencao(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para calcular o custo total automaticamente
  const calculateTotalCost = () => {
    const valorTotalPecas = pecasSelecionadas.reduce((total, peca) => total + Number(peca.valor_total || 0), 0);
    const valorMaoDeObra = Number(currentManutencao.labor_cost) || 0;
    return valorTotalPecas + valorMaoDeObra;
  };
  
  // Salvar manutenção
  const handleSaveManutencao = async () => {
    // Validação
    if (!currentManutencao.placa || !currentManutencao.descricao_manutencao || !currentManutencao.mecanico) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Placa, Descrição e Mecânico são campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const supabase = createSupabaseClient();
      
      // Calcular custo total das peças automaticamente
      const valorTotalPecas = pecasSelecionadas.reduce((total, peca) => total + Number(peca.valor_total || 0), 0);
      
      // Calcular valor da mão de obra
      const valorMaoDeObra = Number(currentManutencao.labor_cost) || 0;
      
      // Calcular custo total (peças + mão de obra)
      const custoTotalCalculado = valorTotalPecas + valorMaoDeObra;
      
      // Formatear lista de peças para salvar no banco
      const pecasUtilizadasTexto = pecasSelecionadas.map(peca => 
        `${peca.nome} (${peca.codigo}) - Qtd: ${peca.quantidade} ${peca.unidade_medida} - R$ ${Number(peca.valor_total || 0).toFixed(2)}`
      ).join('\n');
      
      // Preparar dados básicos da manutenção
      const dadosBasicos = {
        placa: currentManutencao.placa,
        km: Number(currentManutencao.km) || 0,
        prazo: currentManutencao.prazo,
        descricao_manutencao: currentManutencao.descricao_manutencao,
        status: currentManutencao.status,
        mecanico: currentManutencao.mecanico,
        custo_total: custoTotalCalculado,
        observacoes: currentManutencao.observacoes || '',
        peças_utilizadas: pecasUtilizadasTexto || currentManutencao.peças_utilizadas || '',
        // Campos de oficina parceira
        mechanic_name: currentManutencao.mechanic_name || currentManutencao.mecanico,
        used_partner_workshop: currentManutencao.used_partner_workshop || false,
        partner_workshop_name: currentManutencao.partner_workshop_name || '',
        labor_cost: Number(currentManutencao.labor_cost) || 0,
        // Campos específicos para "Aguardando Peça"
        ...(currentManutencao.status === 'aguardando_peca' && {
          peca_descricao: currentManutencao.pendingPartDescription || currentManutencao.peca_descricao || '',
          peca_valor: Number(currentManutencao.pendingPartValue || currentManutencao.peca_valor) || 0,
          fornecedor_nome: currentManutencao.pendingPartSupplier || currentManutencao.fornecedor_nome || '',
          fornecedor_telefone: currentManutencao.pendingPartPhone || currentManutencao.fornecedor_telefone || '',
          prazo_entrega: currentManutencao.pendingPartDeadline || currentManutencao.prazo_entrega || ''
        })
      };

      if (isEditMode && currentManutencao.id) {
        // Verificar se houve transição de status para "finalizado"
        const transitouParaFinalizado = currentManutencao.status === 'finalizado' && statusOriginal !== 'finalizado';
        
        // Atualizar manutenção existente
        const { error: updateError } = await supabase
          .from('oficina_murici_manutencoes')
          .update({
            ...dadosBasicos,
            ...(currentManutencao.data_hora_inicio && {
              data_hora_inicio: currentManutencao.data_hora_inicio
            }),
            // Só define data_hora_fim se houver transição para finalizado
            ...(transitouParaFinalizado && {
              data_hora_fim: new Date().toISOString()
            })
          })
          .eq('id', currentManutencao.id);
        
        if (updateError) {
          console.error('Erro Supabase:', updateError);
          throw new Error(`Erro ao atualizar: ${updateError.message}`);
        }
        
        // Sincronizar atualização com Indicadores de Manutenção
        try {
          await apiRequest('POST', '/api/indicadores/sync-oficina-murici', {
            placa: currentManutencao.placa,
            modelo: '', 
            km: Number(currentManutencao.km) || 0,
            relato: currentManutencao.descricao_manutencao,
            oficina: 'Oficina Murici',
            mecanico: currentManutencao.mecanico,
            status: currentManutencao.status,
            custo_total: custoTotalCalculado
          });
          console.log('Atualização sincronizada com Indicadores de Manutenção');
        } catch (syncError) {
          console.warn('Erro ao sincronizar atualização com Indicadores (não crítico):', syncError);
        }
        
        toast({
          title: 'Manutenção atualizada',
          description: `Manutenção do veículo ${currentManutencao.placa} atualizada com sucesso.`
        });
      } else {
        // Criar nova manutenção
        const { error: insertError } = await supabase
          .from('oficina_murici_manutencoes')
          .insert({
            ...dadosBasicos,
            data_hora_inicio: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Erro Supabase:', insertError);
          throw new Error(`Erro ao criar: ${insertError.message}`);
        }
        
        // Sincronizar com Indicadores de Manutenção
        try {
          await apiRequest('POST', '/api/indicadores/sync-oficina-murici', {
            placa: currentManutencao.placa,
            modelo: '', 
            km: Number(currentManutencao.km) || 0,
            relato: currentManutencao.descricao_manutencao,
            oficina: 'Oficina Murici',
            mecanico: currentManutencao.mecanico,
            status: currentManutencao.status,
            custo_total: custoTotalCalculado
          });
          console.log('Sincronizado com Indicadores de Manutenção');
        } catch (syncError) {
          console.warn('Erro ao sincronizar com Indicadores (não crítico):', syncError);
        }
        
        toast({
          title: 'Manutenção cadastrada',
          description: `Manutenção do veículo ${currentManutencao.placa} registrada com sucesso.`
        });
      }
      
      // Atualizar estoque das peças apenas após salvar com sucesso
      if (pecasSelecionadas.length > 0) {
        try {
          // Buscar o estoque atual antes de atualizar
          for (const peca of pecasSelecionadas) {
            // Primeiro, buscar a peça atual para obter a quantidade em estoque
            const stockResponse = await apiRequest('GET', `/api/frota/estoque-pecas`);
            const estoquePecas = await stockResponse.json();
            const pecaAtual = estoquePecas.find((p: any) => p.id === peca.id);
            
            if (pecaAtual) {
              // Calcular nova quantidade: estoque atual - quantidade utilizada
              const novaQuantidade = Math.max(0, pecaAtual.quantidade - peca.quantidade);
              
              const response = await apiRequest('PUT', `/api/frota/estoque-pecas/${peca.id}`, {
                quantidade: novaQuantidade
              });
              
              if (!response.ok) {
                console.warn(`Erro ao atualizar estoque da peça ${peca.nome}`);
              }
            }
          }
          
          toast({
            title: 'Estoque atualizado',
            description: `Estoque das peças utilizadas foi atualizado automaticamente.`
          });
        } catch (stockError) {
          console.error('Erro ao atualizar estoque:', stockError);
          toast({
            title: 'Aviso',
            description: 'Manutenção salva, mas houve erro ao atualizar o estoque das peças.',
            variant: 'destructive'
          });
        }
      }
      
      // Recarregar dados e fechar diálogo
      fetchManutencoes();
      setIsDialogOpen(false);
      resetForm();
      
    } catch (error) {
      console.error('Erro ao salvar manutenção:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a manutenção. Tente novamente.',
        variant: 'destructive'
      });
    }
  };
  
  // Verificar se o usuário é administrador
  const isAdmin = user?.role === 'admin';
  
  // Exclusão de manutenção (apenas para administradores)
  const handleDeleteManutencao = async (id: number) => {
    // Verificar permissão de administrador
    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem excluir registros de manutenção.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!confirm('Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.')) return;
    
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('oficina_murici_manutencoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Manutenção excluída',
        description: 'Registro de manutenção removido com sucesso.'
      });
      
      fetchManutencoes();
    } catch (error) {
      console.error('Erro ao excluir manutenção:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a manutenção. Tente novamente.',
        variant: 'destructive'
      });
    }
  };
  
  // Edição de manutenção
  const handleEditManutencao = (manutencao: Manutencao) => {
    setCurrentManutencao({
      ...manutencao,
      prazo: manutencao.prazo ? manutencao.prazo.split('T')[0] : new Date().toISOString().split('T')[0],
      data_hora_inicio: manutencao.data_hora_inicio || undefined
    });
    setStatusOriginal(manutencao.status);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };
  
  // Função para gerar relatório PDF da manutenção
  const generateMaintenanceReport = async (manutencao: Manutencao) => {
    try {
      const pdf = new jsPDF();
      
      // Configurar fonte
      pdf.setFont('helvetica');
      
      // Cabeçalho
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('RELATÓRIO DE MANUTENÇÃO', 105, 30, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text('Murici On Fleet 2.0 - Oficina', 105, 45, { align: 'center' });
      
      // Linha divisória
      pdf.setLineWidth(0.5);
      pdf.line(20, 55, 190, 55);
      
      // Informações do veículo
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('DADOS DO VEÍCULO', 20, 70);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Placa: ${manutencao.placa}`, 20, 85);
      pdf.text(`Quilometragem: ${Number(manutencao.km || 0).toLocaleString('pt-BR')} km`, 20, 95);
      
      // Data da manutenção
      const dataInicio = manutencao.data_hora_inicio ? 
        format(new Date(manutencao.data_hora_inicio), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 
        'Não informado';
      const dataFim = manutencao.data_hora_fim ? 
        format(new Date(manutencao.data_hora_fim), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 
        'Em andamento';
      
      pdf.text(`Data de Início: ${dataInicio}`, 20, 105);
      pdf.text(`Data de Conclusão: ${dataFim}`, 20, 115);
      
      // Status
      const statusMap: Record<string, string> = {
        'em_andamento': 'Em Andamento',
        'aguardando_peca': 'Aguardando Peça',
        'finalizado': 'Finalizado'
      };
      pdf.text(`Status: ${statusMap[manutencao.status] || manutencao.status}`, 20, 125);
      
      // Informações da manutenção
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('DETALHES DA MANUTENÇÃO', 20, 145);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Mecânico Responsável: ${manutencao.mecanico || 'Não informado'}`, 20, 160);
      
      // Descrição da manutenção com quebra de linha
      const descricaoLinhas = pdf.splitTextToSize(`Descrição: ${manutencao.descricao_manutencao}`, 170);
      pdf.text(descricaoLinhas, 20, 170);
      
      let yPosition = 170 + (descricaoLinhas.length * 10);
      
      // Peças utilizadas se houver
      if (manutencao.peças_utilizadas) {
        pdf.setFontSize(16);
        pdf.setTextColor(51, 51, 51);
        pdf.text('PEÇAS UTILIZADAS', 20, yPosition + 20);
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const pecasLinhas = pdf.splitTextToSize(manutencao.peças_utilizadas, 170);
        pdf.text(pecasLinhas, 20, yPosition + 35);
        
        yPosition += 35 + (pecasLinhas.length * 5);
      }
      
      // Informações de oficina parceira se houver
      if (manutencao.used_partner_workshop && manutencao.partner_workshop_name) {
        pdf.setFontSize(16);
        pdf.setTextColor(51, 51, 51);
        pdf.text('OFICINA PARCEIRA', 20, yPosition + 20);
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Oficina: ${manutencao.partner_workshop_name}`, 20, yPosition + 35);
        pdf.text(`Valor da Mão de Obra: ${formatCurrency(manutencao.labor_cost || 0)}`, 20, yPosition + 45);
        
        yPosition += 55;
      }
      
      // Custos
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('CUSTOS', 20, yPosition + 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const custoTotal = Number(manutencao.custo_total || 0);
      pdf.text(`Custo Total da Manutenção: ${formatCurrency(custoTotal)}`, 20, yPosition + 35);
      
      // Observações se houver
      if (manutencao.observacoes) {
        pdf.setFontSize(16);
        pdf.setTextColor(51, 51, 51);
        pdf.text('OBSERVAÇÕES', 20, yPosition + 55);
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        const observacoesLinhas = pdf.splitTextToSize(manutencao.observacoes, 170);
        pdf.text(observacoesLinhas, 20, yPosition + 70);
      }
      
      // Rodapé
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Relatório gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, 280, { align: 'center' });
      
      // Salvar o PDF
      const fileName = `relatorio_manutencao_${manutencao.placa}_${format(new Date(), 'ddMMyyyy_HHmm')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: 'Relatório gerado',
        description: `Relatório de manutenção do veículo ${manutencao.placa} foi gerado com sucesso.`
      });
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Não foi possível gerar o relatório PDF. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setCurrentManutencao({
      placa: '',
      km: 0,
      prazo: new Date().toISOString().split('T')[0],
      descricao_manutencao: '',
      status: 'em_andamento',
      mecanico: '',
      custo_total: 0
    });
    setIsEditMode(false);
    setStatusOriginal(null);
  };
  
  // Abrir diálogo de nova manutenção
  const handleOpenNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  
  // Função para obter classe de cor por status
  const getStatusClass = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : 'bg-gray-100 text-gray-800';
  };
  
  // Formatação de data para exibição
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return '-';
    }
  };
  
  // Exportar para Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredManutencoes.map(m => ({
        'Placa': m.placa,
        'KM': m.km,
        'Prazo': m.prazo ? format(new Date(m.prazo), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        'Descrição': m.descricao_manutencao,
        'Status': statusOptions.find(opt => opt.value === m.status)?.label || m.status,
        'Mecânico': m.mecanico,
        'Início': formatDateTime(m.data_hora_inicio),
        'Fim': formatDateTime(m.data_hora_fim),
        'Custo Total': m.custo_total ? `R$ ${m.custo_total.toFixed(2)}` : 'R$ 0,00',
        'Observações': m.observacoes || '',
        'Peças Utilizadas': m.peças_utilizadas || ''
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Manutenções');
    
    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 10 },  // Placa
      { wch: 8 },   // KM
      { wch: 12 },  // Prazo
      { wch: 40 },  // Descrição
      { wch: 15 },  // Status
      { wch: 15 },  // Mecânico
      { wch: 18 },  // Início
      { wch: 18 },  // Fim
      { wch: 12 },  // Custo
      { wch: 30 },  // Observações
      { wch: 30 },  // Peças
    ];
    
    worksheet['!cols'] = columnWidths;
    
    XLSX.writeFile(workbook, `oficina_murici_manutencoes_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: 'Exportação concluída',
      description: 'Os dados foram exportados para Excel com sucesso!'
    });
  };
  
  // Importar de Excel
  const importFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(fileData, { type: 'array' });
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        
        if (jsonData.length === 0) {
          toast({
            title: 'Planilha vazia',
            description: 'A planilha não contém dados para importar.',
            variant: 'destructive'
          });
          return;
        }
        
        const formattedData = jsonData.map(row => {
          // Converter status de texto para valor
          let status = 'em_andamento';
          if (row['Status']?.toLowerCase().includes('aguardando')) {
            status = 'aguardando_peca';
          } else if (row['Status']?.toLowerCase().includes('finalizado')) {
            status = 'finalizado';
          }
          
          // Converter datas se necessário
          let prazo = null;
          if (row['Prazo']) {
            try {
              // Tentar converter formatos comuns de data
              const parts = row['Prazo'].split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                prazo = new Date(year, month, day).toISOString().split('T')[0];
              }
            } catch (e) {
              console.warn('Erro ao converter data:', e);
            }
          }
          
          // Converter valores monetários se necessário
          let custoTotal = 0;
          if (row['Custo Total']) {
            const custoStr = String(row['Custo Total']).replace('R$', '').replace(',', '.').trim();
            custoTotal = parseFloat(custoStr) || 0;
          }
          
          return {
            placa: String(row['Placa'] || '').toUpperCase(),
            km: parseInt(row['KM'] || '0', 10),
            prazo,
            descricao_manutencao: row['Descrição'] || 'Importado de Excel',
            status,
            mecanico: row['Mecânico'] || '',
            custo_total: custoTotal,
            observacoes: row['Observações'] || '',
            peças_utilizadas: row['Peças Utilizadas'] || ''
          };
        });
        
        // Filtrar entradas inválidas
        const validData = formattedData.filter(item => 
          item.placa && item.descricao_manutencao
        );
        
        if (validData.length === 0) {
          toast({
            title: 'Dados inválidos',
            description: 'Nenhum registro válido encontrado na planilha.',
            variant: 'destructive'
          });
          return;
        }
        
        // Inserir no banco
        const supabase = createSupabaseClient();
        const { error: importError } = await supabase
          .from('oficina_murici_manutencoes')
          .insert(validData);
        
        if (importError) throw importError;
        
        toast({
          title: 'Importação concluída',
          description: `${validData.length} registros foram importados com sucesso!`
        });
        
        fetchManutencoes();
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Erro ao importar Excel:', error);
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível processar o arquivo. Verifique o formato.',
        variant: 'destructive'
      });
    } finally {
      // Limpar input file
      event.target.value = '';
    }
  };
  
  // Contador de manutenções por status (incluindo OS Coca-Cola)
  const osEmAndamento = osRecebidas.filter((os: any) => os.status_manutencao === 'em_andamento');
  const osAguardandoPeca = osRecebidas.filter((os: any) => os.status_manutencao === 'aguardando_peca');
  const osFinalizadas = osRecebidas.filter((os: any) => os.status_manutencao === 'finalizado');
  const osPendentes = osRecebidas.filter((os: any) => !os.status_manutencao || os.status_manutencao === 'pendente');
  
  const counterByStatus = {
    total: manutencoes.length + osEmAndamento.length + osAguardandoPeca.length + osFinalizadas.length,
    em_andamento: manutencoes.filter(m => m.status === 'em_andamento').length + osEmAndamento.length,
    aguardando_peca: manutencoes.filter(m => m.status === 'aguardando_peca').length + osAguardandoPeca.length,
    finalizado: manutencoes.filter(m => m.status === 'finalizado').length + osFinalizadas.length
  };

  // Calcular valor total em manutenção
  const valorTotalManutencao = manutencoes.reduce((total, manutencao) => {
    const custoTotal = Number(manutencao.custo_total || 0);
    const custoMaoObra = Number(manutencao.labor_cost || 0);
    return total + custoTotal + custoMaoObra;
  }, 0);
  
  return (
    <MainLayoutSimple>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Oficina Murici</h1>
            <p className="text-muted-foreground">
              Gerenciamento de manutenções da frota
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                try {
                  const res = await apiRequest('POST', '/api/indicadores/sync-all-oficina-murici');
                  const data = await res.json();
                  if (data.success) {
                    toast({
                      title: 'Sincronização concluída',
                      description: data.message
                    });
                  } else {
                    throw new Error(data.message);
                  }
                } catch (error: any) {
                  toast({
                    title: 'Erro na sincronização',
                    description: error.message || 'Erro ao sincronizar com Indicadores',
                    variant: 'destructive'
                  });
                }
              }}
              variant="secondary"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Sincronizar Indicadores
            </Button>
            
            <Button onClick={exportToExcel}>
              <FileDownload className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            
            <div className="relative">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={importFromExcel}
                className="hidden"
                id="import-excel"
              />
              <Button asChild variant="outline">
                <label htmlFor="import-excel" className="cursor-pointer">
                  <FileUp className="h-4 w-4 mr-2" />
                  Importar Excel
                </label>
              </Button>
            </div>
            
            <Button onClick={handleOpenNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Manutenção
            </Button>
          </div>
        </div>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Manutenções</p>
                  <h3 className="text-2xl font-bold">{counterByStatus.total}</h3>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <Tool className="h-6 w-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <h3 className="text-2xl font-bold">{counterByStatus.em_andamento}</h3>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Aguardando Peça</p>
                  <h3 className="text-2xl font-bold">{counterByStatus.aguardando_peca}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Finalizadas</p>
                  <h3 className="text-2xl font-bold">{counterByStatus.finalizado}</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <h3 className="text-2xl font-bold text-red-600">{formatCurrency(valorTotalManutencao)}</h3>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <span className="text-red-700 font-bold text-lg">R$</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs e Tabela de manutenções */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-5 w-full sm:w-[650px]">
                <TabsTrigger value="os_recebidas" className="bg-red-50 text-red-700 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                  OS Recebidas ({osPendentes.length})
                </TabsTrigger>
                <TabsTrigger value="todas">
                  Todas ({counterByStatus.total})
                </TabsTrigger>
                <TabsTrigger value="em_andamento">
                  Em Andamento ({counterByStatus.em_andamento})
                </TabsTrigger>
                <TabsTrigger value="aguardando_peca">
                  Ag. Peça ({counterByStatus.aguardando_peca})
                </TabsTrigger>
                <TabsTrigger value="finalizadas">
                  Finalizadas ({counterByStatus.finalizado})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar por placa, mecânico..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : activeTab === 'os_recebidas' ? (
            /* Tabela de OS Recebidas do Time de Manutenção */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-50">
                    <TableHead>Placa</TableHead>
                    <TableHead>Base Origem</TableHead>
                    <TableHead>Urgência</TableHead>
                    <TableHead>Problema</TableHead>
                    <TableHead>Data Agendada</TableHead>
                    <TableHead>Status Oficina</TableHead>
                    <TableHead>Mecânico</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {osPendentes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                        Nenhuma OS pendente direcionada para a Oficina Murici.
                      </TableCell>
                    </TableRow>
                  ) : (
                    osPendentes.map((os: any) => {
                      const osAny = os as any;
                      const valorTotal = (parseFloat(osAny.valor_pecas) || 0) + (parseFloat(osAny.valor_mao_obra) || 0);
                      return (
                        <TableRow key={os.id} className="hover:bg-red-50/50">
                          <TableCell className="font-bold text-red-700">{os.placa}</TableCell>
                          <TableCell>{os.base_origem}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              os.urgencia === 'alta' ? 'bg-red-100 text-red-800' :
                              os.urgencia === 'media' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {os.urgencia?.charAt(0).toUpperCase() + os.urgencia?.slice(1) || 'Média'}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={os.relato_problema}>
                            {os.relato_problema}
                          </TableCell>
                          <TableCell>
                            {os.data_agendamento ? format(new Date(os.data_agendamento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              osAny.status_manutencao === 'em_andamento' ? 'bg-yellow-100 text-yellow-800' :
                              osAny.status_manutencao === 'aguardando_peca' ? 'bg-blue-100 text-blue-800' :
                              osAny.status_manutencao === 'finalizado' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {osAny.status_manutencao === 'em_andamento' ? 'Em Andamento' :
                               osAny.status_manutencao === 'aguardando_peca' ? 'Ag. Peça' :
                               osAny.status_manutencao === 'finalizado' ? 'Finalizado' : 'Pendente'}
                            </span>
                          </TableCell>
                          <TableCell>{osAny.mecanico_responsavel || '-'}</TableCell>
                          <TableCell className="font-semibold">
                            {valorTotal > 0 ? formatCurrency(valorTotal) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditOsRecebida(os)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <FileEdit className="h-4 w-4 mr-1" />
                              Atualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mecânico</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Finalização</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManutencoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        Nenhuma manutenção encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredManutencoes.map((manutencao: any) => {
                      const isCocaCola = manutencao.is_coca_cola === true;
                      return (
                      <TableRow key={manutencao.id} className={isCocaCola ? 'bg-red-50/30' : ''}>
                        <TableCell className={`font-medium ${isCocaCola ? 'text-red-700' : ''}`}>
                          {manutencao.placa}
                          {isCocaCola && <span className="ml-1 text-xs text-red-500">(CC)</span>}
                        </TableCell>
                        <TableCell>{(manutencao.km || 0).toLocaleString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={manutencao.descricao_manutencao}>
                          {manutencao.descricao_manutencao}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(manutencao.status)}`}>
                            {statusOptions.find(opt => opt.value === manutencao.status)?.label}
                          </span>
                        </TableCell>
                        <TableCell>{manutencao.mecanico}</TableCell>
                        <TableCell>
                          {manutencao.prazo ? format(new Date(manutencao.prazo), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </TableCell>
                        <TableCell>
                          {manutencao.data_hora_inicio ? formatDateTime(manutencao.data_hora_inicio) : '-'}
                        </TableCell>
                        <TableCell>
                          {manutencao.data_hora_fim ? formatDateTime(manutencao.data_hora_fim) : '-'}
                        </TableCell>
                        <TableCell>
                          {manutencao.custo_total ? formatCurrency(manutencao.custo_total) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => isCocaCola ? handleEditOsRecebida(manutencao.original_os) : handleEditManutencao(manutencao)}
                              title="Editar"
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            {!isCocaCola && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => generateMaintenanceReport(manutencao)}
                                title="Imprimir Relatório"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}
                            {isAdmin && !isCocaCola && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => manutencao.id && handleDeleteManutencao(manutencao.id)}
                                title="Excluir (Apenas Administradores)"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      
      {/* Diálogo para adicionar/editar manutenção */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-xl font-bold">
              {isEditMode ? 'Editar Manutenção' : 'Nova Manutenção'}
            </DialogTitle>
            <DialogDescription className="mt-1 text-gray-600 text-sm">
              {isEditMode 
                ? 'Atualize os dados da manutenção selecionada.' 
                : 'Registre uma nova manutenção na Oficina Murici.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="placa" className="text-sm">Placa do Veículo*</Label>
                <Input
                  id="placa"
                  name="placa"
                  value={currentManutencao.placa}
                  onChange={handleInputChange}
                  placeholder="AAA1234"
                  maxLength={10}
                  className="h-9"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="km" className="text-sm">Quilometragem*</Label>
                <Input
                  id="km"
                  name="km"
                  type="number"
                  value={currentManutencao.km || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: 15000"
                  className="h-9"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="descricao_manutencao" className="text-sm">Descrição da Manutenção*</Label>
              <Textarea
                id="descricao_manutencao"
                name="descricao_manutencao"
                value={currentManutencao.descricao_manutencao}
                onChange={handleInputChange}
                placeholder="Descreva o problema ou serviço a ser realizado"
                rows={3}
                className="min-h-[80px] resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="mecanico" className="text-sm">Mecânico Responsável*</Label>
                <Input
                  id="mecanico"
                  name="mecanico"
                  value={currentManutencao.mecanico}
                  onChange={handleInputChange}
                  placeholder="Nome do mecânico"
                  className="h-9"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="prazo" className="text-sm">Prazo</Label>
                <Input
                  id="prazo"
                  name="prazo"
                  type="date"
                  value={currentManutencao.prazo}
                  onChange={handleInputChange}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="data_hora_inicio" className="text-sm">Data de Início</Label>
              <Input
                id="data_hora_inicio"
                name="data_hora_inicio"
                type="datetime-local"
                value={currentManutencao.data_hora_inicio ? 
                  format(new Date(currentManutencao.data_hora_inicio), "yyyy-MM-dd'T'HH:mm") : 
                  ''}
                onChange={handleInputChange}
                className="h-9"
              />
            </div>

            {/* Seção de Oficina Parceira */}
            <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="used_partner_workshop"
                  checked={currentManutencao.used_partner_workshop || false}
                  onChange={(e) => handleSelectChange('used_partner_workshop', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="used_partner_workshop" className="text-sm font-medium">
                  Utilizou Oficina Parceira?
                </Label>
              </div>

              {currentManutencao.used_partner_workshop && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="partner_workshop_name" className="text-sm">Nome da Oficina Parceira*</Label>
                    <Input
                      id="partner_workshop_name"
                      name="partner_workshop_name"
                      value={currentManutencao.partner_workshop_name || ''}
                      onChange={handleInputChange}
                      placeholder="Nome da oficina terceirizada"
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="labor_cost" className="text-sm">Valor da Mão de Obra (R$)*</Label>
                    <Input
                      id="labor_cost"
                      name="labor_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentManutencao.labor_cost || ''}
                      onChange={handleInputChange}
                      placeholder="0,00"
                      className="h-9"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="status" className="text-sm">Status</Label>
                <Select
                  value={currentManutencao.status}
                  onValueChange={(value: 'em_andamento' | 'aguardando_peca' | 'finalizado') => 
                    handleSelectChange('status', value)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="custo_total" className="text-sm">Custo Total (R$)</Label>
                <div className="h-9 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center text-sm font-medium text-gray-900">
                  R$ {calculateTotalCost().toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">
                  Calculado automaticamente: Peças + Mão de Obra
                </p>
              </div>
            </div>

            {/* Resumo de Custos - aparece quando há valor de mão de obra ou peças */}
            {((currentManutencao.labor_cost && currentManutencao.labor_cost > 0) || (currentManutencao.custo_total && currentManutencao.custo_total > 0)) && (
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-semibold text-green-800 mb-2">Resumo de Custos</h3>
                <div className="space-y-1 text-sm">
                  {currentManutencao.custo_total && currentManutencao.custo_total > 0 && (
                    <div className="flex justify-between">
                      <span>Total das Peças:</span>
                      <span className="font-medium">{formatCurrency(currentManutencao.custo_total)}</span>
                    </div>
                  )}
                  {currentManutencao.labor_cost && currentManutencao.labor_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Mão de Obra:</span>
                      <span className="font-medium">{formatCurrency(currentManutencao.labor_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1 font-bold text-green-800">
                    <span>Custo Total:</span>
                    <span>{formatCurrency(Number(currentManutencao.custo_total || 0) + Number(currentManutencao.labor_cost || 0))}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Campos específicos para aguardando_peca */}
            {currentManutencao.status === 'aguardando_peca' && (
              <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
                <h3 className="font-semibold text-orange-800">Informações da Peça Aguardada</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome da peça */}
                  <div className="space-y-1">
                    <Label htmlFor="peca_descricao" className="text-sm">Nome da Peça*</Label>
                    <Input
                      id="peca_descricao"
                      name="peca_descricao"
                      value={currentManutencao.peca_descricao || ''}
                      onChange={handleInputChange}
                      placeholder="Ex: Filtro de óleo"
                      className="h-9"
                      required
                    />
                  </div>
                  
                  {/* Valor estimado */}
                  <div className="space-y-1">
                    <Label htmlFor="peca_valor" className="text-sm">Valor Estimado (R$)*</Label>
                    <Input
                      id="peca_valor"
                      name="peca_valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentManutencao.peca_valor || ''}
                      onChange={handleInputChange}
                      placeholder="0,00"
                      className="h-9"
                      required
                    />
                  </div>
                  
                  {/* Nome do fornecedor */}
                  <div className="space-y-1">
                    <Label htmlFor="fornecedor_nome" className="text-sm">Nome do Fornecedor*</Label>
                    <Input
                      id="fornecedor_nome"
                      name="fornecedor_nome"
                      value={currentManutencao.fornecedor_nome || ''}
                      onChange={handleInputChange}
                      placeholder="Ex: Auto Peças XYZ"
                      className="h-9"
                      required
                    />
                  </div>
                  
                  {/* Telefone do fornecedor */}
                  <div className="space-y-1">
                    <Label htmlFor="fornecedor_telefone" className="text-sm">Telefone do Fornecedor*</Label>
                    <Input
                      id="fornecedor_telefone"
                      name="fornecedor_telefone"
                      value={currentManutencao.fornecedor_telefone || ''}
                      onChange={handleInputChange}
                      placeholder="(11) 99999-9999"
                      className="h-9"
                      required
                    />
                  </div>
                  
                  {/* Prazo de entrega */}
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="prazo_entrega" className="text-sm">Prazo de Entrega Estimado*</Label>
                    <Input
                      id="prazo_entrega"
                      name="prazo_entrega"
                      type="date"
                      value={currentManutencao.prazo_entrega || ''}
                      onChange={handleInputChange}
                      className="h-9"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Componente de seleção de peças do estoque */}
            <SeletorPecasEstoque 
              pecasSelecionadas={pecasSelecionadas}
              onPecasChange={setPecasSelecionadas}
            />
            
            <div className="space-y-1">
              <Label htmlFor="observacoes" className="text-sm">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={currentManutencao.observacoes || ''}
                onChange={handleInputChange}
                placeholder="Observações adicionais"
                rows={2}
                className="min-h-[60px] resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveManutencao}>
              {isEditMode ? 'Atualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de OS Recebida */}
      <Dialog open={isOsEditDialogOpen} onOpenChange={setIsOsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-red-700">
              Atualizar OS - {currentOsEdit?.placa}
            </DialogTitle>
            <DialogDescription>
              Base: {currentOsEdit?.base_origem} | Problema: {currentOsEdit?.relato_problema}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status da Manutenção</Label>
                <Select
                  value={osEditForm.status_manutencao}
                  onValueChange={(value) => setOsEditForm(prev => ({ ...prev, status_manutencao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mecânico Responsável</Label>
                <Input
                  value={osEditForm.mecanico_responsavel}
                  onChange={(e) => setOsEditForm(prev => ({ ...prev, mecanico_responsavel: e.target.value }))}
                  placeholder="Nome do mecânico"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Peças Utilizadas</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddPeca} className="text-green-600 border-green-300">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Peça
                </Button>
              </div>
              
              {pecasLista.length === 0 ? (
                <div className="text-center py-4 text-gray-500 border rounded-lg bg-gray-50">
                  Nenhuma peça adicionada. Clique em "Adicionar Peça" para começar.
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {pecasLista.map((peca, index) => (
                    <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                      <Input
                        value={peca.nome}
                        onChange={(e) => handleUpdatePeca(index, 'nome', e.target.value)}
                        placeholder="Nome da peça"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={peca.valor}
                          onChange={(e) => handleUpdatePeca(index, 'valor', e.target.value)}
                          placeholder="0.00"
                          className="w-24"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePeca(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {pecasLista.length > 0 && (
                <div className="text-right text-sm font-medium text-gray-600">
                  Subtotal Peças: {formatCurrency(calcularTotalPecas())}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Valor Mão de Obra (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={osEditForm.valor_mao_obra}
                onChange={(e) => setOsEditForm(prev => ({ ...prev, valor_mao_obra: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Finalização</Label>
              <Input
                type="date"
                value={osEditForm.data_finalizacao}
                onChange={(e) => setOsEditForm(prev => ({ ...prev, data_finalizacao: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações da Oficina</Label>
              <Textarea
                value={osEditForm.observacoes_oficina}
                onChange={(e) => setOsEditForm(prev => ({ ...prev, observacoes_oficina: e.target.value }))}
                placeholder="Observações sobre a manutenção"
                rows={2}
              />
            </div>

            {/* Resumo de valores */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Peças:</span>
                <span>{formatCurrency(calcularTotalPecas())}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Mão de Obra:</span>
                <span>{formatCurrency(parseFloat(osEditForm.valor_mao_obra) || 0)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor Total:</span>
                <span className="text-xl font-bold text-green-700">
                  {formatCurrency(calcularTotalPecas() + (parseFloat(osEditForm.valor_mao_obra) || 0))}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOsEdit} className="bg-red-600 hover:bg-red-700">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayoutSimple>
  );
};

export default OficinaMurici;