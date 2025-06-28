// src/components/AuthGuard.jsx
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Este es un componente de orden superior que protege las rutas.
const AuthGuard = ({ children }) => {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    // Si no hay usuario y la ruta no es la de login, redirigir.
    // Usamos `user === null` para asegurarnos de que la comprobación ha terminado.
    // `user` es `undefined` mientras se está cargando.
    if (user === null) {
      // Puedes especificar la ruta de tu página de login.
      // Usando la de tu log de error: /avancemosDigital
      router.push('/avancemosDigital'); 
    }
  }, [user, router]);

  // Si el usuario existe, muestra el contenido de la página.
  if (user) {
    return <>{children}</>;
  }

  // Mientras se verifica el usuario (user es undefined), muestra un loader global.
  // Esto evita el parpadeo y que se muestre la página por un segundo.
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <p className="text-gray-600 animate-pulse">Verificando sesión...</p>
    </div>
  );
};

export default AuthGuard;