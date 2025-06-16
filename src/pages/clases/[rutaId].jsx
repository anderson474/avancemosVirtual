// /pages/clases/[rutaId].jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

// ----- Componentes que crearemos a continuación -----
import ClaseSidebar from '@components/dashboard/alumno/claseSidebar';
import VideoPlayer from '@components/dashboard/alumno/videoPlayer';
import InfoTabs from '@components/dashboard/alumno/infoTabs';

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

  useEffect(() => {
    if (!rutaId || !user) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      // 1. Obtener la información de la ruta y sus clases
      // Las políticas RLS se encargarán de la seguridad
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
        .single();
      
      if (fetchError) {
        console.error("Error fetching ruta data:", fetchError);
        setError("No se pudo cargar el contenido. Es posible que no tengas acceso a esta ruta.");
        setIsLoading(false);
        return;
      }
      
      setRutaInfo({ titulo: data.titulo });
      setClases(data.clases || []);
      
      // Establecer la primera clase como activa por defecto
      if (data.clases && data.clases.length > 0) {
        setClaseActiva(data.clases[0]);
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [rutaId, user, supabase]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-gray-100">Cargando clases...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 text-center">
        <p className="text-red-500 font-semibold">{error}</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row bg-gray-100 min-h-screen">
      {/* Botón para volver al Dashboard */}
      <button 
        onClick={() => router.push('/Dashboard/alumno')}
        className="absolute top-4 left-4 z-20 flex items-center px-3 py-2 bg-white rounded-full shadow-md hover:bg-gray-200 transition"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Volver
      </button>

      {/* Sidebar con la lista de clases */}
      <ClaseSidebar
        rutaTitulo={rutaInfo?.titulo}
        clases={clases}
        claseActivaId={claseActiva?.id}
        onSelectClase={setClaseActiva}
      />
      
      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-8">
        {claseActiva ? (
          <div>
            <VideoPlayer videoUrl={claseActiva.video_url} claseTitulo={claseActiva.titulo} />
            <InfoTabs claseId={claseActiva.id} />
          </div>
        ) : (
          <div className="flex justify-center items-center h-full bg-white rounded-lg shadow-md">
            <p className="text-gray-500">Esta ruta aún no tiene clases. ¡Vuelve pronto!</p>
          </div>
        )}
      </main>
    </div>
  );
}