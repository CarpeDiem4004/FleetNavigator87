import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Check, X, Building, Info, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/hooks/use-permission";

// Interface para as oficinas pendentes de aprovação
interface OficinaPendente {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  ramoAtuacao: string;
  dataCadastro: string;
  status: "pendente" | "aprovado" | "rejeitado";
  observacoes?: string;
}

export default function AprovacaoOficinas() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("pendentes");
  const [oficinaDetalhes, setOficinaDetalhes] = useState<OficinaPendente | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [rejectMode, setRejectMode] = useState(false);

  // Verifica se o usuário tem permissão para aprovar oficinas
  const canApproveWorkshops = hasPermission(["admin", "gestor_frota"]);
  
  // Query para buscar oficinas pendentes
  const { data: oficinas, isLoading, error } = useQuery({
    queryKey: ['/api/workshops/pending'],
    queryFn: async () => {
      const response = await apiRequest('/api/workshops/pending');
      return response.data;
    },
    enabled: canApproveWorkshops
  });

  // Mutação para aprovar uma oficina
  const approvalMutation = useMutation({
    mutationFn: async (oficinaId: number) => {
      return await apiRequest(`/api/workshops/${oficinaId}/approve`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Oficina aprovada",
        description: "A oficina foi aprovada com sucesso e já pode acessar o sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workshops/pending'] });
      setShowDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar oficina",
        description: error.message || "Ocorreu um erro ao aprovar a oficina. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutação para rejeitar uma oficina
  const rejectionMutation = useMutation({
    mutationFn: async ({ oficinaId, motivo }: { oficinaId: number, motivo: string }) => {
      return await apiRequest(`/api/workshops/${oficinaId}/reject`, {
        method: 'POST',
        data: { motivo }
      });
    },
    onSuccess: () => {
      toast({
        title: "Oficina rejeitada",
        description: "A oficina foi rejeitada e será notificada sobre o motivo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workshops/pending'] });
      setShowDialog(false);
      setRejectMode(false);
      setMotivoRejeicao("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar oficina",
        description: error.message || "Ocorreu um erro ao rejeitar a oficina. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Filtra as oficinas por status
  const oficinasPendentes = oficinas?.filter(o => o.status === "pendente") || [];
  const oficinasAprovadas = oficinas?.filter(o => o.status === "aprovado") || [];
  const oficinasRejeitadas = oficinas?.filter(o => o.status === "rejeitado") || [];

  // Abre o diálogo com os detalhes da oficina
  const verDetalhes = (oficina: OficinaPendente) => {
    setOficinaDetalhes(oficina);
    setShowDialog(true);
    setRejectMode(false);
  };

  // Função para aprovar uma oficina
  const aprovarOficina = (oficinaId: number) => {
    approvalMutation.mutate(oficinaId);
  };

  // Função para abrir o modo de rejeição
  const prepararRejeicao = () => {
    setRejectMode(true);
  };

  // Função para rejeitar uma oficina
  const rejeitarOficina = () => {
    if (!motivoRejeicao.trim()) {
      toast({
        title: "Motivo necessário",
        description: "Informe o motivo da rejeição para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    if (oficinaDetalhes) {
      rejectionMutation.mutate({ 
        oficinaId: oficinaDetalhes.id, 
        motivo: motivoRejeicao
      });
    }
  };

  // Verifica se o usuário não tem permissão para acessar esta página
  if (!canApproveWorkshops) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página. Esta funcionalidade é restrita a administradores e gestores de frota.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Building className="h-8 w-8 mr-3 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Aprovação de Oficinas</h1>
          <p className="text-gray-500">
            Gerencie solicitações de cadastro de oficinas parceiras
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="pendentes" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Pendentes</span>
            {oficinasPendentes.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {oficinasPendentes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="aprovadas">
            <Check className="h-4 w-4 mr-1" />
            Aprovadas
          </TabsTrigger>
          <TabsTrigger value="rejeitadas">
            <X className="h-4 w-4 mr-1" />
            Rejeitadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          <Card>
            <CardHeader>
              <CardTitle>Oficinas Pendentes de Aprovação</CardTitle>
              <CardDescription>
                Revise e aprove os cadastros de novas oficinas parceiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">Carregando solicitações...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  Erro ao carregar solicitações. Tente novamente mais tarde.
                </div>
              ) : oficinasPendentes.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  Não há solicitações pendentes no momento.
                </div>
              ) : (
                <Table>
                  <TableCaption>Lista de oficinas aguardando aprovação</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Ramo</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oficinasPendentes.map((oficina) => (
                      <TableRow key={oficina.id}>
                        <TableCell className="font-medium">{oficina.nome}</TableCell>
                        <TableCell>{oficina.cnpj}</TableCell>
                        <TableCell>{oficina.ramoAtuacao}</TableCell>
                        <TableCell>{new Date(oficina.dataCadastro).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verDetalhes(oficina)}
                            >
                              Detalhes
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => aprovarOficina(oficina.id)}
                              disabled={approvalMutation.isPending}
                            >
                              {approvalMutation.isPending ? "Aprovando..." : "Aprovar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aprovadas">
          <Card>
            <CardHeader>
              <CardTitle>Oficinas Aprovadas</CardTitle>
              <CardDescription>
                Oficinas que já foram aprovadas e têm acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">Carregando oficinas aprovadas...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  Erro ao carregar oficinas. Tente novamente mais tarde.
                </div>
              ) : oficinasAprovadas.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  Não há oficinas aprovadas no sistema.
                </div>
              ) : (
                <Table>
                  <TableCaption>Lista de oficinas aprovadas</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Ramo</TableHead>
                      <TableHead>Data de Aprovação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oficinasAprovadas.map((oficina) => (
                      <TableRow key={oficina.id}>
                        <TableCell className="font-medium">{oficina.nome}</TableCell>
                        <TableCell>{oficina.cnpj}</TableCell>
                        <TableCell>{oficina.ramoAtuacao}</TableCell>
                        <TableCell>{new Date(oficina.dataCadastro).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verDetalhes(oficina)}
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejeitadas">
          <Card>
            <CardHeader>
              <CardTitle>Oficinas Rejeitadas</CardTitle>
              <CardDescription>
                Oficinas cujo cadastro foi rejeitado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">Carregando oficinas rejeitadas...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  Erro ao carregar oficinas. Tente novamente mais tarde.
                </div>
              ) : oficinasRejeitadas.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  Não há oficinas rejeitadas no sistema.
                </div>
              ) : (
                <Table>
                  <TableCaption>Lista de oficinas rejeitadas</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Ramo</TableHead>
                      <TableHead>Data de Rejeição</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oficinasRejeitadas.map((oficina) => (
                      <TableRow key={oficina.id}>
                        <TableCell className="font-medium">{oficina.nome}</TableCell>
                        <TableCell>{oficina.cnpj}</TableCell>
                        <TableCell>{oficina.ramoAtuacao}</TableCell>
                        <TableCell>{new Date(oficina.dataCadastro).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {oficina.observacoes || "Não informado"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verDetalhes(oficina)}
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de detalhes da oficina */}
      {oficinaDetalhes && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {rejectMode ? "Rejeitar Cadastro" : "Detalhes da Oficina"}
              </DialogTitle>
              <DialogDescription>
                {rejectMode
                  ? "Informe o motivo da rejeição que será enviado à oficina."
                  : "Visualize as informações completas da oficina."}
              </DialogDescription>
            </DialogHeader>

            {rejectMode ? (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo da Rejeição:</label>
                  <textarea 
                    className="w-full p-2 border rounded-md resize-y min-h-[100px]"
                    placeholder="Descreva o motivo da rejeição..."
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 py-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Dados da Oficina</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Nome:</span> {oficinaDetalhes.nome}
                      </div>
                      <div>
                        <span className="font-medium">CNPJ:</span> {oficinaDetalhes.cnpj}
                      </div>
                      <div>
                        <span className="font-medium">Ramo de Atuação:</span> {oficinaDetalhes.ramoAtuacao}
                      </div>
                      <div>
                        <span className="font-medium">Telefone:</span> {oficinaDetalhes.telefone}
                      </div>
                      <div>
                        <span className="font-medium">E-mail:</span> {oficinaDetalhes.email}
                      </div>
                      <div>
                        <span className="font-medium">Endereço:</span> {oficinaDetalhes.endereco}
                      </div>
                      <div>
                        <span className="font-medium">Data de Cadastro:</span>{" "}
                        {new Date(oficinaDetalhes.dataCadastro).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {oficinaDetalhes.status === "rejeitado" && oficinaDetalhes.observacoes && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Motivo da Rejeição</h3>
                      <p className="text-gray-700">{oficinaDetalhes.observacoes}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            <DialogFooter className="flex justify-between">
              {rejectMode ? (
                <>
                  <Button variant="outline" onClick={() => setRejectMode(false)}>
                    Voltar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={rejeitarOficina}
                    disabled={rejectionMutation.isPending}
                  >
                    {rejectionMutation.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    {oficinaDetalhes.status === "pendente" && (
                      <Button 
                        variant="destructive" 
                        className="mr-2"
                        onClick={prepararRejeicao}
                      >
                        Rejeitar
                      </Button>
                    )}
                  </div>
                  <div>
                    <Button variant="outline" onClick={() => setShowDialog(false)} className="mr-2">
                      Fechar
                    </Button>
                    {oficinaDetalhes.status === "pendente" && (
                      <Button 
                        variant="default"
                        onClick={() => aprovarOficina(oficinaDetalhes.id)}
                        disabled={approvalMutation.isPending}
                      >
                        {approvalMutation.isPending ? "Aprovando..." : "Aprovar"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}