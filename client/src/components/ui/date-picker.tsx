import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
  mode?: "single"; // Simplificamos para apenas "single" por enquanto
  selected?: Date | undefined;
  initialFocus?: boolean;
  onSelect?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({ 
  mode = "single", 
  selected, 
  onSelect, 
  initialFocus = false,
  disabled = false,
  className 
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(selected);

  const handleSelect = (value: Date | undefined) => {
    setDate(value);
    onSelect?.(value);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleSelect}
        initialFocus={initialFocus}
        disabled={disabled}
        locale={ptBR}
      />
    </div>
  );
}