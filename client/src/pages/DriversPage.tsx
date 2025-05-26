import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-compat';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileEdit, Trash2, Search, Plus } from "lucide-react";

// Interface para Bases (Centros de Distribuição)
interface Base {
  id: number;
  name: string;
}

interface Driver {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
  base_id: number;
  base_nome?: string;
  created_at: string;
}

const DriversPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Estados para formulário
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    base_id: '',
  });
  const [bases, setBases] = useState<Base[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregamento de dados - Motoristas
  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('motoristas')
          .select(`
            *,
            bases:base_id(id, name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Formatar os dados para incluir os nomes das bases
        const formattedData = data.map((item: any) => ({
          id: item.id,
          nome: item.nome,
          cpf: item.cpf,
          telefone: item.telefone,
          base_id: item.base_id,
          base_nome: item.bases?.name,
          created_at: item.created_at
        }));

        setDrivers(formattedData);
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        toast({
          title: 'Erro ao carregar motoristas',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrivers();
  }, [toast]);

  // Carregar bases
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const { data, error } = await supabase.from('bases').select('id, name');
        if (error) throw error;
        setBases(data || []);
      } catch (error) {
        console.error('Erro ao buscar bases:', error);
        toast({
          title: 'Erro ao carregar bases',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    };

    fetchBases();
  }, [toast]);

  // Filtrar motoristas
  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.cpf.includes(searchTerm) ||
      (driver.telefone && driver.telefone.includes(searchTerm)) ||
      (driver.base_nome && driver.base_nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Função para lidar com mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Função para lidar com mudanças no select
  const handleSelectChange = (value: string, field: string) => {
    setForm({ ...form, [field]: value });
  };

  // Função para cadastrar novo motorista
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.nome || !form.cpf || !form.base_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const driverData = {
        nome: form.nome,
        cpf: form.cpf,
        telefone: form.telefone,
        base_id: parseInt(form.base_id),
      };

      // Usar a API backend direta ao invés do Supabase
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar motorista');
      }

      const newDriver = await response.json();

      toast({
        title: 'Motorista cadastrado',
        description: 'O motorista foi cadastrado com sucesso.',
        variant: 'default',
      });

      // Limpar formulário
      setForm({
        nome: '',
        cpf: '',
        telefone: '',
        base_id: '',
      });
      
      // Adicionar novo motorista à lista
      const baseSelecionada = bases.find(b => b.id === parseInt(form.base_id));
      
      const newDriverForList: Driver = {
        id: newDriver.id,
        nome: newDriver.nome,
        cpf: newDriver.cpf,
        telefone: newDriver.telefone,
        base_id: newDriver.base_id,
        base_nome: baseSelecionada?.name,
        created_at: newDriver.created_at
      };
      
      setDrivers([newDriverForList, ...drivers]);
      setActiveTab('list');
      
    } catch (error) {
      console.error('Erro ao cadastrar motorista:', error);
      toast({
        title: 'Erro ao cadastrar motorista',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para excluir motorista
  const handleDeleteDriver = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('motoristas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDrivers(drivers.filter(driver => driver.id !== id));
      
      toast({
        title: 'Motorista excluído',
        description: 'O motorista foi excluído com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao excluir motorista:', error);
      toast({
        title: 'Erro ao excluir motorista',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Gerenciamento de Motoristas</h1>
            <p className="text-gray-500">
              Cadastre e gerencie os motoristas da frota
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Lista de Motoristas</TabsTrigger>
            <TabsTrigger value="add">Cadastrar Motorista</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div></div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar motoristas..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>Lista de motoristas cadastrados</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDrivers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            Nenhum motorista encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDrivers.map((driver) => (
                          <TableRow key={driver.id}>
                            <TableCell className="font-medium">
                              {driver.nome}
                            </TableCell>
                            <TableCell>{driver.cpf}</TableCell>
                            <TableCell>{driver.telefone || '-'}</TableCell>
                            <TableCell>{driver.base_nome}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  title="Editar Motorista"
                                >
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  title="Excluir Motorista"
                                  onClick={() => handleDeleteDriver(driver.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Novo Motorista</CardTitle>
                <CardDescription>
                  Cadastre um novo motorista para a frota
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {/* Nome do Motorista */}
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Motorista *</Label>
                    <Input
                      id="nome"
                      name="nome"
                      placeholder="Digite o nome completo"
                      value={form.nome}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  {/* CPF */}
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      placeholder="Digite o CPF (apenas números)"
                      value={form.cpf}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      placeholder="Digite o telefone com DDD"
                      value={form.telefone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  {/* Base */}
                  <div className="space-y-2">
                    <Label htmlFor="base">Base *</Label>
                    <Select 
                      value={form.base_id} 
                      onValueChange={(value) => handleSelectChange(value, 'base_id')}
                    >
                      <SelectTrigger id="base">
                        <SelectValue placeholder="Selecione a base" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases.map((base) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Limpar formulário
                      setForm({
                        nome: '',
                        cpf: '',
                        telefone: '',
                        base_id: '',
                      });
                    }}
                  >
                    Limpar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Cadastrando...' : 'Cadastrar Motorista'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayoutSimple>
  );
};

export default DriversPage;