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
        // Se não tem usuário ou não é operador de base, redireciona para login da base
        if (!user || user.role !== 'operador' || user.basename !== baseName) {
          return <Redirect to={baseLoginPath} />;
        }
        
        return <Component />;
      }}
    </Route>
  );
};

export default ProtectedBaseRoute;