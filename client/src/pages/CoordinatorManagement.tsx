import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Settings, Shield, Eye, Trash2, Plus } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface UserWithRoles {
  user_id: number;
  user_name: string;
  user_email: string;
  is_active: boolean;
  roles: Array<{
    role_id: number;
    role_name: string;
    role_description: string;
    assigned_at: string;
  }>;
}

interface Project {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface Base {
  id: number;
  name: string;
  description: string;
  project_id: number;
  is_active: boolean;
}

interface CoordinatorScope {
  user_id: number;
  user_name: string;
  user_email: string;
  scope: Array<{
    project_id: number;
    project_name: string;
    base_id: number;
    base_name: string;
    assigned_at: string;
  }>;
}

const CoordinatorManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [coordinators, setCoordinators] = useState<CoordinatorScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedBase, setSelectedBase] = useState<string>('');
  const [filteredBases, setFilteredBases] = useState<Base[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const projectBases = bases.filter(base => base.project_id === parseInt(selectedProject));
      setFilteredBases(projectBases);
      setSelectedBase('');
    } else {
      setFilteredBases([]);
    }
  }, [selectedProject, bases]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados em paralelo
      const [rolesResponse, usersResponse, projectsBasesResponse, coordinatorsResponse] = await Promise.all([
        fetch('/api/coordinator-roles/roles'),
        fetch('/api/coordinator-roles/users-with-roles'),
        fetch('/api/coordinator-roles/projects-bases'),
        fetch('/api/coordinator-roles/coordinators-scope')
      ]);

      if (!rolesResponse.ok || !usersResponse.ok || !projectsBasesResponse.ok || !coordinatorsResponse.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const rolesData = await rolesResponse.json();
      const usersData = await usersResponse.json();
      const projectsBasesData = await projectsBasesResponse.json();
      const coordinatorsData = await coordinatorsResponse.json();

      setRoles(rolesData.data);
      setUsers(usersData.data);
      setProjects(projectsBasesData.data.projects);
      setBases(projectsBasesData.data.bases);
      setCoordinators(coordinatorsData.data);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do sistema",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Erro",
        description: "Selecione um usuário e um papel",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/coordinator-roles/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(selectedUser),
          roleId: parseInt(selectedRole)
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atribuir papel');
      }

      toast({
        title: "Sucesso",
        description: "Papel atribuído com sucesso",
        variant: "default"
      });

      // Recarregar dados
      loadInitialData();
      setSelectedUser('');
      setSelectedRole('');
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atribuir papel",
        variant: "destructive"
      });
    }
  };

  const removeRole = async (userId: number, roleId: number) => {
    try {
      const response = await fetch('/api/coordinator-roles/remove-role', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId })
      });

      if (!response.ok) {
        throw new Error('Erro ao remover papel');
      }

      toast({
        title: "Sucesso",
        description: "Papel removido com sucesso",
        variant: "default"
      });

      loadInitialData();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover papel",
        variant: "destructive"
      });
    }
  };

  const assignScope = async () => {
    if (!selectedUser || !selectedProject || !selectedBase) {
      toast({
        title: "Erro",
        description: "Selecione um coordenador, projeto e base",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/coordinator-roles/assign-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(selectedUser),
          projectId: parseInt(selectedProject),
          baseId: parseInt(selectedBase)
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atribuir escopo');
      }

      toast({
        title: "Sucesso",
        description: "Escopo atribuído com sucesso",
        variant: "default"
      });

      loadInitialData();
      setSelectedUser('');
      setSelectedProject('');
      setSelectedBase('');
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atribuir escopo",
        variant: "destructive"
      });
    }
  };

  const removeScope = async (userId: number, projectId: number, baseId: number) => {
    try {
      const response = await fetch('/api/coordinator-roles/remove-scope', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, projectId, baseId })
      });

      if (!response.ok) {
        throw new Error('Erro ao remover escopo');
      }

      toast({
        title: "Sucesso",
        description: "Escopo removido com sucesso",
        variant: "default"
      });

      loadInitialData();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover escopo",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (roleName: string) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'coordenador': 'bg-blue-100 text-blue-800',
      'gestor_combustivel': 'bg-green-100 text-green-800',
      'gerente_base': 'bg-purple-100 text-purple-800',
      'operador': 'bg-gray-100 text-gray-800'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  const coordinatorUsers = users.filter(user => 
    user.roles.some(role => role.role_name === 'coordenador')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema de coordenadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Coordenadores</h1>
          <p className="text-gray-600">Gerencie papéis e escopos de acesso dos coordenadores de projeto</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="px-3 py-1">
            <Users className="w-4 h-4 mr-1" />
            {users.length} usuários
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <Shield className="w-4 h-4 mr-1" />
            {coordinators.length} coordenadores
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">Papéis de Usuário</TabsTrigger>
          <TabsTrigger value="coordinators">Coordenadores</TabsTrigger>
          <TabsTrigger value="scope">Escopo de Acesso</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Atribuir Papel a Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="user-select">Usuário</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.user_id} value={user.user_id.toString()}>
                          {user.user_name} ({user.user_email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role-select">Papel</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name} - {role.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={assignRole} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Atribuir Papel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuários e Papéis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{user.user_name}</h3>
                      <p className="text-sm text-gray-600">{user.user_email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.roles.map(role => (
                          <Badge key={role.role_id} className={getRoleColor(role.role_name)}>
                            {role.role_name}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-4 w-4 p-0"
                              onClick={() => removeRole(user.user_id, role.role_id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordinators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coordenadores Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coordinatorUsers.map(user => (
                  <div key={user.user_id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{user.user_name}</h3>
                      <Badge className="bg-blue-100 text-blue-800">Coordenador</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{user.user_email}</p>
                    
                    {/* Mostrar escopo do coordenador */}
                    {coordinators.find(c => c.user_id === user.user_id)?.scope && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium mb-2">Escopo de Acesso:</h4>
                        <div className="space-y-1">
                          {coordinators.find(c => c.user_id === user.user_id)?.scope.map((scope, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm">
                                {scope.project_name} → {scope.base_name}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeScope(user.user_id, scope.project_id, scope.base_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scope" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Atribuir Escopo a Coordenador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="coordinator-select">Coordenador</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione coordenador" />
                    </SelectTrigger>
                    <SelectContent>
                      {coordinatorUsers.map(user => (
                        <SelectItem key={user.user_id} value={user.user_id.toString()}>
                          {user.user_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="project-select">Projeto</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="base-select">Base</Label>
                  <Select value={selectedBase} onValueChange={setSelectedBase} disabled={!selectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione base" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBases.map(base => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={assignScope} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Atribuir Escopo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo de Projetos e Bases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Projetos Ativos ({projects.length})</h4>
                  <div className="space-y-1">
                    {projects.map(project => (
                      <div key={project.id} className="text-sm p-2 bg-gray-50 rounded">
                        {project.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Bases Ativas ({bases.length})</h4>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {bases.map(base => (
                      <div key={base.id} className="text-sm p-2 bg-gray-50 rounded">
                        {base.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoordinatorManagement;