import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, ArrowRight, FileCheck, Tools, Wrench, BookOpen, Car, Receipt } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "wouter";

export default function OficinasOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inicio");
  const [, navigate] = useNavigate();

  // Verificar se o usuário está autenticado e tem o papel de oficina
  useEffect(() => {
    if (user && user.role !== 'oficina') {
      // Redirecionar para a página inicial se não for uma oficina
      toast({
        title: "Acesso restrito",
        description: "Esta página é apenas para oficinas credenciadas.",
        variant: "destructive"
      });
      navigate("/");
    } else {
      setLoading(false);
    }
  }, [user, toast, navigate]);

  // Função para marcar etapa como concluída
  const markStepAsCompleted = (step: string) => {
    localStorage.setItem(`oficina_onboarding_${step}`, 'completed');
    toast({
      title: "Etapa concluída",
      description: "Avance para a próxima etapa ou inicie o uso do sistema.",
      variant: "default"
    });
  };

  // Verificar se uma etapa está concluída
  const isStepCompleted = (step: string) => {
    return localStorage.getItem(`oficina_onboarding_${step}`) === 'completed';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Bem-vindo ao Portal de Oficinas Credenciadas</h1>
        <p className="text-gray-600 mt-2">
          Estamos felizes em tê-lo como parceiro! Este guia irá ajudá-lo a começar a utilizar o sistema.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <Tools className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>Manutenções de Frota</CardTitle>
            <CardDescription>
              Gerencie os veículos em manutenção e envie orçamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Acompanhe todas as solicitações de manutenção, envie orçamentos e registre a conclusão dos serviços.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Receipt className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>Orçamentos e Negociação</CardTitle>
            <CardDescription>
              Negocie orçamentos diretamente com a gestão de frotas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Envie orçamentos detalhados e acompanhe o processo de aprovação em tempo real com os gestores de frota.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Car className="h-8 w-8 text-orange-600 mb-2" />
            <CardTitle>Veículos em Manutenção</CardTitle>
            <CardDescription>
              Registre entrada, saída e atualizações dos veículos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Mantenha o histórico completo das manutenções realizadas e registre a entrada e saída dos veículos.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto">
          <TabsTrigger value="inicio">Início</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="manutencoes">Manutenções</TabsTrigger>
          <TabsTrigger value="concluir">Concluir</TabsTrigger>
        </TabsList>

        <TabsContent value="inicio">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Primeiros Passos
              </CardTitle>
              <CardDescription>
                Conheça os principais recursos disponíveis para sua oficina
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Como utilizar o sistema</h3>
                <p className="text-sm text-gray-600">
                  O sistema de gestão de oficinas permite que você:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Receba solicitações de orçamento diretamente das bases</li>
                  <li>Negocie valores e prazos com a equipe de gestão de frotas</li>
                  <li>Registre o andamento de cada manutenção</li>
                  <li>Notifique sobre a conclusão dos serviços</li>
                  <li>Mantenha um histórico completo dos serviços realizados</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-lg">Benefícios</h3>
                <p className="text-sm text-gray-600">
                  Como oficina credenciada, você terá:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Prioridade nas solicitações de orçamento</li>
                  <li>Canal direto com os gestores de frota</li>
                  <li>Visibilidade para todas as bases da empresa</li>
                  <li>Processo simplificado de aprovação de orçamentos</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex items-center">
                {isStepCompleted('inicio') ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                ) : null}
                <span className="text-sm text-gray-600">
                  {isStepCompleted('inicio') ? 'Etapa concluída' : 'Marque como concluído quando terminar a leitura'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={isStepCompleted('inicio') ? "default" : "outline"}
                  onClick={() => markStepAsCompleted('inicio')}
                >
                  {isStepCompleted('inicio') ? 'Concluído' : 'Marcar como concluído'}
                </Button>
                <Button onClick={() => setActiveTab('orcamentos')}>
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="orcamentos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileCheck className="h-5 w-5 mr-2" />
                Gerenciamento de Orçamentos
              </CardTitle>
              <CardDescription>
                Aprenda a enviar e gerenciar orçamentos no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Como enviar um orçamento</h3>
                <p className="text-sm text-gray-600">
                  Para enviar um novo orçamento:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
                  <li>Acesse o Portal da Oficina</li>
                  <li>Clique no botão "Novo Orçamento" no canto superior direito</li>
                  <li>Selecione o veículo na lista suspensa</li>
                  <li>Preencha o valor do orçamento, quilometragem atual e descrição do serviço</li>
                  <li>Indique o prazo estimado para conclusão</li>
                  <li>Clique em "Enviar Orçamento"</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-lg">Acompanhamento da negociação</h3>
                <p className="text-sm text-gray-600">
                  Após enviar o orçamento:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>A equipe de gestão de frota irá analisar e responder</li>
                  <li>Você poderá acompanhar o status na tabela de manutenções</li>
                  <li>Para responder a uma contraproposta, clique no botão "Atualizar Orçamento"</li>
                  <li>Quando aprovado, o status mudará para "Orçamento Aprovado"</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex items-center">
                {isStepCompleted('orcamentos') ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                ) : null}
                <span className="text-sm text-gray-600">
                  {isStepCompleted('orcamentos') ? 'Etapa concluída' : 'Marque como concluído quando terminar a leitura'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('inicio')}>
                  Anterior
                </Button>
                <Button 
                  variant={isStepCompleted('orcamentos') ? "default" : "outline"}
                  onClick={() => markStepAsCompleted('orcamentos')}
                >
                  {isStepCompleted('orcamentos') ? 'Concluído' : 'Marcar como concluído'}
                </Button>
                <Button onClick={() => setActiveTab('manutencoes')}>
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="manutencoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Registro de Manutenções
              </CardTitle>
              <CardDescription>
                Como registrar o andamento e conclusão das manutenções
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Atualizando o status da manutenção</h3>
                <p className="text-sm text-gray-600">
                  Durante o processo de manutenção, mantenha o sistema atualizado:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
                  <li>Acesse a lista de manutenções no Portal da Oficina</li>
                  <li>Localize a manutenção desejada</li>
                  <li>No campo "Ações", selecione o novo status no menu suspenso</li>
                  <li>Utilize o status "Aguardando Peças" quando necessário</li>
                  <li>Atualize para "Em Andamento" quando iniciar o serviço</li>
                  <li>Finalize com o status "Concluída" ao terminar o serviço</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-lg">Ciclo de vida da manutenção</h3>
                <p className="text-sm text-gray-600">
                  O sistema permite acompanhar todo o ciclo de vida da manutenção:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Utilize o botão "Ciclo de Vida" para ver e gerenciar todas as etapas</li>
                  <li>Registre observações importantes durante o processo</li>
                  <li>Documente cada etapa com detalhes para referência futura</li>
                  <li>Mantenha a gestão de frotas informada sobre qualquer imprevisto</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex items-center">
                {isStepCompleted('manutencoes') ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                ) : null}
                <span className="text-sm text-gray-600">
                  {isStepCompleted('manutencoes') ? 'Etapa concluída' : 'Marque como concluído quando terminar a leitura'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('orcamentos')}>
                  Anterior
                </Button>
                <Button 
                  variant={isStepCompleted('manutencoes') ? "default" : "outline"}
                  onClick={() => markStepAsCompleted('manutencoes')}
                >
                  {isStepCompleted('manutencoes') ? 'Concluído' : 'Marcar como concluído'}
                </Button>
                <Button onClick={() => setActiveTab('concluir')}>
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="concluir">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Tudo Pronto!
              </CardTitle>
              <CardDescription>
                Você está pronto para começar a utilizar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="font-medium text-xl">Parabéns!</h3>
                <p className="text-sm text-gray-600 max-w-lg mx-auto">
                  Você concluiu o guia de introdução ao Portal de Oficinas. Agora você pode começar a receber e gerenciar as manutenções 
                  de veículos da frota.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-medium text-lg text-blue-800">Próximos passos</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700 mt-2">
                  <li>Acesse o Portal da Oficina para verificar solicitações de manutenção</li>
                  <li>Configure suas informações no perfil, se necessário</li>
                  <li>Entre em contato com o suporte em caso de dúvidas</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex items-center">
                {isStepCompleted('concluir') ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                ) : null}
                <span className="text-sm text-gray-600">
                  {isStepCompleted('concluir') ? 'Onboarding concluído' : 'Marque como concluído para finalizar'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('manutencoes')}>
                  Anterior
                </Button>
                <Button 
                  variant={isStepCompleted('concluir') ? "default" : "outline"}
                  onClick={() => markStepAsCompleted('concluir')}
                >
                  {isStepCompleted('concluir') ? 'Concluído' : 'Marcar como concluído'}
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => navigate("/oficina/dashboard")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Ir para o Portal <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}