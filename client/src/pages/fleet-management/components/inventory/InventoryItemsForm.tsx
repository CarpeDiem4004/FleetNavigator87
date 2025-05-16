import React, { useState } from 'react';
import { supabase } from '@/lib/supabase-compat';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Schema de validação para o formulário
const formSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres').max(100, 'O nome não pode exceder 100 caracteres'),
  code: z.string().min(2, 'O código deve ter pelo menos 2 caracteres').max(50, 'O código não pode exceder 50 caracteres'),
  category: z.string().min(1, 'A categoria é obrigatória'),
  unit: z.string().min(1, 'A unidade de medida é obrigatória'),
  minimumStock: z.coerce.number().min(0, 'O estoque mínimo não pode ser negativo'),
  unitCost: z.coerce.number().min(0, 'O custo unitário não pode ser negativo'),
  description: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryItemsFormProps {
  onSuccess: () => void;
  editItem?: any;
}

export default function InventoryItemsForm({ onSuccess, editItem }: InventoryItemsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configurar o formulário com valores padrão ou valores do item a ser editado
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editItem ? {
      name: editItem.name,
      code: editItem.code,
      category: editItem.category,
      unit: editItem.unit,
      minimumStock: editItem.minimum_stock,
      unitCost: editItem.unit_cost,
      description: editItem.description || '',
      notes: editItem.notes || '',
      isActive: editItem.is_active
    } : {
      name: '',
      code: '',
      category: '',
      unit: 'un',
      minimumStock: 0,
      unitCost: 0,
      description: '',
      notes: '',
      isActive: true
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const itemData = {
        name: data.name,
        code: data.code,
        category: data.category,
        unit: data.unit,
        minimum_stock: data.minimumStock,
        unit_cost: data.unitCost,
        description: data.description,
        notes: data.notes,
        is_active: data.isActive,
        updated_at: new Date().toISOString()
      };

      let response;
      
      if (editItem) {
        // Atualizar item existente
        response = await supabase
          .from('inventory_items')
          .update(itemData)
          .eq('id', editItem.id);
      } else {
        // Inserir novo item
        response = await supabase
          .from('inventory_items')
          .insert([{
            ...itemData,
            created_at: new Date().toISOString()
          }]);
      }

      if (response.error) {
        throw response.error;
      }

      toast({
        title: editItem ? "Item atualizado" : "Item cadastrado",
        description: editItem 
          ? `O item ${data.name} foi atualizado com sucesso.` 
          : `O item ${data.name} foi adicionado ao sistema.`,
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o item.",
        variant: "destructive",
      });
      console.error("Erro ao salvar item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome do Item */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Item*</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Filtro de Óleo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Código/SKU */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código/SKU*</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: FO-1234" {...field} />
                </FormControl>
                <FormDescription>
                  Código único para identificação do item
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoria */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="motor">Motor</SelectItem>
                    <SelectItem value="freios">Freios</SelectItem>
                    <SelectItem value="suspensao">Suspensão</SelectItem>
                    <SelectItem value="transmissao">Transmissão</SelectItem>
                    <SelectItem value="eletrica">Elétrica</SelectItem>
                    <SelectItem value="carroceria">Carroceria</SelectItem>
                    <SelectItem value="pneus">Pneus e Rodas</SelectItem>
                    <SelectItem value="lubrificantes">Lubrificantes</SelectItem>
                    <SelectItem value="filtros">Filtros</SelectItem>
                    <SelectItem value="acessorios">Acessórios</SelectItem>
                    <SelectItem value="ferramentas">Ferramentas</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unidade de Medida */}
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade de Medida*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="un">Unidade (un)</SelectItem>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="g">Grama (g)</SelectItem>
                    <SelectItem value="l">Litro (l)</SelectItem>
                    <SelectItem value="ml">Mililitro (ml)</SelectItem>
                    <SelectItem value="m">Metro (m)</SelectItem>
                    <SelectItem value="cm">Centímetro (cm)</SelectItem>
                    <SelectItem value="m2">Metro Quadrado (m²)</SelectItem>
                    <SelectItem value="m3">Metro Cúbico (m³)</SelectItem>
                    <SelectItem value="par">Par</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="rolo">Rolo</SelectItem>
                    <SelectItem value="kit">Kit</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Estoque Mínimo */}
          <FormField
            control={form.control}
            name="minimumStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Mínimo*</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="1" {...field} />
                </FormControl>
                <FormDescription>
                  Quantidade mínima desejada no estoque
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Custo Unitário */}
          <FormField
            control={form.control}
            name="unitCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo Unitário (R$)*</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="0,00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descrição detalhada do item, incluindo especificações técnicas"
                  className="min-h-[100px]"
                  {...field} 
                />
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
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Informações adicionais e notas sobre o item"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              onSuccess();
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editItem ? 'Atualizar Item' : 'Cadastrar Item'}
          </Button>
        </div>
      </form>
    </Form>
  );
}