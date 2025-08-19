/**
 * Componente Select otimizado para dispositivos móveis
 * Resolve problemas de eventos touch e responsividade
 */

import { useState, useRef, useEffect } from 'react';
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
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Detectar início do toque
  const handleTouchStart = (e: React.TouchEvent, optionValue: string) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartTime(Date.now());
    setIsScrolling(false);
  };

  // Detectar movimento durante o toque (scroll)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const touch = e.touches[0];
      const deltaY = Math.abs(touch.clientY - touchStartY);
      
      // Se moveu mais de 10px, considera como scroll
      if (deltaY > 10) {
        setIsScrolling(true);
      }
    }
  };

  // Detectar fim do toque e decidir se seleciona
  const handleTouchEnd = (e: React.TouchEvent, optionValue: string) => {
    if (touchStartTime !== null) {
      const touchDuration = Date.now() - touchStartTime;
      
      // Se não está rolando e o toque foi rápido (menos de 300ms), seleciona
      if (!isScrolling && touchDuration < 300) {
        e.preventDefault();
        handleSelect(optionValue);
      }
    }
    
    // Reset estados
    setTouchStartY(null);
    setTouchStartTime(null);
    setIsScrolling(false);
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
          
          {/* Container com header de contagem */}
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {/* Header com contador de itens */}
            {options.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">
                    {options.length} {options.length === 1 ? 'opção disponível' : 'opções disponíveis'}
                  </span>
                  {options.length > 5 && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span>↕</span> Role para navegar
                    </span>
                  )}
                </div>
                {options.length > 5 && (
                  <div className="mt-1">
                    <span className="text-xs text-blue-600 font-medium">
                      💡 Dica: Role primeiro, depois toque para selecionar
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Lista de opções com scroll */}
            <div 
              ref={scrollContainerRef}
              onTouchMove={handleTouchMove}
              className={cn(
                // Altura fixa com scroll visível
                "h-60 overflow-y-auto",
                // Estilo da barra de rolagem
                "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100",
                "hover:scrollbar-thumb-gray-500",
                // Mobile optimization - altura maior em dispositivos móveis
                "md:h-60 sm:h-80",
                // Scroll suave e indicadores visuais
                "scroll-smooth",
                // Border radius interno para o scroll
                "[&::-webkit-scrollbar]:w-3",
                "[&::-webkit-scrollbar-track]:bg-gray-100",
                "[&::-webkit-scrollbar-track]:rounded-r-md",
                "[&::-webkit-scrollbar-thumb]:bg-gray-400",
                "[&::-webkit-scrollbar-thumb]:rounded-full",
                "[&::-webkit-scrollbar-thumb:hover]:bg-gray-500",
                // Gradiente nas bordas para indicar scroll
                "relative",
                "before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-gradient-to-b before:from-white before:to-transparent before:pointer-events-none before:z-10",
                "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-2 after:bg-gradient-to-t after:from-white after:to-transparent after:pointer-events-none after:z-10"
              )}
            >
              {options.length === 0 ? (
                <div className="px-3 py-8 text-center text-gray-500 text-sm">
                  <div className="mb-2">📭</div>
                  Nenhuma opção disponível
                </div>
              ) : (
                options.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    onTouchStart={(e) => handleTouchStart(e, option.value)}
                    onTouchEnd={(e) => handleTouchEnd(e, option.value)}
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
          </div>
        </>
      )}
    </div>
  );
};

export default MobileSelect;