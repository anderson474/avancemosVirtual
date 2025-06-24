// ✅ Reestructurando el archivo src/pages/Dashboard/alumno.jsx
import { useRouter } from 'next/router';
import { useAlumnoDashboard } from '@/hooks/useAlumnoDashboard';
import SlidebarAlumno from '@components/dashboard/alumno/slidebarAlumno';
import RutaAprendizajeCard from '@components/dashboard/alumno/rutaAprendizajeCard';
import Header from '@components/dashboard/alumno/header';

export default function AlumnoPage() {
  const router = useRouter();
  const { dashboardData, isLoading, isError } = useAlumnoDashboard();

  const handleLogout = async () => {
    const supabase = (await import('@supabase/auth-helpers-react')).useSupabaseClient();
    await supabase.auth.signOut();
    router.push('/avancemosDigital');
  };

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
