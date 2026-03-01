import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import {
  Wrench, BarChart4, Building2, Package, FileText, KeyRound,
  Activity, Gauge, Truck, Users, CircleDot, CreditCard, Fuel,
  ShieldAlert, Lock, ChevronRight, AlertCircle, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, any> = {
  Wrench, BarChart4, Building2, Package, FileText, KeyRound,
  Activity, Gauge, Truck, Users, CircleDot, CreditCard, Fuel,
  ShieldAlert
};

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  icon: "text-orange-600",  badge: "bg-orange-100 text-orange-700" },
  yellow:  { bg: "bg-yellow-50",  border: "border-yellow-200",  icon: "text-yellow-600",  badge: "bg-yellow-100 text-yellow-700" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600",   badge: "bg-amber-100 text-amber-700" },
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    icon: "text-blue-600",    badge: "bg-blue-100 text-blue-700" },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  icon: "text-indigo-600",  badge: "bg-indigo-100 text-indigo-700" },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  icon: "text-purple-600",  badge: "bg-purple-100 text-purple-700" },
  red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-600",     badge: "bg-red-100 text-red-700" },
  green:   { bg: "bg-green-50",   border: "border-green-200",   icon: "text-green-600",   badge: "bg-green-100 text-green-700" },
  teal:    { bg: "bg-teal-50",    border: "border-teal-200",    icon: "text-teal-600",    badge: "bg-teal-100 text-teal-700" },
  gray:    { bg: "bg-gray-50",    border: "border-gray-200",    icon: "text-gray-500",    badge: "bg-gray-100 text-gray-600" },
};

const CATEGORY_LABELS: Record<string, string> = {
  manutencao: "Manutenção",
  frota: "Frota",
  outros: "Outros",
};

interface OperatorCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  category: string;
  color: string;
  sort_order: number;
  can_view: boolean;
  can_access: boolean;
}

export default function OperatorDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [cards, setCards] = useState<OperatorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadCards();
    }
  }, [user?.id]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", `/api/operator-card-permissions/${user!.id}`);
      const data = await res.json();
      if (data.success) {
        setCards(data.data.filter((c: OperatorCard) => c.can_view));
      } else {
        setError("Não foi possível carregar os módulos.");
      }
    } catch {
      setError("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (card: OperatorCard) => {
    if (!card.can_access) return;
    navigate(card.href);
  };

  const visibleCards = cards.filter(c => c.can_view);
  const accessibleCount = visibleCards.filter(c => c.can_access).length;

  const groupedCards = visibleCards.reduce<Record<string, OperatorCard[]>>((acc, card) => {
    const cat = card.category || "outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(card);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500">Carregando painel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          Operador de Gestão de Frota — {accessibleCount} de {visibleCards.length} módulos disponíveis
        </p>
      </div>

      {/* Cards por categoria */}
      {Object.entries(groupedCards).map(([category, catCards]) => (
        <div key={category} className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-px bg-gray-300 inline-block" />
            {CATEGORY_LABELS[category] || category}
            <span className="w-6 h-px bg-gray-300 inline-block" />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {catCards.map(card => {
              const colorKey = card.color || "blue";
              const colors = COLOR_MAP[colorKey] || COLOR_MAP.blue;
              const IconComp = ICON_MAP[card.icon] || Wrench;
              const isLocked = !card.can_access;

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className={`
                    relative rounded-xl border-2 p-5 transition-all duration-200 group
                    ${isLocked
                      ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
                      : `${colors.bg} ${colors.border} cursor-pointer hover:shadow-md hover:-translate-y-0.5`
                    }
                  `}
                >
                  {/* Lock overlay */}
                  {isLocked && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${isLocked ? "bg-gray-200" : colors.badge}`}>
                    <IconComp className={`w-5 h-5 ${isLocked ? "text-gray-400" : colors.icon}`} />
                  </div>

                  {/* Content */}
                  <h3 className={`font-semibold text-sm mb-1 ${isLocked ? "text-gray-400" : "text-gray-800"}`}>
                    {card.name}
                  </h3>
                  {card.description && (
                    <p className={`text-xs leading-relaxed mb-3 ${isLocked ? "text-gray-400" : "text-gray-500"}`}>
                      {card.description}
                    </p>
                  )}

                  {/* Footer */}
                  {isLocked ? (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Acesso restrito
                    </span>
                  ) : (
                    <span className={`text-xs font-medium flex items-center gap-1 ${colors.icon} group-hover:gap-2 transition-all`}>
                      Acessar <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {visibleCards.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum módulo disponível para seu perfil.</p>
          <p className="text-xs mt-1">Contate o administrador para liberar acesso.</p>
        </div>
      )}
    </div>
  );
}
