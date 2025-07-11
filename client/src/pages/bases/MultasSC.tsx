import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, ArrowLeft, Eye, Calendar, MapPin, Car, Clock, AlertCircle } from "lucide-react";
import { Link } from 'wouter';

const MultasSC: React.FC = () => {
  // Dados simulados de multas - em produção viriam da API
  const [multas] = useState([
    {
      id: 1,
      placa: 'ABC1234',
      veiculo: 'Honda Civic',
      motorista: 'João Silva',
      infracao: 'Excesso de velocidade',
      valor: 195.23,
      data: '2025-07-05',
      local: 'Av. Paulista, 1000 - São Paulo/SP',
      status: 'pendente',
      pontos: 5,
      orgao: 'DETRAN-SP'
    },
    {
      id: 2,
      placa: 'XYZ5678',
      veiculo: 'Toyota Corolla',
      motorista: 'Maria Santos',
      infracao: 'Estacionamento proibido',
      valor: 88.38,
      data: '2025-07-03',
      local: 'Rua Augusta, 500 - São Paulo/SP',
      status: 'pago',
      pontos: 3,
      orgao: 'CET-SP'
    },
    {
      id: 3,
      placa: 'DEF9012',
      veiculo: 'Ford Ka',
      motorista: 'Carlos Oliveira',
      infracao: 'Avanço de sinal vermelho',
      valor: 293.47,
      data: '2025-07-01',
      local: 'Av. Faria Lima, 2000 - São Paulo/SP',
      status: 'contestado',
      pontos: 7,
      orgao: 'DETRAN-SP'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pago':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'contestado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'pago':
        return 'Pago';
      case 'contestado':
        return 'Contestado';
      default:
        return 'Desconhecido';
    }
  };

  const totalPendentes = multas.filter(multa => multa.status === 'pendente').length;
  const valorTotalPendente = multas
    .filter(multa => multa.status === 'pendente')
    .reduce((total, multa) => total + multa.valor, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link href="/bases/sc">
            <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Base SC
            </Button>
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <DollarSign className="h-10 w-10 text-yellow-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Gestão de Multas
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Base SC (Ribeirão Preto) SSP4
            </p>
          </div>
        </div>

        {/* Resumo das Multas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Multas</p>
                  <p className="text-2xl font-bold text-gray-900">{multas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPendentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Pendente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {valorTotalPendente.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Multas */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">
              Comunicados de Multas e Infrações
            </CardTitle>
            <CardDescription className="text-gray-600">
              Multas e infrações de trânsito enviadas pela Gestão de Multas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {multas.length === 0 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <Eye className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  Nenhuma multa encontrada para esta base no momento.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {multas.map((multa) => (
                  <Card key={multa.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(multa.status)}>
                              {getStatusText(multa.status)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {multa.orgao}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">
                                <strong>{multa.placa}</strong> - {multa.veiculo}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">
                                {new Date(multa.data).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-gray-700">
                              <strong>Motorista:</strong> {multa.motorista}
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong>Infração:</strong> {multa.infracao}
                            </p>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">
                                {multa.local}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <div className="text-lg font-bold text-gray-900">
                            R$ {multa.valor.toFixed(2).replace('.', ',')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {multa.pontos} pontos
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Importantes */}
        <Card className="mt-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <strong>Importante:</strong> Os comunicados de multas são enviados automaticamente pela Gestão de Multas. 
                Em caso de dúvidas ou contestações, entre em contato com o setor responsável.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MultasSC;