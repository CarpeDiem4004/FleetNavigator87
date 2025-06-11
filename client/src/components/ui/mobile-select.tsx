/**
 * Componente Select otimizado para dispositivos móveis
 * Resolve problemas de eventos touch e responsividade
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MobileSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Selecione uma opção",
  disabled = false,
  className = "",
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Encontrar a opção selecionada
  const selectedOption = options.find(opt => opt.value === value);

  // Handler para abrir/fechar com suporte a touch
  const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Handler para seleção de opção
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  // Handler para eventos de teclado (acessibilidade)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  };

  return (
    <div 
      ref={selectRef}
      className={cn(
        "relative w-full",
        className
      )}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        onTouchStart={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 text-left bg-white border rounded-md shadow-sm",
          "flex items-center justify-between",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "transition-colors duration-200",
          // Estados
          error 
            ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
            : "border-gray-300",
          disabled 
            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
            : "hover:border-gray-400 cursor-pointer",
          // Mobile-specific
          "min-h-[44px] touch-manipulation", // Tamanho mínimo de toque recomendado (44px)
          "active:bg-gray-50" // Feedback visual no toque
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
      >
        <span className={cn(
          "block truncate",
          selectedOption ? "text-gray-900" : "text-gray-500"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-gray-400 transition-transform duration-200",
            isOpen && "transform rotate-180"
          )}
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <>
          {/* Overlay para mobile */}
          <div className="fixed inset-0 z-40 md:hidden" />
          
          {/* Lista de opções */}
          <div className={cn(
            "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg",
            "max-h-60 overflow-auto",
            // Mobile optimization
            "md:relative md:z-auto",
            // Em mobile, ocupar mais espaço vertical
            "mobile:max-h-[50vh] mobile:overflow-y-scroll"
          )}>
            {options.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Nenhuma opção disponível
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onTouchStart={() => handleSelect(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm",
                    "flex items-center justify-between",
                    "transition-colors duration-150",
                    // Mobile touch targets
                    "min-h-[44px] touch-manipulation",
                    // Estados
                    option.disabled
                      ? "text-gray-400 cursor-not-allowed bg-gray-50"
                      : cn(
                          "text-gray-900 cursor-pointer",
                          "hover:bg-gray-100 active:bg-gray-200",
                          // Highlight da opção selecionada
                          value === option.value && "bg-blue-50 text-blue-700"
                        )
                  )}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <span className="block truncate">
                    {option.label}
                  </span>
                  
                  {value === option.value && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MobileSelect;