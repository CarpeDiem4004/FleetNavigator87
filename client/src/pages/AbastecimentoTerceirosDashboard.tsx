import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Download, LogOut, Fuel, Building2, TrendingUp, FileText, Eye, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface User {
  id: number;
  cnpj: string;
  empresaId: number;
  empresaNome: string;
}

interface DashboardData {
  empresa: {
    nome: string;
    cnpj: string;
  };
  estatisticas: {
    totalAbastecimentos: number;
    totalLitros: number;
    totalValor: number;
  };
  abastecimentos: Abastecimento[];
}

interface Abastecimento {
  id: number;
  motorista_nome: string;
  veiculo_placa: string;
  litros: number;
  valor: number;
  nota_fiscal_url: string | null;
  data_abastecimento: string;
  observacoes: string | null;
}

export default function AbastecimentoTerceirosDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    motoristaNome: '',
    veiculoPlaca: '',
    litros: '',
    valor: '',
    observacoes: ''
  });
  const [notaFiscalFile, setNotaFiscalFile] = useState<File | null>(null);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const token = localStorage.getItem('terceiros_token');
    const userData = localStorage.getItem('terceiros_user');

    if (!token || !userData) {
      setLocation('/terceiros/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      fetchDashboardData();
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      handleLogout();
    }
  }, [setLocation]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('terceiros_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('terceiros_token');
      const response = await fetch('/api/terceiros/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar dashboard');
      }

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('terceiros_token');
    localStorage.removeItem('terceiros_user');
    setLocation('/terceiros/login');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      setNotaFiscalFile(file);
    }
  };

  const handleSubmitAbastecimento = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.motoristaNome || !formData.veiculoPlaca || !formData.litros || !formData.valor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('terceiros_token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('motoristaNome', formData.motoristaNome);
      formDataToSend.append('veiculoPlaca', formData.veiculoPlaca.toUpperCase());
      formDataToSend.append('litros', formData.litros);
      formDataToSend.append('valor', formData.valor);
      if (formData.observacoes) {
        formDataToSend.append('observacoes', formData.observacoes);
      }
      if (notaFiscalFile) {
        formDataToSend.append('notaFiscal', notaFiscalFile);
      }

      const response = await fetch('/api/terceiros/abastecimentos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar abastecimento');
      }

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Abastecimento registrado com sucesso!",
        });

        // Limpar formulário
        setFormData({
          motoristaNome: '',
          veiculoPlaca: '',
          litros: '',
          valor: '',
          observacoes: ''
        });
        setNotaFiscalFile(null);
        setIsCreating(false);

        // Recarregar dados
        await fetchDashboardData();
      }

    } catch (error) {
      console.error('Erro ao registrar abastecimento:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportRelatorio = async () => {
    try {
      const token = localStorage.getItem('terceiros_token');
      const response = await fetch('/api/terceiros/relatorio/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `relatorio_abastecimentos_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatLiters = (value: number) => {
    return `${value.toFixed(3)} L`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Erro ao carregar dados</p>
              <Button onClick={() => setLocation('/terceiros/login')}>
                Voltar ao Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Fuel className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {dashboardData.empresa.nome}
                  </h1>
                  <p className="text-sm text-gray-600">
                    CNPJ: {dashboardData.empresa.cnpj}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Abastecimentos
              </CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.estatisticas.totalAbastecimentos}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Litros
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatLiters(dashboardData.estatisticas.totalLitros)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Valor Total
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData.estatisticas.totalValor)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Registros de Abastecimento
          </h2>
          <div className="flex space-x-3">
            <Button onClick={handleExportRelatorio} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
            
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Abastecimento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Novo Abastecimento</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do abastecimento realizado
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitAbastecimento} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="motoristaNome">Nome do Motorista *</Label>
                      <Input
                        id="motoristaNome"
                        name="motoristaNome"
                        value={formData.motoristaNome}
                        onChange={handleInputChange}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="veiculoPlaca">Placa do Veículo *</Label>
                      <Input
                        id="veiculoPlaca"
                        name="veiculoPlaca"
                        value={formData.veiculoPlaca}
                        onChange={handleInputChange}
                        placeholder="ABC-1234"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="litros">Litros *</Label>
                      <Input
                        id="litros"
                        name="litros"
                        type="number"
                        step="0.001"
                        value={formData.litros}
                        onChange={handleInputChange}
                        placeholder="0.000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor (R$) *</Label>
                      <Input
                        id="valor"
                        name="valor"
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input
                      id="observacoes"
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleInputChange}
                      placeholder="Observações adicionais (opcional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notaFiscal">Nota Fiscal (imagem)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="notaFiscal"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      <Upload className="h-4 w-4 text-gray-400" />
                    </div>
                    {notaFiscalFile && (
                      <p className="text-sm text-green-600">
                        Arquivo selecionado: {notaFiscalFile.name}
                      </p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreating(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        'Registrar'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabela de Abastecimentos */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Nota Fiscal</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.abastecimentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        <Fuel className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum abastecimento registrado ainda</p>
                        <p className="text-sm mt-1">
                          Clique em "Novo Abastecimento" para começar
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  dashboardData.abastecimentos.map((abastecimento) => (
                    <TableRow key={abastecimento.id}>
                      <TableCell>
                        {format(new Date(abastecimento.data_abastecimento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {abastecimento.motorista_nome}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {abastecimento.veiculo_placa}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatLiters(abastecimento.litros)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(abastecimento.valor)}
                      </TableCell>
                      <TableCell>
                        {abastecimento.nota_fiscal_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedImage(abastecimento.nota_fiscal_url)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {abastecimento.observacoes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal para visualizar imagem da nota fiscal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nota Fiscal</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img 
                src={selectedImage} 
                alt="Nota Fiscal" 
                className="max-w-full max-h-96 object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}