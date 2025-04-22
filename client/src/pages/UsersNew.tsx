import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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
import { Search, Plus, FileEdit, Trash2, UserCircle2 } from 'lucide-react';
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
  role: 'admin' | 'gestor' | 'operador' | 'oficina' | 'pneus';
  baseId: number | null;
  baseName: string | null;
  lastLogin: string | null;
  isActive: boolean;
}

// Dados mockados para a tabela de usuários
const mockUsers: User[] = [
  {
    id: 1,
    name: 'Admin Master',
    email: 'master@muricionfleet.com',
    role: 'admin',
    baseId: null,
    baseName: null,
    lastLogin: '2025-04-15T10:30:00Z',
    isActive: true
  },
  {
    id: 2,
    name: 'João Silva',
    email: 'joao@muricionfleet.com',
    role: 'gestor',
    baseId: 1,
    baseName: 'Multas',
    lastLogin: '2025-04-14T14:15:00Z',
    isActive: true
  },
  {
    id: 3,
    name: 'Carlos Santos',
    email: 'carlos@muricionfleet.com',
    role: 'operador',
    baseId: 2,
    baseName: 'Pneus',
    lastLogin: '2025-04-15T08:45:00Z',
    isActive: true
  },
  {
    id: 4,
    name: 'Ana Souza',
    email: 'ana@muricionfleet.com',
    role: 'gestor',
    baseId: 3,
    baseName: 'Line Hall',
    lastLogin: '2025-04-10T09:20:00Z',
    isActive: true
  },
  {
    id: 5,
    name: 'Marcos Oliveira',
    email: 'marcos@muricionfleet.com',
    role: 'operador',
    baseId: 4,
    baseName: 'Gestão de Frotas',
    lastLogin: '2025-04-13T11:35:00Z',
    isActive: true
  }
];

// Bases disponíveis (para o select de bases)
const availableBases = [
  { id: 9, name: 'Multas' },
  { id: 10, name: 'Pneus' },
  { id: 11, name: 'Line Hall' },
  { id: 12, name: 'Gestão de Frotas' },
  { id: 31, name: 'Osasco' },
  { id: 32, name: 'Guarulhos' },
  { id: 33, name: 'São Paulo' },
  { id: 34, name: 'Campinas' },
  { id: 35, name: 'ABC' },
  { id: 36, name: 'Socorro' },
  { id: 37, name: 'Sorocaba' },
  { id: 88, name: 'ABC (Coca Cola)' }
];

// Função para traduzir os tipos de perfil
const translateUserRole = (role: string): string => {
  const roles: Record<string, string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    operador: 'Operador',
    oficina: 'Oficina',
    pneus: 'Especialista em Pneus'
  };
  return roles[role] || role;
};

// Função para obter a classe CSS para o badge de perfil
const getRoleBadgeClass = (role: string): string => {
  const classes: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    gestor: 'bg-blue-100 text-blue-800',
    operador: 'bg-green-100 text-green-800',
    oficina: 'bg-amber-100 text-amber-800',
    pneus: 'bg-teal-100 text-teal-800'
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

const UsersNew: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Filtrar usuários com base no termo de busca
  const filteredUsers = users.filter(
    (user) => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.baseName && user.baseName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    const base = availableBases.find(b => b.id === id);
    setNewUser({
      ...newUser,
      baseId: id,
      baseName: base?.name || null
    });
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

    if (!password) {
      toast({
        title: "Erro ao adicionar usuário",
        description: "A senha é obrigatória",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro ao adicionar usuário",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Processando",
        description: "Criando novo usuário...",
      });
      
      // Fazer a requisição para a API de registro
      // Preparar dados para envio, incluindo baseId se existir
      const registerData: any = {
        username: newUser.email,
        password: password,
        name: newUser.name,
        role: newUser.role
      };
      
      // Adicionar baseId apenas se não for null e maior que 0
      if (newUser.baseId && newUser.baseId > 0) {
        registerData.baseId = newUser.baseId;
        registerData.basename = newUser.baseName;
      }
      
      console.log('Enviando dados de usuário:', { ...registerData, password: '***' });
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao registrar usuário');
      }

      const createdUser = await response.json();
      
      // Adicionar à lista local
      const user = {
        ...newUser,
        id: createdUser.id,
        lastLogin: null
      } as User;
      
      setUsers([...users, user]);
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
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'gestor' | 'operador' | 'oficina' | 'pneus'})}
                      options={[
                        { value: 'admin', label: 'Administrador' },
                        { value: 'gestor', label: 'Gestor' },
                        { value: 'operador', label: 'Operador' },
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
                    <NativeSelect
                      id="base"
                      value={newUser.baseId?.toString() || '0'}
                      onChange={(e) => handleBaseChange(e.target.value)}
                      options={[
                        { value: '0', label: 'Nenhuma (Global)' },
                        ...availableBases.map(base => ({
                          value: base.id.toString(),
                          label: base.name
                        }))
                      ]}
                      placeholder="Selecione a base (opcional)"
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
                {filteredUsers.map((user) => (
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
                        <Button variant="outline" size="icon">
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayoutSimple>
  );
};

export default UsersNew;