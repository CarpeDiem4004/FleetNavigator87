import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

// Interface para o ciclo de vida da manutenção
interface MaintenanceLifecycle {
  id?: number;
  maintenance_id: number;
  entry_date: string | null;
  maintenance_start_date: string | null;
  expected_exit_date: string | null;
  actual_exit_date: string | null;
  vehicle_pickup_date: string | null;
  pickup_person_name: string | null;
  pickup_person_cpf: string | null;
  pickup_comments: string | null;
  created_at?: string;
  updated_at?: string;
}

interface MaintenanceLifecycleProps {
  maintenanceId: number;
  onStatusChange?: () => void;
  initialEntryDate?: string;
}

export default function MaintenanceLifecycle({ maintenanceId, onStatusChange, initialEntryDate }: MaintenanceLifecycleProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("recebimento");
  
  // Estados para os dados do ciclo de vida
  const [lifecycleData, setLifecycleData] = useState<MaintenanceLifecycle>({
    maintenance_id: maintenanceId,
    entry_date: initialEntryDate || null,
    maintenance_start_date: null,
    expected_exit_date: null,
    actual_exit_date: null,
    vehicle_pickup_date: null,
    pickup_person_name: null,
    pickup_person_cpf: null,
    pickup_comments: null
  });
  
  // Função para carregar dados do ciclo de vida
  const fetchLifecycleData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workshop/maintenance-lifecycle/${maintenanceId}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados do ciclo de vida: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data) {
        setLifecycleData({
          ...lifecycleData,
          ...data,
          entry_date: data.entry_date || initialEntryDate,
        });
        
        // Definir a aba ativa com base nos dados
        if (data.vehicle_pickup_date) {
          setActiveTab("retirada");
        } else if (data.actual_exit_date) {
          setActiveTab("conclusao");
        } else if (data.maintenance_start_date) {
          setActiveTab("execucao");
        } else {
          setActiveTab("recebimento");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados do ciclo de vida:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do ciclo de vida.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para salvar dados
  const saveLifecycleData = async () => {
    try {
      setSaving(true);
      
      const response = await fetch("/api/workshop/maintenance-lifecycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(lifecycleData)
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao salvar dados: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLifecycleData(data);
      
      // Chamar callback se existir
      if (onStatusChange) {
        onStatusChange();
      }
      
      toast({
        title: "Sucesso",
        description: "Dados do ciclo de vida atualizados com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar dados do ciclo de vida:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchLifecycleData();
  }, [maintenanceId]);
  
  // Função auxiliar para atualizar uma data no estado
  const updateDate = (field: keyof MaintenanceLifecycle, date: Date | null | undefined) => {
    setLifecycleData({
      ...lifecycleData,
      [field]: date ? date.toISOString().split('T')[0] : null
    });
  };
  
  // Função para atualizar campos de texto
  const updateTextField = (field: keyof MaintenanceLifecycle, value: string) => {
    setLifecycleData({
      ...lifecycleData,
      [field]: value || null
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ciclo de Vida da Manutenção</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando dados...</span>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="recebimento" className="flex-1">Recebimento</TabsTrigger>
                <TabsTrigger value="execucao" className="flex-1">Execução</TabsTrigger>
                <TabsTrigger value="conclusao" className="flex-1">Conclusão</TabsTrigger>
                <TabsTrigger value="retirada" className="flex-1">Retirada</TabsTrigger>
              </TabsList>
              
              {/* Aba de Recebimento do Veículo */}
              <TabsContent value="recebimento">
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="entry_date">Data de Entrada do Veículo na Oficina</Label>
                    <div className="flex mt-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !lifecycleData.entry_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {lifecycleData.entry_date ? formatDate(lifecycleData.entry_date) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={lifecycleData.entry_date ? new Date(lifecycleData.entry_date) : undefined}
                            onSelect={(date) => updateDate("entry_date", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={saveLifecycleData}
                    disabled={saving || !lifecycleData.entry_date}
                  >
                    {saving ? 
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </span> : 
                      "Salvar Dados de Recebimento"
                    }
                  </Button>
                </div>
              </TabsContent>
              
              {/* Aba de Execução da Manutenção */}
              <TabsContent value="execucao">
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="maintenance_start_date">Data de Início da Manutenção</Label>
                    <div className="flex mt-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !lifecycleData.maintenance_start_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {lifecycleData.maintenance_start_date ? 
                              formatDate(lifecycleData.maintenance_start_date) : 
                              "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={lifecycleData.maintenance_start_date ? 
                              new Date(lifecycleData.maintenance_start_date) : undefined}
                            onSelect={(date) => updateDate("maintenance_start_date", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="expected_exit_date">Previsão de Conclusão</Label>
                    <div className="flex mt-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !lifecycleData.expected_exit_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {lifecycleData.expected_exit_date ? 
                              formatDate(lifecycleData.expected_exit_date) : 
                              "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={lifecycleData.expected_exit_date ? 
                              new Date(lifecycleData.expected_exit_date) : undefined}
                            onSelect={(date) => updateDate("expected_exit_date", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={saveLifecycleData}
                    disabled={saving || !lifecycleData.maintenance_start_date}
                  >
                    {saving ? 
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </span> : 
                      "Atualizar Dados de Execução"
                    }
                  </Button>
                </div>
              </TabsContent>
              
              {/* Aba de Conclusão da Manutenção */}
              <TabsContent value="conclusao">
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="actual_exit_date">Data de Conclusão da Manutenção</Label>
                    <div className="flex mt-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !lifecycleData.actual_exit_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {lifecycleData.actual_exit_date ? 
                              formatDate(lifecycleData.actual_exit_date) : 
                              "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={lifecycleData.actual_exit_date ? 
                              new Date(lifecycleData.actual_exit_date) : undefined}
                            onSelect={(date) => updateDate("actual_exit_date", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={saveLifecycleData}
                    disabled={saving || !lifecycleData.actual_exit_date}
                  >
                    {saving ? 
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </span> : 
                      "Concluir Manutenção"
                    }
                  </Button>
                </div>
              </TabsContent>
              
              {/* Aba de Retirada do Veículo */}
              <TabsContent value="retirada">
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="vehicle_pickup_date">Data de Retirada do Veículo</Label>
                    <div className="flex mt-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !lifecycleData.vehicle_pickup_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {lifecycleData.vehicle_pickup_date ? 
                              formatDate(lifecycleData.vehicle_pickup_date) : 
                              "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={lifecycleData.vehicle_pickup_date ? 
                              new Date(lifecycleData.vehicle_pickup_date) : undefined}
                            onSelect={(date) => updateDate("vehicle_pickup_date", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="pickup_person_name">Nome de Quem Retirou</Label>
                    <Input
                      id="pickup_person_name"
                      value={lifecycleData.pickup_person_name || ""}
                      onChange={(e) => updateTextField("pickup_person_name", e.target.value)}
                      className="mt-1.5"
                      placeholder="Nome completo da pessoa que retirou o veículo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pickup_person_cpf">CPF de Quem Retirou</Label>
                    <Input
                      id="pickup_person_cpf"
                      value={lifecycleData.pickup_person_cpf || ""}
                      onChange={(e) => updateTextField("pickup_person_cpf", e.target.value)}
                      className="mt-1.5"
                      placeholder="CPF da pessoa que retirou o veículo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pickup_comments">Observações</Label>
                    <Textarea
                      id="pickup_comments"
                      value={lifecycleData.pickup_comments || ""}
                      onChange={(e) => updateTextField("pickup_comments", e.target.value)}
                      className="mt-1.5"
                      placeholder="Observações sobre a retirada do veículo"
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={saveLifecycleData}
                    disabled={saving || !lifecycleData.vehicle_pickup_date || !lifecycleData.pickup_person_name}
                  >
                    {saving ? 
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </span> : 
                      "Finalizar Processo de Manutenção"
                    }
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}