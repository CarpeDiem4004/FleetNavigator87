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
  requester_cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  requester_email: z.string().email("Email deve ser válido"),
  requester_phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  requester_base_address: z.string().min(1, "Endereço da base é obrigatório"),
  requester_department: z.string().min(1, "Departamento é obrigatório"),
  requester_function: z.string().min(1, "Função é obrigatória"),
  project_name: z.string().min(1, "Nome do projeto é obrigatório"),
  base_name: z.string().min(1, "Nome da base é obrigatório"),
  manager_approval: z.string().min(1, "Nome do gestor é obrigatório"),
  manager_phone: z.string().min(10, "Telefone do gestor deve ter pelo menos 10 dígitos"),
  equipment_type: z.enum(['notebook', 'celular', 'email', 'chip']),
  justification: z.string().min(20, "Motivo da solicitação deve ter pelo menos 20 caracteres"),
  urgency_level: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
  requested_delivery_date: z.string().optional(),
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
              
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Dados Pessoais</h3>
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
                    name="requester_cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF *</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
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
              </div>

              {/* Dados Profissionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Dados Profissionais</h3>
                <FormField
                  control={form.control}
                  name="requester_base_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço da Base *</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo da base de trabalho" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="project_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Projeto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do projeto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="base_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requester_department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento *</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu departamento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="requester_function"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Função *</FormLabel>
                        <FormControl>
                          <Input placeholder="Sua função/cargo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dados do Gestor */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Dados do Gestor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manager_approval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Gestor *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do gestor que aprova" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="manager_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone do Gestor *</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Solicitação de Equipamento */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Solicitação de Equipamento</h3>
                
                <FormField
                  control={form.control}
                  name="equipment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Solicitado *</FormLabel>
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

<FormField
                  control={form.control}
                  name="justification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo da Solicitação *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explique o motivo da solicitação e como será utilizado"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="urgency_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de Urgência</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a urgência" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(urgencyLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                <span className={urgencyColors[value as keyof typeof urgencyColors]}>{label}</span>
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
              </div>

              {/* Botão de Envio */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full md:w-auto px-8"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
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