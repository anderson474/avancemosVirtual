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
    // Solo ejecutamos la carga de datos si tenemos un usuario
    if (user) {
      const fetchAlumnoData = async () => {
        setIsLoading(true);

        // 1. Obtener el perfil del alumno (para el nombre)
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('nombre,username, avatar_url')
          .eq('id', user.id)
          .single();

        if (perfilError) {
          console.error('Error fetching perfil:', perfilError);
          // Si no hay perfil, usamos el email como fallback
          setNombreAlumno(user.email);
        } else {
          setNombreAlumno(perfil.username || perfil.nombre);

          // --- LÓGICA PARA CONSTRUIR LA URL DEL AVATAR ---
          if (perfil.avatar_url) {
            const { data: publicURLData } = supabase.storage
              .from('avatars')
              .getPublicUrl(perfil.avatar_url);
            setAvatarUrl(publicURLData.publicUrl);
          } else {
            // Si no hay avatar, usamos la imagen por defecto
            setAvatarUrl('/default-avatar.png'); // Asegúrate que este archivo exista en /public
          }
        }

        // 2. Obtener las rutas asignadas al alumno
        // Hacemos un JOIN implícito para obtener datos de la tabla 'rutas'
        // y el 'progreso' de la tabla 'rutas_alumnos'
        const { data: rutas, error: rutasError } = await supabase
          .from('rutas_alumnos')
          .select(`
            progreso,
            rutas (
              id,
              nombre,
              descripcion
            )
          `)
          .eq('alumno_id', user.id);

        if (rutasError) {
          console.error('Error fetching rutas asignadas:', rutasError);
        } else {
          // Transformamos los datos para que coincidan con la estructura que espera el componente Card
          const formattedRutas = rutas.map(item => ({
            id: item.rutas.id,
            titulo: item.rutas.nombre,
            descripcion: item.rutas.descripcion,
            progreso: item.progreso,
          }));
          setRutasAsignadas(formattedRutas);
        }

        setIsLoading(false);
      };

      fetchAlumnoData();
    }
  }, [user, supabase]); // El efecto se re-ejecuta si el usuario o supabase cambian

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