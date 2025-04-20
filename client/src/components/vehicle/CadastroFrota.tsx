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
  const [modelo, setModelo] = useState('Fiorino')
  const [baseId, setBaseId] = useState('')
  const [bases, setBases] = useState<{id: number, nome: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const modelos = ['Fiorino', 'Van', 'VUC', '3/4', 'Toco', 'Truck', 'Cavalo', 'Carreta']

  useEffect(() => {
    async function fetchBases() {
      const { data, error } = await supabase.from('bases').select('id, nome')
      if (error) {
        console.error('Erro ao buscar bases:', error)
        toast({
          title: 'Erro ao carregar bases',
          description: 'Não foi possível carregar a lista de bases.',
          variant: 'destructive'
        })
      } else {
        setBases(data || [])
      }
    }

    fetchBases()
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
      const { error } = await supabase.from('veiculos').insert({
        placa,
        marca,
        modelo,
        base_id: parseInt(baseId),
        status: 'em_operacao',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      if (error) {
        toast({
          title: 'Erro ao cadastrar veículo',
          description: error.message,
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Veículo cadastrado',
          description: `Veículo ${placa} cadastrado com sucesso.`,
          variant: 'default'
        })
        
        // Limpar formulário após sucesso
        setPlaca('')
        setMarca('')
        setModelo('Fiorino')
        setBaseId('')
        
        // Notificar o componente pai sobre a adição
        if (onVehicleAdded) {
          onVehicleAdded()
        }
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
            <Label htmlFor="modelo">Modelo *</Label>
            <Select value={modelo} onValueChange={setModelo}>
              <SelectTrigger id="modelo">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                {modelos.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base">Base *</Label>
            <Select value={baseId.toString()} onValueChange={setBaseId}>
              <SelectTrigger id="base">
                <SelectValue placeholder="Selecione a Base" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Selecione a Base</SelectItem>
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