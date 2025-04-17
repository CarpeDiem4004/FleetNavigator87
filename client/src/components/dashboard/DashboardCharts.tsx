import React from 'react';
import { DashboardData } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardChartsProps {
  data: DashboardData;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Disponibilidade da Frota</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.fleetAvailability}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[75, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Disponibilidade"
                  stroke="#0ea5e9"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Meta"
                  stroke="#f43f5e"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Custo por Km (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.costPerKm}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[1, 2.5]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Custo"
                  stroke="#8b5cf6"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Meta"
                  stroke="#f43f5e"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tempo Médio de Manutenção (dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.maintenanceTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Tempo"
                  stroke="#f97316"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Meta"
                  stroke="#f43f5e"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Eficiência de Combustível (km/l)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.fuelEfficiency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[2, 5]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Eficiência"
                  stroke="#10b981"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Meta"
                  stroke="#f43f5e"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quilometragem por Base (Comparativo Mensal)</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bar">
            <TabsList className="mb-4">
              <TabsTrigger value="bar">Barras</TabsTrigger>
              <TabsTrigger value="line">Linha</TabsTrigger>
            </TabsList>
            <TabsContent value="bar">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data.kmPerBase}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="base" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="currentMonth" name="Mês Atual" fill="#3b82f6" />
                  <Bar dataKey="previousMonth" name="Mês Anterior" fill="#93c5fd" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="line">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={data.kmPerBase}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="base" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="currentMonth" name="Mês Atual" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="previousMonth" name="Mês Anterior" stroke="#93c5fd" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardCharts;