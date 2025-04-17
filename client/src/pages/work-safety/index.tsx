import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, CheckCircle, Clock, LineChart, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WorkSafetyPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <ShieldCheck className="mr-2 h-8 w-8" />
                Segurança do Trabalho
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestão de segurança ocupacional e treinamentos
              </p>
            </div>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Novo Relatório de Segurança
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">98.5%</CardTitle>
                <CardDescription>Índice de Conformidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-secondary rounded-full h-2 mt-1">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">143</CardTitle>
                <CardDescription>Dias sem acidentes</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">96%</CardTitle>
                <CardDescription>Treinamentos em Dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-secondary rounded-full h-2 mt-1">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">3</CardTitle>
                <CardDescription>Inspeções Pendentes</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Estatísticas de Segurança
                </CardTitle>
                <CardDescription>
                  Indicadores de desempenho em segurança
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Índice de Frequência de Acidentes</span>
                      <span className="text-sm font-bold text-green-600">0.8 ↓</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Meta: &lt; 1.0</span>
                      <span>Média do setor: 2.3</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Índice de Gravidade</span>
                      <span className="text-sm font-bold text-green-600">3.2 ↓</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Meta: &lt; 5.0</span>
                      <span>Média do setor: 8.7</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Quase Acidentes Reportados</span>
                      <span className="text-sm font-bold text-amber-600">12 ↑</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div className="bg-amber-500 h-3 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Meta: &gt; 15</span>
                      <span>Período anterior: 8</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Próximos Treinamentos
                </CardTitle>
                <CardDescription>
                  Capacitações agendadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      title: 'Direção Defensiva',
                      date: '25/04/2025',
                      participants: 42,
                      status: 'Confirmado'
                    },
                    {
                      id: 2,
                      title: 'Primeiros Socorros',
                      date: '03/05/2025',
                      participants: 28,
                      status: 'Agendado'
                    },
                    {
                      id: 3,
                      title: 'Reciclagem NR-11',
                      date: '12/05/2025',
                      participants: 15,
                      status: 'Aguardando aprovação'
                    }
                  ].map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{item.date}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{item.participants}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Confirmado' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'Agendado'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Checklist de Conformidade
              </CardTitle>
              <CardDescription>
                Requisitos de segurança aplicáveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 1, name: 'Documentação de Motoristas', status: 'Conforme', lastUpdate: '10/04/2025', responsável: 'José Silva' },
                  { id: 2, name: 'Extintores e Equipamentos', status: 'Conforme', lastUpdate: '05/04/2025', responsável: 'Ana Souza' },
                  { id: 3, name: 'EPI - Equipamentos de Proteção', status: 'Atenção', lastUpdate: '01/04/2025', responsável: 'Carlos Oliveira' },
                  { id: 4, name: 'Sinalização de Segurança', status: 'Conforme', lastUpdate: '08/04/2025', responsável: 'Marina Lima' },
                  { id: 5, name: 'Treinamentos Obrigatórios', status: 'Conforme', lastUpdate: '11/04/2025', responsável: 'Pedro Santos' },
                  { id: 6, name: 'Inspeções de Veículos', status: 'Não Conforme', lastUpdate: '02/04/2025', responsável: 'Fernanda Costa' }
                ].map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Conforme' 
                          ? 'bg-green-100 text-green-800' 
                          : item.status === 'Atenção'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Atualizado em {item.lastUpdate}
                    </div>
                    <div className="mt-1 text-xs">
                      Responsável: {item.responsável}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}