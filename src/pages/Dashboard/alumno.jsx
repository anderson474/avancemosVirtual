// src/pages/Dashboard/alumno.jsx
import { useRouter } from 'next/router';
import { useAlumnoDashboard } from '@/hooks/useAlumnoDashboard';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import SlidebarAlumno from '@components/dashboard/alumno/slidebarAlumno';
import RutaAprendizajeCard from '@components/dashboard/alumno/rutaAprendizajeCard';
import Header from '@components/dashboard/alumno/header';
import AuthGuard from '@components/authGuard'; // <-- 1. Importa el guardián

// La lógica principal del dashboard ahora puede asumir que el usuario SIEMPRE existe.
function AlumnoDashboard() {
  const router = useRouter();
  // El hook ahora se llamará sabiendo que hay un usuario.
  const { dashboardData, isLoading, isError } = useAlumnoDashboard();
  const supabase = useSupabaseClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // La redirección después del logout ahora es manejada por el AuthGuard,
    // pero es bueno tenerla aquí también por si acaso.
    router.push('/avancemosDigital');
  };
  
  // Este estado de carga ahora es más fiable.
  // Se mostrará solo DESPUÉS de que AuthGuard confirme el usuario.
  if (isLoading || !dashboardData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 animate-pulse">Cargando tu dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-red-600">Hubo un error al cargar tus datos. Intenta de nuevo.</p>
      </div>
    );
  }
  
  const { nombreAlumno, avatarUrl, rutasAsignadas } = dashboardData;

  // ... (el resto de tu JSX es idéntico)
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <SlidebarAlumno nombreUsuario={nombreAlumno} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <Header nombreUsuario={nombreAlumno} avatarUrl={avatarUrl} onLogout={handleLogout} />
        <main className="flex-1 px-6 py-8 bg-gray-50">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Mis Rutas de Aprendizaje</h2>
          {rutasAsignadas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rutasAsignadas.map((ruta) => (
                <RutaAprendizajeCard key={ruta.id} ruta={ruta} />
              ))}
            </div>
          ) : (
             <div className="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700">¡Bienvenido!</h3>
              <p className="text-gray-500 mt-2">Aún no tienes rutas de aprendizaje asignadas.</p>
              <p className="text-sm text-gray-400 mt-2">Por favor, contacta a un administrador para que te asigne tu primer curso.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// 2. Envuelve tu componente exportado con el AuthGuard
export default function AlumnoPage() {
  return (
    <AuthGuard>
      <AlumnoDashboard />
    </AuthGuard>
  );
}