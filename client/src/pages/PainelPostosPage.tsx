import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fuel, Droplets, ArrowRight, DollarSign, Percent, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Posto = {
  id: number;
  nome: string;
  descricao: string;
  icone: React.ReactNode;
  cor: string;
  rota: string;
  limiteMensal?: number;
  gastoAtual?: number;
  porcentagemUtilizada?: number;
};

export default function PainelPostosPage() {
  const { toast } = useToast();
  const [limitePostoRemedios, setLimitePostoRemedios] = useState(5000);
  const [gastoPostoRemedios, setGastoPostoRemedios] = useState(2350);
  const [dialogLimiteAberto, setDialogLimiteAberto] = useState(false);
  const [novoLimite, setNovoLimite] = useState('');
  const [postoSelecionado, setPostoSelecionado] = useState<Posto | null>(null);

  // Lista de postos disponíveis com seus limites e gastos
  const postos: Posto[] = [
    {
      id: 1,
      nome: 'Posto Remédios',
      descricao: 'Controle de abastecimento e lavagem da frota no Posto Remédios.',
      icone: <Fuel className="h-10 w-10" />,
      cor: 'bg-gradient-to-br from-blue-500 to-blue-700',
      rota: '/posto-remedios',
      limiteMensal: limitePostoRemedios,
      gastoAtual: gastoPostoRemedios,
      porcentagemUtilizada: (gastoPostoRemedios / limitePostoRemedios) * 100
    },
    {
      id: 2,
      nome: 'Posto Contagem',
      descricao: 'Gerenciamento de abastecimento e serviços realizados no Posto Contagem.',
      icone: <Droplets className="h-10 w-10" />,
      cor: 'bg-gradient-to-br from-green-500 to-green-700',
      rota: '/posto-contagem',
      limiteMensal: 7500,
      gastoAtual: 4200,
      porcentagemUtilizada: (4200 / 7500) * 100
    }
  ];

  const atualizarLimite = () => {
    if (!postoSelecionado) return;
    
    const valor = parseFloat(novoLimite);
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor numérico maior que zero.",
        variant: "destructive"
      });
      return;
    }

    // Atualiza o limite conforme o posto selecionado
    if (postoSelecionado.id === 1) {
      setLimitePostoRemedios(valor);
    }
    
    toast({
      title: "Limite atualizado",
      description: `O limite do ${postoSelecionado.nome} foi atualizado para R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      variant: "default"
    });
    
    setDialogLimiteAberto(false);
    setNovoLimite('');
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold">Visão Geral dos Postos de Abastecimento</h1>
            <p className="text-muted-foreground mt-2">
              Gestão e controle dos postos de abastecimento com monitoramento de limites e gastos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {postos.map((posto) => (
              <Card key={posto.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                <div className={`${posto.cor} p-4 flex justify-between items-center`}>
                  <div className="text-white">{posto.icone}</div>
                  <div className="bg-white/20 rounded-full p-2">
                    {posto.id}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>{posto.nome}</CardTitle>
                  <CardDescription>{posto.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Wallet className="w-4 h-4" />
                        Limite Mensal
                      </span>
                      <span className="font-semibold">
                        R$ {posto.limiteMensal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Gasto Atual
                      </span>
                      <span className="font-semibold">
                        R$ {posto.gastoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        Utilizado
                      </span>
                      <span className="font-semibold">
                        {posto.porcentagemUtilizada?.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="pt-1">
                      <Progress 
                        value={posto.porcentagemUtilizada || 0} 
                        className="h-2 bg-neutral-200"
                        indicatorColor={
                          (posto.porcentagemUtilizada || 0) > 80 
                            ? 'bg-red-500' 
                            : (posto.porcentagemUtilizada || 0) > 60 
                              ? 'bg-amber-500' 
                              : 'bg-green-500'
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <Dialog open={dialogLimiteAberto} onOpenChange={setDialogLimiteAberto}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPostoSelecionado(posto)}
                      >
                        Ajustar Limite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajustar Limite Mensal</DialogTitle>
                        <DialogDescription>
                          Defina o novo limite mensal para {postoSelecionado?.nome}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <label htmlFor="limiteMensal" className="block text-sm font-medium mb-2">
                          Novo Limite (R$)
                        </label>
                        <Input
                          id="limiteMensal"
                          type="number"
                          placeholder="0.00"
                          value={novoLimite}
                          onChange={(e) => setNovoLimite(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setDialogLimiteAberto(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={atualizarLimite}>
                          Salvar Alterações
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button asChild variant="default" className="gap-2 ml-auto">
                    <Link href={posto.rota}>
                      Acessar <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}