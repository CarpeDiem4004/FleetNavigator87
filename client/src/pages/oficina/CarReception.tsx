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
import { Car, Plus, Save, Calendar, Calculator, Package2, Trash2, Edit, ArrowLeft } from "lucide-react";
import { workshopAPI } from "@/lib/workshop-api";
import WorkshopAuth from "@/components/auth/WorkshopAuth";
import { useLocation } from "wouter";

const carReceptionSchema = z.object({
  vehiclePlate: z.string().min(1, "Placa é obrigatória"),
  vehicleModel: z.string().min(1, "Modelo é obrigatório"),
  vehicleType: z.enum(["fiorino", "van", "vuc", "toco", "truck", "cavalo_mecanico", "carreta"], {
    required_error: "Tipo de veículo é obrigatório",
  }),
  currentKm: z.number().min(0, "Quilometragem deve ser positiva"),
  baseId: z.number({
    required_error: "Base é obrigatória",
  }),
  projectId: z.number({
    required_error: "Projeto é obrigatório",
  }),
  projectName: z.string().optional(),
  serviceDescription: z.string().min(1, "Descrição do serviço é obrigatória"),
  replacedParts: z.string().optional(),
  laborCost: z.number().min(0, "Custo da mão de obra deve ser positivo").optional(),
  partsCost: z.number().min(0, "Custo das peças deve ser positivo").optional(),
  deliveryDeadline: z.string().optional(),
  notes: z.string().optional(),
});

type CarReceptionForm = z.infer<typeof carReceptionSchema>;

interface Base {
  id: number;
  name: string;
  location: string;
  basename?: string;
}

interface ProjectBase {
  id: number;
  base_name: string;
  base_code?: string;
  description?: string;
  is_active: boolean;
}

interface ProjectWithBases {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  bases: ProjectBase[];
}

interface Part {
  id: string;
  name: string;
  price: number;
}

function CarReception() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [allBases, setAllBases] = useState<Base[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectWithBases[]>([]);
  const [availableBases, setAvailableBases] = useState<Base[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [newPartName, setNewPartName] = useState("");
  const [newPartPrice, setNewPartPrice] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isExternalAccess, setIsExternalAccess] = useState(false);
  const [externalToken, setExternalToken] = useState<string | null>(null);
  const [workshopId, setWorkshopId] = useState<number | null>(null);
  const { toast } = useToast();



  const form = useForm<CarReceptionForm>({
    resolver: zodResolver(carReceptionSchema),
    defaultValues: {
      vehiclePlate: "",
      vehicleModel: "",
      currentKm: 0,
      serviceDescription: "",
      replacedParts: "",
      laborCost: 0,
      partsCost: 0,
      notes: "",
    },
  });

  const selectedProjectId = form.watch("projectId");

  // Função para carregar dados do recebimento para edição
  const loadReceptionForEdit = (receptionData: any) => {
    form.reset({
      vehiclePlate: receptionData.vehiclePlate || "",
      vehicleModel: receptionData.vehicleModel || "",
      vehicleType: receptionData.vehicleType || "van",
      currentKm: receptionData.currentKm || 0,
      baseId: receptionData.baseId,
      projectId: receptionData.projectId,
      projectName: receptionData.projectName || "",
      serviceDescription: receptionData.serviceDescription || "",
      replacedParts: receptionData.replacedParts || "",
      laborCost: Number(receptionData.laborCost || 0),
      partsCost: Number(receptionData.partsCost || 0),
      deliveryDeadline: receptionData.deliveryDeadline ? 
        new Date(receptionData.deliveryDeadline).toISOString().split('T')[0] : "",
      notes: receptionData.notes || "",
    });

    // Se houver peças, carregá-las no estado
    if (receptionData.replacedParts) {
      try {
        const partsData = typeof receptionData.replacedParts === 'string' 
          ? JSON.parse(receptionData.replacedParts) 
          : receptionData.replacedParts;
        if (Array.isArray(partsData)) {
          setParts(partsData);
        }
      } catch (error) {
        console.error('Erro ao carregar peças:', error);
      }
    }
  };

  // Detectar modo de edição e acesso externo através da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isEdit = urlParams.get('edit') === 'true';
    const id = urlParams.get('id');
    const external = urlParams.get('external') === 'true';
    const token = urlParams.get('token');
    const workshop_id = urlParams.get('workshop_id');
    
    // Configurar acesso externo se presente
    if (external && token) {
      setIsExternalAccess(true);
      setExternalToken(token);
      if (workshop_id) {
        setWorkshopId(parseInt(workshop_id));
      }
    }
    
    if (isEdit && id) {
      setIsEditMode(true);
      setEditingId(parseInt(id));
      
      // Carregar dados do localStorage
      const savedData = localStorage.getItem('editingReception');
      if (savedData) {
        try {
          const receptionData = JSON.parse(savedData);
          loadReceptionForEdit(receptionData);
        } catch (error) {
          console.error('Erro ao carregar dados de edição:', error);
          toast({
            title: "Erro",
            description: "Erro ao carregar dados para edição",
            variant: "destructive",
          });
        }
      }
    }
  }, []);

  // Carregar bases e projetos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar bases do sistema
        const basesResponse = await fetch("/api/bases");
        if (basesResponse.ok) {
          const basesData = await basesResponse.json();
          setAllBases(basesData);
        }

        // Carregar projetos com bases usando a mesma API dos postos externos
        const projectsResponse = await fetch("/api/public/projects-with-bases");
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          console.log("📋 Resposta completa da API de projetos:", projectsData);
          if (projectsData.success) {
            console.log("📋 Dados dos projetos carregados:", projectsData.data);
            setAllProjects(projectsData.data);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    loadData();
  }, []);

  // Filtrar bases por projeto selecionado
  useEffect(() => {
    console.log("🔍 Filtrando bases para projeto ID:", selectedProjectId, "tipo:", typeof selectedProjectId);
    console.log("📋 Projetos disponíveis:", allProjects);
    
    if (selectedProjectId && allProjects.length > 0) {
      // Garantir que estamos comparando números com números
      const projectId = Number(selectedProjectId);
      const selectedProject = allProjects.find(p => Number(p.id) === projectId);
      console.log("📋 Projeto encontrado:", selectedProject);
      
      if (selectedProject && selectedProject.bases && selectedProject.bases.length > 0) {
        console.log("🏢 Bases do projeto:", selectedProject.bases);
        
        // As bases vêm aninhadas no projeto
        const basesForProject = selectedProject.bases.map((projectBase: ProjectBase) => ({
          id: projectBase.id,
          name: projectBase.base_name,
          location: projectBase.base_code || '',
          basename: projectBase.base_name
        }));
        
        console.log("🏢 Bases mapeadas:", basesForProject);
        setAvailableBases(basesForProject);
        
        // Auto-selecionar a base se houver apenas uma
        if (basesForProject.length === 1) {
          form.setValue("baseId", basesForProject[0].id);
        } else {
          form.setValue("baseId", undefined as any);
        }
      } else {
        console.log("❌ Projeto não tem bases ou não foi encontrado");
        console.log("- selectedProject:", selectedProject);
        console.log("- tem bases?", selectedProject?.bases);
        console.log("- quantidade de bases:", selectedProject?.bases?.length);
        console.log("- propriedades do projeto:", Object.keys(selectedProject || {}));
        console.log("- projeto completo:", JSON.stringify(selectedProject, null, 2));
        setAvailableBases([]);
      }
    } else {
      console.log("📋 Nenhum projeto selecionado ou projetos não carregados ainda");
      setAvailableBases([]);
      form.setValue("baseId", undefined as any);
    }
  }, [selectedProjectId, allProjects, form]);

  // Função para formatar moeda brasileira
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

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

  const onSubmit = async (data: CarReceptionForm) => {
    setIsLoading(true);
    try {
      const selectedProject = allProjects.find(p => p.id === data.projectId);
      
      const submissionData = {
        ...data,
        projectName: selectedProject?.name || "",
        totalCost: calculateTotalCost(),
        currentKm: Number(data.currentKm),
        laborCost: Number(data.laborCost || 0),
        partsCost: Number(data.partsCost || 0),
        replacedParts: JSON.stringify(parts), // Incluir as peças
        // Sanitizar campos de data - converter strings vazias para null
        deliveryDeadline: data.deliveryDeadline && data.deliveryDeadline.trim() !== '' ? data.deliveryDeadline : null,
        completionDate: data.completionDate && data.completionDate.trim() !== '' ? data.completionDate : null,
      };

      if (isEditMode && editingId) {
        // Atualizar recebimento existente
        const token = localStorage.getItem("oficina_token");
        const response = await fetch(`/api/oficina/car-receptions/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
          throw new Error("Erro ao atualizar recebimento");
        }

        toast({
          title: "Recebimento atualizado com sucesso",
          description: `Veículo ${data.vehiclePlate} foi atualizado.`,
        });
      } else {
        // Criar novo recebimento
        let response;
        if (isExternalAccess && externalToken) {
          // Usar API externa com token na query string
          response = await fetch(`/api/oficina/car-receptions?token=${externalToken}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao criar recebimento");
          }
        } else {
          await workshopAPI.createCarReception(submissionData);
        }
        
        toast({
          title: "Recebimento registrado com sucesso",
          description: `Veículo ${data.vehiclePlate} recebido para manutenção.`,
        });
      }
      
      // Limpar localStorage
      localStorage.removeItem('editingReception');
      
      if (isExternalAccess && externalToken) {
        // Para acesso externo, limpar formulário e permitir novo registro
        form.reset({
          vehiclePlate: "",
          vehicleModel: "",
          currentKm: 0,
          serviceDescription: "",
          replacedParts: "",
          laborCost: 0,
          partsCost: 0,
          notes: "",
        });
        
        // Limpar peças adicionadas
        setParts([]);
        
        // Mostrar opção de novo registro ou voltar ao dashboard
        setTimeout(() => {
          const choice = confirm("Veículo registrado com sucesso!\n\nDeseja registrar outro veículo?");
          if (!choice) {
            // Voltar para dashboard da oficina
            window.location.href = `/oficina/external?token=${externalToken}`;
          }
          // Se escolher sim, o formulário já foi limpo e está pronto para novo registro
        }, 1000);
      } else {
        setLocation('/maintenance/dashboard-oficina');
      }
      
    } catch (error) {
      console.error("Erro ao processar recebimento:", error);
      toast({
        title: isEditMode ? "Erro ao atualizar recebimento" : "Erro ao registrar recebimento",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const vehicleTypes = [
    { value: "fiorino", label: "Fiorino" },
    { value: "van", label: "Van" },
    { value: "vuc", label: "VUC" },
    { value: "toco", label: "Toco" },
    { value: "truck", label: "Truck" },
    { value: "cavalo_mecanico", label: "Cavalo Mecânico" },
    { value: "carreta", label: "Carreta" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Editar Recebimento" : "Recebimento de Veículos"}
          </h1>
        </div>
        {(isEditMode || isExternalAccess) && (
          <Button 
            variant="outline" 
            onClick={() => {
              if (isExternalAccess && externalToken) {
                setLocation(`/oficina/external?token=${externalToken}`);
              } else {
                setLocation('/maintenance/dashboard-oficina');
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit className="h-5 w-5" />
                Editar Recebimento
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Novo Recebimento
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? "Atualize as informações do veículo recebido"
              : "Registre a entrada de um veículo para manutenção"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações do Veículo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vehiclePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa do Veículo</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC-1234" {...field} />
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

              {/* Quilometragem */}
              <FormField
                control={form.control}
                name="currentKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quilometragem Atual (km)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 150000" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Base e Projeto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projeto</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          const numValue = value ? Number(value) : undefined;
                          console.log("🔄 Projeto selecionado (string):", value);
                          console.log("🔄 Projeto selecionado (number):", numValue);
                          field.onChange(numValue);
                        }} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o projeto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))} 
                        defaultValue={field.value?.toString()}
                        disabled={availableBases.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedProjectId ? "Selecione a base" : "Primeiro selecione um projeto"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableBases.map((base) => (
                            <SelectItem key={base.id} value={base.id.toString()}>
                              {base.name} - {base.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Descrição do Serviço */}
              <FormField
                control={form.control}
                name="serviceDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Serviço</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o que será feito no veículo..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sistema de Peças Individuais */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package2 className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Peças e Valores</h3>
                </div>
                
                {/* Adicionar Nova Peça */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    placeholder="Nome da peça"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    className="md:col-span-2"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Valor (R$)"
                    value={newPartPrice}
                    onChange={(e) => setNewPartPrice(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={addPart}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar
                  </Button>
                </div>

                {/* Lista de Peças Adicionadas */}
                {parts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Peças adicionadas:</h4>
                    {parts.map((part) => (
                      <div
                        key={part.id}
                        className="flex items-center justify-between p-2 bg-muted rounded border"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium">{part.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(part.price)}
                          </span>
                          <Button
                            type="button"
                            onClick={() => removePart(part.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total das Peças */}
                    <div className="flex justify-end pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total peças: </span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(parts.reduce((sum, part) => sum + part.price, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Custos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Custo Mão de Obra (R$)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Custo das Peças</FormLabel>
                  <div className="h-10 flex items-center justify-start bg-gray-50 border rounded-md px-3">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(parts.reduce((sum, part) => sum + part.price, 0))}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (calculado automaticamente)
                    </span>
                  </div>
                </div>

                <div className="flex items-end">
                  <div className="w-full">
                    <FormLabel>Total Estimado</FormLabel>
                    <div className="h-10 flex items-center justify-center bg-gray-50 border rounded-md px-3">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(calculateTotalCost())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prazo de Entrega */}
              <FormField
                control={form.control}
                name="deliveryDeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Prazo de Entrega
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observações */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações Adicionais</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações sobre o estado do veículo ou outros detalhes..."
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 
                  (isEditMode ? "Atualizando..." : "Registrando...") : 
                  (isEditMode ? "Atualizar Recebimento" : "Registrar Recebimento")
                }
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Rodapé discreto */}
      <div className="mt-16 pb-8 text-center text-gray-400 text-sm">
        Desenvolvido por Carpe Diem 4004 | suporte 11 970558053
      </div>
    </div>
  );
}

export default function CarReceptionPage() {
  // Verificar se é acesso externo
  const urlParams = new URLSearchParams(window.location.search);
  const isExternal = urlParams.get('external') === 'true';
  const hasToken = urlParams.get('token');

  // Se é acesso externo com token, não usar WorkshopAuth
  if (isExternal && hasToken) {
    return <CarReception />;
  }

  // Caso contrário, usar autenticação normal
  return (
    <WorkshopAuth workshopName="Sistema de Manutenção">
      <CarReception />
    </WorkshopAuth>
  );
}