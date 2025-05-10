import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";

interface PostoAdminSummaryCardsProps {
  data: any[];
  isLoading: boolean;
}

/**
 * Componente que exibe cards de resumo para a tela administrativa de postos
 * Segue o layout específico mostrado na imagem de referência
 */
const PostoAdminSummaryCards: React.FC<PostoAdminSummaryCardsProps> = ({ 
  data,
  isLoading
}) => {
  // Estatísticas para os cards de resumo
  const estatisticas = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalRegistros: 0,
        totalLitros: 0,
        totalValor: 0,
        veiculosUnicos: 0,
        dieselCount: 0,
        arlaCount: 0
      };
    }
    
    const totalLitros = data.reduce((sum, item) => 
      sum + (Number(item.litros || item.quantidade_litros || item.quantity_litros) || 0), 0);
    
    const totalValor = data.reduce((sum, item) => 
      sum + (Number(item.valor_total) || 0), 0);
    
    const dieselCount = data.filter(item => 
      item.tipo_combustivel?.toLowerCase() === 'diesel').length;
    
    const arlaCount = data.filter(item => 
      item.tipo_combustivel?.toLowerCase() === 'arla').length;
    
    const placasUnicas = new Set(data.map(item => item.placa));
    
    return {
      totalRegistros: data.length,
      totalLitros: totalLitros.toFixed(2),
      totalValor: totalValor.toFixed(2),
      veiculosUnicos: placasUnicas.size,
      dieselCount,
      arlaCount
    };
  }, [data]);

  // Função para formatar valores monetários
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(valor);
  };
  
  return (
    <Card className="flex flex-wrap justify-between p-4">
      {/* Layout similar ao da imagem de referência */}
      <div className="flex flex-col items-center p-2 min-w-[80px]">
        <div className="text-xs text-slate-600 mb-1">Registros</div>
        <div className="text-lg font-bold text-blue-700">{estatisticas.totalRegistros}</div>
      </div>
      
      <div className="flex flex-col items-center p-2 min-w-[120px]">
        <div className="text-xs text-slate-600 mb-1">Total de Litros</div>
        <div className="text-lg font-bold text-green-700">{estatisticas.totalLitros}</div>
      </div>
      
      <div className="flex flex-col items-center p-2 min-w-[120px]">
        <div className="text-xs text-slate-600 mb-1">Valor Total</div>
        <div className="text-lg font-bold text-amber-700">
          R$ {parseFloat(estatisticas.totalValor).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
      </div>
      
      <div className="flex flex-col items-center p-2 min-w-[80px]">
        <div className="text-xs text-slate-600 mb-1">Veículos</div>
        <div className="text-lg font-bold text-purple-700">{estatisticas.veiculosUnicos}</div>
      </div>
      
      <div className="flex flex-col items-center p-2 min-w-[80px]">
        <div className="text-xs text-slate-600 mb-1">Diesel</div>
        <div className="text-lg font-bold text-blue-700">{estatisticas.dieselCount}</div>
      </div>
      
      <div className="flex flex-col items-center p-2 min-w-[80px]">
        <div className="text-xs text-slate-600 mb-1">ARLA</div>
        <div className="text-lg font-bold text-cyan-700">{estatisticas.arlaCount}</div>
      </div>
    </Card>
  );
};

export default PostoAdminSummaryCards;