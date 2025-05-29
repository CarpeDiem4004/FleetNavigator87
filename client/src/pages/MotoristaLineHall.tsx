import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  Truck, 
  MapPin, 
  Clock, 
  Calendar,
  Play,
  CheckCircle,
  AlertCircle,
  Navigation,
  Search,
  ClipboardCheck
} from 'lucide-react'

interface Trip {
  id: number
  placa_cavalo: string
  placa_carreta_1: string
  placa_carreta_2?: string
  motorista_nome: string
  local_carregamento: string
  local_descarregamento: string
  data_viagem: string
  horario_carregamento?: string
  status_viagem: string
  rota_selecionada?: string
  km_total?: number
  observacoes?: string
}

interface ChecklistItem {
  id: string
  description: string
  status: 'pending' | 'ok' | 'problema'
  observations?: string
}

interface Checklist {
  id?: number
  trip_id: number
  motorista_nome: string
  placa_cavalo: string
  km_inicial?: number
  km_final?: number
  status: 'em_andamento' | 'concluido'
  items: ChecklistItem[]
  created_at?: string
  completed_at?: string
}

export default function MotoristaLineHall() {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [motoristaName, setMotoristaName] = useState('')
  const [cpf, setCpf] = useState('')
  
  // Estados para checklist
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [showChecklist, setShowChecklist] = useState(false)
  const [kmInicial, setKmInicial] = useState('')
  const [kmFinal, setKmFinal] = useState('')
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: '1', description: 'Verificar freios', status: 'pending' },
    { id: '2', description: 'Verificar pneus', status: 'pending' },
    { id: '3', description: 'Verificar óleo do motor', status: 'pending' },
    { id: '4', description: 'Verificar combustível', status: 'pending' },
    { id: '5', description: 'Verificar documentação', status: 'pending' },
    { id: '6', description: 'Verificar luzes e sinalização', status: 'pending' },
    { id: '7', description: 'Verificar espelhos', status: 'pending' },
    { id: '8', description: 'Verificar limpeza do veículo', status: 'pending' }
  ])
  
  const { toast } = useToast()

  const searchTrip = async () => {
    if (!motoristaName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do motorista",
        variant: "destructive"
      })
      return
    }

    try {
      setSearchLoading(true)
      
      // Buscar viagem ativa do motorista por nome
      const response = await fetch(`/api/line-hall-shopee/motorista/buscar?nome=${encodeURIComponent(motoristaName.trim())}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Nenhuma viagem encontrada",
            description: "Não há viagens ativas para este motorista",
            variant: "destructive"
          })
          setTrip(null)
          return
        }
        throw new Error('Erro ao buscar dados da viagem')
      }
      
      const data = await response.json()
      if (data.success && data.trip) {
        setTrip(data.trip)
        toast({
          title: "Viagem encontrada",
          description: `Dados carregados para ${data.trip.motorista_nome}`,
        })
      } else {
        setTrip(null)
        toast({
          title: "Nenhuma viagem encontrada",
          description: "Não há viagens ativas para este motorista",
          variant: "destructive"
        })
      }
      
    } catch (error) {
      console.error('Erro ao buscar viagem do motorista:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da viagem",
        variant: "destructive"
      })
      setTrip(null)
    } finally {
      setSearchLoading(false)
    }
  }

  const updateTripStatus = async (newStatus: string) => {
    if (!trip) return

    try {
      setUpdating(true)
      
      const updateData: any = {
        status_viagem: newStatus
      }

      // Se está iniciando a viagem, registrar horário de início
      if (newStatus === 'Em Andamento') {
        updateData.data_inicio = new Date().toISOString()
      }

      // Se está finalizando, registrar horário de fim
      if (newStatus === 'Concluída') {
        updateData.data_fim = new Date().toISOString()
      }

      const response = await fetch(`/api/line-hall-shopee/${trip.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status da viagem')
      }

      // Atualizar dados locais
      setTrip(prev => prev ? { ...prev, status_viagem: newStatus } : null)
      
      toast({
        title: "Status atualizado",
        description: `Viagem marcada como: ${newStatus}`,
      })

      // Buscar novamente para dados atualizados
      if (motoristaName) {
        setTimeout(() => searchTrip(), 1000)
      }

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da viagem",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const startChecklist = async () => {
    if (!trip || !kmInicial) {
      toast({
        title: "KM inicial obrigatório",
        description: "Por favor, informe a quilometragem inicial",
        variant: "destructive"
      })
      return
    }

    try {
      setUpdating(true)
      
      const newChecklist: Checklist = {
        trip_id: trip.id,
        motorista_nome: trip.motorista_nome,
        placa_cavalo: trip.placa_cavalo,
        km_inicial: parseInt(kmInicial),
        status: 'em_andamento',
        items: [...checklistItems]
      }

      const response = await fetch('/api/line-hall-checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newChecklist)
      })

      if (!response.ok) {
        throw new Error('Erro ao iniciar checklist')
      }

      const result = await response.json()
      setChecklist(result.checklist)
      setShowChecklist(true)
      
      toast({
        title: "Checklist iniciado",
        description: "Preencha todos os itens do checklist",
      })

    } catch (error) {
      console.error('Erro ao iniciar checklist:', error)
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checklist",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const updateChecklistItem = (itemId: string, status: 'ok' | 'problema', observations?: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, status, observations } 
          : item
      )
    )
  }

  const finishChecklist = async () => {
    if (!checklist || !kmFinal) {
      toast({
        title: "KM final obrigatório",
        description: "Por favor, informe a quilometragem final",
        variant: "destructive"
      })
      return
    }

    // Verificar se todos os itens foram preenchidos
    const pendingItems = checklistItems.filter(item => item.status === 'pending')
    if (pendingItems.length > 0) {
      toast({
        title: "Checklist incompleto",
        description: `${pendingItems.length} item(s) ainda pendente(s)`,
        variant: "destructive"
      })
      return
    }

    try {
      setUpdating(true)
      
      const updatedChecklist: Checklist = {
        ...checklist,
        km_final: parseInt(kmFinal),
        status: 'concluido',
        items: checklistItems
      }

      const response = await fetch(`/api/line-hall-checklist/${checklist.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedChecklist)
      })

      if (!response.ok) {
        throw new Error('Erro ao finalizar checklist')
      }

      setChecklist(updatedChecklist as Checklist)
      
      toast({
        title: "Checklist finalizado",
        description: "Checklist concluído com sucesso!",
      })

      // Finalizar a viagem automaticamente
      await updateTripStatus('Concluída')

    } catch (error) {
      console.error('Erro ao finalizar checklist:', error)
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o checklist",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluída': return 'bg-green-100 text-green-800'
      case 'Em Andamento': return 'bg-blue-100 text-blue-800'
      case 'Aguardando': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Concluída': return <CheckCircle className="h-4 w-4" />
      case 'Em Andamento': return <Play className="h-4 w-4" />
      case 'Aguardando': return <Clock className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-center text-xl font-bold">
              Line Hall Shopee - Controle de Viagem
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Busca do Motorista */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Buscar Viagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="motorista">Nome do Motorista</Label>
                <Input
                  id="motorista"
                  value={motoristaName}
                  onChange={(e) => setMotoristaName(e.target.value)}
                  placeholder="Digite o nome completo"
                  onKeyPress={(e) => e.key === 'Enter' && searchTrip()}
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF (opcional)</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  onKeyPress={(e) => e.key === 'Enter' && searchTrip()}
                />
              </div>
            </div>
            <Button 
              onClick={searchTrip}
              disabled={searchLoading || !motoristaName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {searchLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Viagem
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Informações da Viagem */}
        {trip && (
          <>
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    {trip.motorista_nome}
                  </CardTitle>
                  <Badge className={`${getStatusColor(trip.status_viagem)} px-3 py-1 text-sm font-medium`}>
                    {getStatusIcon(trip.status_viagem)}
                    <span className="ml-2">{trip.status_viagem}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Veículos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Cavalo Mecânico</p>
                    <p className="font-bold text-blue-800">{trip.placa_cavalo}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Carreta 1</p>
                    <p className="font-bold text-green-800">{trip.placa_carreta_1}</p>
                  </div>
                  {trip.placa_carreta_2 && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Carreta 2</p>
                      <p className="font-bold text-purple-800">{trip.placa_carreta_2}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Locais */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Local de Carregamento</p>
                      <p className="font-semibold">{trip.local_carregamento}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <Navigation className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Local de Descarregamento</p>
                      <p className="font-semibold">{trip.local_descarregamento}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Data e Horário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Data da Viagem</p>
                      <p className="font-semibold">
                        {new Date(trip.data_viagem).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  {trip.horario_carregamento && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Horário de Carregamento</p>
                        <p className="font-semibold">{trip.horario_carregamento}</p>
                      </div>
                    </div>
                  )}
                </div>

                {trip.rota_selecionada && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600">Rota</p>
                      <p className="font-semibold">{trip.rota_selecionada}</p>
                      {trip.km_total && (
                        <p className="text-sm text-blue-600">{trip.km_total} km</p>
                      )}
                    </div>
                  </>
                )}

                {trip.observacoes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600">Observações</p>
                      <p className="text-gray-800">{trip.observacoes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Ações */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Controle da Viagem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trip.status_viagem === 'Aguardando' && (
                  <Button 
                    onClick={() => updateTripStatus('Em Andamento')}
                    disabled={updating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    size="lg"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {updating ? 'Iniciando...' : 'Iniciar Viagem'}
                  </Button>
                )}

                {trip.status_viagem === 'Em Andamento' && !showChecklist && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        KM Inicial do Veículo
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 150000"
                        value={kmInicial}
                        onChange={(e) => setKmInicial(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button 
                      onClick={startChecklist}
                      disabled={updating || !kmInicial}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3"
                      size="lg"
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {updating ? 'Iniciando...' : 'Iniciar Checklist'}
                    </Button>
                  </div>
                )}

                {trip.status_viagem === 'Concluída' && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-semibold">Viagem Concluída!</p>
                    <p className="text-green-600 text-sm">Obrigado por usar o sistema Line Hall Shopee</p>
                  </div>
                )}

                <Button 
                  onClick={searchTrip}
                  variant="outline"
                  className="w-full"
                  disabled={updating || searchLoading}
                >
                  Atualizar Dados
                </Button>
              </CardContent>
            </Card>

            {/* Checklist Card */}
            {showChecklist && checklist && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Checklist do Veículo</span>
                    <Badge variant="outline" className="text-sm">
                      KM Inicial: {checklist.km_inicial}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Itens do Checklist */}
                  <div className="space-y-3">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.description}</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={item.status === 'ok' ? 'default' : 'outline'}
                              onClick={() => updateChecklistItem(item.id, 'ok')}
                              className={item.status === 'ok' ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              OK
                            </Button>
                            <Button
                              size="sm"
                              variant={item.status === 'problema' ? 'destructive' : 'outline'}
                              onClick={() => updateChecklistItem(item.id, 'problema')}
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Problema
                            </Button>
                          </div>
                        </div>
                        
                        {item.status === 'problema' && (
                          <div>
                            <Input
                              placeholder="Descreva o problema encontrado..."
                              value={item.observations || ''}
                              onChange={(e) => updateChecklistItem(item.id, 'problema', e.target.value)}
                              className="mt-2"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Finalização do Checklist */}
                  <Separator />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        KM Final (ao retornar para garagem)
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 150250"
                        value={kmFinal}
                        onChange={(e) => setKmFinal(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        {checklistItems.filter(item => item.status === 'ok').length} de {checklistItems.length} itens verificados
                      </span>
                      <span>
                        {checklistItems.filter(item => item.status === 'pending').length} pendente(s)
                      </span>
                    </div>

                    <Button 
                      onClick={finishChecklist}
                      disabled={updating || !kmFinal || checklistItems.some(item => item.status === 'pending')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                      size="lg"
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {updating ? 'Finalizando...' : 'Finalizar Checklist e Viagem'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}