import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, FileSpreadsheet, Download, Calendar, Filter, CheckCircle, XCircle, AlertTriangle, TrendingUp, DollarSign, Droplets, Building2, X, MessageCircle, Send, Phone, Truck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { apiRequest } from '@/lib/queryClient';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface VehicleRouteData {
  data: string;
  placa: string;
  motorista: string;
  operacao?: string;
  modelo?: string;
  rota_log?: string;
  qtde_produtos?: number;
  qtde_paradas?: number;
}

interface FuelRecord {
  data: string;
  placa: string;
  motorista: string;
  projeto?: string;
  tipo: 'abastecimento' | 'solicitacao' | 'solicitacao_cartao' | 'solicitacao_fuel_card' | 'historico_geral' | 'posto_especifico';
  posto?: string;
  fonte?: string;
  valor?: number;
  litros?: number;
  rota?: string;
}

interface ConferenceReport {
  rodaram_e_abasteceram: (VehicleRouteData & { fuel_records: FuelRecord[] })[];
  rodaram_nao_abasteceram: VehicleRouteData[];
  abasteceram_nao_rodaram: FuelRecord[];
}

const getTipoLabel = (tipo: string): string => {
  switch (tipo) {
    case 'abastecimento': return 'Abastecimento';
    case 'posto_especifico': return 'Posto Específico';
    case 'solicitacao_cartao': return 'Solicitação Cartão';
    case 'solicitacao_fuel_card': return 'Fuel Card';
    case 'historico_geral': return 'Histórico Geral';
    case 'solicitacao': return 'Solicitação';
    default: return 'Registro';
  }
};

// Cores para o gráfico
const CHART_COLORS = ['#DB0145', '#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#3182CE', '#805AD5', '#D53F8C', '#319795', '#718096'];

const ConferenciaRotas: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedData, setUploadedData] = useState<VehicleRouteData[]>([]);
  const [conferenceReport, setConferenceReport] = useState<ConferenceReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedBaseFilter, setSelectedBaseFilter] = useState<string>('');
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [selectedBaseForWhatsapp, setSelectedBaseForWhatsapp] = useState<string>('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Dashboard statistics para "Abasteceram Não Rodaram"
  const dashboardStats = useMemo(() => {
    if (!conferenceReport?.abasteceram_nao_rodaram?.length) {
      return null;
    }

    const records = conferenceReport.abasteceram_nao_rodaram;
    
    // Totais gerais
    const totalValor = records.reduce((sum, r) => sum + (r.valor || 0), 0);
    const totalLitros = records.reduce((sum, r) => sum + (r.litros || 0), 0);
    const totalRegistros = records.length;
    
    // Agrupar por base
    const baseStats = new Map<string, { valor: number; litros: number; count: number }>();
    
    records.forEach(record => {
      const base = record.projeto || 'SEM BASE';
      const current = baseStats.get(base) || { valor: 0, litros: 0, count: 0 };
      baseStats.set(base, {
        valor: current.valor + (record.valor || 0),
        litros: current.litros + (record.litros || 0),
        count: current.count + 1
      });
    });
    
    // Converter para array e ordenar por valor (maiores ofensores)
    const basesRanking = Array.from(baseStats.entries())
      .map(([base, stats]) => ({
        base,
        valor: stats.valor,
        litros: stats.litros,
        count: stats.count
      }))
      .sort((a, b) => b.valor - a.valor);
    
    // Todas as bases por valor (ordenadas por valor)
    const todasBasesValor = basesRanking.filter(b => b.valor > 0);
    
    // Todas as bases por litros (ordenadas por litros)
    const todasBasesLitros = [...basesRanking].filter(b => b.litros > 0).sort((a, b) => b.litros - a.litros);
    
    // Top 5 + Outras para gráficos de pizza (valor)
    const top5Valor = todasBasesValor.slice(0, 5);
    const outrasValor = todasBasesValor.slice(5);
    const chartDataValor = outrasValor.length > 0 
      ? [...top5Valor, { 
          base: `Outras (${outrasValor.length})`, 
          valor: outrasValor.reduce((s, b) => s + b.valor, 0),
          litros: outrasValor.reduce((s, b) => s + b.litros, 0),
          count: outrasValor.reduce((s, b) => s + b.count, 0)
        }]
      : top5Valor;
    
    // Top 5 + Outras para gráficos de pizza (litros)
    const top5Litros = todasBasesLitros.slice(0, 5);
    const outrasLitros = todasBasesLitros.slice(5);
    const chartDataLitros = outrasLitros.length > 0
      ? [...top5Litros, {
          base: `Outras (${outrasLitros.length})`,
          valor: outrasLitros.reduce((s, b) => s + b.valor, 0),
          litros: outrasLitros.reduce((s, b) => s + b.litros, 0),
          count: outrasLitros.reduce((s, b) => s + b.count, 0)
        }]
      : top5Litros;
    
    // Lista de todas as bases para o filtro
    const todasBases = Array.from(baseStats.keys()).sort();

    return {
      totalValor,
      totalLitros,
      totalRegistros,
      totalBases: baseStats.size,
      todasBasesValor,
      todasBasesLitros,
      chartDataValor,
      chartDataLitros,
      basesRanking,
      todasBases
    };
  }, [conferenceReport?.abasteceram_nao_rodaram]);

  // Registros filtrados por base selecionada
  const filteredRecords = useMemo(() => {
    if (!conferenceReport?.abasteceram_nao_rodaram?.length) return [];
    if (!selectedBaseFilter) return conferenceReport.abasteceram_nao_rodaram;
    
    return conferenceReport.abasteceram_nao_rodaram.filter(record => {
      const base = record.projeto || 'SEM BASE';
      return base === selectedBaseFilter;
    });
  }, [conferenceReport?.abasteceram_nao_rodaram, selectedBaseFilter]);

  // Estatísticas da base selecionada
  const selectedBaseStats = useMemo(() => {
    if (!selectedBaseFilter || !filteredRecords.length) return null;
    
    const totalValor = filteredRecords.reduce((sum, r) => sum + (r.valor || 0), 0);
    const totalLitros = filteredRecords.reduce((sum, r) => sum + (r.litros || 0), 0);
    
    return {
      base: selectedBaseFilter,
      totalRegistros: filteredRecords.length,
      totalValor,
      totalLitros
    };
  }, [selectedBaseFilter, filteredRecords]);

  // Placas agrupadas por base
  const placasPorBase = useMemo(() => {
    if (!conferenceReport?.abasteceram_nao_rodaram?.length) return [];
    
    const baseMap = new Map<string, { placas: Set<string>; records: FuelRecord[]; totalValor: number; totalLitros: number }>();
    
    conferenceReport.abasteceram_nao_rodaram.forEach(record => {
      const base = record.projeto || 'SEM BASE';
      const current = baseMap.get(base) || { placas: new Set<string>(), records: [], totalValor: 0, totalLitros: 0 };
      current.placas.add(record.placa);
      current.records.push(record);
      current.totalValor += record.valor || 0;
      current.totalLitros += record.litros || 0;
      baseMap.set(base, current);
    });
    
    return Array.from(baseMap.entries())
      .map(([base, data]) => ({
        base,
        placas: Array.from(data.placas).sort(),
        totalPlacas: data.placas.size,
        totalRegistros: data.records.length,
        totalValor: data.totalValor,
        totalLitros: data.totalLitros
      }))
      .sort((a, b) => b.totalValor - a.totalValor);
  }, [conferenceReport?.abasteceram_nao_rodaram]);

  // Função para abrir dialog de WhatsApp
  const handleOpenWhatsappDialog = (base: string) => {
    setSelectedBaseForWhatsapp(base);
    setWhatsappPhone('');
    setWhatsappDialogOpen(true);
  };

  // Função para enviar justificativa via WhatsApp
  const handleSendJustification = async () => {
    const baseData = placasPorBase.find(b => b.base === selectedBaseForWhatsapp);
    if (!baseData || !whatsappPhone) return;

    setSendingWhatsapp(true);
    try {
      await apiRequest('POST', '/api/conferencia-rotas/justificativa', {
        baseName: selectedBaseForWhatsapp,
        plates: baseData.placas,
        date: selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
        phone: whatsappPhone
      });

      toast({
        title: "Mensagem enviada!",
        description: `Solicitação de justificativa enviada para ${selectedBaseForWhatsapp}`,
      });
      setWhatsappDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
        toast({
          title: "Arquivo selecionado",
          description: `Arquivo ${file.name} pronto para upload.`,
        });
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo .xlsx",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const processExcelFile = useCallback(async (file: File): Promise<VehicleRouteData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Usar header: 1 para obter array de arrays, não objetos
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Primeira linha são os cabeçalhos
          const headers = jsonData[0] as string[];
          const dataRows = jsonData.slice(1); // Pular cabeçalho
          
          console.log('Cabeçalhos encontrados:', headers);
          console.log('Total de linhas de dados:', dataRows.length);

          const processedData: VehicleRouteData[] = (dataRows as any[]).map((row: any[], index: number) => {
            // Mapear baseado na estrutura específica do MercadoLivre:
            // Coluna 0: DATA DO FRETE/ABASTECIMENTO (número Excel)
            // Coluna 1: OPERAÇÃO
            // Coluna 2: MOTORISTA  
            // Coluna 3: PLACA
            // Coluna 4: MODELO
            
            const dataFrete = row[0]; // DATA DO FRETE/ABASTECIMENTO
            const operacao = row[1];  // OPERAÇÃO
            const motorista = row[2]; // MOTORISTA
            const placa = row[3];     // PLACA
            const modelo = row[4];    // MODELO

            // Converter data do Excel (número) para formato ISO
            let dataFormatada = '';
            if (dataFrete && typeof dataFrete === 'number') {
              // Excel armazena datas como número de dias desde 1/1/1900
              const excelEpoch = new Date(1900, 0, 1);
              const dataConvertida = new Date(excelEpoch.getTime() + (dataFrete - 2) * 24 * 60 * 60 * 1000);
              dataFormatada = dataConvertida.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            }

            const processedRow = {
              data: dataFormatada,
              placa: placa ? placa.toString().trim().replace(/[^A-Z0-9]/g, '').toUpperCase() : '',
              motorista: motorista ? motorista.toString().trim() : '',
              operacao: operacao ? operacao.toString().trim() : '',
              modelo: modelo ? modelo.toString().trim() : '',
            };

            // Log para debug das primeiras 3 linhas
            if (index < 3) {
              console.log(`Linha ${index + 2} processada:`, processedRow);
            }

            return processedRow;
          });

          const validData = processedData.filter(item => 
            item.data && item.placa && item.motorista
          );

          console.log(`Dados válidos encontrados: ${validData.length} de ${processedData.length} total`);

          if (validData.length === 0) {
            reject(new Error('Nenhum dado válido encontrado na planilha. Verifique se o formato é do modelo MercadoLivre com as colunas: DATA DO FRETE/ABASTECIMENTO, OPERAÇÃO, MOTORISTA, PLACA, MODELO'));
          } else {
            resolve(validData);
          }
        } catch (error) {
          reject(new Error('Erro ao processar arquivo Excel: ' + (error as Error).message));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const uploadAndProcess = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setIsProcessing(true);

    try {
      // Enviar arquivo direto para o backend sem processamento local
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_date', selectedDate);

      console.log('[Frontend] Enviando arquivo para processamento no servidor:', {
        fileName: selectedFile.name,
        uploadDate: selectedDate
      });

      const response = await fetch('/api/conferencia-rotas/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro no upload: ${response.statusText}. ${errorText.includes('<!DOCTYPE') ? 'Resposta inesperada do servidor' : errorText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        throw new Error(`Resposta inválida do servidor: esperado JSON, recebido ${contentType || 'HTML'}`);
      }

      const result = await response.json();

      console.log('[Frontend] Resposta do servidor:', result);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao processar arquivo');
      }

      toast({
        title: "Upload realizado com sucesso!",
        description: `${result.records_processed || 0} registros processados para a data ${selectedDate}`,
      });

      // Gerar relatório automaticamente
      await generateReport();

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [selectedFile, selectedDate, toast]);

  const generateReport = useCallback(async () => {
    if (!selectedDate) {
      toast({
        title: "Data obrigatória",
        description: "Selecione uma data para gerar o relatório",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/conferencia-rotas/report?date=${selectedDate}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao gerar relatório: ${response.statusText}`);
      }

      const report = await response.json();
      setConferenceReport(report);

      toast({
        title: "Relatório gerado!",
        description: `Relatório para ${selectedDate} gerado com sucesso.`,
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedDate, toast]);

  const exportToExcel = useCallback(async () => {
    if (!selectedDate) {
      toast({
        title: "Data obrigatória",
        description: "Selecione uma data para exportar o relatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/conferencia-rotas/export?date=${selectedDate}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erro ao exportar relatório: ${response.statusText}`);
      }

      // Criar blob do arquivo Excel
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Criar link de download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_Conferencia_${selectedDate.replace(/\//g, '-')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      // Limpar recursos
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Excel exportado!",
        description: "Arquivo baixado com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: "Erro ao exportar Excel",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [selectedDate, toast]);

  const exportToPDF = useCallback(() => {
    if (!conferenceReport) return;

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.text('Conferência de Rotas e Abastecimentos', 20, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${selectedDate}`, 20, 30);

    let yPosition = 50;

    // Seção 1: Rodaram e Abasteceram
    doc.setFontSize(14);
    doc.text('Veículos que Rodaram e Abasteceram', 20, yPosition);
    yPosition += 10;

    if (conferenceReport.rodaram_e_abasteceram.length > 0) {
      const tableData1 = conferenceReport.rodaram_e_abasteceram.map(item => [
        item.placa,
        item.motorista,
        item.operacao || '',
        item.modelo || '',
        item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-',
        item.fuel_records.length.toString(),
        item.fuel_records.map(f => f.projeto).filter(Boolean).join(', ')
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Placa', 'Motorista', 'Operação', 'Modelo', 'Data', 'Registros Combustível', 'Projetos']],
        body: tableData1,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    } else {
      doc.text('Nenhum registro encontrado', 20, yPosition);
      yPosition += 20;
    }

    // Verificar se precisa de nova página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Seção 2: Rodaram mas Não Abasteceram
    doc.setFontSize(14);
    doc.text('Veículos que Rodaram mas Não Abasteceram', 20, yPosition);
    yPosition += 10;

    if (conferenceReport.rodaram_nao_abasteceram.length > 0) {
      const tableData2 = conferenceReport.rodaram_nao_abasteceram.map(item => [
        item.placa,
        item.motorista,
        item.operacao || '',
        item.modelo || '',
        item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-',
        '0 registro(s)',
        '-'
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Placa', 'Motorista', 'Operação', 'Modelo', 'Data', 'Registros Combustível', 'Projetos']],
        body: tableData2,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    } else {
      doc.text('Nenhum registro encontrado', 20, yPosition);
      yPosition += 20;
    }

    // Verificar se precisa de nova página
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }

    // Seção 3: Abasteceram mas Não Rodaram
    doc.setFontSize(14);
    doc.text('Veículos que Abasteceram mas Não Rodaram', 20, yPosition);
    yPosition += 10;

    if (conferenceReport.abasteceram_nao_rodaram.length > 0) {
      const tableData3 = conferenceReport.abasteceram_nao_rodaram.map(item => [
        item.placa,
        item.motorista,
        '-',
        '-',
        item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-',
        `${getTipoLabel(item.tipo)}${item.posto ? ` (${item.posto})` : ''}`,
        item.projeto || ''
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Placa', 'Motorista', 'Operação', 'Modelo', 'Data', 'Registros Combustível', 'Projetos']],
        body: tableData3,
        theme: 'grid',
        headStyles: { fillColor: [251, 146, 60] }
      });
    } else {
      doc.text('Nenhum registro encontrado', 20, yPosition);
    }

    doc.save(`conferencia_rotas_${selectedDate}.pdf`);

    toast({
      title: "PDF exportado!",
      description: "Arquivo baixado com sucesso.",
    });
  }, [conferenceReport, selectedDate, toast]);

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Conferência de Rotas e Abastecimentos</h1>
            <p className="text-muted-foreground">
              Compare dados de rotas com registros de abastecimento
            </p>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload e Processamento</TabsTrigger>
            <TabsTrigger value="report">Relatório e Análise</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload da Planilha de Rotas
                </CardTitle>
                <CardDescription>
                  Envie a planilha .xlsx com os dados dos veículos que rodaram. 
                  Colunas necessárias: data, placa, motorista, operacao, modelo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data de Referência</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">Arquivo Excel (.xlsx)</Label>
                    <div className="flex gap-2">
                      <Input
                        ref={fileInputRef}
                        id="file"
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileSelect}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="icon"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {selectedFile && (
                  <Alert>
                    <FileSpreadsheet className="h-4 w-4" />
                    <AlertDescription>
                      Arquivo selecionado: <strong>{selectedFile.name}</strong> 
                      ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={uploadAndProcess}
                  disabled={!selectedFile || isUploading || !selectedDate}
                  className="w-full"
                >
                  {isUploading ? 'Processando...' : 'Enviar e Processar Planilha'}
                </Button>

                {uploadedData.length > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{uploadedData.length} registros</strong> processados com sucesso!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-6">
            {/* Report Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Gerar Relatório de Conferência
                </CardTitle>
                <CardDescription>
                  Selecione uma data para gerar o relatório comparativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="report-date">Data para Análise</Label>
                    <Input
                      id="report-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={generateReport}
                    disabled={isProcessing || !selectedDate}
                  >
                    {isProcessing ? 'Gerando...' : 'Gerar Relatório'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Report Results */}
            {conferenceReport && (
              <div className="space-y-6">
                {/* Total Vehicles Fueled Card */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Total de Veículos Abastecidos em {selectedDate.split('-').reverse().join('/')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {conferenceReport.rodaram_e_abasteceram.length + conferenceReport.abasteceram_nao_rodaram.length}
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      veículos registraram abastecimento nesta data
                    </p>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Rodaram e Abasteceram
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {conferenceReport.rodaram_e_abasteceram.length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Rodaram Não Abasteceram
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {conferenceReport.rodaram_nao_abasteceram.length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Abasteceram Não Rodaram
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {conferenceReport.abasteceram_nao_rodaram.length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button onClick={exportToExcel} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                  <Button onClick={exportToPDF} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>

                {/* Detailed Tables */}
                <Tabs defaultValue="ok" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="ok" className="text-green-700">
                      Rodaram e Abasteceram ({conferenceReport.rodaram_e_abasteceram.length})
                    </TabsTrigger>
                    <TabsTrigger value="missing-fuel" className="text-red-700">
                      Rodaram Não Abasteceram ({conferenceReport.rodaram_nao_abasteceram.length})
                    </TabsTrigger>
                    <TabsTrigger value="extra-fuel" className="text-orange-700">
                      Abasteceram Não Rodaram ({conferenceReport.abasteceram_nao_rodaram.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ok">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-green-700">Veículos em Conformidade</CardTitle>
                        <CardDescription>Veículos que rodaram e possuem registros de abastecimento</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Placa</TableHead>
                              <TableHead>Motorista</TableHead>
                              <TableHead>Operação</TableHead>
                              <TableHead>Rota Log</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Registros Combustível</TableHead>
                              <TableHead>Valor Solicitado</TableHead>
                              <TableHead>Litros (Interno)</TableHead>
                              <TableHead>Projetos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {conferenceReport.rodaram_e_abasteceram.map((item, index) => {
                              const totalValor = item.fuel_records.reduce((sum, f) => sum + (f.valor || 0), 0);
                              const totalLitros = item.fuel_records.reduce((sum, f) => sum + (f.litros || 0), 0);
                              return (
                              <TableRow key={index}>
                                <TableCell className="font-mono">{item.placa}</TableCell>
                                <TableCell>{item.motorista}</TableCell>
                                <TableCell>{item.operacao}</TableCell>
                                <TableCell className="font-mono text-xs">{item.rota_log || '-'}</TableCell>
                                <TableCell>{item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {item.fuel_records.length} registro(s)
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-semibold text-green-700">
                                  {totalValor > 0 ? `R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                </TableCell>
                                <TableCell className="font-semibold text-blue-700">
                                  {totalLitros > 0 ? `${totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L` : '-'}
                                </TableCell>
                                <TableCell>
                                  {item.fuel_records.map(f => f.projeto).filter(Boolean).join(', ')}
                                </TableCell>
                              </TableRow>
                            );})}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="missing-fuel">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-red-700">Veículos sem Abastecimento</CardTitle>
                        <CardDescription>Veículos que rodaram mas não possuem registros de abastecimento</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Placa</TableHead>
                              <TableHead>Motorista</TableHead>
                              <TableHead>Operação</TableHead>
                              <TableHead>Modelo</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Registros Combustível</TableHead>
                              <TableHead>Projetos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {conferenceReport.rodaram_nao_abasteceram.map((item, index) => (
                              <TableRow key={index} className="bg-red-50">
                                <TableCell className="font-mono">{item.placa}</TableCell>
                                <TableCell>{item.motorista}</TableCell>
                                <TableCell>{item.operacao}</TableCell>
                                <TableCell>{item.modelo}</TableCell>
                                <TableCell>{item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    0 registro(s)
                                  </Badge>
                                </TableCell>
                                <TableCell>-</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="extra-fuel">
                    {/* Dashboard Executivo - Bases Mais Ofensoras */}
                    {dashboardStats && (
                      <div className="mb-6 space-y-6">
                        {/* Cards de Resumo */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Total Registros</p>
                                  <p className="text-3xl font-bold text-red-700">{dashboardStats.totalRegistros}</p>
                                </div>
                                <AlertTriangle className="h-10 w-10 text-red-400" />
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Total em Cartões</p>
                                  <p className="text-2xl font-bold text-green-700">
                                    R$ {dashboardStats.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <DollarSign className="h-10 w-10 text-green-400" />
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Total Litros</p>
                                  <p className="text-2xl font-bold text-blue-700">
                                    {dashboardStats.totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                                  </p>
                                </div>
                                <Droplets className="h-10 w-10 text-blue-400" />
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Bases Envolvidas</p>
                                  <p className="text-3xl font-bold text-purple-700">{dashboardStats.totalBases}</p>
                                </div>
                                <Building2 className="h-10 w-10 text-purple-400" />
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Gráficos e Rankings */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Todas as Bases por Valor */}
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                Ranking Bases - Valor (Cartão)
                              </CardTitle>
                              <CardDescription>Gastos em cartão de combustível por base</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {dashboardStats.chartDataValor.length > 0 ? (
                                <div style={{ height: 320 }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={dashboardStats.chartDataValor}
                                        dataKey="valor"
                                        nameKey="base"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        innerRadius={45}
                                        label={({ base, percent }) => `${base} (${(percent * 100).toFixed(0)}%)`}
                                        labelLine={{ strokeWidth: 1 }}
                                        fontSize={11}
                                      >
                                        {dashboardStats.chartDataValor.map((_, index) => (
                                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip 
                                        content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                              <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                <p className="font-bold text-sm mb-1">{data.base}</p>
                                                <p className="text-green-700">Valor: R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <p className="text-gray-600">Veículos: {data.count}</p>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <p className="text-center text-muted-foreground py-8">Sem dados de valor</p>
                              )}
                              
                              {/* Lista completa */}
                              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                                {dashboardStats.todasBasesValor.map((item, idx) => (
                                  <div key={item.base} className="flex items-center justify-between text-sm border-b pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center" 
                                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}>
                                        {idx + 1}
                                      </span>
                                      <span className="font-medium text-xs">{item.base}</span>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                      <span className="font-bold text-green-700">
                                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                      <span className="text-muted-foreground text-xs bg-gray-100 px-2 py-1 rounded">
                                        {item.count} veículo{item.count !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Todas as Bases por Litros */}
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Droplets className="h-5 w-5 text-blue-600" />
                                Ranking Bases - Litros (Interno)
                              </CardTitle>
                              <CardDescription>Consumo em postos internos por base</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {dashboardStats.chartDataLitros.length > 0 ? (
                                <div style={{ height: 320 }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={dashboardStats.chartDataLitros}
                                        dataKey="litros"
                                        nameKey="base"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        innerRadius={45}
                                        label={({ base, percent }) => `${base} (${(percent * 100).toFixed(0)}%)`}
                                        labelLine={{ strokeWidth: 1 }}
                                        fontSize={11}
                                      >
                                        {dashboardStats.chartDataLitros.map((_, index) => (
                                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip 
                                        content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                              <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                <p className="font-bold text-sm mb-1">{data.base}</p>
                                                <p className="text-blue-700">Litros: {data.litros.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L</p>
                                                <p className="text-gray-600">Veículos: {data.count}</p>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <p className="text-center text-muted-foreground py-8">Sem dados de litros</p>
                              )}
                              
                              {/* Lista completa */}
                              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                                {dashboardStats.todasBasesLitros.map((item, idx) => (
                                  <div key={item.base} className="flex items-center justify-between text-sm border-b pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center" 
                                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}>
                                        {idx + 1}
                                      </span>
                                      <span className="font-medium text-xs">{item.base}</span>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                      <span className="font-bold text-blue-700">
                                        {item.litros.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                                      </span>
                                      <span className="text-muted-foreground text-xs bg-gray-100 px-2 py-1 rounded">
                                        {item.count} veículo{item.count !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Filtro por Base */}
                    <Card className="mb-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Filter className="h-5 w-5" />
                          Filtrar por Base
                        </CardTitle>
                        <CardDescription>Selecione uma base para ver o relatório detalhado</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 max-w-md">
                            <Select value={selectedBaseFilter} onValueChange={setSelectedBaseFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="Todas as bases" />
                              </SelectTrigger>
                              <SelectContent>
                                {dashboardStats?.todasBases?.map((base) => (
                                  <SelectItem key={base} value={base}>
                                    {base}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedBaseFilter && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedBaseFilter('')}
                              className="flex items-center gap-1"
                            >
                              <X className="h-4 w-4" />
                              Limpar Filtro
                            </Button>
                          )}
                        </div>

                        {/* Resumo da Base Selecionada */}
                        {selectedBaseStats && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg border border-pink-200">
                            <h4 className="font-bold text-lg text-pink-700 mb-3">
                              Relatório Detalhado: {selectedBaseStats.base}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500">Total de Registros</p>
                                <p className="text-2xl font-bold text-red-700">{selectedBaseStats.totalRegistros}</p>
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500">Total em Cartões</p>
                                <p className="text-xl font-bold text-green-700">
                                  R$ {selectedBaseStats.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500">Total em Litros</p>
                                <p className="text-xl font-bold text-blue-700">
                                  {selectedBaseStats.totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Placas Agrupadas por Base */}
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          Placas por Base
                        </CardTitle>
                        <CardDescription>Clique na base para ver as placas e enviar solicitação de justificativa via WhatsApp</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {placasPorBase.length > 0 ? (
                          <Accordion type="single" collapsible className="w-full">
                            {placasPorBase.map((baseData) => (
                              <AccordionItem key={baseData.base} value={baseData.base}>
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center justify-between w-full pr-4">
                                    <div className="flex items-center gap-3">
                                      <Building2 className="h-4 w-4 text-pink-600" />
                                      <span className="font-semibold">{baseData.base}</span>
                                      <Badge variant="secondary">{baseData.totalPlacas} placas</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      {baseData.totalValor > 0 && (
                                        <span className="text-green-600 font-medium">
                                          R$ {baseData.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                      )}
                                      {baseData.totalLitros > 0 && (
                                        <span className="text-blue-600 font-medium">
                                          {baseData.totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      {baseData.placas.map((placa) => (
                                        <Badge key={placa} variant="outline" className="font-mono">
                                          {placa}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="default"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleOpenWhatsappDialog(baseData.base)}
                                      >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        Enviar Justificativa via WhatsApp
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedBaseFilter(baseData.base);
                                        }}
                                      >
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filtrar Tabela
                                      </Button>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        ) : (
                          <p className="text-gray-500 text-center py-4">Nenhum registro para agrupar</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Dialog para enviar WhatsApp */}
                    <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                            Enviar Solicitação de Justificativa
                          </DialogTitle>
                          <DialogDescription>
                            Base: <strong>{selectedBaseForWhatsapp}</strong>
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="phone">Número do WhatsApp</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <Input
                                id="phone"
                                placeholder="(11) 99999-9999"
                                value={whatsappPhone}
                                onChange={(e) => setWhatsappPhone(e.target.value)}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Digite o número com DDD</p>
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium mb-2">Placas a serem justificadas:</p>
                            <div className="flex flex-wrap gap-1">
                              {placasPorBase.find(b => b.base === selectedBaseForWhatsapp)?.placas.map((placa) => (
                                <Badge key={placa} variant="secondary" className="font-mono text-xs">
                                  {placa}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setWhatsappDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleSendJustification}
                            disabled={!whatsappPhone || sendingWhatsapp}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {sendingWhatsapp ? (
                              <>Enviando...</>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Enviar via WhatsApp
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-orange-700 flex items-center justify-between">
                          <span>Abastecimentos sem Rota</span>
                          {selectedBaseFilter && (
                            <Badge variant="secondary" className="ml-2">
                              Filtrado: {selectedBaseFilter} ({filteredRecords.length} registros)
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {selectedBaseFilter 
                            ? `Registros da base ${selectedBaseFilter}` 
                            : 'Registros de abastecimento sem correspondência nas rotas'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Placa</TableHead>
                              <TableHead>Motorista</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Valor (Cartão)</TableHead>
                              <TableHead>Litros (Interno)</TableHead>
                              <TableHead>Base</TableHead>
                              <TableHead>Rota</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRecords.map((item, index) => (
                              <TableRow key={index} className="bg-orange-50">
                                <TableCell className="font-mono">{item.placa}</TableCell>
                                <TableCell>{item.motorista}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge variant={item.tipo === 'abastecimento' || item.tipo === 'posto_especifico' ? 'default' : 'secondary'}>
                                      {item.tipo === 'abastecimento' && 'Abastecimento'}
                                      {item.tipo === 'posto_especifico' && 'Posto Interno'}
                                      {item.tipo === 'solicitacao_cartao' && 'Solicitação Cartão'}
                                      {item.tipo === 'solicitacao_fuel_card' && 'Fuel Card'}
                                      {item.tipo === 'historico_geral' && 'Histórico Geral'}
                                    </Badge>
                                    {item.posto && (
                                      <span className="text-xs text-muted-foreground">{item.posto}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                <TableCell className="font-semibold text-green-700">
                                  {item.valor && item.valor > 0 ? `R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                </TableCell>
                                <TableCell className="font-semibold text-blue-700">
                                  {item.litros && item.litros > 0 ? `${item.litros.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L` : '-'}
                                </TableCell>
                                <TableCell>{item.projeto || '-'}</TableCell>
                                <TableCell className="text-xs">{item.rota || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayoutSimple>
  );
};

export default ConferenciaRotas;