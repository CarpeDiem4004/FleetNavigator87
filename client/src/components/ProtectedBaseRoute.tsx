import { Route, Redirect } from 'wouter';
import { useAuth } from '../context/AuthContext';

const ProtectedBaseRoute = ({ path, component: Component, baseLoginPath, baseName }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Route path={path}>
      {() => {
        // Se não tem usuário, redireciona para login da base
        if (!user) {
          return <Redirect to={baseLoginPath} />;
        }
        
        // Se é admin, permite acesso a qualquer base
        if (user.role === 'admin') {
          return <Component />;
        }
        
        // Se é operador, verifica se é da base específica
        if (user.role === 'operador' && user.basename === baseName) {
          return <Component />;
        }
        
        // Se não atende os critérios, redireciona para login da base
        return <Redirect to={baseLoginPath} />;
      }}
    </Route>
  );
};

export default ProtectedBaseRoute;