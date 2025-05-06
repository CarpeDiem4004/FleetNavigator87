import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { TireRequest, createTireRequest } from '@/services/tireRequestsService';

interface TireRequestFormProps {
  onRequestSubmitted?: () => void;
}

const TireRequestForm: React.FC<TireRequestFormProps> = ({ onRequestSubmitted }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bases, setBases] = useState<Array<{id: number, nome: string}>>([]);
  const [currentUser, setCurrentUser] = useState<{id: number, name: string} | null>(null);
  
  // Estados para formulário
  const [baseId, setBaseId] = useState<number | string>(0);
  const [baseName, setBaseName] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [medida, setMedida] = useState('');
  const [tipo, setTipo] = useState('direcao');
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');
  
  // Opções para os campos select
  const tiposOptions = [
    { value: 'direcao', label: 'Direção' },
    { value: 'tracao', label: 'Tração' },
    { value: 'trailer', label: 'Trailer/Carreta' },
  ];

  // Carregar bases e usuário atual
  useEffect(() => {
    const loadBases = async () => {
      try {
        const response = await api.get('/api/bases');
        if (response.data && response.data.data) {
          setBases(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar bases:', error);
      }
    };

    const getCurrentUser = async () => {
      try {
        // Em uma implementação real, isso viria de um contexto de autenticação
        // ou de uma chamada API para obter o usuário logado
        // Por hora, usamos um usuário simulado para testes
        setCurrentUser({ id: 12, name: 'Administrador' });
      } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
      }
    };

    if (isOpen) {
      loadBases();
      getCurrentUser();
    }
  }, [isOpen]);

  // Resetar o formulário
  const resetForm = () => {
    setBaseId(0);
    setBaseName('');
    setMarca('');
    setModelo('');
    setMedida('');
    setTipo('direcao');
    setQuantidade(1);
    setMotivo('');
    setObservacao('');
  };

  // Enviar solicitação usando a nova API
  const handleSubmit = async () => {
    if (!baseId) {
      toast({
        title: "Base obrigatória",
        description: "Selecione uma base para a solicitação.",
        variant: "destructive"
      });
      return;
    }

    if (!marca || !modelo || !motivo || quantidade <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Encontra o nome da base pelo ID
      const selectedBase = bases.find(b => b.id === Number(baseId));
      const baseName = selectedBase?.nome || '';

      const request: TireRequest = {
        base_id: Number(baseId),
        base_nome: baseName,
        usuario_id: currentUser?.id || 0,
        usuario_nome: currentUser?.name || '',
        marca,
        modelo,
        medida,
        tipo,
        quantidade,
        motivo,
        status: 'pendente',
        data_solicitacao: new Date().toISOString(),
        observacoes: observacao,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const response = await createTireRequest(request);
      
      if (!response.success) {
        throw new Error(response.error || 'Falha ao criar solicitação');
      }
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de pneus foi enviada com sucesso.",
        variant: "default"
      });
      
      resetForm();
      setIsOpen(false);
      
      // Notificar o componente pai se necessário
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast({
        title: "Erro ao enviar solicitação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center bg-green-600 hover:bg-green-700 text-white">
          <ShoppingBag className="mr-2 h-5 w-5" />
          Solicitar Pneus
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] p-6">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-bold">Solicitar Pneus</DialogTitle>
          <DialogDescription className="mt-2 text-gray-600">
            Preencha os detalhes para solicitar novos pneus para sua base
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-5 py-5">
          {/* Base - Campo destacado */}
          <div className="space-y-2 bg-gray-50 p-3 rounded-md border border-gray-100">
            <Label htmlFor="base" className="font-medium text-gray-800">Base Solicitante *</Label>
            <Select value={baseId.toString()} onValueChange={(value) => setBaseId(parseInt(value))}>
              <SelectTrigger id="base" className="bg-white">
                <SelectValue placeholder="Selecione a Base" />
              </SelectTrigger>
              <SelectContent>
                {bases.map((base) => (
                  <SelectItem key={base.id} value={base.id.toString()}>
                    {base.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Seção: Informações do Pneu */}
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Informações do Pneu</h3>
            
            {/* Marca e Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="marca" className="text-gray-700">Marca *</Label>
                <Input
                  id="marca"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Ex: Pirelli"
                  required
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modelo" className="text-gray-700">Modelo *</Label>
                <Input
                  id="modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex: Formula Energy"
                  required
                  className="bg-white"
                />
              </div>
            </div>
            
            {/* Medida e Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="medida" className="text-gray-700">Medida</Label>
                <Input
                  id="medida"
                  value={medida}
                  onChange={(e) => setMedida(e.target.value)}
                  placeholder="Ex: 295/80R22.5"
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-gray-700">Tipo</Label>
                <Select 
                  value={tipo} 
                  onValueChange={(value) => setTipo(value)}
                >
                  <SelectTrigger id="tipo" className="bg-white">
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
            </div>
            
            {/* Quantidade */}
            <div className="space-y-2">
              <Label htmlFor="quantidade" className="text-gray-700">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={quantidade.toString()}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                required
                className="bg-white w-1/3"
              />
            </div>
          </div>
          
          {/* Motivo e Observações */}
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Justificativa</h3>
            
            {/* Motivo */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="motivo" className="text-gray-700">Motivo da Solicitação *</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Substituição de pneus desgastados"
                required
                rows={2}
                className="bg-white resize-none"
              />
            </div>
            
            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacao" className="text-gray-700">Observações Adicionais</Label>
              <Textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Informações complementares"
                rows={2}
                className="bg-white resize-none"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t pt-4 gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Enviando...
              </span>
            ) : (
              'Enviar Solicitação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TireRequestForm;