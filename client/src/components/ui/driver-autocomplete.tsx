import { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Driver {
  id: number;
  nome: string;
  cpf: string;
}

interface DriverAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  drivers: Driver[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DriverAutocomplete({
  value,
  onValueChange,
  drivers,
  placeholder = "Selecione o motorista",
  disabled = false,
  className
}: DriverAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>(drivers);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Encontrar o motorista selecionado
  const selectedDriver = drivers.find(d => d.nome === value);

  // Filtrar motoristas baseado na pesquisa
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(driver =>
        driver.nome.toLowerCase().includes(searchValue.toLowerCase()) ||
        driver.cpf.includes(searchValue)
      );
      setFilteredDrivers(filtered);
      setHighlightedIndex(0);
    }
  }, [searchValue, drivers]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchValue('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredDrivers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredDrivers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredDrivers[highlightedIndex]) {
          selectDriver(filteredDrivers[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchValue('');
        inputRef.current?.blur();
        break;
    }
  };

  const selectDriver = (driver: Driver) => {
    onValueChange(driver.nome);
    setIsOpen(false);
    setSearchValue('');
    inputRef.current?.blur();
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
    setSearchValue('');
    inputRef.current?.focus();
  };

  const toggleDropdown = () => {
    if (disabled) return;
    
    if (!isOpen) {
      setIsOpen(true);
      setSearchValue('');
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setIsOpen(false);
      setSearchValue('');
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div
        className={cn(
          "flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={toggleDropdown}
      >
        {isOpen ? (
          <Input
            ref={inputRef}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite para pesquisar..."
            className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={disabled}
          />
        ) : (
          <span className={cn(
            "flex-1 truncate",
            !selectedDriver && "text-muted-foreground"
          )}>
            {selectedDriver ? selectedDriver.nome : placeholder}
          </span>
        )}

        <div className="flex items-center gap-1">
          {selectedDriver && !disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={clearSelection}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {isOpen ? (
            <Search className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {filteredDrivers.length === 0 ? (
            <div className="px-3 py-2 text-center text-sm text-muted-foreground">
              {searchValue ? 'Nenhum motorista encontrado' : 'Nenhum motorista disponível'}
            </div>
          ) : (
            <div className="p-1">
              {filteredDrivers.map((driver, index) => (
                <div
                  key={driver.id}
                  className={cn(
                    "relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    index === highlightedIndex && "bg-accent text-accent-foreground",
                    driver.nome === value && "font-medium"
                  )}
                  onClick={() => selectDriver(driver)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate">{driver.nome}</span>
                    <span className="text-xs text-muted-foreground">CPF: {driver.cpf}</span>
                  </div>
                  {driver.nome === value && (
                    <Check className="ml-2 h-4 w-4 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}