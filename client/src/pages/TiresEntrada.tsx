import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Save, ArrowLeft, Trash2 } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase-client';

// Interface para o modelo de pneus
interface Tire {
  codigo: string;
  marca: string;
  modelo: string;
  medida: string;
  aro: string;
  tipo: string;
  origem: string;
  data_aquisicao: string;
  profundidade_sulco: number;
  localizacao: string;
  status: 'estoque';
  quantidade?: number;
  valor_unitario?: number;
}

const TiresEntrada: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para o template de pneu (valores que serão aplicados a todos os pneus)
  const [tireTemplate, setTireTemplate] = useState<Partial<Tire>>({
    marca: '',
    modelo: '',
    medida: '',
    aro: '',
    tipo: 'direcao',
    origem: 'novo',
    data_aquisicao: new Date().toISOString().split('T')[0],
    profundidade_sulco: 12.0,
    localizacao: 'almoxarifado',
    status: 'estoque',
    quantidade: 1,
    valor_unitario: 0,
  });
  
  // Estado para lista de pneus a serem adicionados
  const [tiresQueue, setTiresQueue] = useState<Tire[]>([]);
  
  // Estado para código sendo editado no campo
  const [currentCode, setCurrentCode] = useState('');
  
  // Adicionar um novo pneu à fila
  const addTireToQueue = () => {
    if (!currentCode) {
      toast({
        title: "Código obrigatório",
        description: "Por favor, informe o código do pneu.",
        variant: "destructive"
      });
      return;
    }
    
    if (!tireTemplate.marca || !tireTemplate.modelo) {
      toast({
        title: "Campos obrigatórios",
        description: "Marca e modelo são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar se o código já existe na fila
    if (tiresQueue.some(tire => tire.codigo === currentCode)) {
      toast({
        title: "Código duplicado",
        description: "Este código já foi adicionado à lista.",
        variant: "destructive"
      });
      return;
    }
    
    const newTire: Tire = {
      ...tireTemplate as Tire,
      codigo: currentCode,
    };
    
    setTiresQueue([...tiresQueue, newTire]);
    setCurrentCode('');
  };
  
  // Remover um pneu da fila
  const removeTireFromQueue = (code: string) => {
    setTiresQueue(tiresQueue.filter(tire => tire.codigo !== code));
  };
  
  // Salvar todos os pneus no banco de dados
  const saveTires = async () => {
    if (tiresQueue.length === 0) {
      toast({
        title: "Nenhum pneu na fila",
        description: "Adicione pelo menos um pneu à fila antes de salvar.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = createSupabaseClient();
      
      // Expandir array para incluir múltiplas quantidades do mesmo pneu
      const expandedTires: Tire[] = [];
      
      tiresQueue.forEach(tire => {
        // Quantidade a processar (mínimo 1)
        const quantidade = tire.quantidade && tire.quantidade > 1 ? tire.quantidade : 1;
        
        // Se quantidade for 1, adiciona o pneu diretamente
        if (quantidade === 1) {
          expandedTires.push({
            ...tire,
            // Garante que quantidade será 1 no registro
            quantidade: 1
          });
        } else {
          // Se quantidade > 1, cria múltiplos registros
          // Para cada pneu, criamos um código único baseado no original
          for (let i = 0; i < quantidade; i++) {
            const codigoUnico = `${tire.codigo}-${i+1}`;
            expandedTires.push({
              ...tire,
              codigo: codigoUnico,
              quantidade: 1
            });
          }
        }
      });
      
      // Preparar dados com created_at e updated_at
      const tiresWithTimestamps = expandedTires.map(tire => ({
        ...tire,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      // Inserir todos os pneus de uma vez
      const { data, error } = await supabase
        .from('pneus')
        .insert(tiresWithTimestamps)
        .select();
      
      if (error) throw error;
      
      const totalTires = tiresWithTimestamps.length;
      const totalValor = tiresWithTimestamps.reduce((acc, tire) => 
        acc + (tire.valor_unitario || 0), 0
      );
      
      toast({
        title: "Pneus cadastrados com sucesso",
        description: `${totalTires} pneus foram adicionados ao inventário, totalizando ${totalValor.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        })}.`,
        variant: "default"
      });
      
      // Limpar a fila após o cadastro bem-sucedido
      setTiresQueue([]);
      
    } catch (error) {
      console.error("Erro ao cadastrar pneus:", error);
      toast({
        title: "Erro ao cadastrar pneus",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const tiposOptions = [
    { value: 'direcao', label: 'Direção' },
    { value: 'tracao', label: 'Tração' },
    { value: 'trailer', label: 'Trailer/Carreta' },
  ];

  const origensOptions = [
    { value: 'novo', label: 'Novo' },
    { value: 'recapado', label: 'Recapado' },
    { value: 'usado', label: 'Usado' },
  ];

  const localizacoesOptions = [
    { value: 'almoxarifado', label: 'Almoxarifado' },
    { value: 'estoque_borracharia', label: 'Estoque Borracharia' },
    { value: 'transito', label: 'Em Trânsito' },
  ];
  
  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Entrada em Lote de Pneus</h1>
            <p className="text-gray-500">
              Cadastre múltiplos pneus com informações semelhantes
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/tires')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card para informações em comum */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações Comuns</CardTitle>
                <CardDescription>
                  Defina os atributos comuns a todos os pneus do lote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Marca, Modelo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca *</Label>
                    <Input
                      id="marca"
                      value={tireTemplate.marca || ''}
                      onChange={(e) => setTireTemplate({...tireTemplate, marca: e.target.value})}
                      placeholder="Ex: Pirelli"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo *</Label>
                    <Input
                      id="modelo"
                      value={tireTemplate.modelo || ''}
                      onChange={(e) => setTireTemplate({...tireTemplate, modelo: e.target.value})}
                      placeholder="Ex: Formula Energy"
                      required
                    />
                  </div>
                </div>
                
                {/* Medida, Aro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medida">Medida</Label>
                    <Input
                      id="medida"
                      value={tireTemplate.medida || ''}
                      onChange={(e) => setTireTemplate({...tireTemplate, medida: e.target.value})}
                      placeholder="Ex: 295/80R22.5"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aro">Aro</Label>
                    <Input
                      id="aro"
                      value={tireTemplate.aro || ''}
                      onChange={(e) => setTireTemplate({...tireTemplate, aro: e.target.value})}
                      placeholder="Ex: 22.5"
                    />
                  </div>
                </div>
                
                {/* Tipo, Origem */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select 
                      value={tireTemplate.tipo} 
                      onValueChange={(value) => setTireTemplate({...tireTemplate, tipo: value})}
                    >
                      <SelectTrigger id="tipo">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="origem">Origem</Label>
                    <Select 
                      value={tireTemplate.origem} 
                      onValueChange={(value) => setTireTemplate({...tireTemplate, origem: value})}
                    >
                      <SelectTrigger id="origem">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {origensOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Data de Aquisição, Profundidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_aquisicao">Data de Aquisição</Label>
                    <Input
                      id="data_aquisicao"
                      type="date"
                      value={tireTemplate.data_aquisicao || ''}
                      onChange={(e) => setTireTemplate({...tireTemplate, data_aquisicao: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profundidade_sulco">Profundidade do Sulco (mm)</Label>
                    <Input
                      id="profundidade_sulco"
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={tireTemplate.profundidade_sulco?.toString() || '12.0'}
                      onChange={(e) => setTireTemplate({...tireTemplate, profundidade_sulco: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                
                {/* Localização */}
                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização</Label>
                  <Select 
                    value={tireTemplate.localizacao} 
                    onValueChange={(value) => setTireTemplate({...tireTemplate, localizacao: value})}
                  >
                    <SelectTrigger id="localizacao">
                      <SelectValue placeholder="Selecione a localização" />
                    </SelectTrigger>
                    <SelectContent>
                      {localizacoesOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Quantidade e Valor Unitário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={tireTemplate.quantidade?.toString() || '1'}
                      onChange={(e) => setTireTemplate({...tireTemplate, quantidade: parseInt(e.target.value) || 1})}
                      placeholder="Quantidade"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
                    <Input
                      id="valor_unitario"
                      type="number"
                      step="0.01"
                      min="0"
                      value={tireTemplate.valor_unitario?.toString() || '0'}
                      onChange={(e) => setTireTemplate({...tireTemplate, valor_unitario: parseFloat(e.target.value) || 0})}
                      placeholder="Valor unitário"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Card para adicionar códigos */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Pneus</CardTitle>
                <CardDescription>
                  Informe os códigos dos pneus um por um
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código/Nº de Série *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="codigo"
                      value={currentCode}
                      onChange={(e) => setCurrentCode(e.target.value)}
                      placeholder="Ex: P001"
                      onKeyPress={(e) => e.key === 'Enter' && addTireToQueue()}
                    />
                    <Button onClick={addTireToQueue}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Pneus na fila: {tiresQueue.length}</h3>
                    {tiresQueue.length > 0 && (
                      <div className="text-sm text-right">
                        <span className="font-medium">Total: </span>
                        {tiresQueue.reduce((total, tire) => {
                          const quantidade = tire.quantidade || 1;
                          const valorUnitario = tire.valor_unitario || 0;
                          return total + (quantidade * valorUnitario);
                        }, 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </div>
                    )}
                  </div>
                  {tiresQueue.length > 0 ? (
                    <div className="max-h-[350px] overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Qtd.</TableHead>
                            <TableHead>Valor (R$)</TableHead>
                            <TableHead className="w-[80px]">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tiresQueue.map((tire) => (
                            <TableRow key={tire.codigo}>
                              <TableCell className="font-medium">{tire.codigo}</TableCell>
                              <TableCell>{tire.quantidade || 1}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{(tire.valor_unitario || 0).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  })}</span>
                                  {(tire.quantidade || 1) > 1 && (
                                    <span className="text-xs text-muted-foreground">
                                      Total: {((tire.valor_unitario || 0) * (tire.quantidade || 1)).toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      })}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeTireFromQueue(tire.codigo)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4 border rounded-md">
                      Nenhum pneu na fila
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  disabled={tiresQueue.length === 0 || isSubmitting}
                  className="w-full"
                  onClick={saveTires}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Salvar {tiresQueue.length} Pneus
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayoutSimple>
  );
};

export default TiresEntrada;