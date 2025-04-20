import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface Props {
  onVehicleAdded?: () => void;
}

export default function CadastroFrota({ onVehicleAdded }: Props = {}) {
  const { toast } = useToast()
  const [placa, setPlaca] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('carreta')
  const [baseId, setBaseId] = useState<string | undefined>(undefined)
  const [bases, setBases] = useState<{id: number, nome: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Opções de modelo seguindo os valores válidos do enum vehicleType
  const modelos = [
    { id: 'carreta', nome: 'Carreta' },
    { id: 'cavalo_mecanico', nome: 'Cavalo Mecânico' },
    { id: 'van', nome: 'Van' },
    { id: 'utilitario', nome: 'Utilitário' }
  ]

  useEffect(() => {
    async function fetchBases() {
      try {
        // Usar a API REST em vez do cliente Supabase diretamente
        const response = await fetch('/api/bases');
        if (!response.ok) {
          throw new Error(`Erro ao buscar bases: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Bases carregadas da API:', data);
        
        // Adaptar o formato da resposta da API para o formato esperado pelo componente
        const formattedBases = data.map((base: any) => ({
          id: base.id,
          nome: base.name || base.nome // Lidar com ambos os formatos possíveis
        }));
        
        setBases(formattedBases);
      } catch (error) {
        console.error('Erro ao buscar bases:', error);
        toast({
          title: 'Erro ao carregar bases',
          description: 'Não foi possível carregar a lista de bases.',
          variant: 'destructive'
        });
      }
    }

    fetchBases();
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!placa || !marca || !baseId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Usar a API REST em vez do cliente Supabase
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plate: placa,
          model: marca, // Agora usamos marca como modelo (Ford, FACCHINI, etc)
          vehicleType: modelo, // E modelo como vehicleType (carreta, cavalo_mecanico, etc)
          status: 'em_operacao',
          baseId: parseInt(baseId)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar veículo');
      }
      
      const vehicleData = await response.json();
      
      toast({
        title: 'Veículo cadastrado',
        description: `Veículo ${placa} cadastrado com sucesso.`,
        variant: 'default'
      })
      
      // Limpar formulário após sucesso
      setPlaca('')
      setMarca('')
      setModelo('carreta')
      setBaseId(undefined)
      
      // Notificar o componente pai sobre a adição
      if (onVehicleAdded) {
        onVehicleAdded()
      }
    } catch (error) {
      console.error('Exceção ao cadastrar veículo:', error)
      toast({
        title: 'Erro ao cadastrar veículo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Cadastro de Frota</CardTitle>
        <CardDescription>
          Adicione um novo veículo à frota
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="placa">Placa *</Label>
            <Input
              id="placa"
              type="text"
              placeholder="Ex: ABC1234"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              required
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marca">Marca *</Label>
            <Input
              id="marca"
              type="text"
              placeholder="Ex: Ford"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="modelo">Tipo de Veículo *</Label>
            <Select value={modelo} onValueChange={setModelo}>
              <SelectTrigger id="modelo">
                <SelectValue placeholder="Selecione o tipo de veículo" />
              </SelectTrigger>
              <SelectContent>
                {modelos.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base">Base *</Label>
            <Select value={baseId || undefined} onValueChange={setBaseId}>
              <SelectTrigger id="base">
                <SelectValue placeholder="Selecione a Base" />
              </SelectTrigger>
              <SelectContent>
                {bases.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>{b.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Processando...
              </span>
            ) : (
              'Cadastrar Veículo'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}