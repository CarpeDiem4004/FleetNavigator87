import React, { useState, useEffect } from 'react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { FileSpreadsheet, Plus, Search, FileEdit, Trash2, Download as FileDownload, Upload as FileUp, Calendar, Truck, Wrench as Tool, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import * as XLSX from 'xlsx';

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
}

const statusOptions = [
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'aguardando_peca', label: 'Aguardando Peça', color: 'bg-blue-100 text-blue-800' },
  { value: 'finalizado', label: 'Finalizado', color: 'bg-green-100 text-green-800' }
];

const OficinaMurici: React.FC = () => {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentManutencao, setCurrentManutencao] = useState<Manutencao>({
    placa: '',
    km: 0,
    prazo: new Date().toISOString().split('T')[0],
    descricao_manutencao: '',
    status: 'em_andamento',
    mecanico: '',
    custo_total: 0
  });
  
  const { toast } = useToast();
  
  // Carregar dados da API
  useEffect(() => {
    fetchManutencoes();
  }, []);
  
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
  
  // Filtragem de manutenções
  const filteredManutencoes = manutencoes.filter(m => {
    // Filtro por busca
    const matchesSearch = 
      m.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.mecanico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.descricao_manutencao.toLowerCase().includes(searchTerm.toLowerCase());
    
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
  
  const handleSelectChange = (name: string, value: string) => {
    setCurrentManutencao(prev => ({
      ...prev,
      [name]: value
    }));
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
      
      if (isEditMode && currentManutencao.id) {
        // Atualizar manutenção existente
        const { error: updateError } = await supabase
          .from('oficina_murici_manutencoes')
          .update({
            placa: currentManutencao.placa,
            km: currentManutencao.km,
            prazo: currentManutencao.prazo,
            descricao_manutencao: currentManutencao.descricao_manutencao,
            status: currentManutencao.status,
            mecanico: currentManutencao.mecanico,
            custo_total: currentManutencao.custo_total,
            observacoes: currentManutencao.observacoes,
            peças_utilizadas: currentManutencao.peças_utilizadas,
            ...(currentManutencao.status === 'finalizado' && {
              data_hora_fim: new Date().toISOString()
            })
          })
          .eq('id', currentManutencao.id);
        
        if (updateError) throw updateError;
        
        toast({
          title: 'Manutenção atualizada',
          description: `Manutenção do veículo ${currentManutencao.placa} atualizada com sucesso.`
        });
      } else {
        // Criar nova manutenção
        const { error: insertError } = await supabase
          .from('oficina_murici_manutencoes')
          .insert({
            placa: currentManutencao.placa,
            km: currentManutencao.km,
            prazo: currentManutencao.prazo,
            descricao_manutencao: currentManutencao.descricao_manutencao,
            status: currentManutencao.status,
            mecanico: currentManutencao.mecanico,
            custo_total: currentManutencao.custo_total,
            observacoes: currentManutencao.observacoes,
            peças_utilizadas: currentManutencao.peças_utilizadas
          });
        
        if (insertError) throw insertError;
        
        toast({
          title: 'Manutenção cadastrada',
          description: `Manutenção do veículo ${currentManutencao.placa} registrada com sucesso.`
        });
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
  
  // Exclusão de manutenção
  const handleDeleteManutencao = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta manutenção?')) return;
    
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
      prazo: manutencao.prazo ? manutencao.prazo.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
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
  
  // Contador de manutenções por status
  const counterByStatus = {
    total: manutencoes.length,
    em_andamento: manutencoes.filter(m => m.status === 'em_andamento').length,
    aguardando_peca: manutencoes.filter(m => m.status === 'aguardando_peca').length,
    finalizado: manutencoes.filter(m => m.status === 'finalizado').length
  };
  
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        </div>
        
        {/* Tabs e Tabela de manutenções */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-4 w-full sm:w-[500px]">
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
                    <TableHead>Custo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManutencoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        Nenhuma manutenção encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredManutencoes.map((manutencao) => (
                      <TableRow key={manutencao.id}>
                        <TableCell className="font-medium">{manutencao.placa}</TableCell>
                        <TableCell>{manutencao.km.toLocaleString()}</TableCell>
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
                          {manutencao.custo_total ? `R$ ${manutencao.custo_total.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditManutencao(manutencao)}
                              title="Editar"
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => manutencao.id && handleDeleteManutencao(manutencao.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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
                <Input
                  id="custo_total"
                  name="custo_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentManutencao.custo_total || ''}
                  onChange={handleInputChange}
                  placeholder="0,00"
                  className="h-9"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="pecas_utilizadas" className="text-sm">Peças Utilizadas</Label>
              <Textarea
                id="pecas_utilizadas"
                name="peças_utilizadas"
                value={currentManutencao.peças_utilizadas || ''}
                onChange={handleInputChange}
                placeholder="Liste as peças utilizadas na manutenção"
                rows={2}
                className="min-h-[60px] resize-none"
              />
            </div>
            
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
    </MainLayoutSimple>
  );
};

export default OficinaMurici;