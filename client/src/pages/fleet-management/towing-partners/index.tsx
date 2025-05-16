import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Phone, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  PlusCircle,
  Users,
  CalendarClock,
  MessagesSquare,
  Star,
  StarHalf,
  Filter
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// Dados de exemplo para parceiros de guincho
const towingPartners = [
  {
    id: 1,
    name: 'Guincho Rápido Ltda',
    city: 'São Paulo',
    region: 'Zona Sul',
    phone: '(11) 98765-4321',
    rating: 4.8,
    status: 'ativo',
    services: ['Leve', 'Médio', 'Pesado'],
    workingHours: '24 horas',
    responseTime: '30 min',
    lastService: '12/05/2025',
    pendingRequests: 0,
  },
  {
    id: 2,
    name: 'Guincho Seguro S.A.',
    city: 'São Paulo',
    region: 'Zona Norte',
    phone: '(11) 91234-5678',
    rating: 4.5,
    status: 'ativo',
    services: ['Leve', 'Médio'],
    workingHours: '08:00 às 22:00',
    responseTime: '45 min',
    lastService: '14/05/2025',
    pendingRequests: 1,
  },
  {
    id: 3,
    name: 'Guincho Estrela',
    city: 'Campinas',
    region: 'Centro',
    phone: '(19) 98877-6655',
    rating: 4.9,
    status: 'ativo',
    services: ['Leve', 'Médio', 'Pesado', 'Especial'],
    workingHours: '24 horas',
    responseTime: '20 min',
    lastService: '10/05/2025',
    pendingRequests: 0,
  },
  {
    id: 4,
    name: 'Guincho & Reboque ABC',
    city: 'Santo André',
    region: 'ABC',
    phone: '(11) 97766-5544',
    rating: 4.3,
    status: 'inativo',
    services: ['Leve', 'Médio'],
    workingHours: '07:00 às 20:00',
    responseTime: '40 min',
    lastService: '05/05/2025',
    pendingRequests: 0,
  },
  {
    id: 5,
    name: 'Guincho Águia',
    city: 'Guarulhos',
    region: 'Aeroporto',
    phone: '(11) 99988-7766',
    rating: 4.6,
    status: 'ativo',
    services: ['Leve', 'Médio', 'Pesado'],
    workingHours: '24 horas',
    responseTime: '35 min',
    lastService: '15/05/2025',
    pendingRequests: 2,
  }
];

// Componente principal
export default function TowingPartners() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [regionFilter, setRegionFilter] = useState('todas');
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();

  // Função para filtrar parceiros
  const filteredPartners = towingPartners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          partner.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || partner.status === statusFilter;
    const matchesRegion = regionFilter === 'todas' || partner.region === regionFilter;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Função para lidar com a solicitação de guincho
  const handleRequestTowing = () => {
    setOpenDialog(false);
    toast({
      title: "Solicitação enviada",
      description: "Um parceiro de guincho foi acionado e responderá em breve.",
      duration: 5000,
    });
  };

  // Regiões disponíveis (extraídas dos dados)
  const regions = ['todas', ...new Set(towingPartners.map(p => p.region))];

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Truck className="mr-2 h-8 w-8" />
                Parceiros de Guincho
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie parceiros de guincho e solicite serviços de reboque
              </p>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Solicitação
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Serviço de Guincho</DialogTitle>
                    <DialogDescription>
                      Preencha os dados para acionar um parceiro de guincho
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="vehicle" className="text-right">Veículo</Label>
                      <Select defaultValue="select">
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="select">Selecione um veículo</SelectItem>
                          <SelectItem value="ABC1234">ABC-1234 - Fiat Ducato</SelectItem>
                          <SelectItem value="DEF5678">DEF-5678 - Ford F-4000</SelectItem>
                          <SelectItem value="GHI9012">GHI-9012 - Mercedes Sprinter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="location" className="text-right">Localização</Label>
                      <Input
                        id="location"
                        placeholder="Endereço atual do veículo"
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="problem" className="text-right">Problema</Label>
                      <Select defaultValue="select">
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione o tipo de problema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="select">Selecione o tipo de problema</SelectItem>
                          <SelectItem value="pane">Pane Mecânica</SelectItem>
                          <SelectItem value="acidente">Acidente</SelectItem>
                          <SelectItem value="pneu">Pneu Furado</SelectItem>
                          <SelectItem value="bateria">Bateria Descarregada</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="notes" className="text-right">Observações</Label>
                      <Input
                        id="notes"
                        placeholder="Informações adicionais importantes"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button onClick={handleRequestTowing}>Solicitar Guincho</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Novo Parceiro
              </Button>
            </div>
          </div>
          
          {/* Tabs para diferentes visualizações */}
          <Tabs defaultValue="partners" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="partners">Lista de Parceiros</TabsTrigger>
              <TabsTrigger value="requests">Solicitações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="partners" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                    <CardTitle>Parceiros Cadastrados</CardTitle>
                    
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Buscar parceiro..."
                          className="pl-8 w-full md:w-64"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[125px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="ativo">Ativos</SelectItem>
                            <SelectItem value="inativo">Inativos</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={regionFilter} onValueChange={setRegionFilter}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Região" />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map(region => (
                              <SelectItem key={region} value={region}>
                                {region === 'todas' ? 'Todas Regiões' : region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parceiro</TableHead>
                        <TableHead>Região</TableHead>
                        <TableHead>Serviços</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            Nenhum parceiro encontrado com os filtros aplicados
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPartners.map((partner) => (
                          <TableRow key={partner.id}>
                            <TableCell className="font-medium">
                              <div>
                                {partner.name}
                                <div className="text-sm text-muted-foreground flex items-center mt-1">
                                  <Phone className="h-3 w-3 mr-1" /> {partner.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                <span>{partner.city} - {partner.region}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3 inline mr-1" /> {partner.workingHours}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {partner.services.map((service, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {partner.rating >= 4.5 ? (
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ) : (
                                  <StarHalf className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                )}
                                <span className="ml-1 font-medium">{partner.rating}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Resposta: {partner.responseTime}
                              </div>
                            </TableCell>
                            <TableCell>
                              {partner.status === 'ativo' ? (
                                <Badge variant="success">Ativo</Badge>
                              ) : (
                                <Badge variant="destructive">Inativo</Badge>
                              )}
                              {partner.pendingRequests > 0 && (
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {partner.pendingRequests} pedido(s) pendente(s)
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" className="h-8 mr-2">
                                <Phone className="h-3.5 w-3.5 mr-1" />
                                Contatar
                              </Button>
                              <Button size="sm" className="h-8">
                                <Truck className="h-3.5 w-3.5 mr-1" />
                                Solicitar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="requests" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitações de Guincho</CardTitle>
                  <CardDescription>
                    Histórico de solicitações e status das operações de guincho
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex justify-between mb-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-9">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtrar
                      </Button>
                      
                      <Select defaultValue="todos">
                        <SelectTrigger className="w-[180px] h-9">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os Status</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluídos</SelectItem>
                          <SelectItem value="cancelado">Cancelados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button variant="outline" size="sm" className="h-9">
                      <CalendarClock className="h-4 w-4 mr-2" />
                      Últimos 30 dias
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Parceiro</TableHead>
                        <TableHead>Origem/Destino</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">15/05/2025</div>
                          <div className="text-sm text-muted-foreground">14:30</div>
                        </TableCell>
                        <TableCell>
                          <div>Ford F-4000</div>
                          <div className="text-sm text-muted-foreground">DEF-5678</div>
                        </TableCell>
                        <TableCell>
                          <div>Guincho Águia</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            (11) 99988-7766
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="mb-1">
                              <span className="font-medium">De:</span> Av. Paulista, 1000
                            </div>
                            <div>
                              <span className="font-medium">Para:</span> Oficina Técnica ABC
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-amber-500">Em andamento</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <MessagesSquare className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">12/05/2025</div>
                          <div className="text-sm text-muted-foreground">09:15</div>
                        </TableCell>
                        <TableCell>
                          <div>Mercedes Sprinter</div>
                          <div className="text-sm text-muted-foreground">GHI-9012</div>
                        </TableCell>
                        <TableCell>
                          <div>Guincho Rápido Ltda</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            (11) 98765-4321
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="mb-1">
                              <span className="font-medium">De:</span> Rod. Anhanguera, Km 15
                            </div>
                            <div>
                              <span className="font-medium">Para:</span> Base Campinas
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">Concluído</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <MessagesSquare className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">10/05/2025</div>
                          <div className="text-sm text-muted-foreground">11:45</div>
                        </TableCell>
                        <TableCell>
                          <div>Fiat Ducato</div>
                          <div className="text-sm text-muted-foreground">ABC-1234</div>
                        </TableCell>
                        <TableCell>
                          <div>Guincho Estrela</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            (19) 98877-6655
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="mb-1">
                              <span className="font-medium">De:</span> Rua Augusta, 500
                            </div>
                            <div>
                              <span className="font-medium">Para:</span> Oficina Central
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">Concluído</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <MessagesSquare className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Card com estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Parceiros Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {towingPartners.filter(p => p.status === 'ativo').length}
                </div>
                <p className="text-muted-foreground text-sm">
                  de um total de {towingPartners.length} parceiros
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tempo Médio de Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">35 min</div>
                <p className="text-muted-foreground text-sm">
                  Baseado nas últimas 10 solicitações
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Solicitações no Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">23</div>
                <p className="text-muted-foreground text-sm">
                  <span className="text-green-500 font-medium">89%</span> concluídas com sucesso
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}