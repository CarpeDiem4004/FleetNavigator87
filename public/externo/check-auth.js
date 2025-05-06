/**
 * Script para verificar autenticação em páginas de postos externos
 * Deve ser incluído em todas as páginas de postos que requerem autenticação
 */
(async function() {
  try {
    // Obter a URL atual para usar como redirecionamento após o login
    const currentPath = window.location.pathname;
    
    // Verificar autenticação
    const response = await fetch(`/postos/check-auth?redirectTo=${encodeURIComponent(currentPath)}`, {
      method: 'GET',
      credentials: 'include' // Importante para incluir cookies de sessão
    });
    
    if (!response.ok) {
      console.error('Erro ao verificar autenticação', response.status);
      window.location.href = '/postos/login?redirect=' + encodeURIComponent(currentPath);
      return;
    }
    
    const data = await response.json();
    
    if (!data.authenticated) {
      console.log('Usuário não autenticado. Redirecionando para login...');
      window.location.href = data.redirectTo;
      return;
    }
    
    console.log('Usuário autenticado:', data.user);
    
    // Se chegarmos aqui, o usuário está autenticado
    // Podemos armazenar os dados do usuário para uso na página
    window.userAuthenticated = true;
    window.userData = data.user;
    
    // Disparar evento personalizado para notificar que a autenticação foi verificada
    document.dispatchEvent(new CustomEvent('auth:verified', { 
      detail: { 
        authenticated: true,
        user: data.user
      }
    }));
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    
    // Em caso de erro, redireciona para a página de login
    const currentPath = window.location.pathname;
    window.location.href = '/postos/login?redirect=' + encodeURIComponent(currentPath);
  }
})();