// src/pages/Dashboard/alumno.jsx
import { useRouter } from "next/router";
import { useAlumnoDashboard } from "@/hooks/useAlumnoDashboard";
import {
  useSessionContext,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import SlidebarAlumno from "@components/dashboard/alumno/slidebarAlumno";
import RutaAprendizajeCard from "@components/dashboard/alumno/rutaAprendizajeCard";
import Header from "@components/dashboard/alumno/header";

function AlumnoDashboard() {
  console.log("🖥️ [AlumnoDashboard] Componente renderizándose...");

  const router = useRouter();

  const { isLoading: isSessionLoading } = useSessionContext();
  const {
    dashboardData,
    isLoading: isDashboardDataLoading,
    isError,
  } = useAlumnoDashboard();

  // Log de estados en cada render
  console.log("  - Estado de sesión:", { isSessionLoading });
  console.log("  - Estado de datos:", { isDashboardDataLoading });
  console.log("  - Datos recibidos:", dashboardData); // Log para ver si los datos llegan

  const supabase = useSupabaseClient();

  const handleLogout = async () => {
    console.log("🖥️ [AlumnoDashboard] Ejecutando handleLogout...");
    await supabase.auth.signOut();
    router.push("/avancemosDigital");
  };

  const isLoading = isSessionLoading || isDashboardDataLoading;
  console.log(
    "  - ¿Está cargando en total? (isSessionLoading || isDashboardDataLoading):",
    isLoading
  );

  if (isLoading) {
    console.log("  ➡️ Mostrando pantalla de CARGA (isLoading es true)");
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 animate-pulse">Cargando tu dashboard...</p>
      </div>
    );
  }

  // Si ya no está cargando, pero no hay datos, algo raro pasó.
  if (!dashboardData) {
    console.log(
      "  ➡️ Mostrando pantalla de CARGA (isLoading es false, pero !dashboardData es true)"
    );
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600">
          Verificando sesión... (No hay datos después de cargar)
        </p>
      </div>
    );
  }

  if (isError) {
    console.error("  ➡️ Mostrando pantalla de ERROR", isError);
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-red-600">
          Hubo un error al cargar tus datos. Intenta de nuevo.
        </p>
      </div>
    );
  }

  console.log("  ✅ Mostrando DASHBOARD COMPLETO");
  const { nombreAlumno, avatarUrl, rutasAsignadas } = dashboardData;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <SlidebarAlumno nombreUsuario={nombreAlumno} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <Header
          nombreUsuario={nombreAlumno}
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
        />
        <main className="flex-1 px-6 py-8 bg-gray-50">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Mis Rutas de Aprendizaje
          </h2>
          {rutasAsignadas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rutasAsignadas.map((ruta) => (
                <RutaAprendizajeCard key={ruta.id} ruta={ruta} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700">
                ¡Bienvenido!
              </h3>
              <p className="text-gray-500 mt-2">
                Aún no tienes rutas de aprendizaje asignadas.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Por favor, contacta a un administrador para que te asigne tu
                primer curso.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AlumnoPage() {
  return <AlumnoDashboard />;
}

// Logs en el guardián del lado del servidor
export const getServerSideProps = async (ctx) => {
  console.log("📄 [getServerSideProps] Iniciando en el servidor...");
  const supabase = createServerSupabaseClient(ctx);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.log("  - No se encontró sesión. Redirigiendo a /avancemosDigital");
    return {
      redirect: {
        destination: "/avancemosDigital", // Asegúrate que esta es tu página de login
        permanent: false,
      },
    };
  }

  console.log("  - Sesión encontrada para el usuario:", session.user.id);
  return {
    props: {
      initialSession: session,
    },
  };
};
