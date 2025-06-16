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
import { Car, Plus, Save, Calendar, Calculator, Package2 } from "lucide-react";
import { workshopAPI } from "@/lib/workshop-api";

const carReceptionSchema = z.object({
  vehiclePlate: z.string().min(1, "Placa é obrigatória"),
  vehicleModel: z.string().min(1, "Modelo é obrigatório"),
  vehicleType: z.enum(["fiorino", "van", "vuc", "toco", "truck", "cavalo", "carreta"], {
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
}

interface Project {
  id: number;
  name: string;
  baseId: number;
}

export default function CarReception() {
  const [isLoading, setIsLoading] = useState(false);
  const [allBases, setAllBases] = useState<Base[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [availableBases, setAvailableBases] = useState<Base[]>([]);
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

        // Carregar projetos do sistema
        const projectsResponse = await fetch("/api/projects");
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          if (projectsData.success) {
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
    if (selectedProjectId) {
      const selectedProject = allProjects.find(p => p.id === selectedProjectId);
      if (selectedProject) {
        const basesForProject = allBases.filter(base => base.id === selectedProject.baseId);
        setAvailableBases(basesForProject);
        // Auto-selecionar a base se houver apenas uma
        if (basesForProject.length === 1) {
          form.setValue("baseId", basesForProject[0].id);
        } else {
          form.setValue("baseId", undefined as any);
        }
      }
    } else {
      setAvailableBases([]);
      form.setValue("baseId", undefined as any);
    }
  }, [selectedProjectId, allProjects, allBases, form]);

  const calculateTotalCost = () => {
    const laborCost = form.getValues("laborCost") || 0;
    const partsCost = form.getValues("partsCost") || 0;
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
      };

      await workshopAPI.createCarReception(submissionData);
      
      toast({
        title: "Recebimento registrado com sucesso",
        description: `Veículo ${data.vehiclePlate} recebido para manutenção.`,
      });
      
      form.reset();
      
    } catch (error) {
      console.error("Erro ao registrar recebimento:", error);
      toast({
        title: "Erro ao registrar recebimento",
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
    { value: "cavalo", label: "Cavalo Mecânico" },
    { value: "carreta", label: "Carreta" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Car className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Recebimento de Veículos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Recebimento
          </CardTitle>
          <CardDescription>
            Registre a entrada de um veículo para manutenção
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
                        onValueChange={(value) => field.onChange(value ? Number(value) : undefined)} 
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

              {/* Peças Trocadas */}
              <FormField
                control={form.control}
                name="replacedParts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Package2 className="h-4 w-4" />
                      Peças a Trocar (Opcional)
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Liste as peças que serão trocadas..."
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

                <FormField
                  control={form.control}
                  name="partsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo das Peças (R$)</FormLabel>
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

                <div className="flex items-end">
                  <div className="w-full">
                    <FormLabel>Total Estimado (R$)</FormLabel>
                    <div className="h-10 flex items-center justify-center bg-gray-50 border rounded-md px-3">
                      <span className="font-semibold text-green-600">
                        R$ {calculateTotalCost().toFixed(2)}
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
                {isLoading ? "Registrando..." : "Registrar Recebimento"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}