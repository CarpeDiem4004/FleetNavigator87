/**
 * Utilitários para fixação automática do nome do operador
 * Sistema de fixação de nomes baseado no usuário logado
 */

export interface User {
  name?: string;
  email?: string;
  role?: string;
}

/**
 * Fixa o nome do operador baseado nos dados do usuário logado
 * Sistema de prioridades para garantir que o nome correto seja usado
 */
export const fixOperatorName = async (
  postId: string, 
  user?: User,
  setFieldValue?: (field: string, value: string) => void
): Promise<string> => {
  console.log(`[OPERADOR-FIXACAO-UTIL] Verificando usuário para posto ${postId}:`, user);
  
  let operatorName = "";
  
  // Prioridade 1: Nome do usuário logado no sistema principal
  if (user?.name && user.name !== "Administrador" && user.name.trim() !== "") {
    operatorName = user.name;
    console.log(`[OPERADOR-FIXACAO-UTIL] Usando nome do usuário autenticado: ${operatorName}`);
  }
  // Prioridade 2: Nome salvo no localStorage (de login anterior)
  else if (localStorage.getItem('fixed_operator_name')) {
    operatorName = localStorage.getItem('fixed_operator_name') || "";
    console.log(`[OPERADOR-FIXACAO-UTIL] Usando nome fixado anterior: ${operatorName}`);
  }
  // Prioridade 3: Nome armazenado no localStorage após login do posto
  else if (localStorage.getItem('user_name')) {
    operatorName = localStorage.getItem('user_name') || "";
    console.log(`[OPERADOR-FIXACAO-UTIL] Usando nome do localStorage: ${operatorName}`);
  }
  // Prioridade 4: Email do usuário (extrair nome antes do @)
  else if (user?.email) {
    const emailName = user.email.split('@')[0];
    operatorName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    console.log(`[OPERADOR-FIXACAO-UTIL] Usando nome baseado no email: ${operatorName}`);
  }
  // Prioridade 5: Tentar API do usuário
  else {
    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.name && userData.name !== "Administrador") {
          operatorName = userData.name;
          console.log(`[OPERADOR-FIXACAO-UTIL] Usando nome da API: ${operatorName}`);
        }
      }
    } catch (error) {
      console.warn('[OPERADOR-FIXACAO-UTIL] Erro ao carregar da API:', error);
    }
  }
  
  // Prioridade 6: Nome padrão baseado no posto (fallback final)
  if (!operatorName) {
    const defaultOperators: Record<string, string> = {
      'osasco_v2': 'Operador Osasco',
      'alair_v2': 'Operador Alair',
      'campinas_v2': 'Operador Campinas',
      'abc_v2': 'Operador ABC',
      'socorro_v2': 'Operador Socorro',
      'sorocaba_v2': 'Operador Sorocaba',
      'guarulhos_v2': 'Operador Guarulhos'
    };
    
    operatorName = defaultOperators[postId] || "Operador";
    console.log(`[OPERADOR-FIXACAO-UTIL] Usando nome padrão do posto: ${operatorName}`);
  }
  
  // Salvar nome fixado para persistência
  if (operatorName) {
    localStorage.setItem('fixed_operator_name', operatorName);
    localStorage.setItem(`operator_${postId}`, operatorName);
    
    // Se uma função de set foi fornecida, usar para definir o valor no formulário
    if (setFieldValue) {
      setFieldValue("operador", operatorName);
    }
    
    console.log(`[OPERADOR-FIXACAO-UTIL] Nome fixado com sucesso: ${operatorName}`);
  }
  
  return operatorName;
};

/**
 * Obtém o nome fixado do operador do localStorage
 */
export const getFixedOperatorName = (postId?: string): string => {
  const fixedName = localStorage.getItem('fixed_operator_name');
  const postSpecificName = postId ? localStorage.getItem(`operator_${postId}`) : null;
  
  return postSpecificName || fixedName || "";
};

/**
 * Limpa os dados do operador fixado
 */
export const clearFixedOperatorName = (postId?: string): void => {
  localStorage.removeItem('fixed_operator_name');
  
  if (postId) {
    localStorage.removeItem(`operator_${postId}`);
  }
  
  console.log('[OPERADOR-FIXACAO-UTIL] Dados do operador fixado limpos');
};