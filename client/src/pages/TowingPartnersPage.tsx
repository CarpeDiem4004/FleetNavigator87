import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Truck, Phone, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  },
  {
    id: 2,
    name: 'Guincho Seguro S.A.',
    city: 'São Paulo',
    region: 'Zona Norte',
    phone: '(11) 91234-5678',
    rating: 4.5,
    status: 'ativo',
  },
  {
    id: 3,
    name: 'Guincho Estrela',
    city: 'Campinas',
    region: 'Centro',
    phone: '(19) 98877-6655',
    rating: 4.9,
    status: 'ativo',
  },
  {
    id: 4,
    name: 'Guincho & Reboque ABC',
    city: 'Santo André',
    region: 'ABC',
    phone: '(11) 97766-5544',
    rating: 4.3,
    status: 'inativo',
  },
  {
    id: 5,
    name: 'Guincho Águia',
    city: 'Guarulhos',
    region: 'Aeroporto',
    phone: '(11) 99988-7766',
    rating: 4.6,
    status: 'ativo',
  }
];

export default function TowingPartnersPage() {
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
              <Button>
                Nova Solicitação
              </Button>
              
              <Button variant="outline">
                Novo Parceiro
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="partners" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="partners">Lista de Parceiros</TabsTrigger>
              <TabsTrigger value="requests">Solicitações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="partners" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Parceiros Cadastrados</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parceiro</TableHead>
                        <TableHead>Região</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {towingPartners.map((partner) => (
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
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="ml-1 font-medium">{partner.rating}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {partner.status === 'ativo' ? (
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Ativo</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Inativo</Badge>
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
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="requests" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitações de Guincho</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Não há solicitações de guincho ativas no momento.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}