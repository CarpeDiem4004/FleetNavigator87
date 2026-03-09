import * as React from "react"
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Combobox } from "@/components/ui/combobox"

interface VehicleOption {
  value: string
  label: string
}

interface VehiclePlateAutocompleteProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
> {
  form: UseFormReturn<TFieldValues>
  name: TName
  label?: string
  placeholder?: string
  helpText?: string
  vehicles: { plate: string; model?: string }[]
  disabled?: boolean
}

export function VehiclePlateAutocomplete<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>({
  form,
  name,
  label = "Placa do Veículo",
  placeholder = "Selecione a placa do veículo",
  helpText = "Digite ou selecione a placa do veículo",
  vehicles,
  disabled = false,
}: VehiclePlateAutocompleteProps<TFieldValues, TName>) {
  
  // Converte os veículos para o formato esperado pelo Combobox
  const vehicleOptions: VehicleOption[] = React.useMemo(() => {
    return vehicles.map(vehicle => ({
      value: vehicle.plate,
      label: vehicle.model ? `${vehicle.plate} - ${vehicle.model}` : vehicle.plate
    }))
  }, [vehicles])

  // Permite a entrada manual de placa não cadastrada
  const [customValue, setCustomValue] = React.useState("")

  // Gerencia a exibição de valor personalizado
  const handleChange = (value: string) => {
    // Atualiza o valor no formulário
    form.setValue(name, value as any, { shouldValidate: true })
    
    // Se for um valor personalizado (não existe nas opções), armazenamos
    if (!vehicleOptions.some(option => option.value === value) && value) {
      setCustomValue(value)
    } else {
      setCustomValue("")
    }
  }

  // Obter o valor atual do campo do formulário
  const fieldValue = form.watch(name) as string
  
  // Lista final de opções, incluindo valor personalizado se necessário
  const allOptions = React.useMemo(() => {
    const options = [...vehicleOptions]
    
    // Adiciona o valor personalizado como uma opção se não existir nas opções originais
    if (customValue && !options.some(option => option.value === customValue)) {
      options.push({
        value: customValue,
        label: customValue
      })
    }
    
    // Adiciona o valor atual do formulário se não estiver nas opções
    if (fieldValue && !options.some(option => option.value === fieldValue)) {
      options.push({
        value: fieldValue,
        label: fieldValue
      })
    }
    
    return options
  }, [vehicleOptions, customValue, fieldValue])

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Combobox
          value={fieldValue || ""}
          onChange={handleChange}
          options={allOptions}
          placeholder={placeholder}
          emptyMessage="Nenhuma placa encontrada. Digite a placa completa."
          disabled={disabled}
        />
      </FormControl>
      {helpText && (
        <p className="text-muted-foreground text-xs">{helpText}</p>
      )}
      <FormMessage />
    </FormItem>
  )
}