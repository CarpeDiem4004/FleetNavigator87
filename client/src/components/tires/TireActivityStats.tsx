import React, { useEffect, useState } from 'react';
import { getTireActivityStats } from '@/services/tireActivityLogService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Wrench, Truck, Trash2, ArrowDownUp, UserCircle } from 'lucide-react';

export default function TireActivityStats() {
  const [stats, setStats] = useState<{
    totalMontagens: number;
    totalRemocoes: number;
    totalDescartes: number;
    totalManutencoes: number;
    usuariosMaisAtivos: { usuario_nome: string; total: number }[];
  }>({
    totalMontagens: 0,
    totalRemocoes: 0,
    totalDescartes: 0,
    totalManutencoes: 0,
    usuariosMaisAtivos: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);
        const activityStats = await getTireActivityStats();
        setStats(activityStats);
      } catch (err) {
        console.error('Erro ao carregar estatísticas de atividades:', err);
        setError('Não foi possível carregar as estatísticas');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  // Preparar dados para o gráfico de pizza
  const pieChartData = [
    { name: 'Montagens', value: stats.totalMontagens, color: '#22c55e' },
    { name: 'Remoções', value: stats.totalRemocoes, color: '#f59e0b' },
    { name: 'Descartes', value: stats.totalDescartes, color: '#ef4444' },
    { name: 'Manutenções', value: stats.totalManutencoes, color: '#3b82f6' }
  ];
  
  // Preparar dados para o gráfico de barras de usuários
  const userBarData = stats.usuariosMaisAtivos.map(user => ({
    name: user.usuario_nome.split(' ')[0], // Apenas o primeiro nome para o gráfico
    total: user.total,
    fullName: user.usuario_nome // Nome completo para o tooltip
  }));

  // Calcular o total de operações
  const totalOperacoes = pieChartData.reduce((acc, curr) => acc + curr.value, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Estatísticas de Operações de Pneus</CardTitle>
        <CardDescription>Visão geral das atividades realizadas com pneus</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="charts" className="flex-1">Gráficos</TabsTrigger>
            <TabsTrigger value="details" className="flex-1">Detalhes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="charts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gráfico de pizza das operações */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Distribuição de Operações</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {totalOperacoes > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} operações`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-[300px] text-muted-foreground">
                      Nenhuma operação registrada
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Gráfico de barras dos usuários mais ativos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    <UserCircle className="h-5 w-5 inline-block mr-2" />
                    Usuários Mais Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {userBarData.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userBarData}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name, props) => 
                              [`${value} operações`, props.payload.fullName]
                            } 
                          />
                          <Legend />
                          <Bar dataKey="total" name="Operações" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-[300px] text-muted-foreground">
                      Nenhum usuário registrou operações
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="space-y-6">
              {/* Montagens */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-green-500" />
                  <h3 className="text-lg font-medium">Montagens de Pneus</h3>
                  <span className="ml-auto font-bold">{stats.totalMontagens}</span>
                </div>
                <Progress 
                  value={(stats.totalMontagens / (totalOperacoes || 1)) * 100} 
                  className="h-2 bg-muted" 
                />
              </div>
              
              {/* Remoções */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <ArrowDownUp className="h-5 w-5 mr-2 text-amber-500" />
                  <h3 className="text-lg font-medium">Remoções de Pneus</h3>
                  <span className="ml-auto font-bold">{stats.totalRemocoes}</span>
                </div>
                <Progress 
                  value={(stats.totalRemocoes / (totalOperacoes || 1)) * 100} 
                  className="h-2 bg-muted" 
                />
              </div>
              
              {/* Manutenções */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Wrench className="h-5 w-5 mr-2 text-blue-500" />
                  <h3 className="text-lg font-medium">Manutenções</h3>
                  <span className="ml-auto font-bold">{stats.totalManutencoes}</span>
                </div>
                <Progress 
                  value={(stats.totalManutencoes / (totalOperacoes || 1)) * 100} 
                  className="h-2 bg-muted" 
                />
              </div>
              
              {/* Descartes */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-red-500" />
                  <h3 className="text-lg font-medium">Descartes</h3>
                  <span className="ml-auto font-bold">{stats.totalDescartes}</span>
                </div>
                <Progress 
                  value={(stats.totalDescartes / (totalOperacoes || 1)) * 100} 
                  className="h-2 bg-muted" 
                  indicatorClassName="bg-red-500" 
                />
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">
                  <UserCircle className="h-5 w-5 inline-block mr-2" />
                  Top Usuários
                </h3>
                
                {stats.usuariosMaisAtivos.length > 0 ? (
                  <div className="space-y-3">
                    {stats.usuariosMaisAtivos.map((user, index) => (
                      <div key={index} className="flex items-center">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span className="ml-2 flex-1 truncate">{user.usuario_nome}</span>
                        <span className="font-medium">{user.total}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum usuário registrou operações
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}