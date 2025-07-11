import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  Users, 
  FileText, 
  Shield, 
  DollarSign, 
  Truck, 
  Settings 
} from "lucide-react";
import { Link } from 'wouter';

const BaseFlorianopolis: React.FC = () => {
  const functionalities = [
    {
      id: 1,
      title: "Solicitação de Cartão Combustível",
      description: "Solicite recarga ou novo cartão para veículos",
      icon: CreditCard,
      color: "bg-blue-500",
      link: "/bases/florianopolis/cartao-combustivel",
      status: "Ativo"
    },
    {
      id: 2,
      title: "Comunicação de Sinistros",
      description: "Registre ocorrências e sinistros",
      icon: AlertTriangle,
      color: "bg-red-500",
      link: "/bases/florianopolis/sinistros",
      status: "Ativo"
    },
    {
      id: 3,
      title: "Acidentes de Trabalho",
      description: "Registre acidentes e incidentes",
      icon: Clock,
      color: "bg-orange-500",
      link: "/bases/florianopolis/acidentes-trabalho",
      status: "Ativo"
    },
    {
      id: 4,
      title: "Gestão de Colaboradores",
      description: "Gerenciar equipe e escalas",
      icon: Users,
      color: "bg-green-500",
      link: "/bases/florianopolis/colaboradores",
      status: "Ativo"
    },
    {
      id: 5,
      title: "Relatórios Operacionais",
      description: "Visualize relatórios e métricas",
      icon: FileText,
      color: "bg-purple-500",
      link: "/bases/florianopolis/relatorios",
      status: "Ativo"
    },
    {
      id: 6,
      title: "Multas de Trânsito",
      description: "Consulte multas da gestão",
      icon: Shield,
      color: "bg-yellow-500",
      link: "/bases/florianopolis/multas",
      status: "Ativo"
    },
    {
      id: 7,
      title: "Controle Financeiro",
      description: "Acompanhe gastos e orçamentos",
      icon: DollarSign,
      color: "bg-indigo-500",
      link: "/bases/florianopolis/financeiro",
      status: "Ativo"
    },
    {
      id: 8,
      title: "Gestão de Veículos",
      description: "Controle frota e manutenções",
      icon: Truck,
      color: "bg-teal-500",
      link: "/bases/florianopolis/veiculos",
      status: "Ativo"
    },
    {
      id: 9,
      title: "Configurações da Base",
      description: "Ajustes e configurações locais",
      icon: Settings,
      color: "bg-gray-500",
      link: "/bases/florianopolis/configuracoes",
      status: "Ativo"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Inativo':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SC (FLORIANÓPOLIS) SSC2
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gerenciamento completo da Base Florianópolis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {functionalities.map((func) => {
            const IconComponent = func.icon;
            return (
              <Card key={func.id} className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${func.color} text-white`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <Badge className={`${getStatusColor(func.status)} text-xs`}>
                      {func.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {func.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {func.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={func.link}>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Acessar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Link to="/dashboard">
            <Button 
              variant="outline" 
              className="bg-white/80 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-6 rounded-md transition-colors duration-200"
            >
              Voltar ao Sistema Principal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BaseFlorianopolis;