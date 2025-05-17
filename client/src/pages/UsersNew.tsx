import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { 
  Loader2, Search, Plus, KeyRound, FileEdit, 
  Trash2, UserX, UserCircle2, RefreshCw, 
  Copy, CheckCircle2
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
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

// Dados mockados para a tabela de usuários
// Interface para as bases

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

const UsersNew: React.FC = () => {
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
  
  // Interface para a resposta da API híbrida
  interface HybridApiResponse {
    success: boolean;
    count: number;
    users: any[];
  }

  // Buscar usuários da API (usando a API híbrida que é mais robusta)
  const { data: usersRaw = { success: false, count: 0, users: [] }, isLoading: usersLoading, error: usersError } = useQuery<HybridApiResponse>({
    queryKey: ['/api/hybrid/users'],
    staleTime: 10000, // Considerar stale após 10 segundos para permitir atualizações frequentes
    queryFn: getQueryFn({ on401: "returnNull" }), // Adicionado para lidar com erros 401
  });
  
  // Verificar e normalizar os dados de usuário
  let users: User[] = [];
  try {
    // A API híbrida retorna os dados em um formato diferente
    // { success: true, count: number, users: User[] }
    if (usersRaw && typeof usersRaw === 'object') {
      // Verificar se é o formato da API híbrida
      if (usersRaw.success && Array.isArray(usersRaw.users)) {
        // Formato da API híbrida
        users = usersRaw.users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: (user.role || 'operador') as 'admin' | 'gestor' | 'operador' | 'oficina' | 'pneus' | 'posto' | 'gestor_frota',
          baseId: user.baseId || user.base_id || null,
          baseName: user.baseName || user.basename || null,
          lastLogin: user.lastLogin || user.last_login || null,
          isActive: user.isActive !== undefined ? user.isActive : 
                   user.is_active !== undefined ? user.is_active : true
        }));
      }
    }
    
    // Log do formato dos dados para debug
    console.log('Formato dos dados recebidos:', usersRaw);
  } catch (error) {
    console.error('Erro ao processar dados de usuário:', error);
  }
  
  // Log para debug
  useEffect(() => {
    console.log('UsersNew - Dados recebidos:', {
      users,
      usersLoading,
      usersError,
      filteredUsersLength: users?.length || 0
    });
    
    // Log detalhado para status de usuários
    if (users && users.length > 0) {
      console.log('Status de usuários:', users.map(user => ({
        id: user.id,
        name: user.name,
        isActive: user.isActive
      })));
    }
  }, [users, usersLoading, usersError]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  
  // Interface para a resposta da API híbrida de bases
  interface HybridBasesApiResponse {
    success: boolean;
    count: number;
    bases: Base[];
  }

  // Buscar bases disponíveis usando React Query com a API híbrida
  const { data: basesRaw, isLoading: basesLoading } = useQuery<HybridBasesApiResponse>({
    queryKey: ['/api/hybrid/bases'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Log para depuração dos dados das bases
  console.log('Resposta da API de bases:', basesRaw);
  
  // Extrair as bases da resposta
  const bases = basesRaw?.bases || [];
  
  // Log das bases extraídas
  console.log('Bases extraídas:', bases);

  // Filtrar usuários com base no termo de busca
  const filteredUsers = Array.isArray(users) ? users.filter(
    (user) => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.baseName && user.baseName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

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
    // TypeScript segurança: garantir que bases é um array antes de chamar find
    const base = Array.isArray(bases) ? bases.find(b => b.id === id) : undefined;
    setNewUser({
      ...newUser,
      baseId: id,
      baseName: base?.name || null
    });
  };
  
  // Efeito para invalidar a query de bases quando o modal de adicionar usuário é aberto
  useEffect(() => {
    if (isAddDialogOpen) {
      // Forçar uma atualização da lista de bases quando o modal é aberto
      queryClient.invalidateQueries({ queryKey: ['/api/hybrid/bases'] });
      
      // Gerar senha aleatória para novo usuário
      const newPassword = generateRandomPassword(10);
      setPassword(newPassword);
      setConfirmPassword(newPassword);
    }
  }, [isAddDialogOpen]);
  
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
      // Chamar API híbrida para excluir o usuário
      await apiRequest('DELETE', `/api/hybrid/users/${selectedUserId}`);
      
      // Fechar o diálogo
      setIsDeleteUserDialogOpen(false);
      
      // Atualizar a lista de usuários
      handleUserDataChanged();
      
      toast({
        title: "Usuário excluído",
        description: "Usuário excluído com sucesso.",
      });
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
      // Chamar API híbrida para atualizar o status do usuário
      await apiRequest('PATCH', `/api/hybrid/users/${userId}/status`, { 
        isActive: !currentStatus 
      });
      
      // Atualizar a lista de usuários
      handleUserDataChanged();
      
      toast({
        title: `Usuário ${!currentStatus ? 'ativado' : 'desativado'}`,
        description: `Status do usuário alterado com sucesso.`,
      });
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
      const newPassword = generateRandomPassword(10);
      
      // Chamar API híbrida para atualizar a senha do usuário
      await apiRequest('POST', `/api/hybrid/users/${selectedUserId}/reset-password`, { 
        password: newPassword 
      });
      
      // Fechar o diálogo e mostrar a nova senha
      setIsResetPasswordDialogOpen(false);
      toast({
        title: "Senha redefinida com sucesso",
        description: `A nova senha é: ${newPassword}`,
      });
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro ao tentar redefinir a senha.",
        variant: "destructive"
      });
    }
  };

  // Atualizar lista de usuários após adicionar um novo ou resetar senha
  const handleUserDataChanged = () => {
    // Invalidar a query para forçar uma nova requisição e atualizar os dados
    queryClient.invalidateQueries({ queryKey: ['/api/hybrid/users'] });
  };

  // Estados para controlar o diálogo de senha gerada
  const [isShowPasswordDialogOpen, setIsShowPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [hasPasswordCopied, setHasPasswordCopied] = useState(false);
  
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
      
      // Usar a rota híbrida para criação de usuários (para manter a autenticação consistente)
      const response = await apiRequest('POST', '/api/hybrid/users', userData);
      const data = await response.json();
      
      // Armazenar a senha gerada e mostrar o diálogo
      if (data.generatedPassword) {
        setGeneratedPassword(data.generatedPassword);
        setIsShowPasswordDialogOpen(true);
      }
      
      // Atualizar a lista de usuários
      handleUserDataChanged();
      
      // Limpar formulário mas manter o modal aberto se precisar exibir a senha
      if (!data.generatedPassword) {
        // Se não tiver senha gerada, fechar o modal
        setIsAddDialogOpen(false);
        
        // Limpar formulário
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
      }
      
      // Atualizar lista de bases após adicionar um usuário
      queryClient.invalidateQueries({ queryKey: ['/api/hybrid/bases'] });
      
      toast({
        title: "Usuário adicionado",
        description: "Usuário criado com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: "Erro ao adicionar usuário",
        description: error.message || "Ocorreu um erro ao tentar criar o usuário.",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Usuários</h1>
            <p className="text-gray-500">
              Gestão de usuários do sistema
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do usuário abaixo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="col-span-3"
                    placeholder="Nome do usuário"
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
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="col-span-3"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Perfil
                  </Label>
                  <div className="col-span-3">
                    <NativeSelect
                      id="role"
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'gestor' | 'operador' | 'oficina' | 'pneus' | 'posto' | 'gestor_frota'})}
                      options={[
                        { value: 'admin', label: 'Administrador' },
                        { value: 'gestor', label: 'Gestor' },
                        { value: 'gestor_frota', label: 'Gestor de Frota' },
                        { value: 'operador', label: 'Operador' },
                        { value: 'posto', label: 'Posto (Abastecimento)' },
                        { value: 'oficina', label: 'Oficina' },
                        { value: 'pneus', label: 'Especialista em Pneus' }
                      ]}
                      placeholder="Selecione o perfil"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="base" className="text-right">
                    Base
                  </Label>
                  <div className="col-span-3">
                    {basesLoading ? (
                      <div className="flex items-center justify-center h-10">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                      </div>
                    ) : (
                      <NativeSelect
                        id="base"
                        value={newUser.baseId?.toString() || 'global'}
                        onChange={(e) => handleBaseChange(e.target.value)}
                        options={[
                          { value: 'global', label: 'Nenhuma (Global)' },
                          ...(bases || []).map(base => ({
                            value: base.id.toString(),
                            label: base.name
                          }))
                        ]}
                        placeholder="Selecione a base (opcional)"
                      />
                    )}
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
                    placeholder="Senha"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirmPassword" className="text-right">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="col-span-3"
                    placeholder="Confirmar senha"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right">
                    Status
                  </Label>
                  <div className="col-span-3">
                    <NativeSelect
                      id="isActive"
                      value={newUser.isActive ? 'active' : 'inactive'}
                      onChange={(e) => 
                        setNewUser({...newUser, isActive: e.target.value === 'active'})
                      }
                      options={[
                        { value: 'active', label: 'Ativo' },
                        { value: 'inactive', label: 'Inativo' }
                      ]}
                      placeholder="Selecione o status"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddUser}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Usuários</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar usuários..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Lista de usuários do sistema</TableCaption>
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
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-2" />
                        <span className="text-gray-500">Carregando usuários...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <UserX className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-gray-500">Nenhum usuário encontrado</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass(user.role)}`}>
                          {translateUserRole(user.role)}
                        </span>
                      </TableCell>
                      <TableCell>{user.baseName || 'Global'}</TableCell>
                      <TableCell>{formatDateTime(user.lastLogin)}</TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Inativo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            className={user.isActive ? "bg-green-50 hover:bg-red-50" : "bg-red-50 hover:bg-green-50"}
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            title={user.isActive ? "Desativar usuário" : "Ativar usuário"}
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4 text-red-600" />
                            ) : (
                              <UserCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
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
          </CardContent>
        </Card>
        
        {/* Diálogo de redefinição de senha */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja gerar uma nova senha para este usuário?
                A senha atual será perdida e uma nova senha será gerada automaticamente.
              </DialogDescription>
            </DialogHeader>
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
        
        {/* Diálogo de visualização de detalhes do usuário */}
        <Dialog open={isViewUserDialogOpen} onOpenChange={setIsViewUserDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Nome:</div>
                  <div className="col-span-2">{selectedUser.name}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">E-mail:</div>
                  <div className="col-span-2">{selectedUser.email}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Perfil:</div>
                  <div className="col-span-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass(selectedUser.role)}`}>
                      {translateUserRole(selectedUser.role)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Base:</div>
                  <div className="col-span-2">{selectedUser.baseName || 'Global'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Último acesso:</div>
                  <div className="col-span-2">{formatDateTime(selectedUser.lastLogin) || 'Nunca acessou'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Status:</div>
                  <div className="col-span-2">
                    {selectedUser.isActive ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Inativo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewUserDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de exclusão de usuário */}
        <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Excluir Usuário</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este usuário?
                Esta ação não poderá ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para exibir a senha gerada automaticamente */}
        <Dialog 
          open={isShowPasswordDialogOpen} 
          onOpenChange={(open) => {
            setIsShowPasswordDialogOpen(open);
            // Limpar formulário e fechar modal de adição quando fechar o diálogo de senha
            if (!open) {
              setIsAddDialogOpen(false);
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
              setHasPasswordCopied(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Senha do Novo Usuário</DialogTitle>
              <DialogDescription>
                Esta senha foi gerada automaticamente. Anote-a pois não será exibida novamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="bg-amber-50 text-amber-900 border-amber-500">
                <AlertTitle className="flex items-center">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Importante
                </AlertTitle>
                <AlertDescription>
                  Forneça esta senha ao usuário de forma segura. Após fechar esta janela, a senha não poderá ser recuperada.
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-100 p-4 rounded-md flex items-center justify-between">
                <div className="font-mono text-base font-bold">{generatedPassword}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyPasswordToClipboard}
                  disabled={hasPasswordCopied}
                  className="ml-2"
                >
                  {hasPasswordCopied ? 
                    <><CheckCircle2 className="h-4 w-4 mr-1" /> Copiado</> : 
                    <><Copy className="h-4 w-4 mr-1" /> Copiar</>
                  }
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsShowPasswordDialogOpen(false)}>
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayoutSimple>
  );
};

export default UsersNew;