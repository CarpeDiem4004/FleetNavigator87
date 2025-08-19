import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, ArrowDownUp, Trash2, Wrench, AlertTriangle, RotateCcw, ChevronLeft, ClipboardList } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useToast } from '@/hooks/use-toast';
import { Tire, getTireById } from '@/services/tiresService';
import TireActivityHistory from '@/components/tires/TireActivityHistory';
import TireMountingHistory from '@/components/tires/TireMountingHistory';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { logTireActivity } from '@/services/tireActivityLogService';

export default function TireDetailPage() {
  const params = useParams<{ id: string }>();
  const tireId = parseInt(params.id);
  const { toast } = useToast();
  const supabaseAuth = useSupabaseAuth();
  const supabaseUser = supabaseAuth?.user || null;
  
  const [tire, setTire] = useState<Tire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadTireDetails() {
      try {
        setLoading(true);
        setError(null);
        
        const loadedTire = await getTireById(tireId);
        setTire(loadedTire || null);
        
        // Registrar atividade de visualização
        if (loadedTire) {
          await logTireActivity(
            {
              pneu_id: loadedTire.id,
              acao: 'atualizacao',
              detalhes: { tipo: 'visualizacao', data: new Date().toISOString() }
            },
            supabaseUser
          );
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes do pneu:', err);
        setError('Não foi possível carregar os detalhes do pneu');
      } finally {
        setLoading(false);
      }
    }
    
    if (tireId) {
      loadTireDetails();
    }
  }, [tireId, supabaseUser]);
  
  // Função para obter classe CSS baseada no status do pneu
  const getStatusBadgeClass = (status: string | undefined) => {
    switch (status) {
      case 'em_uso':
        return 'bg-green-100 text-green-800';
      case 'estoque':
        return 'bg-blue-100 text-blue-800';
      case 'descartado':
        return 'bg-red-100 text-red-800';
      case 'manutencao':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Traduzir status do pneu para português
  const translateTireStatus = (status: string | undefined) => {
    const statusMap: Record<string, string> = {
      'em_uso': 'Em Uso',
      'estoque': 'Em Estoque',
      'descartado': 'Descartado',
      'manutencao': 'Em Manutenção'
    };
    
    return statusMap[status || ''] || 'Desconhecido';
  };
  
  // Função para obter ícone baseado no status do pneu
  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'em_uso':
        return <Truck className="h-5 w-5 mr-2 text-green-600" />;
      case 'estoque':
        return <RotateCcw className="h-5 w-5 mr-2 text-blue-600" />;
      case 'descartado':
        return <Trash2 className="h-5 w-5 mr-2 text-red-600" />;
      case 'manutencao':
        return <Wrench className="h-5 w-5 mr-2 text-amber-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 mr-2 text-gray-600" />;
    }
  };
  
  if (loading) {
    return (
      <MainLayoutSimple>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayoutSimple>
    );
  }
  
  if (error || !tire) {
    return (
      <MainLayoutSimple>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-500">{error || 'Pneu não encontrado'}</h2>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </MainLayoutSimple>
    );
  }
  
  return (
    <MainLayoutSimple>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="mr-4"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Pneu {tire.codigo}</h1>
          </div>
          <Badge className={getStatusBadgeClass(tire.status)} variant="outline">
            {getStatusIcon(tire.status)}
            {translateTireStatus(tire.status)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Pneu */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>Detalhes técnicos e administrativos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Marca/Modelo</p>
                <p className="font-medium">{tire.marca} {tire.modelo}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Medida/Aro</p>
                <p className="font-medium">{tire.medida} {tire.aro ? `(Aro ${tire.aro})` : ''}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                <p className="font-medium capitalize">{tire.tipo || 'Não especificado'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Localização Atual</p>
                <p className="font-medium">{tire.localizacao || 'Não especificada'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Data de Aquisição</p>
                <p className="font-medium">
                  {tire.data_aquisicao 
                    ? new Date(tire.data_aquisicao).toLocaleDateString('pt-BR') 
                    : 'Não especificada'}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Veículo Atual</p>
                <p className="font-medium">
                  {tire.veiculo_placa 
                    ? <Badge variant="outline"><Truck className="h-3 w-3 mr-1" /> {tire.veiculo_placa}</Badge>
                    : 'Não montado'}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Posição</p>
                <p className="font-medium">{tire.posicao || 'N/A'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Profundidade do Sulco</p>
                <p className="font-medium">{tire.profundidade_sulco ? `${tire.profundidade_sulco} mm` : 'Não medido'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Quilometragem Inicial</p>
                <p className="font-medium">{tire.km_inicial ? `${tire.km_inicial.toLocaleString('pt-BR')} km` : 'N/A'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Quilometragem Atual</p>
                <p className="font-medium">{tire.km_atual ? `${tire.km_atual.toLocaleString('pt-BR')} km` : 'N/A'}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <Wrench className="h-4 w-4 mr-2" />
                Registrar Manutenção
              </Button>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Descartar
              </Button>
            </CardFooter>
          </Card>
          
          {/* Conteúdo principal - Histórico e Estatísticas */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="activities" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="activities" className="flex-1">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Atividades
                </TabsTrigger>
                <TabsTrigger value="mountings" className="flex-1">
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  Montagens
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="activities" className="mt-4">
                <TireActivityHistory tireId={tireId} />
              </TabsContent>
              
              <TabsContent value="mountings" className="mt-4">
                <TireMountingHistory tireId={tireId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayoutSimple>
  );
}