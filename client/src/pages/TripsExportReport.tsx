import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, FileJson, Filter, RefreshCw, Truck, MapPin, Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Viagem {
  Data: string;
  Placa: string;
  Rota: string;
  Valor: number;
}

interface ViagensResponse {
  data: Viagem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Stats {
  total_viagens: number;
  total_veiculos: number;
  total_rotas: number;
  valor_total: number;
  valor_medio: number;
  valor_minimo: number;
  valor_maximo: number;
}

export default function TripsExportReport() {
  const [filters, setFilters] = useState({
    data_inicio: "",
    data_fim: "",
    placa: "",
    rota: "",
    valor_min: "",
    valor_max: "",
  });
  const [page, setPage] = useState(1);
  const limit = 50;

  const buildQueryString = (format?: string, allRecords?: boolean) => {
    const params = new URLSearchParams();
    if (filters.data_inicio) params.append("data_inicio", filters.data_inicio);
    if (filters.data_fim) params.append("data_fim", filters.data_fim);
    if (filters.placa) params.append("placa", filters.placa);
    if (filters.rota) params.append("rota", filters.rota);
    if (filters.valor_min) params.append("valor_min", filters.valor_min);
    if (filters.valor_max) params.append("valor_max", filters.valor_max);
    if (!allRecords) {
      params.append("page", page.toString());
      params.append("limit", limit.toString());
    } else {
      params.append("limit", "10000");
    }
    if (format) params.append("format", format);
    return params.toString();
  };

  const { data, isLoading, refetch } = useQuery<ViagensResponse>({
    queryKey: ["/api/viagens/export", filters, page],
    queryFn: async () => {
      const res = await fetch(`/api/viagens/export?${buildQueryString()}`);
      if (!res.ok) throw new Error("Erro ao carregar viagens");
      return res.json();
    },
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/viagens/stats", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.data_inicio) params.append("data_inicio", filters.data_inicio);
      if (filters.data_fim) params.append("data_fim", filters.data_fim);
      if (filters.placa) params.append("placa", filters.placa);
      if (filters.rota) params.append("rota", filters.rota);
      const res = await fetch(`/api/viagens/stats?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar estatísticas");
      return res.json();
    },
  });

  const handleExportCSV = () => {
    window.open(`/api/viagens/export?${buildQueryString("csv", true)}`, "_blank");
  };

  const handleExportExcel = () => {
    window.open(`/api/viagens/export?${buildQueryString("excel", true)}`, "_blank");
  };

  const handleExportJSON = async () => {
    const res = await fetch(`/api/viagens/export?${buildQueryString("json", true)}`);
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "viagens_export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const clearFilters = () => {
    setFilters({
      data_inicio: "",
      data_fim: "",
      placa: "",
      rota: "",
      valor_min: "",
      valor_max: "",
    });
    setPage(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatório de Viagens</h1>
          <p className="text-muted-foreground">Exportação de registros individuais de viagens</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button onClick={handleExportJSON} variant="outline" className="gap-2">
            <FileJson className="h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Viagens</p>
                <p className="text-2xl font-bold">{stats?.total_viagens || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Veículos</p>
                <p className="text-2xl font-bold">{stats?.total_veiculos || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rotas</p>
                <p className="text-2xl font-bold">{stats?.total_rotas || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.valor_total || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={filters.data_inicio}
                onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filters.data_fim}
                onChange={(e) => setFilters({ ...filters, data_fim: e.target.value })}
              />
            </div>
            <div>
              <Label>Placa</Label>
              <Input
                placeholder="Ex: SUV2B70"
                value={filters.placa}
                onChange={(e) => setFilters({ ...filters, placa: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label>Rota</Label>
              <Input
                placeholder="Ex: Betim"
                value={filters.rota}
                onChange={(e) => setFilters({ ...filters, rota: e.target.value })}
              />
            </div>
            <div>
              <Label>Valor Mín (R$)</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.valor_min}
                onChange={(e) => setFilters({ ...filters, valor_min: e.target.value })}
              />
            </div>
            <div>
              <Label>Valor Máx (R$)</Label>
              <Input
                type="number"
                placeholder="1000"
                value={filters.valor_max}
                onChange={(e) => setFilters({ ...filters, valor_max: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => { setPage(1); refetch(); }} className="gap-2">
              <Filter className="h-4 w-4" />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Viagens Individuais
            {data?.pagination && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({data.pagination.total} registros)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.map((viagem, index) => (
                      <TableRow key={index}>
                        <TableCell>{viagem.Data}</TableCell>
                        <TableCell className="font-mono font-medium">{viagem.Placa}</TableCell>
                        <TableCell>{viagem.Rota}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(viagem.Valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.data || data.data.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhuma viagem encontrada com os filtros selecionados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {data.pagination.page} de {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
