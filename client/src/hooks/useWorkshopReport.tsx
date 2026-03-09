import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

interface WorkshopReportData {
  id: number;
  source: string;
  vehiclePlate: string;
  serviceDescription: string;
  status: string;
  priority: string;
  entryDate: string;
  estimatedCompletion?: string;
  completionDate?: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
}

interface WorkshopInfo {
  id: number;
  name: string;
  cnpj: string;
}

interface ReportResponse {
  success: boolean;
  workshop: WorkshopInfo;
  data: WorkshopReportData[];
  summary: {
    totalRecords: number;
    totalLaborCost: number;
    totalPartsCost: number;
    totalCost: number;
  };
}

export function useWorkshopReport() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const downloadReport = async (workshopId: number, token: string, workshopName: string) => {
    try {
      setIsDownloading(true);
      
      const response = await fetch(`/api/maintenance/workshop/${workshopId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }
      
      const reportData: ReportResponse = await response.json();
      
      if (reportData.success && reportData.data.length > 0) {
        // Criar CSV para download
        const csvHeaders = [
          'ID',
          'Fonte',
          'Data Entrada',
          'Placa',
          'Descrição do Serviço', 
          'Status',
          'Prioridade',
          'Data Previsão',
          'Data Conclusão',
          'Mão de Obra (R$)',
          'Valor Peças (R$)',
          'Valor Total (R$)'
        ];
        
        const csvRows = reportData.data.map(item => [
          item.id,
          item.source === 'maintenance' ? 'Manutenção' : 'Recepção',
          item.entryDate ? new Date(item.entryDate).toLocaleDateString('pt-BR') : '',
          item.vehiclePlate || '',
          item.serviceDescription || '',
          item.status || '',
          item.priority || '',
          item.estimatedCompletion ? new Date(item.estimatedCompletion).toLocaleDateString('pt-BR') : '',
          item.completionDate ? new Date(item.completionDate).toLocaleDateString('pt-BR') : '',
          item.laborCost.toFixed(2),
          item.partsCost.toFixed(2),
          item.totalCost.toFixed(2)
        ]);
        
        // Adicionar linha de resumo
        const summaryRow = [
          '',
          'RESUMO TOTAL',
          '',
          '',
          `${reportData.summary.totalRecords} registros`,
          '',
          '',
          '',
          '',
          reportData.summary.totalLaborCost.toFixed(2),
          reportData.summary.totalPartsCost.toFixed(2),
          reportData.summary.totalCost.toFixed(2)
        ];
        
        const csvContent = [csvHeaders, ...csvRows, [], summaryRow]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        
        // Download do arquivo CSV
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const fileName = `relatório-${workshopName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', fileName);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Relatório baixado com sucesso!",
          description: `${reportData.data.length} registros exportados. Total: R$ ${reportData.summary.totalCost.toFixed(2)}`,
        });
        
        return reportData;
      } else {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há registros de manutenção para exportar no momento.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      toast({
        title: "Erro ao baixar relatório",
        description: "Não foi possível gerar o relatório. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadReport,
    isDownloading
  };
}