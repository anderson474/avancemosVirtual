// /pages/clases/[rutaId].jsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'; // Para proteger la ruta
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

// Importa tus componentes de UI
import ClaseSidebar from '@components/dashboard/alumno/claseSidebar';
import VideoPlayer from '@components/dashboard/alumno/videoPlayer';
import InfoTabs from '@components/dashboard/alumno/infoTabs';
import ChatIA from '@components/dashboard/alumno/chatIA';

import Lottie from 'lottie-react';
import loading  from "@public/animation/loading.json"

export default function InterfazClasePage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  const { rutaId } = router.query;

  const [rutaInfo, setRutaInfo] = useState(null);
  const [clases, setClases] = useState([]);
  const [claseActiva, setClaseActiva] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clasesVistasIds, setClasesVistasIds] = useState([]);

const handleNextClase = () => {
  const currentIndex = clases.findIndex(c => c.id === claseActiva.id);
  if (currentIndex !== -1 && currentIndex < clases.length - 1) {
    const siguienteClase = clases[currentIndex + 1];
    handleSelectClase(siguienteClase); // Reutilizamos la función que ya guarda el progreso
  } else {
    // Opcional: Mostrar un mensaje de "¡Has completado la ruta!"
    alert('¡Felicidades, has terminado todas las clases de esta ruta!');
    router.push('/Dashboard/alumno');
  }
};

  const handleSelectClase = async (clase) => {
  setClaseActiva(clase);
  
  // Si tenemos un usuario, guardamos esta clase como la última vista para esta ruta
  if (user && rutaId && clase) {
    await supabase
      .from('rutas_alumnos')
      .update({ ultima_clase_vista_id: clase.id })
      .eq('alumno_id', user.id)
      .eq('ruta_id', rutaId);
  }
};

  useEffect(() => {
    // Si no hay rutaId o usuario, no hacer nada.
    if (!rutaId || !user) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const { data: vistasData } = await supabase
        .from('clases_vistas')
        .select('clase_id')
        .eq('alumno_id', user.id);
        
      if (vistasData) {
        setClasesVistasIds(vistasData.map(v => v.clase_id));
      }
      // 1. Obtener la información de la ruta y todas sus clases asociadas.
      // La seguridad se maneja con Políticas de Seguridad (RLS) en Supabase.
      const { data, error: fetchError } = await supabase
        .from('rutas')
        .select(`
          nombre,
          clases (
            id,
            titulo,
            descripcion,
            video_url
          )
        `)
        .eq('id', rutaId)
        .single(); // Esperamos una sola ruta.
      
      if (fetchError) {
        console.error("Error al obtener los datos de la ruta:", fetchError);
        setError("No se pudo cargar el contenido. Es posible que no tengas acceso a esta ruta o que no exista.");
        setIsLoading(false);
        return;
      }
      
      // Ordenar las clases si es necesario (ej. por un campo 'orden' o 'created_at')
      // Aquí asumimos que vienen en el orden correcto desde la BD.
      const sortedClases = data.clases || [];

      setRutaInfo({ titulo: data.nombre });
      setClases(sortedClases);
      
      // Establecer la primera clase como activa por defecto al cargar la página.
      if (sortedClases.length > 0) {
        setClaseActiva(sortedClases[0]);
      } else {
        // Manejar el caso de que una ruta no tenga clases.
        setClaseActiva(null);
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [rutaId, user, supabase]); // Dependencias del efecto.

  // --- Vistas de Carga y Error ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="w-64 h-64 mt-4">
          <Lottie 
            animationData={loading} 
            loop={false} // Puedes ponerlo en false si quieres que se reproduzca una sola vez
          />
        </div>
        <p className="text-gray-600 animate-pulse">Cargando contenido del curso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 text-center p-4">
        <p className="text-red-500 font-semibold text-lg">{error}</p>
        <button 
          onClick={() => router.push('/Dashboard/alumno')} 
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Volver al Panel
        </button>
      </div>
    );
  }

  // --- Layout Principal de la Página ---
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 1. Barra Lateral con la lista de clases */}
      <ClaseSidebar
        rutaTitulo={rutaInfo?.titulo}
        clases={clases}
        claseActivaId={claseActiva?.id}
        onSelectClase={handleSelectClase}
        clasesVistasIds={clasesVistasIds}
      />
      
      {/* 2. Contenedor principal (Header + Main) que ocupa el resto del espacio */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 2a. Header fijo para la navegación y título de la clase */}
        <header className="flex-shrink-0 flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
          <button 
            onClick={() => router.push('/Dashboard/alumno')}
            className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-800 font-medium"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver al Panel
          </button>
          
          {claseActiva && (
            <h1 className="text-xl font-bold text-gray-800 truncate ml-4 hidden md:block">
              {claseActiva.titulo}
            </h1>
          )}
          
          {/* Espacio reservado a la derecha para futuras acciones (ej. botón de completar clase) */}
          <div className="w-40"></div>
          <div className="flex justify-end">
              <button onClick={handleNextClase} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                Siguiente Clase →
              </button>
          </div>
        </header>

        {/* 2b. Área de contenido principal con su propio scroll */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {claseActiva ? (
            // Contenedor que centra el contenido y limita su ancho máximo para mejor legibilidad
            <div className="max-w-5xl mx-auto">
              {/* Contenedor del video con aspect-ratio para tamaño consistente */}
              <div className="w-full aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden shadow-xl mb-8">
                <VideoPlayer 
                  videoUrl={claseActiva.video_url}
                  claseId={claseActiva.id} 
                  userId={user.id}
                  onVideoEnded={handleNextClase}          
                />
              </div>
              {/*Aqui esta el chat de IA */}
              <div className="mt-8">
                <ChatIA claseId={claseActiva.id} />
              </div>
              {/* Pestañas de información (descripción, recursos, comentarios) */}
              <InfoTabs claseId={claseActiva.id} />
            </div>
          ) : (
            // Mensaje que se muestra si la ruta no tiene clases
            <div className="flex flex-col justify-center items-center h-full text-center bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800">¡Ruta en construcción!</h2>
              <p className="text-gray-500 mt-2 max-w-md">Esta ruta de aprendizaje aún no tiene clases disponibles. ¡Vuelve pronto para comenzar tu aventura de conocimiento!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- Protección de la Ruta en el Servidor ---
// Esto se ejecuta antes de que la página se renderice.
export const getServerSideProps = async (ctx) => {
  const supabase = createPagesServerClient(ctx);
  
  const { data: { session } } = await supabase.auth.getSession();

  // Si no hay sesión, redirigir al usuario a la página de login.
  if (!session) {
    return {
      redirect: {
        destination: '/avancemosDigital', // Asegúrate que esta es tu página de login
        permanent: false,
      },
    };
  }

  // Si hay sesión, permitir que la página se renderice.
  return {
    props: {
      initialSession: session,
    },
  };
};