import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileWarning, ArrowLeft, Eye, Calendar, Car, DollarSign } from 'lucide-react';
import { Link } from 'wouter';

const MultasGP03: React.FC = () => {
  const [multas] = useState([
    {
      id: 1,
      veiculo: 'ABC-1234',
      tipo: 'Excesso de Velocidade',
      valor: 195.23,
      data: '2025-07-10',
      local: 'Rodovia SP-348, Km 85',
      status: 'Pendente',
      motorista: 'João Silva'
    },
    {
      id: 2,
      veiculo: 'DEF-5678',
      tipo: 'Estacionamento Irregular',
      valor: 88.38,
      data: '2025-07-08',
      local: 'Rua das Flores, 123',
      status: 'Pago',
      motorista: 'Maria Santos'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago':
        return 'bg-green-100 text-green-800';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Vencido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/bases/gp03">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Multas</h1>
                <p className="text-gray-600">Base GP03 - Hortolandia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-indigo-700">
                <FileWarning className="w-5 h-5 mr-2" />
                Comunicados de Multas
              </CardTitle>
              <CardDescription>
                Visualize multas e infrações de trânsito dos veículos da Base GP03
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {multas.map((multa) => (
                  <Card key={multa.id} className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Car className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold text-gray-900">{multa.veiculo}</span>
                            <Badge className={getStatusColor(multa.status)}>
                              {multa.status}
                            </Badge>
                          </div>
                          
                          <h3 className="font-medium text-gray-900 mb-1">{multa.tipo}</h3>
                          <p className="text-sm text-gray-600 mb-2">Motorista: {multa.motorista}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span>{new Date(multa.data).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <span>R$ {multa.valor.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Local:</span>
                              <span>{multa.local}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {multas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileWarning className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma multa encontrada para esta base.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MultasGP03;