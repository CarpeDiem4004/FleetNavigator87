import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface PecaEstoque {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  categoria: string;
  fabricante: string;
  valor_unitario: number;
  quantidade: number;
  estoque_minimo: number;
  unidade_medida: string;
  localizacao: string;
}

interface PecaSelecionada {
  id: number;
  codigo: string;
  nome: string;
  valor_unitario: number;
  quantidade: number;
  unidade_medida: string;
  valor_total: number;
}

interface SeletorPecasEstoqueProps {
  pecasSelecionadas: PecaSelecionada[];
  onPecasChange: (pecas: PecaSelecionada[]) => void;
}

export default function SeletorPecasEstoque({ pecasSelecionadas, onPecasChange }: SeletorPecasEstoqueProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { toast } = useToast();

  // Buscar peças do estoque usando a API do sistema de inventário
  const { data: allParts = [], isLoading: loadingPecas } = useQuery({
    queryKey: ['/api/frota/estoque-pecas'],
  });

  // Filtrar peças com base na busca e categoria
  const pecasEstoque = (allParts as PecaEstoque[]).filter((peca) => {
    const matchesSearch = !searchTerm || 
      peca.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      peca.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      peca.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      peca.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory && peca.quantidade > 0;
  });

  // Extrair categorias únicas das peças
  const categorias = (allParts as PecaEstoque[])
    .map((peca) => peca.categoria)
    .filter(Boolean)
    .filter((categoria, index, arr) => arr.indexOf(categoria) === index);

  const adicionarPeca = (peca: PecaEstoque) => {
    const pecaExistente = pecasSelecionadas.find(p => p.id === peca.id);
    
    if (pecaExistente) {
      toast({
        title: 'Peça já adicionada',
        description: 'Esta peça já está na lista. Edite a quantidade se necessário.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se há estoque suficiente
    if (peca.quantidade < 1) {
      toast({
        title: 'Estoque insuficiente',
        description: 'Não há estoque disponível para esta peça.',
        variant: 'destructive',
      });
      return;
    }

    // Não atualizar o estoque aqui - apenas adicionar à lista
    // O estoque será atualizado quando a manutenção for registrada
    const novaPeca: PecaSelecionada = {
      id: peca.id,
      codigo: peca.codigo,
      nome: peca.nome,
      valor_unitario: peca.valor_unitario,
      quantidade: 1,
      unidade_medida: peca.unidade_medida,
      valor_total: peca.valor_unitario,
    };

    onPecasChange([...pecasSelecionadas, novaPeca]);
    
    toast({
      title: 'Peça adicionada',
      description: `${peca.nome} foi adicionada à lista.`,
    });
  };

  const removerPeca = (id: number) => {
    onPecasChange(pecasSelecionadas.filter(p => p.id !== id));
  };

  const atualizarQuantidade = (id: number, quantidade: number) => {
    if (quantidade <= 0) {
      removerPeca(id);
      return;
    }

    const pecasAtualizadas = pecasSelecionadas.map(peca => {
      if (peca.id === id) {
        return {
          ...peca,
          quantidade,
          valor_total: peca.valor_unitario * quantidade,
        };
      }
      return peca;
    });

    onPecasChange(pecasAtualizadas);
  };

  const valorTotalGeral = pecasSelecionadas.reduce((total, peca) => total + (peca.valor_total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Peças Utilizadas</Label>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Package className="h-4 w-4 mr-2" />
              Adicionar do Estoque
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Selecionar Peças do Estoque</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar Peças</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar por nome, código ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categorias.map((categoria: string) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabela de peças */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPecas ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Carregando peças...
                        </TableCell>
                      </TableRow>
                    ) : pecasEstoque.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Nenhuma peça encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      pecasEstoque.map((peca: PecaEstoque) => (
                        <TableRow key={peca.id}>
                          <TableCell className="font-mono text-sm">{peca.codigo}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{peca.nome}</div>
                              <div className="text-sm text-muted-foreground">{peca.descricao}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{peca.categoria}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className={`${peca.quantidade <= peca.estoque_minimo ? 'text-red-600' : 'text-green-600'}`}>
                              {peca.quantidade} {peca.unidade_medida}
                            </div>
                          </TableCell>
                          <TableCell>
                            R$ {Number(peca.valor_unitario || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => adicionarPeca(peca)}
                              disabled={peca.quantidade === 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de peças selecionadas */}
      {pecasSelecionadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Peças Selecionadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pecasSelecionadas.map((peca) => (
                <div key={peca.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{peca.nome}</div>
                    <div className="text-sm text-muted-foreground">Código: {peca.codigo}</div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      R$ {Number(peca.valor_unitario || 0).toFixed(2)} / {peca.unidade_medida}
                    </div>
                    
                    <Input
                      type="number"
                      min="1"
                      value={peca.quantidade}
                      onChange={(e) => atualizarQuantidade(peca.id, parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    
                    <div className="text-sm font-medium min-w-[80px] text-right">
                      R$ {Number(peca.valor_total || 0).toFixed(2)}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removerPeca(peca.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-medium">Total das Peças:</span>
                <span className="text-lg font-bold">R$ {Number(valorTotalGeral || 0).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}