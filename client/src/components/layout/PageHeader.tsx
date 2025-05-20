import React, { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import SafeLink from '@/components/SafeLink';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  backLink?: string;
  backLabel?: string;
}

/**
 * Componente de cabeçalho de página padronizado
 * Exibe o título, descrição opcional, ícone e ações (botões, etc)
 */
const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  icon, 
  actions,
  backLink,
  backLabel
}) => {
  return (
    <div className="flex flex-col">
      {backLink && (
        <div className="mb-2">
          <SafeLink to={backLink}>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ArrowLeft size={16} />
              {backLabel || 'Voltar'}
            </Button>
          </SafeLink>
        </div>
      )}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <Separator className="my-4" />
    </div>
  );
};

export default PageHeader;