import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, Download, Calendar, Filter, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface VehicleRouteData {
  data: string;
  placa: string;
  motorista: string;
  operacao?: string;
  modelo?: string;
}

interface FuelRecord {
  data: string;
  placa: string;
  motorista: string;
  projeto?: string;
  tipo: 'abastecimento' | 'solicitacao';
}

interface ConferenceReport {
  rodaram_e_abasteceram: (VehicleRouteData & { fuel_records: FuelRecord[] })[];
  rodaram_nao_abasteceram: VehicleRouteData[];
  abasteceram_nao_rodaram: FuelRecord[];
}

const ConferenciaRotas: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedData, setUploadedData] = useState<VehicleRouteData[]>([]);
  const [conferenceReport, setConferenceReport] = useState<ConferenceReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const processedData: VehicleRouteData[] = jsonData.map((row: any) => ({
            data: row.data || row.Data || row.DATA || '',
            placa: row.placa || row.Placa || row.PLACA || '',
            motorista: row.motorista || row.Motorista || row.MOTORISTA || '',
            operacao: row.operacao || row.Operacao || row.OPERACAO || row.operação || row.Operação || row.OPERAÇÃO || '',
            modelo: row.modelo || row.Modelo || row.MODELO || '',
          }));

          const validData = processedData.filter(item => 
            item.data && item.placa && item.motorista
          );

          if (validData.length === 0) {
            reject(new Error('Nenhum dado válido encontrado na planilha. Verifique se as colunas estão nomeadas corretamente: data, placa, motorista, operacao, modelo'));
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
      // Processar arquivo Excel
      const excelData = await processExcelFile(selectedFile);
      setUploadedData(excelData);

      // Enviar dados para o backend
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('data', JSON.stringify(excelData));
      formData.append('upload_date', selectedDate);

      const response = await fetch('/api/conferencia-rotas/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro no upload: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Upload realizado com sucesso!",
        description: `${excelData.length} registros processados para a data ${selectedDate}`,
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
  }, [selectedFile, selectedDate, processExcelFile, toast]);

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

  const exportToExcel = useCallback(() => {
    if (!conferenceReport) return;

    const workbook = XLSX.utils.book_new();

    // Planilha 1: Rodaram e Abasteceram
    const sheet1Data = conferenceReport.rodaram_e_abasteceram.map(item => ({
      Data: item.data,
      Placa: item.placa,
      Motorista: item.motorista,
      Operação: item.operacao || '',
      Modelo: item.modelo || '',
      'Registros Combustível': item.fuel_records.length,
      Projetos: item.fuel_records.map(f => f.projeto).filter(Boolean).join(', ')
    }));
    const worksheet1 = XLSX.utils.json_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'Rodaram e Abasteceram');

    // Planilha 2: Rodaram mas Não Abasteceram
    const sheet2Data = conferenceReport.rodaram_nao_abasteceram.map(item => ({
      Data: item.data,
      Placa: item.placa,
      Motorista: item.motorista,
      Operação: item.operacao || '',
      Modelo: item.modelo || ''
    }));
    const worksheet2 = XLSX.utils.json_to_sheet(sheet2Data);
    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Rodaram Não Abasteceram');

    // Planilha 3: Abasteceram mas Não Rodaram
    const sheet3Data = conferenceReport.abasteceram_nao_rodaram.map(item => ({
      Data: item.data,
      Placa: item.placa,
      Motorista: item.motorista,
      Projeto: item.projeto || '',
      Tipo: item.tipo === 'abastecimento' ? 'Abastecimento' : 'Solicitação'
    }));
    const worksheet3 = XLSX.utils.json_to_sheet(sheet3Data);
    XLSX.utils.book_append_sheet(workbook, worksheet3, 'Abasteceram Não Rodaram');

    // Salvar arquivo
    XLSX.writeFile(workbook, `conferencia_rotas_${selectedDate}.xlsx`);

    toast({
      title: "Excel exportado!",
      description: "Arquivo baixado com sucesso.",
    });
  }, [conferenceReport, selectedDate, toast]);

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
        item.fuel_records.length.toString()
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Placa', 'Motorista', 'Operação', 'Registros Combustível']],
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
        item.operacao || ''
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Placa', 'Motorista', 'Operação']],
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
        item.projeto || '',
        item.tipo === 'abastecimento' ? 'Abastecimento' : 'Solicitação'
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Placa', 'Motorista', 'Projeto', 'Tipo']],
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
                              <TableHead>Modelo</TableHead>
                              <TableHead>Registros Combustível</TableHead>
                              <TableHead>Projetos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {conferenceReport.rodaram_e_abasteceram.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono">{item.placa}</TableCell>
                                <TableCell>{item.motorista}</TableCell>
                                <TableCell>{item.operacao}</TableCell>
                                <TableCell>{item.modelo}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {item.fuel_records.length} registro(s)
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {item.fuel_records.map(f => f.projeto).filter(Boolean).join(', ')}
                                </TableCell>
                              </TableRow>
                            ))}
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
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {conferenceReport.rodaram_nao_abasteceram.map((item, index) => (
                              <TableRow key={index} className="bg-red-50">
                                <TableCell className="font-mono">{item.placa}</TableCell>
                                <TableCell>{item.motorista}</TableCell>
                                <TableCell>{item.operacao}</TableCell>
                                <TableCell>{item.modelo}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="extra-fuel">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-orange-700">Abastecimentos sem Rota</CardTitle>
                        <CardDescription>Registros de abastecimento sem correspondência nas rotas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Placa</TableHead>
                              <TableHead>Motorista</TableHead>
                              <TableHead>Projeto</TableHead>
                              <TableHead>Tipo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {conferenceReport.abasteceram_nao_rodaram.map((item, index) => (
                              <TableRow key={index} className="bg-orange-50">
                                <TableCell className="font-mono">{item.placa}</TableCell>
                                <TableCell>{item.motorista}</TableCell>
                                <TableCell>{item.projeto}</TableCell>
                                <TableCell>
                                  <Badge variant={item.tipo === 'abastecimento' ? 'default' : 'secondary'}>
                                    {item.tipo === 'abastecimento' ? 'Abastecimento' : 'Solicitação'}
                                  </Badge>
                                </TableCell>
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