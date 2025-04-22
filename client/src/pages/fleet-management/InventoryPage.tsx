import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Eye,
  Send,
  PackageOpen,
  PackagePlus,
  Package,
  FileBarChart,
  Truck,
  AlertCircle,
  Settings,
  Plus,
  Undo2,
  FileDown,
  ArrowUpDown,
  Search
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import InventoryItemsTable from './components/inventory/InventoryItemsTable';
import InventoryMovements from './components/inventory/InventoryMovements';
import InventoryStockByLocation from './components/inventory/InventoryStockByLocation';
import InventoryItemsForm from './components/inventory/InventoryItemsForm';

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('estoque');
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se o usuário tem permissão (admin ou gestor de frota)
  const hasPermission = user && (
    user.role === 'admin' || 
    user.role === 'gestor'
  );

  // Se não tiver permissão, mostrar mensagem de acesso negado
  if (!hasPermission) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-red-600">
                Acesso Restrito
              </CardTitle>
              <CardDescription>
                Você não tem permissão para acessar o sistema de gestão de estoque.
                Esta funcionalidade é restrita aos gestores de frota e administradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-8">
                <AlertCircle className="h-24 w-24 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Estoque</h1>
            <p className="text-gray-500">
              Gerenciamento de inventário e movimentações de peças
            </p>
          </div>
          <div className="flex space-x-2">
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            )}
            <Button variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Área de Cadastro de Item */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex justify-between items-center">
                <CardTitle>Cadastrar Novo Item</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowForm(false)}
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <InventoryItemsForm 
                onSuccess={() => {
                  setShowForm(false);
                  toast({
                    title: "Item cadastrado",
                    description: "O item foi adicionado ao sistema de estoque.",
                  });
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Abas Principais */}
        <Tabs 
          defaultValue="estoque" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="estoque">
              <PackageOpen className="h-4 w-4 mr-2" />
              Estoque Atual
            </TabsTrigger>
            <TabsTrigger value="itens">
              <Package className="h-4 w-4 mr-2" />
              Itens Cadastrados
            </TabsTrigger>
            <TabsTrigger value="movimentacoes">
              <Send className="h-4 w-4 mr-2" />
              Movimentações
            </TabsTrigger>
            <TabsTrigger value="locais">
              <Truck className="h-4 w-4 mr-2" />
              Estoque por Local
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo da Aba Estoque */}
          <TabsContent value="estoque">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                <div>
                  <CardTitle>Estoque Atual</CardTitle>
                  <CardDescription>
                    Visão consolidada do estoque atual em todas as bases e oficinas
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex items-center px-6 py-4 space-x-4">
                  <div className="flex items-center space-x-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Pesquisar itens..." 
                      className="flex-1"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Categorias</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="freios">Freios</SelectItem>
                      <SelectItem value="suspensao">Suspensão</SelectItem>
                      <SelectItem value="transmissao">Transmissão</SelectItem>
                      <SelectItem value="eletrica">Elétrica</SelectItem>
                      <SelectItem value="carroceria">Carroceria</SelectItem>
                      <SelectItem value="pneus">Pneus e Rodas</SelectItem>
                      <SelectItem value="lubrificantes">Lubrificantes</SelectItem>
                      <SelectItem value="filtros">Filtros</SelectItem>
                      <SelectItem value="acessorios">Acessórios</SelectItem>
                      <SelectItem value="ferramentas">Ferramentas</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Nome do Item</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead className="text-right">Custo Unitário</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="animate-pulse">
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        Carregando dados do estoque...
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conteúdo da Aba Itens */}
          <TabsContent value="itens">
            <InventoryItemsTable />
          </TabsContent>

          {/* Conteúdo da Aba Movimentações */}
          <TabsContent value="movimentacoes">
            <InventoryMovements />
          </TabsContent>

          {/* Conteúdo da Aba Estoque por Local */}
          <TabsContent value="locais">
            <InventoryStockByLocation />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}