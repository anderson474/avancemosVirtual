import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import useSWR from "swr";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import MuxPlayer from "@mux/mux-player-react";
import Lottie from "lottie-react";
import loading from "@public/animation/loading.json";

import ClaseSidebar from "@components/dashboard/alumno/claseSidebar";
import InfoTabs from "@components/dashboard/alumno/infoTabs";
import ChatIA from "@components/dashboard/alumno/chatIA";

// --- FUNCIÓN FETCHER CON LOGS ---
const fetcher = async ([supabase, user, rutaId]) => {
  console.groupCollapsed(" SWR Fetcher Executing ");
  console.log(`Fetching data for rutaId: ${rutaId} and user: ${user.id}`);
  try {
    const [vistasResult, rutaResult, progresoResult] = await Promise.all([
      supabase
        .from("clases_vistas")
        .select("clase_id, ultimo_tiempo_visto")
        .eq("alumno_id", user.id),
      supabase
        .from("rutas")
        .select("nombre, clases(id, titulo, descripcion, mux_playback_id)")
        .eq("id", rutaId)
        .maybeSingle(),
      supabase
        .from("rutas_alumnos")
        .select("ultima_clase_vista_id")
        .eq("alumno_id", user.id)
        .eq("ruta_id", rutaId)
        .maybeSingle(),
    ]);

    console.log("  - Supabase responses received:", {
      vistasResult,
      rutaResult,
      progresoResult,
    });

    const { data: rutaData, error: rutaError } = rutaResult;
    if (rutaError || !rutaData) {
      console.error("  - ERROR: Ruta not found or access denied.", rutaError);
      throw new Error(
        "No se pudo cargar el contenido. Es posible que no tengas acceso o la ruta no exista."
      );
    }

    const progresoMap = new Map(
      vistasResult.data?.map((v) => [v.clase_id, v.ultimo_tiempo_visto])
    );

    const finalData = {
      rutaInfo: { titulo: rutaData.nombre },
      clases: rutaData.clases || [],
      progresoMap,
      ultimaClaseId: progresoResult.data?.ultima_clase_vista_id,
    };

    console.log("  - Fetcher returning data:", finalData);
    console.groupEnd();
    return finalData;
  } catch (error) {
    console.error("  - FATAL ERROR inside fetcher:", error);
    console.groupEnd();
    throw error;
  }
};

// --- COMPONENTE PRINCIPAL CON LOGS ---
export default function InterfazClasePage() {
  console.group(` Render Cycle - Timestamp: ${Date.now()} `);

  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  const {
    rutaId,
    clase: claseIdFromQuery,
    start: startTimeFromQuery,
  } = router.query;
  const [claseActiva, setClaseActiva] = useState(null);

  console.log("1. Initial state:", {
    isRouterReady: router.isReady,
    rutaId: rutaId,
    userExists: !!user,
    claseActivaId: claseActiva?.id,
  });

  const key = rutaId && user ? [supabase, user, rutaId] : null;
  console.log("2. SWR Key:", key ? `[${key[2]}]` : "null (SWR will not fetch)");

  const { data, error, isLoading } = useSWR(key, fetcher);
  console.log("3. SWR State:", {
    isLoading,
    hasData: !!data,
    hasError: !!error,
  });

  // Efecto para determinar qué clase mostrar
  useEffect(() => {
    console.groupCollapsed(" useEffect - Selecting Active Class ");
    console.log("  - Dependencies:", {
      hasData: !!data,
      isRouterReady: router.isReady,
      claseIdFromQuery,
    });

    if (!data || !router.isReady) {
      console.log("  - Exit Condition: Data or router not ready. Aborting.");
      console.groupEnd();
      return;
    }

    const clasesDisponibles = data.clases;
    console.log(`  - Found ${clasesDisponibles.length} available classes.`);
    if (clasesDisponibles.length === 0) {
      console.log("  - No classes available. Aborting.");
      setClaseActiva(null); // Asegurarse de limpiar la clase activa si no hay clases
      console.groupEnd();
      return;
    }

    let claseASeleccionar = null;
    console.log("  - Priority 1: Checking for class in URL query...");
    if (claseIdFromQuery) {
      claseASeleccionar = clasesDisponibles.find(
        (c) => c.id.toString() === claseIdFromQuery
      );
      console.log(
        claseASeleccionar
          ? `    - Found class from query: ${claseASeleccionar.titulo}`
          : "    - No match found for query."
      );
    }

    if (!claseASeleccionar) {
      console.log("  - Priority 2: Checking for last viewed class...");
      if (data.ultimaClaseId) {
        claseASeleccionar = clasesDisponibles.find(
          (c) => c.id === data.ultimaClaseId
        );
        console.log(
          claseASeleccionar
            ? `    - Found last viewed class: ${claseASeleccionar.titulo}`
            : "    - No match found for last viewed."
        );
      } else {
        console.log("    - No last viewed class ID available.");
      }
    }

    if (!claseASeleccionar) {
      console.log("  - Priority 3: Defaulting to first class in list.");
      claseASeleccionar = clasesDisponibles[0];
      console.log(`    - Selected first class: ${claseASeleccionar.titulo}`);
    }

    console.log(
      "  - Final Decision: Setting active class to:",
      claseASeleccionar?.titulo || "None"
    );
    setClaseActiva(claseASeleccionar);
    console.groupEnd();
  }, [data, router.isReady, claseIdFromQuery]);

  // --- MANEJADORES DE EVENTOS ---
  const handleSelectClase = async (clase) => {
    router.push(`/clases/${rutaId}?clase=${clase.id}`, undefined, {
      shallow: true,
    });
    setClaseActiva(clase);
    if (user && rutaId && clase) {
      await supabase
        .from("rutas_alumnos")
        .update({ ultima_clase_vista_id: clase.id })
        .eq("alumno_id", user.id)
        .eq("ruta_id", rutaId);
    }
  };

  const handleNextClase = () => {
    if (!data || !claseActiva) return;
    const currentIndex = data.clases.findIndex((c) => c.id === claseActiva.id);
    if (currentIndex < data.clases.length - 1) {
      const siguienteClase = data.clases[currentIndex + 1];
      handleSelectClase(siguienteClase);
    } else {
      alert("¡Felicidades, has terminado todas las clases de esta ruta!");
      router.push("/Dashboard/alumno");
    }
  };

  const guardarProgreso = async (event) => {
    const currentTime = event.target.currentTime;
    if (!claseActiva || !user || !currentTime || event.target.ended) return;
    await supabase.from("clases_vistas").upsert(
      {
        clase_id: claseActiva.id,
        alumno_id: user.id,
        ultimo_tiempo_visto: currentTime,
      },
      { onConflict: "alumno_id, clase_id" }
    );
  };

  const marcarComoVista = async () => {
    if (!claseActiva || !user) return;
    await supabase.from("clases_vistas").upsert(
      {
        clase_id: claseActiva.id,
        alumno_id: user.id,
        ultimo_tiempo_visto: 0,
      },
      { onConflict: "alumno_id, clase_id" }
    );
    handleNextClase();
  };

  // --- RENDERIZADO CONDICIONAL ---
  console.log("4. Checking render condition:", {
    isLoading,
    isRouterReady: router.isReady,
    hasData: !!data,
  });
  if (isLoading || !router.isReady || !data) {
    console.log("  - RESULT: Rendering Loading Component.");
    console.groupEnd();
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
    console.error("  - ERROR STATE DETECTED:", error);
    console.log("  - RESULT: Rendering Error Component.");
    console.groupEnd();
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

  console.log(
    "5. RESULT: Rendering Main Component with active class:",
    claseActiva?.titulo || "None yet"
  );
  console.groupEnd();
  return (
    <div className="flex h-screen bg-gray-100">
      <ClaseSidebar
        rutaTitulo={data?.rutaInfo?.titulo || "Cargando ruta..."}
        clases={data.clases}
        claseActivaId={claseActiva?.id}
        onSelectClase={handleSelectClase}
        progresoMap={data.progresoMap}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => router.push(`/rutas/${rutaId}`)}
            className="flex items-center px-4 py-2 bg-gray-100 cursor-pointer rounded-lg hover:bg-gray-200 transition text-gray-800 font-medium"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver al Panel
          </button>
          <h1 className="text-xl font-bold text-gray-800 truncate ml-4 hidden md:block">
            {claseActiva?.titulo || "Selecciona una clase"}
          </h1>
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
                {claseActiva.mux_playback_id ? (
                  <MuxPlayer
                    key={claseActiva.id}
                    playbackId={claseActiva.mux_playback_id}
                    autoPlay
                    startTime={
                      Number(startTimeFromQuery) ||
                      data?.progresoMap?.get(claseActiva.id) ||
                      0
                    }
                    onTimeUpdate={guardarProgreso}
                    onEnded={marcarComoVista}
                    metadata={{
                      video_id: claseActiva.id,
                      video_title: claseActiva.titulo,
                      user_id: user?.id,
                    }}
                    accentColor="#96b422"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white bg-gray-800">
                    <p>El video no está disponible o se está procesando.</p>
                  </div>
                )}
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
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- PROTECCIÓN DE LA RUTA EN EL SERVIDOR ---
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
      initialSession: session, // Pasamos la sesión para que el cliente la tenga de inmediato
    },
  };
};
