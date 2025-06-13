// src/pages/Dashboard/alumno.jsx
import { useRouter } from 'next/router';
import { createClient } from '@utils/supabase/client'; // Asegúrate que la ruta sea correcta

// Importa los componentes que acabamos de crear
import SlidebarAlumno from '@components/dashboard/alumno/slidebarAlumno';
import RutaAprendizajeCard from '@components/dashboard/alumno/rutaAprendizajeCard';
import Bienvenida from '@components/dashboard/bienvenida'; // Reutilizamos este

export default function AlumnoPage() {
  const router = useRouter();
  const supabase = createClient();

  // --- DATOS DE PRUEBA (Esto vendrá de Supabase más adelante) ---
  const alumno = {
    nombre: 'Carlos Rodríguez',
  };

  const rutasAsignadas = [
    {
      id: 1,
      titulo: 'Inglés para Principiantes - A1',
      descripcion: 'Domina los fundamentos del inglés, desde saludos hasta conversaciones básicas.',
      progreso: 75,
    },
    {
      id: 2,
      titulo: 'Excel para Negocios',
      descripcion: 'Aprende a manejar hojas de cálculo, tablas dinámicas y fórmulas esenciales.',
      progreso: 20,
    },
    {
      id: 3,
      titulo: 'Comunicación Efectiva en el Trabajo',
      descripcion: 'Desarrolla habilidades para presentar tus ideas de forma clara y persuasiva.',
      progreso: 0,
    },
  ];
  // --- FIN DE LOS DATOS DE PRUEBA ---

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/avancemosDigital');
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <SlidebarAlumno nombreUsuario={alumno.nombre} onLogout={handleLogout} />
      
      <main className="flex-1 p-8">
        {/* Usamos el componente de bienvenida que ya tenías */}
        <Bienvenida nombre={alumno.nombre} />

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Rutas de Aprendizaje</h2>
          
          {rutasAsignadas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Mapeamos los datos de prueba para crear una tarjeta por cada ruta */}
              {rutasAsignadas.map((ruta) => (
                <RutaAprendizajeCard key={ruta.id} ruta={ruta} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">Aún no tienes rutas de aprendizaje asignadas.</p>
              <p className="text-sm text-gray-400 mt-2">Por favor, contacta a un administrador para que te asigne contenido.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}