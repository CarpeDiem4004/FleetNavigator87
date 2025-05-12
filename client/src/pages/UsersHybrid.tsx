import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Search, Plus, KeyRound, FileEdit, 
  Trash2, UserX, UserCircle2, RefreshCw, 
  Copy, CheckCircle2
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NativeSelect } from '@/components/ui/native-select';
import * as hybridUserService from '../services/hybridUserService';

// Tipo para usuários
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'operador' | 'oficina' | 'pneus' | 'posto' | 'gestor_frota';
  baseId: number | null;
  baseName: string | null;
  lastLogin: string | null;
  isActive: boolean;
  // Campos do banco, utilizados para compatibilidade
  base_id?: number | null;
  basename?: string | null;
  is_active?: boolean;
}

// Interface para as bases
interface Base {
  id: number;
  name: string;
  location?: string;
  operation?: string;
  active?: boolean;
  hasMaintenance?: boolean;
  hasTires?: boolean;
  created_at?: string;
}

// Função para traduzir os tipos de perfil
const translateUserRole = (role: string): string => {
  const roles: Record<string, string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    gestor_frota: 'Gestor de Frota',
    operador: 'Operador',
    oficina: 'Oficina',
    pneus: 'Especialista em Pneus',
    posto: 'Posto (Abastecimento)'
  };
  return roles[role] || role;
};

// Função para obter a classe CSS para o badge de perfil
const getRoleBadgeClass = (role: string): string => {
  const classes: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    gestor: 'bg-blue-100 text-blue-800',
    gestor_frota: 'bg-indigo-100 text-indigo-800',
    operador: 'bg-green-100 text-green-800',
    oficina: 'bg-amber-100 text-amber-800',
    pneus: 'bg-teal-100 text-teal-800',
    posto: 'bg-red-100 text-red-800'
  };
  return classes[role] || 'bg-gray-100 text-gray-800';
};

// Função para formatar data e hora
const formatDateTime = (dateTimeString: string | null): string => {
  if (!dateTimeString) return 'Nunca';
  const date = new Date(dateTimeString);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};

// Função para gerar senha aleatória
const generateRandomPassword = (length: number = 8): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  
  // Garantir pelo menos um caractere de cada categoria
  password += charset.substring(0, 26).charAt(Math.floor(Math.random() * 26)); // minúscula
  password += charset.substring(26, 52).charAt(Math.floor(Math.random() * 26)); // maiúscula
  password += charset.substring(52, 62).charAt(Math.floor(Math.random() * 10)); // número
  password += charset.substring(62).charAt(Math.floor(Math.random() * (charset.length - 62))); // especial
  
  // Preencher o restante da senha aleatoriamente
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Embaralhar a senha para que os caracteres obrigatórios não fiquem sempre nas mesmas posições
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

const UsersHybrid: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'operador',
    baseId: null,
    baseName: null,
    lastLogin: null,
    isActive: true
  });
  
  // Estados para usuários e bases
  const [users, setUsers] = useState<User[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para manipulação de usuários
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  
  // Estados para controlar o diálogo de senha gerada
  const [isShowPasswordDialogOpen, setIsShowPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [hasPasswordCopied, setHasPasswordCopied] = useState(false);
  
  // Carregar usuários quando o componente montar
  useEffect(() => {
    loadUsers();
  }, []);
  
  // Função para carregar usuários usando o serviço híbrido
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await hybridUserService.getAllUsers();
      if (response.success && Array.isArray(response.users)) {
        console.log('Usuários carregados:', response.users);
        setUsers(response.users);
      } else {
        console.error('Erro ao carregar usuários:', response);
        setError('Erro ao carregar usuários. Por favor, tente novamente.');
      }
    } catch (err) {
      console.error('Exceção ao carregar usuários:', err);
      setError('Erro ao carregar usuários. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar bases
  const loadBases = async () => {
    try {
      // Utilizando API híbrida para bases (deve ser implementada)
      // Por enquanto, podemos usar mock de bases ou a API tradicional
      const response = await fetch('/api/bases');
      if (response.ok) {
        const data = await response.json();
        setBases(data.bases || []);
      }
    } catch (err) {
      console.error('Erro ao carregar bases:', err);
      // Falhar silenciosamente, bases não são críticas
    }
  };
  
  // Filtrar usuários com base no termo de busca
  const filteredUsers = users.filter(
    (user) => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.baseName && user.baseName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Efeito para carregar bases quando o modal de adicionar usuário é aberto
  useEffect(() => {
    if (isAddDialogOpen) {
      loadBases();
      
      // Gerar senha aleatória para novo usuário
      const newPassword = generateRandomPassword(10);
      setPassword(newPassword);
      setConfirmPassword(newPassword);
    }
  }, [isAddDialogOpen]);
  
  // Atualizar o nome da base ao selecionar uma base
  const handleBaseChange = (baseId: string) => {
    if (baseId === "0") {
      setNewUser({
        ...newUser,
        baseId: null,
        baseName: null
      });
      return;
    }
    
    const id = parseInt(baseId);
    const base = bases.find(b => b.id === id);
    setNewUser({
      ...newUser,
      baseId: id,
      baseName: base?.name || null
    });
  };
  
  // Função para visualizar detalhes do usuário
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewUserDialogOpen(true);
  };
  
  // Função para iniciar processo de exclusão do usuário
  const handleDeleteUserConfirm = (userId: number) => {
    setSelectedUserId(userId);
    setIsDeleteUserDialogOpen(true);
  };
  
  // Função para excluir um usuário
  const handleDeleteUser = async () => {
    if (!selectedUserId) return;
    
    try {
      const response = await hybridUserService.deleteUser(selectedUserId);
      
      if (response.success) {
        // Fechar o diálogo
        setIsDeleteUserDialogOpen(false);
        
        // Atualizar a lista de usuários
        loadUsers();
        
        toast({
          title: "Usuário excluído",
          description: "Usuário excluído com sucesso.",
        });
      } else {
        throw new Error(response.message || 'Erro ao excluir usuário');
      }
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao tentar excluir o usuário.",
        variant: "destructive"
      });
    }
  };
  
  // Função para alternar o status do usuário (ativo/inativo)
  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await hybridUserService.toggleUserStatus(userId, !currentStatus);
      
      if (response.success) {
        // Atualizar a lista de usuários
        loadUsers();
        
        toast({
          title: `Usuário ${!currentStatus ? 'ativado' : 'desativado'}`,
          description: `Status do usuário alterado com sucesso.`,
        });
      } else {
        throw new Error(response.message || 'Erro ao alterar status do usuário');
      }
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: "Erro ao alterar status",
        description: error.message || "Ocorreu um erro ao tentar alterar o status do usuário.",
        variant: "destructive"
      });
    }
  };
  
  // Função para resetar a senha de um usuário
  const handleResetPassword = async () => {
    if (!selectedUserId) return;
    
    try {
      const response = await hybridUserService.resetUserPassword(selectedUserId);
      
      if (response.success) {
        // Fechar o diálogo
        setIsResetPasswordDialogOpen(false);
        
        // Se a resposta contiver uma nova senha, exibi-la
        if (response.newPassword) {
          toast({
            title: "Senha redefinida com sucesso",
            description: `A nova senha é: ${response.newPassword}`,
          });
        } else {
          toast({
            title: "Senha redefinida com sucesso",
            description: "A senha foi redefinida com sucesso.",
          });
        }
      } else {
        throw new Error(response.message || 'Erro ao redefinir senha');
      }
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro ao tentar redefinir a senha.",
        variant: "destructive"
      });
    }
  };
  
  // Função para copiar a senha gerada para a área de transferência
  const copyPasswordToClipboard = () => {
    try {
      // Método alternativo para copiar para a área de transferência
      // Criar um elemento temporário
      const textArea = document.createElement('textarea');
      textArea.value = generatedPassword;
      
      // Configurar o elemento para não ser visível
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // Selecionar e copiar o texto
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      
      // Limpar
      document.body.removeChild(textArea);
      
      // Atualizar estado
      setHasPasswordCopied(true);
      setTimeout(() => setHasPasswordCopied(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar senha para a área de transferência:', err);
      // Tentar o método moderno como fallback
      navigator.clipboard?.writeText?.(generatedPassword)
        .then(() => {
          setHasPasswordCopied(true);
          setTimeout(() => setHasPasswordCopied(false), 3000);
        })
        .catch(clipErr => {
          console.error('Falha no método alternativo também:', clipErr);
          toast({
            title: "Erro ao copiar senha",
            description: "Não foi possível copiar a senha. Por favor, copie manualmente.",
            variant: "destructive"
          });
        });
    }
  };
  
  // Adicionar novo usuário
  const handleAddUser = async () => {
    // Validar dados
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Erro ao adicionar usuário",
        description: "Nome e e-mail são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Processando",
        description: "Criando novo usuário...",
      });
      
      // Preparar dados para envio
      const userData: any = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive
      };
      
      // Adicionar senha se fornecida
      if (password) {
        userData.password = password;
      }
      
      // Adicionar baseId apenas se não for null e maior que 0
      if (newUser.baseId && newUser.baseId > 0) {
        userData.baseId = newUser.baseId;
      }
      
      console.log('Enviando dados de usuário:', { ...userData, password: password ? '***' : '[gerada automaticamente]' });
      
      // Usar o serviço híbrido para criar usuário
      const response = await hybridUserService.createUser(userData);
      
      if (response.success) {
        // Armazenar a senha gerada e mostrar o diálogo
        if (response.generatedPassword) {
          setGeneratedPassword(response.generatedPassword);
          setIsShowPasswordDialogOpen(true);
        }
        
        // Atualizar a lista de usuários
        loadUsers();
        
        // Limpar formulário e fechar modal se não precisar mostrar senha
        if (!response.generatedPassword) {
          setNewUser({
            name: '',
            email: '',
            role: 'operador',
            baseId: null,
            baseName: null,
            lastLogin: null,
            isActive: true
          });
          setPassword('');
          setConfirmPassword('');
          setIsAddDialogOpen(false);
        }
        
        toast({
          title: "Usuário criado",
          description: "Usuário criado com sucesso.",
        });
      } else {
        throw new Error(response.message || 'Erro ao criar usuário');
      }
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: "Erro ao adicionar usuário",
        description: error.message || "Ocorreu um erro ao adicionar usuário.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <MainLayoutSimple>
      <div className="flex flex-col space-y-6 p-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários (Híbrido)</h1>
          <p className="text-muted-foreground">Gerencie usuários, perfis de acesso e permissões</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Lista de usuários registrados no sistema</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => loadUsers()}
                  variant="outline"
                  size="icon"
                  title="Atualizar lista"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar usuários..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center my-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Alert variant="destructive" className="my-4">
                <AlertTitle>Erro ao carregar usuários</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableCaption>Lista de usuários do sistema. Total: {filteredUsers.length}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <UserCircle2 className="h-4 w-4" />
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${getRoleBadgeClass(user.role)}`}>
                            {translateUserRole(user.role)}
                          </span>
                        </TableCell>
                        <TableCell>{user.baseName || '-'}</TableCell>
                        <TableCell>{formatDateTime(user.lastLogin)}</TableCell>
                        <TableCell>
                          <Button
                            variant={user.isActive ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            title={user.isActive ? "Desativar usuário" : "Ativar usuário"}
                          >
                            {user.isActive ? "Ativo" : "Inativo"}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsResetPasswordDialogOpen(true);
                              }}
                              title="Redefinir senha"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              title="Visualizar detalhes"
                              onClick={() => handleViewUser(user)}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              title="Excluir usuário"
                              onClick={() => handleDeleteUserConfirm(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Diálogo de redefinição de senha */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>
                Esta ação irá gerar uma nova senha aleatória para o usuário.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Tem certeza que deseja redefinir a senha deste usuário?</p>
              <p className="text-sm text-muted-foreground mt-2">
                A nova senha será exibida apenas uma vez após a confirmação.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleResetPassword}>
                Redefinir Senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de visualização/edição de usuário */}
        <Dialog open={isViewUserDialogOpen} onOpenChange={setIsViewUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
              <DialogDescription>
                Informações do usuário selecionado.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="view-name" className="text-right">
                    Nome
                  </Label>
                  <div className="col-span-3" id="view-name">
                    {selectedUser.name}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="view-email" className="text-right">
                    E-mail
                  </Label>
                  <div className="col-span-3" id="view-email">
                    {selectedUser.email}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="view-role" className="text-right">
                    Perfil
                  </Label>
                  <div className="col-span-3" id="view-role">
                    <span className={`px-2 py-1 rounded text-xs ${getRoleBadgeClass(selectedUser.role)}`}>
                      {translateUserRole(selectedUser.role)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="view-base" className="text-right">
                    Base
                  </Label>
                  <div className="col-span-3" id="view-base">
                    {selectedUser.baseName || '-'}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="view-last-login" className="text-right">
                    Último Acesso
                  </Label>
                  <div className="col-span-3" id="view-last-login">
                    {formatDateTime(selectedUser.lastLogin)}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="view-status" className="text-right">
                    Status
                  </Label>
                  <div className="col-span-3" id="view-status">
                    <span className={`px-2 py-1 rounded text-xs ${selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedUser.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewUserDialogOpen(false)}>
                Fechar
              </Button>
              {/* Botão de edição a ser implementado futuramente */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de confirmação de exclusão */}
        <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. O usuário será desativado do sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-destructive font-semibold flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Tem certeza que deseja excluir este usuário?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                A exclusão apenas desativa o usuário, mantendo seus registros no sistema.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Sim, Excluir Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de adicionar usuário */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Nome completo"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Perfil
                </Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value as any })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="gestor_frota">Gestor de Frota</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                    <SelectItem value="pneus">Especialista em Pneus</SelectItem>
                    <SelectItem value="posto">Posto (Abastecimento)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="base" className="text-right">
                  Base
                </Label>
                <div className="col-span-3">
                  <NativeSelect
                    id="base"
                    value={newUser.baseId?.toString() || "0"}
                    onChange={(e) => handleBaseChange(e.target.value)}
                    className="w-full"
                    options={
                      [
                        { value: "0", label: "Sem base específica" },
                        ...bases.map((base) => ({
                          value: base.id.toString(),
                          label: base.name
                        }))
                      ]
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3"
                  placeholder="Senha segura"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirm-password" className="text-right">
                  Confirmar Senha
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="col-span-3"
                  placeholder="Confirme a senha"
                />
              </div>
              {password !== confirmPassword && (
                <div className="col-span-4 text-destructive text-sm">
                  As senhas não coincidem!
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddUser}
                disabled={!newUser.name || !newUser.email || password !== confirmPassword}
              >
                Adicionar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de exibição de senha gerada */}
        <Dialog open={isShowPasswordDialogOpen} onOpenChange={(open) => {
          setIsShowPasswordDialogOpen(open);
          if (!open) {
            // Ao fechar, limpar o formulário e o diálogo principal também
            setNewUser({
              name: '',
              email: '',
              role: 'operador',
              baseId: null,
              baseName: null,
              lastLogin: null,
              isActive: true
            });
            setPassword('');
            setConfirmPassword('');
            setGeneratedPassword('');
            setIsAddDialogOpen(false);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Usuário Criado com Sucesso</DialogTitle>
              <DialogDescription>
                Anote a senha gerada para o novo usuário:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="relative">
                <div className="flex items-center justify-between border p-3 rounded-lg bg-muted/50">
                  <code className="text-lg font-mono font-bold">{generatedPassword}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyPasswordToClipboard}
                    title="Copiar senha"
                  >
                    {hasPasswordCopied ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {hasPasswordCopied && (
                  <span className="text-xs text-green-600 absolute right-0 -bottom-5">
                    Copiado!
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Esta senha não será exibida novamente. Certifique-se de guardá-la em um local seguro
                ou informá-la ao usuário para que ele possa acessar o sistema.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setIsShowPasswordDialogOpen(false);
                  setNewUser({
                    name: '',
                    email: '',
                    role: 'operador',
                    baseId: null,
                    baseName: null,
                    lastLogin: null,
                    isActive: true
                  });
                  setPassword('');
                  setConfirmPassword('');
                  setGeneratedPassword('');
                  setIsAddDialogOpen(false);
                }}
              >
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayoutSimple>
  );
};

export default UsersHybrid;