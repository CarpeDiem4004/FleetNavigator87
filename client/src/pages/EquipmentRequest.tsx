import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Laptop, Smartphone, Mail, Phone, Headphones, Monitor, Send, CheckCircle, Clock } from "lucide-react";

// Schema para validação do formulário de solicitação
const equipmentRequestSchema = z.object({
  requester_name: z.string().min(1, "Nome é obrigatório"),
  requester_email: z.string().email("Email deve ser válido"),
  requester_phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  requester_department: z.string().min(1, "Departamento é obrigatório"),
  equipment_type: z.enum(['notebook', 'celular', 'email', 'chip']),
  equipment_description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  justification: z.string().min(20, "Justificativa deve ter pelo menos 20 caracteres"),
  urgency_level: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
  requested_delivery_date: z.string().optional(),
  manager_approval: z.string().min(1, "Nome do gestor aprovador é obrigatório"),
  whatsapp_phone: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos"),
});

type EquipmentRequestFormData = z.infer<typeof equipmentRequestSchema>;

const equipmentTypeLabels = {
  notebook: 'Notebook/Laptop',
  celular: 'Celular/Smartphone',
  email: 'Conta de Email',
  chip: 'Chip de Celular'
};

const equipmentTypeIcons = {
  notebook: <Laptop className="h-5 w-5" />,
  celular: <Smartphone className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  chip: <Phone className="h-5 w-5" />
};

const urgencyLabels = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente'
};

const urgencyColors = {
  baixa: 'text-green-600',
  normal: 'text-blue-600',
  alta: 'text-orange-600',
  urgente: 'text-red-600'
};

export default function EquipmentRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<EquipmentRequestFormData>({
    resolver: zodResolver(equipmentRequestSchema),
    defaultValues: {
      urgency_level: 'normal',
    }
  });

  const onSubmit = async (data: EquipmentRequestFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest("POST", "/api/equipment-requests", data);
      const result = await response.json();
      
      if (result.success) {
        setRequestId(result.data.id);
        setSubmitted(true);
        toast({
          title: "Solicitação Enviada!",
          description: `Sua solicitação #${result.data.id} foi enviada com sucesso. Você receberá atualizações via WhatsApp.`,
          variant: "default"
        });
      } else {
        throw new Error(result.message || "Erro ao enviar solicitação");
      }
    } catch (error) {
      console.error("Erro ao submeter solicitação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            </div>
            <CardTitle className="text-green-800">Solicitação Enviada com Sucesso!</CardTitle>
            <CardDescription className="text-lg">
              Protocolo: #{requestId}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Próximos Passos:</h3>
              <div className="space-y-2 text-green-700">
                <div className="flex items-center gap-2 justify-center">
                  <Clock className="h-4 w-4" />
                  <span>Análise da solicitação: 1-2 dias úteis</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Headphones className="h-4 w-4" />
                  <span>Notificações via WhatsApp sobre o status</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setRequestId(null);
                form.reset();
              }}
              variant="outline"
              className="mt-4"
            >
              Fazer Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-6 w-6" />
            Solicitação de Equipamentos
          </CardTitle>
          <CardDescription>
            Solicite notebook, email, telefone ou chip. Você receberá atualizações via WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Informações Pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requester_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requester_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu.email@empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requester_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requester_department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: TI, RH, Vendas, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tipo de Equipamento */}
              <FormField
                control={form.control}
                name="equipment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Equipamento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de equipamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(equipmentTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              {equipmentTypeIcons[value as keyof typeof equipmentTypeIcons]}
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrição e Justificativa */}
              <FormField
                control={form.control}
                name="equipment_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Equipamento *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva as especificações desejadas (ex: Notebook i5, 8GB RAM, SSD 256GB)"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justificativa *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explique a necessidade do equipamento e como será utilizado"
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prioridade */}
                <FormField
                  control={form.control}
                  name="urgency_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Urgência *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(urgencyLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <span className={urgencyColors[value as keyof typeof urgencyColors]}>
                                {label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data Desejada */}
                <FormField
                  control={form.control}
                  name="requested_delivery_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Desejada de Entrega</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gestor Aprovador */}
                <FormField
                  control={form.control}
                  name="manager_approval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gestor Aprovador *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do seu gestor direto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WhatsApp */}
                <FormField
                  control={form.control}
                  name="whatsapp_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp para Notificações *</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}