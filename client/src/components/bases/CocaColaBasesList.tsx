import { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Info } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface Base {
  id: number;
  name: string;
  location?: string;
  operation?: string;
  active: boolean;
  created_at: string;
}

interface CocaColaBasesListProps {
  existingBases: Base[];
  onComplete: () => void;
}

// Lista de bases da Coca-Cola a serem importadas
const COCA_COLA_BASES = [
  { name: 'COCA COLA (ABC)', operation: 'COCA COLA' },
  { name: 'COCA COLA (IPATINGA)', operation: 'COCA COLA' },
  { name: 'COCA COLA SANTOS', operation: 'COCA COLA' },
  { name: 'COCA COLA (MARIANA)', operation: 'COCA COLA' },
  { name: 'COCA COLA (CRICIUMA)', operation: 'COCA COLA' },
  { name: 'COCA COLA (PONTE NOVA)', operation: 'COCA COLA' },
  { name: 'COCA COLA (PINHEIROS)', operation: 'COCA COLA' },
  { name: 'COCA COLA (APARECIDA)', operation: 'COCA COLA' },
  { name: 'COCA COLA (JURUBATUBA)', operation: 'COCA COLA' },
  { name: 'COCA COLA (PQ Novo Mundo)', operation: 'COCA COLA' },
];

// Adicione também as bases do Grupo Pereira
const GRUPO_PEREIRA_BASES = [
  { name: 'GP01 VARGEM GRANDE (GRUPO PEREIRA)', operation: 'GRUPO PEREIRA' },
  { name: 'GP02 JACAREI (GRUPO PEREIRA)', operation: 'GRUPO PEREIRA' },
  { name: 'GP03 HORTOLANDIA (GRUPO PEREIRA)', operation: 'GRUPO PEREIRA' },
  { name: 'BASE GPV', operation: 'GRUPO PEREIRA' },
];

export default function CocaColaBasesList({ existingBases, onComplete }: CocaColaBasesListProps) {
  const [open, setOpen] = useState(true);
  const [selectedBases, setSelectedBases] = useState<Record<string, boolean>>({});
  const [importLoading, setImportLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const { toast } = useToast();

  const operations = [
    { value: 'COCA COLA', label: 'Coca Cola' },
    { value: 'GRUPO PEREIRA', label: 'Grupo Pereira' },
    { value: 'MERCADO LIVRE', label: 'Mercado Livre' },
  ];

  // Determinar quais bases mostrar baseado na operação selecionada
  const basesToShow = selectedOperation === 'COCA COLA' 
    ? COCA_COLA_BASES 
    : selectedOperation === 'GRUPO PEREIRA' 
      ? GRUPO_PEREIRA_BASES 
      : [];

  // Filtrar bases por termo de busca
  const filteredBases = basesToShow.filter(base => 
    base.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar duplicatas com as bases existentes
  const checkDuplicate = (baseName: string) => {
    return existingBases.some(base => 
      base.name.toLowerCase() === baseName.toLowerCase()
    );
  };

  // Inicializar seleção de bases
  useEffect(() => {
    if (basesToShow.length > 0) {
      const initialSelection: Record<string, boolean> = {};
      basesToShow.forEach(base => {
        initialSelection[base.name] = false;
      });
      setSelectedBases(initialSelection);
    }
  }, [selectedOperation]);

  // Selecionar/Deselecionar todas as bases
  const toggleSelectAll = () => {
    const newSelection = { ...selectedBases };
    const allSelected = filteredBases.every(base => selectedBases[base.name]);
    
    filteredBases.forEach(base => {
      newSelection[base.name] = !allSelected;
    });
    
    setSelectedBases(newSelection);
  };

  // Alternar seleção de uma base específica
  const toggleSelectBase = (baseName: string) => {
    setSelectedBases(prev => ({
      ...prev,
      [baseName]: !prev[baseName]
    }));
  };

  // Importar bases selecionadas
  const importSelectedBases = async () => {
    setImportLoading(true);
    try {
      const basesToImport = Object.entries(selectedBases)
        .filter(([_, selected]) => selected)
        .map(([baseName]) => {
          const baseInfo = basesToShow.find(base => base.name === baseName);
          return {
            name: baseName,
            operation: baseInfo?.operation || selectedOperation,
            active: true,
          };
        });

      if (basesToImport.length === 0) {
        toast({
          title: "Nenhuma base selecionada",
          description: "Selecione pelo menos uma base para importar.",
          variant: "destructive",
        });
        setImportLoading(false);
        return;
      }

      // Enviar requisição para importar bases
      const responses = await Promise.all(
        basesToImport.map(baseData => 
          fetch('/api/bases', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(baseData),
          })
        )
      );

      // Verificar respostas
      const allSuccessful = responses.every(res => res.ok);
      if (allSuccessful) {
        toast({
          title: "Bases importadas com sucesso",
          description: `${basesToImport.length} base(s) foram importadas.`,
          variant: "default",
        });
        setOpen(false);
        onComplete();
      } else {
        const failedCount = responses.filter(res => !res.ok).length;
        toast({
          title: "Erro ao importar bases",
          description: `${failedCount} base(s) não puderam ser importadas.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao importar bases:', error);
      toast({
        title: "Erro ao importar bases",
        description: "Ocorreu um erro de conexão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
      setConfirmDialog(false);
    }
  };

  // Contar bases selecionadas
  const selectedCount = Object.values(selectedBases).filter(Boolean).length;

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-4xl w-full overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>Importação de Bases</SheetTitle>
            <SheetDescription>
              Selecione as bases que deseja importar para o sistema.
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
            {/* Seleção de Operação */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {operations.map(operation => (
                <Card
                  key={operation.value}
                  className={`cursor-pointer transition-all ${
                    selectedOperation === operation.value 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedOperation(operation.value)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-medium">{operation.label}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {selectedOperation ? (
              <>
                {/* Barra de pesquisa e botões de ação */}
                <div className="flex flex-col md:flex-row gap-2 items-center">
                  <div className="w-full md:flex-grow">
                    <Input 
                      placeholder="Pesquisar base..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={toggleSelectAll}
                      className="whitespace-nowrap"
                    >
                      {filteredBases.every(base => selectedBases[base.name]) 
                        ? "Desmarcar Todos" 
                        : "Selecionar Todos"}
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (selectedCount > 0) {
                          setConfirmDialog(true);
                        } else {
                          toast({
                            title: "Nenhuma base selecionada",
                            description: "Selecione pelo menos uma base para importar.",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={selectedCount === 0 || importLoading}
                      className="whitespace-nowrap"
                    >
                      {importLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Importar Selecionados
                    </Button>
                  </div>
                </div>

                {/* Tabela de bases */}
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Operação</TableHead>
                          <TableHead className="w-20">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBases.length > 0 ? (
                          filteredBases.map((base, index) => {
                            const isDuplicate = checkDuplicate(base.name);
                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedBases[base.name] || false}
                                    onCheckedChange={() => toggleSelectBase(base.name)}
                                    disabled={isDuplicate}
                                  />
                                </TableCell>
                                <TableCell>{base.name}</TableCell>
                                <TableCell>{base.operation}</TableCell>
                                <TableCell>
                                  {isDuplicate ? (
                                    <div className="flex items-center gap-1">
                                      <Info className="h-4 w-4 text-yellow-500" />
                                      <span className="text-xs">Duplicado</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span className="text-xs">Novo</span>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6">
                              {searchTerm 
                                ? "Nenhuma base encontrada com o termo pesquisado." 
                                : "Nenhuma base disponível para esta operação."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Info className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Selecione uma Operação</h3>
                  <p className="text-muted-foreground">
                    Escolha uma operação para ver as bases disponíveis para importação.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Botões de ação inferiores */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Diálogo de confirmação */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Importação</DialogTitle>
            <DialogDescription>
              Você está prestes a importar {selectedCount} base(s). Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              Bases selecionadas: <strong>{selectedCount}</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              As bases serão criadas com o status "Ativo".
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog(false)}
              disabled={importLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={importSelectedBases}
              disabled={importLoading}
            >
              {importLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}