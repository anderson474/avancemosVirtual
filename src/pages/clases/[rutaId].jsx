// /pages/clases/[rutaId].jsx

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import useSWR from "swr";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import ClaseSidebar from "@components/dashboard/alumno/claseSidebar";
import VideoPlayer from "@components/dashboard/alumno/videoPlayer";
import InfoTabs from "@components/dashboard/alumno/infoTabs";
import ChatIA from "@components/dashboard/alumno/chatIA";

import Lottie from "lottie-react";
import loading from "@public/animation/loading.json";

// --- FUNCIÓN FETCHER PARA SWR (Ligeramente modificada para robustez) ---
const fetcher = async ([supabase, user, rutaId]) => {
  const [vistasResult, rutaResult, progresoResult] = await Promise.all([
    supabase.from("clases_vistas").select("clase_id").eq("alumno_id", user.id),

    // CAMBIO: Usamos maybeSingle() para evitar que la app crashee si la ruta no existe.
    supabase
      .from("rutas")
      .select("nombre, clases(id, titulo, descripcion, video_url)")
      .eq("id", rutaId)
      .maybeSingle(),

    supabase
      .from("rutas_alumnos")
      .select("ultima_clase_vista_id")
      .eq("alumno_id", user.id)
      .eq("ruta_id", rutaId)
      .maybeSingle(),
  ]);

  const { data: vistasData } = vistasResult;
  const { data: rutaData, error: rutaError } = rutaResult;
  const { data: progresoData } = progresoResult;

  // CAMBIO: Ahora también comprobamos si la ruta existe.
  if (rutaError || !rutaData) {
    throw new Error(
      "No se pudo cargar el contenido. Es posible que no tengas acceso o la ruta no exista."
    );
  }

  const clasesVistasIds = vistasData ? vistasData.map((v) => v.clase_id) : [];
  const ultimaClaseId = progresoData
    ? progresoData.ultima_clase_vista_id
    : null;

  // Devolvemos el nombre de la ruta bajo `rutaData.nombre` para que coincida con la consulta
  return {
    rutaInfo: { titulo: rutaData.nombre },
    clases: rutaData.clases || [],
    clasesVistasIds,
    ultimaClaseId,
  };
};

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function InterfazClasePage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  // CAMBIO: Leemos el `rutaId` y el nuevo parámetro `clase` de la URL.
  const { rutaId, clase: claseIdFromQuery } = router.query;

  const key = rutaId && user && supabase ? [supabase, user, rutaId] : null;
  const { data, error, isLoading } = useSWR(key, fetcher);

  const [claseActiva, setClaseActiva] = useState(null);

  // ======================================================================
  // ESTE EFECTO AHORA LEE EL PARÁMETRO DE LA URL
  // ======================================================================
  useEffect(() => {
    // Salimos si los datos no están listos o si el router aún no tiene los query params.
    if (!data || !router.isReady) return;

    const clasesDisponibles = data.clases;
    if (clasesDisponibles.length === 0) return;

    let claseASeleccionar = null;

    // Prioridad 1: Si la URL especifica una clase (`?clase=ID`), la buscamos.
    if (claseIdFromQuery) {
      claseASeleccionar = clasesDisponibles.find(
        (clase) => clase.id.toString() === claseIdFromQuery
      );
    }

    // Prioridad 2: Si no hay clase en la URL, buscamos la última vista en la ruta.
    if (!claseASeleccionar && data.ultimaClaseId) {
      claseASeleccionar = clasesDisponibles.find(
        (clase) => clase.id === data.ultimaClaseId
      );
    }

    // Prioridad 3: Como último recurso, usamos la primera clase de la lista.
    if (!claseASeleccionar) {
      claseASeleccionar = clasesDisponibles[0];
    }

    // Si la clase a seleccionar es la misma que ya está activa, no hacemos nada.
    if (claseActiva?.id === claseASeleccionar?.id) return;

    setClaseActiva(claseASeleccionar);
  }, [
    data,
    router.isReady,
    claseIdFromQuery,
    claseActiva,
    data?.ultimaClaseId,
  ]);

  // --- MANEJADORES DE EVENTOS ---
  const handleSelectClase = async (clase) => {
    // CAMBIO: Actualizamos la URL para que refleje la clase seleccionada.
    // Esto es crucial para que los refrescos de página y el historial del navegador funcionen.
    // `shallow: true` evita que la página se recargue por completo.
    router.push(`/clases/${rutaId}?clase=${clase.id}`, undefined, {
      shallow: true,
    });

    // El useEffect se encargará de actualizar el estado, pero lo hacemos aquí también
    // para una respuesta visual instantánea.
    setClaseActiva(clase);

    // Esta parte de guardar el progreso no cambia.
    if (user && rutaId && clase) {
      await supabase
        .from("rutas_alumnos")
        .update({ ultima_clase_vista_id: clase.id })
        .eq("alumno_id", user.id)
        .eq("ruta_id", rutaId);
    }
  };

  const handleNextClase = () => {
    if (!data || !data.clases) return;
    const currentIndex = data.clases.findIndex((c) => c.id === claseActiva.id);
    if (currentIndex !== -1 && currentIndex < data.clases.length - 1) {
      const siguienteClase = data.clases[currentIndex + 1];
      handleSelectClase(siguienteClase);
    } else {
      alert("¡Felicidades, has terminado todas las clases de esta ruta!");
      router.push("/Dashboard/alumno");
    }
  };

  // --- RENDERIZADO CONDICIONAL: CARGA Y ERROR (SIN CAMBIOS) ---
  if (isLoading || !router.isReady) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="w-64 h-64 mt-4">
          <Lottie animationData={loading} loop={true} />
        </div>
        <p className="text-gray-600 animate-pulse">
          Cargando contenido del curso...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 text-center p-4">
        <p className="text-red-500 font-semibold text-lg">{error.message}</p>
        <button
          onClick={() => router.push("/Dashboard/alumno")}
          className="mt-6 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Volver al Panel
        </button>
      </div>
    );
  }

  // --- RENDERIZADO PRINCIPAL (SIN CAMBIOS) ---
  return (
    <div className="flex h-screen bg-gray-100">
      <ClaseSidebar
        rutaTitulo={data?.rutaInfo?.titulo}
        clases={data?.clases || []}
        claseActivaId={claseActiva?.id}
        onSelectClase={handleSelectClase}
        clasesVistasIds={data?.clasesVistasIds || []}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => router.push("/Dashboard/alumno")}
            className="flex items-center px-4 py-2 bg-gray-100 cursor-pointer rounded-lg hover:bg-gray-200 transition text-gray-800 font-medium"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver al Panel
          </button>
          {claseActiva && (
            <h1 className="text-xl font-bold text-gray-800 truncate ml-4 hidden md:block">
              {claseActiva.titulo}
            </h1>
          )}
          <div className="w-40 hidden md:block"></div>
          <div className="flex justify-end">
            <button
              onClick={handleNextClase}
              className="px-6 py-3 cursor-pointer bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Siguiente Clase →
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {claseActiva ? (
            <div className="max-w-5xl mx-auto">
              <div className="w-full aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden shadow-xl mb-8">
                {/* CAMBIO: Añadimos la key para forzar el re-montaje del video player */}
                <VideoPlayer
                  key={claseActiva.id}
                  videoUrl={claseActiva.video_url}
                  claseId={claseActiva.id}
                  userId={user.id}
                  onVideoEnded={handleNextClase}
                />
              </div>
              <div className="mt-8">
                <ChatIA claseId={claseActiva.id} />
              </div>
              <InfoTabs claseId={claseActiva.id} />
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-center bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800">
                ¡Ruta en construcción!
              </h2>
              <p className="text-gray-500 mt-2 max-w-md">
                Esta ruta de aprendizaje aún no tiene clases disponibles.
                ¡Vuelve pronto!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- PROTECCIÓN DE LA RUTA EN EL SERVIDOR (SIN CAMBIOS) ---
export const getServerSideProps = async (ctx) => {
  const supabase = createPagesServerClient(ctx);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/avancemosDigital",
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialSession: session,
    },
  };
};
