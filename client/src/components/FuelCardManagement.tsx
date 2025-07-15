import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Plus, Edit, Trash2, AlertCircle, DollarSign, Calendar, MapPin, User, Car, Settings, Eye, Search, Filter } from 'lucide-react';

interface FuelCard {
  id: number;
  card_number: string;
  card_type: 'vinculado' | 'especifico';
  provider: string;
  vehicle_plate?: string;
  project_id?: number;
  base_id?: number;
  status: 'ativo' | 'inativo' | 'bloqueado' | 'perdido' | 'cancelado';
  current_balance: string;
  monthly_limit?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  project_name?: string;
  base_name?: string;
  creator_name?: string;
}

interface Project {
  id: number;
  name: string;
  bases: ProjectBase[];
}

interface ProjectBase {
  id: number;
  base_name: string;
  base_code: string;
}

interface FuelCardFormData {
  card_number: string;
  card_type: 'vinculado' | 'especifico';
  provider: string;
  vehicle_plate: string;
  project_id: string;
  base_id: string;
  status: 'ativo' | 'inativo' | 'bloqueado' | 'perdido' | 'cancelado';
  current_balance: string;
  monthly_limit: string;
  notes: string;
}

const statusColors = {
  ativo: 'bg-green-500',
  inativo: 'bg-gray-500',
  bloqueado: 'bg-red-500',
  perdido: 'bg-yellow-500',
  cancelado: 'bg-red-700'
};

const statusLabels = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  bloqueado: 'Bloqueado',
  perdido: 'Perdido',
  cancelado: 'Cancelado'
};

export default function FuelCardManagement() {
  const { toast } = useToast();
  const [fuelCards, setFuelCards] = useState<FuelCard[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filteredBases, setFilteredBases] = useState<ProjectBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<FuelCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState<FuelCardFormData>({
    card_number: '',
    card_type: 'vinculado',
    provider: 'Ticket',
    vehicle_plate: '',
    project_id: '',
    base_id: '',
    status: 'ativo',
    current_balance: '0.00',
    monthly_limit: '',
    notes: ''
  });

  useEffect(() => {
    loadFuelCards();
    loadProjects();
  }, []);

  const loadFuelCards = async () => {
    try {
      const response = await fetch('/api/fuel-cards');
      if (!response.ok) throw new Error('Erro ao carregar cartões');
      const data = await response.json();
      setFuelCards(data);
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os cartões de combustível',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/public/projects-with-bases');
      if (!response.ok) throw new Error('Erro ao carregar projetos');
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os projetos',
        variant: 'destructive'
      });
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id.toString() === projectId);
    setSelectedProject(project || null);
    setFilteredBases(project ? project.bases : []);
    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      base_id: ''
    }));
  };

  const handleInputChange = (field: keyof FuelCardFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.card_number.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'Número do cartão é obrigatório',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.card_type === 'vinculado' && !formData.vehicle_plate.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'Placa do veículo é obrigatória para cartões vinculados',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.provider) {
      toast({
        title: 'Erro de validação',
        description: 'Provedor é obrigatório',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = editingCard ? `/api/fuel-cards/${editingCard.id}` : '/api/fuel-cards';
      const method = editingCard ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Erro ao salvar cartão');

      toast({
        title: 'Sucesso',
        description: editingCard ? 'Cartão atualizado com sucesso' : 'Cartão cadastrado com sucesso',
        variant: 'default'
      });

      setShowAddModal(false);
      setEditingCard(null);
      resetForm();
      loadFuelCards();
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o cartão',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      card_number: '',
      card_type: 'vinculado',
      provider: 'Ticket',
      vehicle_plate: '',
      project_id: '',
      base_id: '',
      status: 'ativo',
      current_balance: '0.00',
      monthly_limit: '',
      notes: ''
    });
    setSelectedProject(null);
    setFilteredBases([]);
  };

  const handleEdit = (card: FuelCard) => {
    setEditingCard(card);
    setFormData({
      card_number: card.card_number,
      card_type: card.card_type,
      provider: card.provider,
      vehicle_plate: card.vehicle_plate || '',
      project_id: card.project_id?.toString() || '',
      base_id: card.base_id?.toString() || '',
      status: card.status,
      current_balance: card.current_balance,
      monthly_limit: card.monthly_limit || '',
      notes: card.notes || ''
    });
    
    if (card.project_id) {
      const project = projects.find(p => p.id === card.project_id);
      if (project) {
        setSelectedProject(project);
        setFilteredBases(project.bases);
      }
    }
    
    setShowAddModal(true);
  };

  const handleDelete = async (cardId: number) => {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;

    try {
      const response = await fetch(`/api/fuel-cards/${cardId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao excluir cartão');

      toast({
        title: 'Sucesso',
        description: 'Cartão excluído com sucesso',
        variant: 'default'
      });

      loadFuelCards();
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cartão',
        variant: 'destructive'
      });
    }
  };

  const filteredCards = fuelCards.filter(card => {
    const matchesSearch = card.card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.base_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando cartões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Cartões de Combustível</h2>
          <p className="text-muted-foreground">Gerencie os cartões de combustível ativos da base</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCard(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? 'Editar Cartão' : 'Adicionar Novo Cartão'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card_number">Número do Cartão *</Label>
                  <Input
                    id="card_number"
                    value={formData.card_number}
                    onChange={(e) => handleInputChange('card_number', e.target.value)}
                    placeholder="Digite o número do cartão"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="provider">Provedor *</Label>
                  <Select value={formData.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ticket">Ticket</SelectItem>
                      <SelectItem value="Alelo">Alelo</SelectItem>
                      <SelectItem value="VR">VR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card_type">Tipo de Cartão *</Label>
                  <Select value={formData.card_type} onValueChange={(value: 'vinculado' | 'especifico') => handleInputChange('card_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vinculado">Vinculado à Placa</SelectItem>
                      <SelectItem value="especifico">Cartão Específico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value: 'ativo' | 'inativo' | 'bloqueado' | 'perdido' | 'cancelado') => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.card_type === 'vinculado' && (
                <div>
                  <Label htmlFor="vehicle_plate">Placa do Veículo *</Label>
                  <Input
                    id="vehicle_plate"
                    value={formData.vehicle_plate}
                    onChange={(e) => handleInputChange('vehicle_plate', e.target.value.toUpperCase())}
                    placeholder="Ex: ABC1234"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project_id">Projeto</Label>
                  <Select value={formData.project_id} onValueChange={handleProjectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
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
                  <Label htmlFor="base_id">Base</Label>
                  <Select value={formData.base_id} onValueChange={(value) => handleInputChange('base_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma base" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBases.map(base => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.base_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_balance">Saldo Atual (R$)</Label>
                  <Input
                    id="current_balance"
                    type="number"
                    step="0.01"
                    value={formData.current_balance}
                    onChange={(e) => handleInputChange('current_balance', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="monthly_limit">Limite Mensal (R$)</Label>
                  <Input
                    id="monthly_limit"
                    type="number"
                    step="0.01"
                    value={formData.monthly_limit}
                    onChange={(e) => handleInputChange('monthly_limit', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações sobre o cartão"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : editingCard ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cartões Cadastrados
          </CardTitle>
          <CardDescription>
            Lista de todos os cartões de combustível cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número do cartão, placa ou projeto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredCards.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum cartão encontrado</p>
              {searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  Tente ajustar os filtros de busca
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número do Cartão</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Projeto/Base</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{card.card_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {card.card_type === 'vinculado' ? 'Vinculado' : 'Específico'}
                        </Badge>
                      </TableCell>
                      <TableCell>{card.provider}</TableCell>
                      <TableCell>{card.vehicle_plate || '-'}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[card.status]} text-white`}>
                          {statusLabels[card.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(card.current_balance)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {card.project_name && (
                            <div className="font-medium">{card.project_name}</div>
                          )}
                          {card.base_name && (
                            <div className="text-muted-foreground">{card.base_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(card)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(card.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}