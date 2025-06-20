import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  ExternalLink, 
  Key, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Wrench, 
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar
} from "lucide-react";

interface WorkshopToken {
  workshopId: number;
  workshopName: string;
  cnpj: string;
  email: string;
  telefone: string;
  token: string | null;
  tokenCreated: string | null;
  isActive: boolean;
  hasToken: boolean;
  externalLink: string | null;
}

export default function WorkshopExternalAccess() {
  const [workshops, setWorkshops] = useState<WorkshopToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState<number | null>(null);
  const [deletingToken, setDeletingToken] = useState<number | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopToken | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchWorkshops = async () => {
    try {
      const response = await fetch('/api/maintenance/workshops/external-tokens');
      const data = await response.json();

      if (data.success) {
        setWorkshops(data.workshops);
      } else {
        throw new Error(data.message || 'Erro ao carregar dados');
      }
    } catch (error) {
      console.error('Erro ao buscar oficinas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das oficinas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async (workshopId: number) => {
    try {
      setGeneratingToken(workshopId);
      const response = await fetch(`/api/maintenance/workshops/${workshopId}/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Token gerado com sucesso",
        });
        fetchWorkshops();
      } else {
        throw new Error(data.message || 'Erro ao gerar token');
      }
    } catch (error) {
      console.error('Erro ao gerar token:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar token",
        variant: "destructive",
      });
    } finally {
      setGeneratingToken(null);
    }
  };

  const deleteToken = async (workshopId: number) => {
    try {
      setDeletingToken(workshopId);
      const response = await fetch(`/api/maintenance/workshops/${workshopId}/external-token`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Token desativado com sucesso",
        });
        fetchWorkshops();
      } else {
        throw new Error(data.message || 'Erro ao desativar token');
      }
    } catch (error) {
      console.error('Erro ao desativar token:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao desativar token",
        variant: "destructive",
      });
    } finally {
      setDeletingToken(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: "Link copiado para a área de transferência",
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: "Erro",
        description: "Erro ao copiar link",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (workshop: WorkshopToken) => {
    if (!workshop.hasToken) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Sem Acesso</Badge>;
    }
    
    if (workshop.isActive) {
      return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
    }
    
    return <Badge variant="destructive">Inativo</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados das oficinas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Acesso Externo das Oficinas
                </h1>
                <p className="text-gray-600">
                  Gerencie tokens de acesso e links externos para oficinas parceiras
                </p>
              </div>
            </div>
            <Button onClick={fetchWorkshops} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Wrench className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Oficinas</p>
                  <p className="text-2xl font-bold text-gray-900">{workshops.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Com Acesso Ativo</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workshops.filter(w => w.hasToken && w.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Sem Acesso</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workshops.filter(w => !w.hasToken).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Tokens Inativos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workshops.filter(w => w.hasToken && !w.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Info */}
        <Alert className="mb-8">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Os tokens de acesso permitem que as oficinas visualizem e atualizem suas ordens de serviço 
            através de um painel externo dedicado. Cada token é único e pode ser desativado a qualquer momento.
          </AlertDescription>
        </Alert>

        {/* Workshops List */}
        <div className="grid gap-6">
          {workshops.map((workshop) => (
            <Card key={workshop.workshopId} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    {workshop.workshopName}
                    <span className="text-sm font-normal text-gray-600">
                      (ID: {workshop.workshopId})
                    </span>
                  </CardTitle>
                  <div className="flex gap-2">
                    {getStatusBadge(workshop)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Workshop Info */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Informações da Oficina</Label>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm"><strong>CNPJ:</strong> {workshop.cnpj || 'N/A'}</p>
                      <p className="text-sm"><strong>Email:</strong> {workshop.email || 'N/A'}</p>
                      <p className="text-sm"><strong>Telefone:</strong> {workshop.telefone || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Token Info */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Token de Acesso</Label>
                    <div className="mt-2 space-y-1">
                      {workshop.hasToken ? (
                        <>
                          <p className="text-sm">
                            <strong>Status:</strong> {workshop.isActive ? 'Ativo' : 'Inativo'}
                          </p>
                          <p className="text-sm">
                            <strong>Criado em:</strong> {formatDate(workshop.tokenCreated)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[200px]">
                              {workshop.token?.substring(0, 20)}...
                            </code>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Nenhum token gerado</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Ações</Label>
                    <div className="mt-2 space-y-2">
                      {workshop.hasToken && workshop.isActive ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(workshop.externalLink!)}
                            className="w-full"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Link
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedWorkshop(workshop)}
                                className="w-full"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Acesso Externo</DialogTitle>
                              </DialogHeader>
                              {selectedWorkshop && (
                                <div className="space-y-4">
                                  <div>
                                    <Label>Link de Acesso Externo</Label>
                                    <div className="flex gap-2 mt-1">
                                      <Input 
                                        value={selectedWorkshop.externalLink || ''} 
                                        readOnly 
                                        className="flex-1"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => copyToClipboard(selectedWorkshop.externalLink!)}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Token de Segurança</Label>
                                    <div className="flex gap-2 mt-1">
                                      <Input 
                                        value={selectedWorkshop.token || ''} 
                                        readOnly 
                                        className="flex-1 font-mono text-xs"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => copyToClipboard(selectedWorkshop.token!)}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <Alert>
                                    <Shield className="h-4 w-4" />
                                    <AlertDescription>
                                      Compartilhe apenas o link de acesso com a oficina. 
                                      O token deve ser mantido em segurança.
                                    </AlertDescription>
                                  </Alert>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteToken(workshop.workshopId)}
                            disabled={deletingToken === workshop.workshopId}
                            className="w-full"
                          >
                            {deletingToken === workshop.workshopId ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Desativar
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => generateToken(workshop.workshopId)}
                          disabled={generatingToken === workshop.workshopId}
                          className="w-full"
                        >
                          {generatingToken === workshop.workshopId ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Key className="h-4 w-4 mr-2" />
                          )}
                          {workshop.hasToken ? 'Reativar Token' : 'Gerar Token'}
                        </Button>
                      )}
                      
                      {workshop.hasToken && workshop.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateToken(workshop.workshopId)}
                          disabled={generatingToken === workshop.workshopId}
                          className="w-full"
                        >
                          {generatingToken === workshop.workshopId ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Regenerar Token
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {workshops.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma Oficina Encontrada
              </h3>
              <p className="text-gray-600">
                Cadastre oficinas no sistema para gerenciar seus acessos externos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}