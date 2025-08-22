import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Car, Plus, Save, ArrowLeft, Calculator, Package2, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

const carReceptionSchema = z.object({
  vehiclePlate: z.string().min(1, "Placa é obrigatória"),
  vehicleModel: z.string().min(1, "Modelo é obrigatório"),
  vehicleType: z.enum(["fiorino", "van", "vuc", "toco", "truck", "cavalo_mecanico", "carreta"], {
    required_error: "Tipo de veículo é obrigatório",
  }),
  currentKm: z.number().min(0, "Quilometragem deve ser positiva"),
  project: z.string().optional(),
  base: z.string().optional(),
  serviceDescription: z.string().min(1, "Descrição do serviço é obrigatória"),
  status: z.string().default("recebido"),
  laborCost: z.number().min(0, "Custo da mão de obra deve ser positivo").optional(),
  partsCost: z.number().min(0, "Custo das peças deve ser positivo").optional(),
  deliveryDeadline: z.string().optional(),
  notes: z.string().optional(),
});

type CarReceptionForm = z.infer<typeof carReceptionSchema>;

interface Part {
  id: string;
  name: string;
  price: number;
}

export default function AutofreiCarReception() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [newPartName, setNewPartName] = useState("");
  const [newPartPrice, setNewPartPrice] = useState("");
  const { toast } = useToast();

  const form = useForm<CarReceptionForm>({
    resolver: zodResolver(carReceptionSchema),
    defaultValues: {
      vehiclePlate: "",
      vehicleModel: "",
      vehicleType: "van",
      currentKm: 0,
      project: "",
      base: "",
      serviceDescription: "",
      status: "recebido",
      laborCost: 0,
      partsCost: 0,
      notes: "",
    },
  });

  const vehicleTypes = [
    { value: "fiorino", label: "Fiorino" },
    { value: "van", label: "Van" },
    { value: "vuc", label: "VUC" },
    { value: "toco", label: "Toco" },
    { value: "truck", label: "Truck" },
    { value: "cavalo_mecanico", label: "Cavalo Mecânico" },
    { value: "carreta", label: "Carreta" },
  ];

  // Função para adicionar uma nova peça
  const addPart = () => {
    if (!newPartName.trim() || !newPartPrice) {
      toast({
        title: "Erro",
        description: "Preencha o nome e valor da peça",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(newPartPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Erro",
        description: "Valor da peça deve ser um número positivo",
        variant: "destructive",
      });
      return;
    }

    const newPart: Part = {
      id: Date.now().toString(),
      name: newPartName.trim(),
      price: price,
    };

    setParts(prev => [...prev, newPart]);
    setNewPartName("");
    setNewPartPrice("");
    
    // Atualizar o valor total das peças no formulário
    updatePartsCost([...parts, newPart]);
  };

  // Função para remover uma peça
  const removePart = (partId: string) => {
    const updatedParts = parts.filter(part => part.id !== partId);
    setParts(updatedParts);
    updatePartsCost(updatedParts);
  };

  // Função para atualizar o custo total das peças
  const updatePartsCost = (partsList: Part[]) => {
    const total = partsList.reduce((sum, part) => sum + part.price, 0);
    form.setValue("partsCost", total);
  };

  // Calcular o custo total (mão de obra + peças)
  const calculateTotalCost = () => {
    const laborCost = form.watch("laborCost") || 0;
    const partsCost = parts.reduce((sum, part) => sum + part.price, 0);
    return laborCost + partsCost;
  };

  // Função para formatar moeda brasileira
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const onSubmit = async (data: CarReceptionForm) => {
    setIsLoading(true);
    try {
      const submissionData = {
        ...data,
        totalCost: calculateTotalCost(),
        currentKm: Number(data.currentKm),
        laborCost: Number(data.laborCost || 0),
        partsCost: Number(data.partsCost || 0),
        replacedParts: JSON.stringify(parts),
        officina: "AUTOFREI",
        officinaId: 12,
        deliveryDeadline: data.deliveryDeadline && data.deliveryDeadline.trim() !== '' ? data.deliveryDeadline : null,
      };

      // Simular envio dos dados
      console.log("Dados do recebimento:", submissionData);
      
      toast({
        title: "Recebimento registrado com sucesso",
        description: `Veículo ${data.vehiclePlate} registrado para manutenção.`,
      });

      // Limpar formulário
      form.reset({
        vehiclePlate: "",
        vehicleModel: "",
        vehicleType: "van",
        currentKm: 0,
        project: "",
        base: "",
        serviceDescription: "",
        status: "recebido",
        laborCost: 0,
        partsCost: 0,
        notes: "",
      });
      
      // Limpar peças
      setParts([]);
      
    } catch (error) {
      console.error("Erro ao registrar recebimento:", error);
      toast({
        title: "Erro ao registrar recebimento",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/oficina/autofrei/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Car className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Recebimento de Veículos</h1>
                <p className="text-sm text-gray-500">AUTOFREI - Registro de entrada para manutenção</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">CNPJ: 33.704.013/0001-09</p>
              <p className="text-sm text-gray-500">autofreipecas@gmail.com</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Recebimento
            </CardTitle>
            <CardDescription>
              Registre a entrada de um veículo para manutenção na AUTOFREI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Dados do Veículo */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    Dados do Veículo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="vehiclePlate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Placa do Veículo</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC1234" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modelo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Mercedes Sprinter" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Veículo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicleTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="currentKm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quilometragem Atual (km)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="project"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Projeto</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o projeto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Selecione o projeto</SelectItem>
                              <SelectItem value="projeto1">Projeto 1</SelectItem>
                              <SelectItem value="projeto2">Projeto 2</SelectItem>
                              <SelectItem value="projeto3">Projeto 3</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="base"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Primeiro selecione um projeto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Primeiro selecione um projeto</SelectItem>
                              <SelectItem value="base1">Base 1</SelectItem>
                              <SelectItem value="base2">Base 2</SelectItem>
                              <SelectItem value="base3">Base 3</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Detalhes do Serviço */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-orange-900 mb-4 flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Detalhes do Serviço
                  </h3>
                  <FormField
                    control={form.control}
                    name="serviceDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição do Serviço</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o que será feito no veículo..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="recebido">Recebido</SelectItem>
                              <SelectItem value="em_analise">Em Análise</SelectItem>
                              <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                              <SelectItem value="em_execucao">Em Execução</SelectItem>
                              <SelectItem value="finalizado">Finalizado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prazo de Entrega</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Peças e Valores */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-900 mb-4 flex items-center">
                    <Package2 className="h-5 w-5 mr-2" />
                    Peças e Valores
                  </h3>
                  
                  {/* Adicionar nova peça */}
                  <div className="bg-white p-4 rounded border mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Nome da Peça</label>
                        <Input
                          placeholder="Nome da peça"
                          value={newPartName}
                          onChange={(e) => setNewPartName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Valor (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="R$ 0,00"
                          value={newPartPrice}
                          onChange={(e) => setNewPartPrice(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          onClick={addPart} 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de peças */}
                  {parts.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {parts.map((part) => (
                        <div key={part.id} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div>
                            <span className="font-medium">{part.name}</span>
                            <span className="text-green-600 ml-2">{formatCurrency(part.price)}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePart(part.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custos */}
                  <div className="bg-white p-4 rounded border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="laborCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custo Mão de Obra (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="R$ 0,00"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <label className="text-sm font-medium text-gray-900 mb-2 block">Custo das Peças</label>
                        <div className="p-2 bg-gray-50 border rounded text-sm font-medium">
                          {formatCurrency(parts.reduce((sum, part) => sum + part.price, 0))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Estimado</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(calculateTotalCost())}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observações Adicionais */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-purple-900 mb-4 flex items-center">
                    📝 Observações Adicionais
                  </h3>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Observações sobre o estado do veículo ou outros detalhes..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-4 pt-6">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Registrando..." : "Registrar Recebimento"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setLocation('/oficina/autofrei/dashboard')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}