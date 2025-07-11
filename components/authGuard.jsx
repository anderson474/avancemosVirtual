// src/components/AuthGuard.jsx
import { useSessionContext } from '@supabase/auth-helpers-react'; // <-- Cambio clave 1: Importar el hook correcto
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const AuthGuard = ({ children }) => {
  // <-- Cambio clave 2: Usar useSessionContext para obtener el estado de carga y la sesión
  const { isLoading, session } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    // Solo ejecutamos la lógica de redirección CUANDO la carga haya terminado.
    if (!isLoading) {
      // Si la carga terminó y NO hay sesión, entonces sí redirigimos.
      if (!session) {
        router.push('/avancemosDigital');
      }
    }
    // La dependencia ahora es `isLoading` y `session`.
  }, [isLoading, session, router]);

  // <-- Cambio clave 3: Lógica de renderizado más robusta

  // 1. Si está cargando, SIEMPRE mostramos el loader.
  // Esto previene cualquier parpadeo o redirección prematura.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 animate-pulse">Verificando sesión...</p>
      </div>
    );
  }

  // 2. Si la carga terminó y HAY una sesión, mostramos el contenido protegido.
  if (session) {
    return <>{children}</>;
  }

  // 3. Si la carga terminó y NO hay sesión, no mostramos nada (o el loader)
  // porque el useEffect ya se está encargando de la redirección.
  // Devolver el loader aquí evita un "flash" de pantalla en blanco.
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 animate-pulse">Redirigiendo...</p>
    </div>
  );
};

export default AuthGuard;