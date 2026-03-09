import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GraduationCap, ArrowLeft, Clock, Users, CheckCircle, Calendar, User, Phone, Building } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const BASES_DISPONIVEIS = [
  'Guarulhos', 'Osasco', 'Cajamar', 'Embu', 'Barueri', 
  'Campinas', 'Ribeirão Preto', 'Sorocaba', 'Santos', 'São José dos Campos',
  'Mauá', 'Santo André', 'Diadema', 'São Bernardo', 'Jundiaí'
];

interface Training {
  id: number;
  nome: string;
  descricao: string;
  carga_horaria: number;
  validade: number;
  ativo: boolean;
}

export default function WorkSafetyTrainings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    motoristaNome: '',
    motoristaCpf: '',
    base: '',
  });

  const { data: trainingsData, isLoading } = useQuery<{ success: boolean; data: Training[] }>({
    queryKey: ['/api/work-safety/trainings'],
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/work-safety/trainings/participations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Inscrição realizada!',
        description: 'Sua inscrição foi registrada com sucesso.',
      });
      setShowDialog(false);
      setFormData({ motoristaNome: '', motoristaCpf: '', base: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/work-safety/trainings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na inscrição',
        description: error.message || 'Ocorreu um erro ao realizar a inscrição.',
        variant: 'destructive',
      });
    },
  });

  const handleSubscribe = () => {
    if (!formData.motoristaNome || !formData.base || !selectedTraining) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate({
      treinamentoId: selectedTraining.id,
      motoristaNome: formData.motoristaNome,
      motoristaCpf: formData.motoristaCpf,
      base: formData.base,
      status: 'inscrito',
    });
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const trainings = trainingsData?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/work-safety/portal">
            <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Portal
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl mb-6">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">Treinamentos Disponíveis</CardTitle>
                <CardDescription className="text-green-100">
                  Confira os treinamentos disponíveis e confirme sua participação
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando treinamentos...</p>
              </div>
            ) : trainings.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum treinamento disponível no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainings.map((training) => (
                  <Card key={training.id} className="hover:shadow-lg transition-shadow" data-testid={`card-training-${training.id}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-green-600" />
                        {training.nome}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{training.descricao}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        {training.carga_horaria && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {training.carga_horaria}h
                          </div>
                        )}
                        {training.validade && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Validade: {training.validade} meses
                          </div>
                        )}
                      </div>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedTraining(training);
                          setShowDialog(true);
                        }}
                        data-testid={`button-subscribe-${training.id}`}
                      >
                        Confirmar Participação
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-600" />
                Confirmar Participação
              </DialogTitle>
              <DialogDescription>
                {selectedTraining?.nome}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="motoristaNome">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="motoristaNome"
                    placeholder="Seu nome completo"
                    className="pl-10"
                    value={formData.motoristaNome}
                    onChange={(e) => setFormData({...formData, motoristaNome: e.target.value})}
                    data-testid="input-participant-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motoristaCpf">CPF (opcional)</Label>
                <Input
                  id="motoristaCpf"
                  placeholder="000.000.000-00"
                  value={formData.motoristaCpf}
                  onChange={(e) => setFormData({...formData, motoristaCpf: formatCPF(e.target.value)})}
                  maxLength={14}
                  data-testid="input-participant-cpf"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base">Base de Atuação *</Label>
                <Select value={formData.base} onValueChange={(v) => setFormData({...formData, base: v})}>
                  <SelectTrigger data-testid="select-base">
                    <SelectValue placeholder="Selecione a base" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASES_DISPONIVEIS.map((base) => (
                      <SelectItem key={base} value={base}>{base}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleSubscribe}
                disabled={mutation.isPending}
                data-testid="button-confirm-subscription"
              >
                {mutation.isPending ? 'Inscrevendo...' : 'Confirmar Inscrição'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
