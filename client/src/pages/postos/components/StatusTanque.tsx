import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel, Droplets } from 'lucide-react';

interface TanqueProps {
  tipo: 'Diesel' | 'ARLA';
  capacidade: number;
  atual: number;
  ultimoRecebimento?: string;
}

const StatusTanque: React.FC<TanqueProps> = ({ tipo, capacidade, atual, ultimoRecebimento }) => {
  const percentual = Math.round((atual / capacidade) * 100);
  const dataFormatada = ultimoRecebimento 
    ? new Date(ultimoRecebimento).toLocaleDateString('pt-BR') 
    : 'Não registrado';
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className={`py-3 ${tipo === 'Diesel' ? 'bg-amber-100' : 'bg-blue-100'}`}>
        <CardTitle className="flex items-center gap-2 text-base">
          {tipo === 'Diesel' ? (
            <Fuel className="h-4 w-4" />
          ) : (
            <Droplets className="h-4 w-4" />
          )}
          Tanque de {tipo}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span>Capacidade:</span>
            <span className="font-medium">{capacidade.toLocaleString('pt-BR')} litros</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Volume atual:</span>
            <span className="font-medium">{atual.toLocaleString('pt-BR')} litros</span>
          </div>
          
          <div className="mt-1 space-y-1">
            <Progress value={percentual} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>{percentual}%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t flex justify-between text-xs text-muted-foreground">
            <span>Último recebimento:</span>
            <span>{dataFormatada}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusTanque;