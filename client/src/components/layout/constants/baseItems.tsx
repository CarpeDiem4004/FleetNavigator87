import { CreditCard, CircleDot, FileText, Warehouse, Wrench } from 'lucide-react';
import { NavItem } from '../Sidebar';

export const baseItems: NavItem[] = [
  { name: 'Todas as Bases', href: '/bases', icon: Warehouse },
  { name: 'Base Campinas', href: '/bases/campinas', icon: Warehouse },
  { name: 'Despesas Campinas', href: '/bases/campinas/despesas', icon: CreditCard },
  { name: 'Solicitação de Pneus', href: '/bases/campinas/solicitacao-pneus', icon: CircleDot },
  { name: 'Solicitação de Orçamento', href: '/bases/campinas/solicitacao-orcamento', icon: FileText },
  { name: 'Manutenção de Frota', href: '/bases/campinas/manutencao-frota', icon: Wrench },
];