import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function FuelCardSolicitation() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    placa: "",
    km: "",
    tipo_cartao: "placa", // placa ou numero
    provedor_cartao: "ticket", // ticket ou alelo
    numero_cartao: "",
    motorista: "",
    observacoes: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.placa) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe a placa do veículo.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.km) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe a quilometragem atual do veículo.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.tipo_cartao === "numero" && !formData.numero_cartao) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o número do cartão.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest("POST", "/api/fuel-card-solicitations", formData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao enviar solicitação");
      }
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação foi enviada com sucesso e está aguardando aprovação.",
      });
      
      // Resetar o formulário
      setFormData({
        placa: "",
        km: "",
        tipo_cartao: "placa",
        provedor_cartao: "ticket",
        numero_cartao: "",
        motorista: "",
        observacoes: ""
      });
      
      // Redirecionar para a página de confirmação ou outra página adequada
      setLocation("/fuel-card/confirmation");
      
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast({
        title: "Erro ao enviar solicitação",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-xl">Solicitação de Cartão Combustível</CardTitle>
          <CardDescription className="text-primary-foreground/90">
            Preencha os dados abaixo para solicitar seu cartão de combustível
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="placa">Placa do Veículo</Label>
                  <Input 
                    id="placa" 
                    name="placa" 
                    placeholder="AAA-0000" 
                    value={formData.placa}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="km">Quilometragem (KM)</Label>
                  <Input 
                    id="km" 
                    name="km" 
                    type="number" 
                    placeholder="Km atual" 
                    value={formData.km}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_cartao">Tipo de Cartão</Label>
                  <Select
                    value={formData.tipo_cartao}
                    onValueChange={(value) => handleSelectChange("tipo_cartao", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placa">Placa do Veículo</SelectItem>
                      <SelectItem value="numero">Número do Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provedor_cartao">Cartão</Label>
                  <Select
                    value={formData.provedor_cartao}
                    onValueChange={(value) => handleSelectChange("provedor_cartao", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cartão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket">Ticket</SelectItem>
                      <SelectItem value="alelo">Alelo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {formData.tipo_cartao === "numero" && (
                <div className="space-y-2">
                  <Label htmlFor="numero_cartao">Número do Cartão</Label>
                  <Input 
                    id="numero_cartao" 
                    name="numero_cartao" 
                    placeholder="Digite o número do cartão" 
                    value={formData.numero_cartao}
                    onChange={handleChange}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="motorista">Nome do Motorista</Label>
                <Input 
                  id="motorista" 
                  name="motorista" 
                  placeholder="Seu nome completo" 
                  value={formData.motorista}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Input 
                  id="observacoes" 
                  name="observacoes" 
                  placeholder="Informações adicionais" 
                  value={formData.observacoes}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}