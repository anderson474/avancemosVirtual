// src/pages/Dashboard/alumno.jsx
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useState, useEffect } from 'react';

// Importa los componentes
import SlidebarAlumno from '@components/dashboard/alumno/slidebarAlumno';
import RutaAprendizajeCard from '@components/dashboard/alumno/rutaAprendizajeCard';
import Header from '@components/dashboard/alumno/header';

export default function AlumnoPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser(); // Obtenemos el usuario de la sesión

  // --- ESTADOS PARA MANEJAR DATOS REALES ---
  const [nombreAlumno, setNombreAlumno] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); 
  const [rutasAsignadas, setRutasAsignadas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchAlumnoData = async () => {
        setIsLoading(true);

        // 1. Obtener el perfil del alumno (nombre y avatar)
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('nombre, username, avatar_url')
          .eq('id', user.id)
          .single();

        if (perfil) {
          setNombreAlumno(perfil.username || perfil.nombre);
          if (perfil.avatar_url) {
            const { data: publicURLData } = supabase.storage.from('avatars').getPublicUrl(perfil.avatar_url);
            setAvatarUrl(publicURLData.publicUrl);
          } else {
            setAvatarUrl('/default-avatar.png');
          }
        } else {
          console.error('Error fetching perfil:', perfilError);
          setNombreAlumno(user.email);
        }

        // 2. Obtener las rutas asignadas al alumno (sin el campo 'progreso')
        const { data: rutasData, error: rutasError } = await supabase
          .from('rutas_alumnos')
          .select(`
            ultima_clase_vista_id,
            rutas (
              id,
              nombre,
              descripcion
            )
          `)
          .eq('alumno_id', user.id);

        if (rutasError) {
          console.error('Error fetching rutas asignadas:', rutasError);
          setRutasAsignadas([]);
        } else {
          // Extraemos solo la información de las rutas
          const rutas = rutasData.map(item => item.rutas);
          
          // 3. Calcular el progreso para CADA ruta usando nuestra función de BD
          // Usamos Promise.all para hacer todas las llamadas en paralelo, ¡es muy eficiente!
          const progressPromises = rutas.map(ruta => 
            supabase.rpc('calcular_progreso_ruta', {
              p_alumno_id: user.id,
              p_ruta_id: ruta.id
            })
          );

          const progressResults = await Promise.all(progressPromises);

          // 4. Combinar los datos de las rutas con su progreso calculado
          const formattedRutas = rutas.map((ruta, index) => {
            const progressData = progressResults[index];
            if (progressData.error) {
              console.error(`Error al calcular progreso para la ruta ${ruta.id}:`, progressData.error);
            }
            return {
              id: ruta.id,
              titulo: ruta.nombre,
              descripcion: ruta.descripcion,
              // Usamos el progreso calculado o 0 si hubo un error.
              // Math.round para redondear a un número entero.
              progreso: progressData.data ? Math.round(progressData.data) : 0,
              ultimaClaseId: ruta.ultima_clase_vista_id,
            };
          });
          
          setRutasAsignadas(formattedRutas);
        }

        setIsLoading(false);
      };

      fetchAlumnoData();
    }
  }, [user, supabase]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/avancemosDigital');
  };

  // --- VISTA DE CARGA ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600">Cargando tu dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Usamos el nombre del alumno cargado desde la base de datos */}
      <SlidebarAlumno nombreUsuario={nombreAlumno} onLogout={handleLogout} />
      

      {/* 2. Contenedor principal para el Header y el Main Content */}
      <div className="flex-1 flex flex-col">
        {/* 2a. El nuevo Header en la parte superior */}
        <Header 
          nombreUsuario={nombreAlumno} 
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
        />
      
      <main className="flex-1 p-8">
        

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Rutas de Aprendizaje</h2>
          
          {rutasAsignadas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rutasAsignadas.map((ruta) => (
                <RutaAprendizajeCard key={ruta.id} ruta={ruta} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700">¡Bienvenido!</h3>
              <p className="text-gray-500 mt-2">Aún no tienes rutas de aprendizaje asignadas.</p>
              <p className="text-sm text-gray-400 mt-2">Por favor, contacta a un administrador para que te asigne tu primer curso.</p>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}