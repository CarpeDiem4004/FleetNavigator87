import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, RefreshCw, Key, Building2, Copy, Check, ExternalLink, Info } from 'lucide-react';

interface WorkshopCredential {
  id: number;
  name: string;
  cnpj: string;
  email: string;
  phone?: string;
  password?: string;
  hasCredentials: boolean;
  lastLogin?: string;
  status: 'active' | 'inactive';
  externalToken?: string;
  externalLink?: string;
  loginLink?: string;
}

export default function OficinasCredentialsPage() {
  const { toast } = useToast();
  const [workshops, setWorkshops] = useState<WorkshopCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopCredential | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/maintenance/workshops/credentials', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Frontend: Dados recebidos das oficinas:', data.workshops);
        const alairData = data.workshops?.find((w: any) => w.name === 'Oficina Alair');
        console.log('Frontend: Dados da Oficina Alair:', alairData);
        setWorkshops(data.workshops || []);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as oficinas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar oficinas:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const updateWorkshopPassword = async () => {
    if (!selectedWorkshop || !newPassword) {
      toast({
        title: "Erro",
        description: "Selecione uma oficina e defina uma senha",
        variant: "destructive",
      });
      return;
    }

    try {
      setGeneratingPassword(true);
      const response = await fetch(`/api/maintenance/workshops/${selectedWorkshop.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Senha atualizada com sucesso",
        });
        setIsDialogOpen(false);
        setNewPassword('');
        setSelectedWorkshop(null);
        fetchWorkshops();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao atualizar senha",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setGeneratingPassword(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'password' | 'link' = 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'password') {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
      toast({
        title: "Copiado",
        description: type === 'password' ? "Senha copiada para a área de transferência" : "Link copiado para a área de transferência",
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const openPasswordDialog = (workshop: WorkshopCredential) => {
    setSelectedWorkshop(workshop);
    setNewPassword('');
    setIsDialogOpen(true);
  };

  const openDetailsDialog = (workshop: WorkshopCredential) => {
    setSelectedWorkshop(workshop);
    setIsDetailsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credenciais das Oficinas</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as senhas de acesso das oficinas credenciadas
          </p>
        </div>
        <Button onClick={fetchWorkshops} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Oficinas Credenciadas ({workshops.length})
          </CardTitle>
          <CardDescription>
            Lista de todas as oficinas e suas credenciais de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oficina</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Credenciais</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="w-[220px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workshops.map((workshop) => (
                <TableRow key={workshop.id}>
                  <TableCell className="font-medium">
                    {workshop.name}
                  </TableCell>
                  <TableCell>
                    {workshop.cnpj || 'Não informado'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {workshop.email && (
                        <div className="text-sm">{workshop.email}</div>
                      )}
                      {workshop.phone && (
                        <div className="text-sm text-gray-500">{workshop.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={workshop.status === 'active' ? 'default' : 'secondary'}>
                      {workshop.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={workshop.hasCredentials ? 'default' : 'destructive'}>
                      {workshop.hasCredentials ? 'Configuradas' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {workshop.lastLogin ? (
                      new Date(workshop.lastLogin).toLocaleDateString('pt-BR')
                    ) : (
                      <span className="text-gray-400">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetailsDialog(workshop)}
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      {workshop.externalToken && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`${window.location.origin}/oficina/external?token=${workshop.externalToken}`, '_blank')}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Link
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPasswordDialog(workshop)}
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Configurar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkshop?.hasCredentials ? 'Alterar' : 'Criar'} Senha
            </DialogTitle>
            <DialogDescription>
              Defina uma nova senha para a oficina: {selectedWorkshop?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cnpj">CNPJ da Oficina</Label>
              <Input 
                value={selectedWorkshop?.cnpj || 'Não informado'} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Nova Senha</Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                >
                  Gerar
                </Button>
                {newPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newPassword)}
                  >
                    {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>

            {newPassword && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Anote esta senha e repasse para a oficina. 
                  Ela precisará usar o CNPJ e esta senha para acessar o sistema.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={generatingPassword}
            >
              Cancelar
            </Button>
            <Button
              onClick={updateWorkshopPassword}
              disabled={!newPassword || generatingPassword}
            >
              {generatingPassword ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Senha'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes da Oficina */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedWorkshop?.name}
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas e links de acesso da oficina
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações da Oficina */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">CNPJ</Label>
                <p className="font-medium">{selectedWorkshop?.cnpj || 'Não informado'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedWorkshop?.email || 'Não informado'}</p>
              </div>
              {selectedWorkshop?.phone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                  <p className="font-medium">{selectedWorkshop.phone}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge variant={selectedWorkshop?.status === 'active' ? 'default' : 'secondary'}>
                  {selectedWorkshop?.status === 'active' ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </div>

            {/* Token de Acesso Direto */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Token de Acesso Direto</Label>
                {selectedWorkshop?.externalToken ? (
                  <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                      <Label className="text-sm font-semibold text-blue-800">Link de Acesso Externo</Label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input 
                          value={`${window.location.origin}/oficina/external?token=${selectedWorkshop.externalToken}`}
                          readOnly 
                          className="text-xs bg-white"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(`${window.location.origin}/oficina/external?token=${selectedWorkshop.externalToken}`, 'link')}
                        >
                          {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => window.open(`${window.location.origin}/oficina/external?token=${selectedWorkshop.externalToken}`, '_blank')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-blue-700">
                        Link direto para o painel da oficina (não requer login)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Nenhum token de acesso direto configurado para esta oficina.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Use a página "Acesso Externo" para gerar um token de acesso direto se necessário.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Links de Acesso */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Link de Login (Recomendado)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={`${window.location.origin}/oficina/login`}
                    readOnly 
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}/oficina/login`, 'link')}
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${window.location.origin}/oficina/login`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  A oficina deve usar CNPJ e senha para fazer login
                </p>
              </div>

              {selectedWorkshop?.externalToken && (
                <div>
                  <Label className="text-sm font-medium">Link Direto com Token</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      value={selectedWorkshop.externalLink || `${window.location.origin}/oficina/external?token=${selectedWorkshop.externalToken}`}
                      readOnly 
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(selectedWorkshop.externalLink || `${window.location.origin}/oficina/external?token=${selectedWorkshop.externalToken}`, 'link')}
                    >
                      {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(selectedWorkshop.externalLink || `${window.location.origin}/oficina/external?token=${selectedWorkshop.externalToken}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Link direto que não requer login (use com cuidado)
                  </p>
                </div>
              )}

              {!selectedWorkshop?.externalToken && (
                <div>
                  <Label className="text-sm font-medium">Token de Acesso Direto</Label>
                  <div className="bg-amber-50 p-3 rounded-md mt-1">
                    <p className="text-sm text-amber-700">
                      Nenhum token de acesso direto configurado para esta oficina.
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Use a página "Acesso Externo" para gerar um token de acesso direto se necessário.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Credenciais de Acesso */}
            <div className="bg-muted p-4 rounded-md">
              <Label className="text-sm font-medium">Credenciais de Acesso</Label>
              <div className="mt-2 space-y-1 text-sm">
                <p><strong>CNPJ:</strong> {selectedWorkshop?.cnpj || 'Não informado'}</p>
                <p><strong>Senha:</strong> {selectedWorkshop?.hasCredentials ? 'Configurada' : 'Não configurada'}</p>
              </div>
              {!selectedWorkshop?.hasCredentials && (
                <p className="text-xs text-amber-600 mt-2">
                  Configure uma senha para permitir que a oficina acesse o sistema
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setIsDetailsDialogOpen(false);
                openPasswordDialog(selectedWorkshop!);
              }}
              disabled={!selectedWorkshop}
            >
              <Key className="h-4 w-4 mr-2" />
              Configurar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}