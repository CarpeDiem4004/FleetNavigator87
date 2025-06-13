import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, FileText, Building2, Fuel, TrendingUp, Download, RefreshCw, Plus, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  data_cadastro: string;
  status: 'ativo' | 'inativo';
}

interface Abastecimento {
  id: number;
  empresa_id: number;
  empresa_nome: string;
  empresa_cnpj: string;
  motorista_nome: string;
  veiculo_placa: string;
  litros: number;
  valor: number;
  nota_fiscal_url?: string;
  observacoes?: string;
  data_abastecimento: string;
}

interface DashboardStats {
  totalEmpresas: number;
  totalAbastecimentos: number;
  totalLitros: number;
  totalValor: number;
  abastecimentosHoje: number;
}

export default function GerenciamentoTerceiros() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmpresas: 0,
    totalAbastecimentos: 0,
    totalLitros: 0,
    totalValor: 0,
    abastecimentosHoje: 0
  });
  const [activeTab, setActiveTab] = useState<'empresas' | 'abastecimentos'>('abastecimentos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    senha: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fazer requisições com XMLHttpRequest para contornar interceptação do Vite
      const makeRequest = (url: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.withCredentials = true;
          xhr.setRequestHeader('Content-Type', 'application/json');
          
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                try {
                  const data = JSON.parse(xhr.responseText);
                  resolve(data);
                } catch (e) {
                  reject(new Error('Invalid JSON response'));
                }
              } else {
                reject(new Error(`HTTP ${xhr.status}`));
              }
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send();
        });
      };
      
      // Buscar estatísticas
      try {
        const statsData = await makeRequest('/api/terceiros/admin/stats');
        console.log('Stats data received:', statsData);
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar estatísticas",
          variant: "destructive"
        });
      }

      // Buscar empresas
      try {
        const empresasData = await makeRequest('/api/terceiros/admin/empresas');
        console.log('Empresas data received:', empresasData);
        if (empresasData.success && empresasData.data) {
          setEmpresas(empresasData.data);
        }
      } catch (error) {
        console.error('Erro ao carregar empresas:', error);
      }

      // Buscar abastecimentos
      try {
        const abastecimentosData = await makeRequest('/api/terceiros/admin/abastecimentos');
        console.log('Abastecimentos data received:', abastecimentosData);
        if (abastecimentosData.success && abastecimentosData.data) {
          setAbastecimentos(abastecimentosData.data);
        }
      } catch (error) {
        console.error('Erro ao carregar abastecimentos:', error);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de terceiros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const exportarRelatorio = async () => {
    try {
      const response = await fetch('/api/terceiros/admin/relatorio/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `relatorio_terceiros_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
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

  const handleCreateCompany = async () => {
    try {
      // Validação básica
      if (!newCompanyForm.nome || !newCompanyForm.cnpj || !newCompanyForm.email || !newCompanyForm.senha) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/terceiros/admin/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: newCompanyForm.nome,
          cnpj: newCompanyForm.cnpj,
          email: newCompanyForm.email,
          telefone: newCompanyForm.telefone,
          endereco: newCompanyForm.endereco,
          senha: newCompanyForm.senha,
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Empresa cadastrada com sucesso!",
        });
        
        // Limpar formulário
        setNewCompanyForm({
          nome: '',
          cnpj: '',
          email: '',
          telefone: '',
          endereco: '',
          senha: ''
        });
        
        // Fechar modal
        setIsNewCompanyDialogOpen(false);
        
        // Recarregar dados
        fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar empresa');
      }
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao cadastrar empresa",
        variant: "destructive",
      });
    }
  };

  const filteredEmpresas = empresas.filter(empresa => {
    const matchesSearch = empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empresa.cnpj.includes(searchTerm);
    const matchesStatus = filterStatus === 'todos' || empresa.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredAbastecimentos = abastecimentos.filter(abastecimento => {
    return abastecimento.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
           abastecimento.empresa_cnpj.includes(searchTerm) ||
           abastecimento.motorista_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
           abastecimento.veiculo_placa.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Terceiros</h1>
          <p className="text-muted-foreground">
            Acompanhe empresas parceiras e seus registros de abastecimento
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewCompanyDialogOpen} onOpenChange={setIsNewCompanyDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <UserPlus className="h-4 w-4" />
                Cadastrar Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Empresa Terceira</DialogTitle>
                <DialogDescription>
                  Preencha os dados da empresa que terá acesso ao sistema de abastecimento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome da Empresa</label>
                    <Input
                      value={newCompanyForm.nome}
                      onChange={(e) => setNewCompanyForm({...newCompanyForm, nome: e.target.value})}
                      placeholder="Ex: Transportes Silva Ltda"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">CNPJ</label>
                    <Input
                      value={newCompanyForm.cnpj}
                      onChange={(e) => setNewCompanyForm({...newCompanyForm, cnpj: e.target.value})}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={newCompanyForm.email}
                      onChange={(e) => setNewCompanyForm({...newCompanyForm, email: e.target.value})}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefone</label>
                    <Input
                      value={newCompanyForm.telefone}
                      onChange={(e) => setNewCompanyForm({...newCompanyForm, telefone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Endereço</label>
                  <Input
                    value={newCompanyForm.endereco}
                    onChange={(e) => setNewCompanyForm({...newCompanyForm, endereco: e.target.value})}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Senha de Acesso</label>
                  <Input
                    type="password"
                    value={newCompanyForm.senha}
                    onChange={(e) => setNewCompanyForm({...newCompanyForm, senha: e.target.value})}
                    placeholder="Senha para acesso ao sistema"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsNewCompanyDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateCompany}>
                    Cadastrar Empresa
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportarRelatorio}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmpresas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Abastecimentos</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAbastecimentos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Litros</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLitros.toLocaleString('pt-BR')}L</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.abastecimentosHoje}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('abastecimentos')}
          className={`pb-2 px-1 ${
            activeTab === 'abastecimentos'
              ? 'border-b-2 border-primary text-primary font-medium'
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          Abastecimentos
        </button>
        <button
          onClick={() => setActiveTab('empresas')}
          className={`pb-2 px-1 ${
            activeTab === 'empresas'
              ? 'border-b-2 border-primary text-primary font-medium'
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          Empresas
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Buscar ${activeTab === 'empresas' ? 'empresas...' : 'abastecimentos...'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeTab === 'empresas' && (
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'abastecimentos' ? (
        <Card>
          <CardHeader>
            <CardTitle>Registros de Abastecimento</CardTitle>
            <CardDescription>
              Histórico completo de abastecimentos realizados por empresas terceiras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Nota Fiscal</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAbastecimentos.map((abastecimento) => (
                  <TableRow key={abastecimento.id}>
                    <TableCell>
                      {format(new Date(abastecimento.data_abastecimento), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{abastecimento.empresa_nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {abastecimento.empresa_cnpj}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{abastecimento.motorista_nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{abastecimento.veiculo_placa}</Badge>
                    </TableCell>
                    <TableCell>{abastecimento.litros.toLocaleString('pt-BR')}L</TableCell>
                    <TableCell>
                      R$ {abastecimento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {abastecimento.nota_fiscal_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewImage(abastecimento.nota_fiscal_url!)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FileText className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalhes do Abastecimento</DialogTitle>
                            <DialogDescription>
                              Informações completas do registro
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Empresa</label>
                                <p className="text-sm text-muted-foreground">
                                  {abastecimento.empresa_nome}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">CNPJ</label>
                                <p className="text-sm text-muted-foreground">
                                  {abastecimento.empresa_cnpj}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Motorista</label>
                                <p className="text-sm text-muted-foreground">
                                  {abastecimento.motorista_nome}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Veículo</label>
                                <p className="text-sm text-muted-foreground">
                                  {abastecimento.veiculo_placa}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Litros</label>
                                <p className="text-sm text-muted-foreground">
                                  {abastecimento.litros.toLocaleString('pt-BR')}L
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Valor</label>
                                <p className="text-sm text-muted-foreground">
                                  R$ {abastecimento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                            {abastecimento.observacoes && (
                              <div>
                                <label className="text-sm font-medium">Observações</label>
                                <p className="text-sm text-muted-foreground">
                                  {abastecimento.observacoes}
                                </p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Empresas Cadastradas</CardTitle>
            <CardDescription>
              Lista de empresas parceiras autorizadas para registro de abastecimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{empresa.nome}</div>
                        <div className="text-sm text-muted-foreground">{empresa.endereco}</div>
                      </div>
                    </TableCell>
                    <TableCell>{empresa.cnpj}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{empresa.email}</div>
                        <div className="text-sm text-muted-foreground">{empresa.telefone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(empresa.data_cadastro), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={empresa.status === 'ativo' ? 'default' : 'secondary'}>
                        {empresa.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal para visualizar imagem */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
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