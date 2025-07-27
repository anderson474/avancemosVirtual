// pages/rutas/[rutaId].jsx

import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import useSWR from "swr";
import Link from "next/link";
import { BookOpenIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import Lottie from "lottie-react";
import loadingAnimation from "@public/animation/loading.json";

import ClaseListItem from "@components/dashboard/alumno/claseListItem";

// --- FUNCIÓN FETCHER (SIN CAMBIOS) ---
const fetcher = async ([supabase, user, rutaId]) => {
  const [rutaResult, progresoResult] = await Promise.all([
    supabase
      .from("rutas")
      .select(
        `id, nombre, descripcion, clases(id, titulo, mux_playback_id, duracion_segundos)`
      )
      .eq("id", rutaId)
      .maybeSingle(),
    supabase
      .from("clases_vistas")
      .select("clase_id, ultimo_tiempo_visto")
      .eq("alumno_id", user.id),
  ]);

  const { data: rutaData, error: rutaError } = rutaResult;
  const { data: progresoData } = progresoResult;

  if (rutaError || !rutaData) {
    throw new Error(
      "No se pudo cargar la ruta. Es posible que no exista o no tengas acceso."
    );
  }

  const progresoClases = (progresoData || []).reduce((acc, vista) => {
    acc[vista.clase_id] = vista.ultimo_tiempo_visto;
    return acc;
  }, {});

  return {
    ruta: rutaData,
    clases: rutaData.clases || [],
    progresoClases,
  };
};

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function RutaDetallePage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  const { rutaId } = router.query;

  const { data, error, isLoading } = useSWR(
    rutaId && user ? [supabase, user, rutaId] : null,
    fetcher
  );

  // --- PRIMERA GUARDA: ESTADO DE CARGA ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="w-48 h-48">
          <Lottie animationData={loadingAnimation} loop={true} />
        </div>
        <p className="text-xl">Cargando detalles de la ruta...</p>
      </div>
    );
  }

  // --- SEGUNDA GUARDA: ESTADO DE ERROR ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center p-4">
        <h2 className="text-2xl text-red-400 font-bold">
          ¡Oops! Algo salió mal.
        </h2>
        <p className="mt-2 text-gray-300">{error.message}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-4 py-2 bg-blue-600 rounded-lg"
        >
          Volver
        </button>
      </div>
    );
  }

  // ======================================================================
  // --- TERCERA GUARDA (LA CORRECCIÓN CLAVE): DATOS INCOMPLETOS ---
  // Si la carga terminó sin errores pero 'data' o 'data.ruta' no existen,
  // no podemos renderizar. Esto previene el error 'cannot read properties of undefined'.
  // ======================================================================
  if (!data || !data.ruta) {
    // Puedes mostrar un mensaje de "No encontrado" o simplemente no renderizar nada.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 text-center p-4">
        <p className="mt-2 text-gray-300">Cargando...</p>
        <button
          onClick={() => router.push("/Dashboard/alumno")}
          className="mt-6 px-4 py-2 bg-blue-600 rounded-lg"
        >
          Volver a Mis Rutas
        </button>
      </div>
    );
  }

  // Si llegamos aquí, estamos seguros de que 'data' y 'data.ruta' existen.
  const { ruta, clases, progresoClases } = data;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/fondo/fondoRuta.jpg')" }}
    >
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <button
          onClick={() => router.push("/Dashboard/alumno")}
          className="flex items-center text-sm text-black hover:text-gray-500 mb-8 cursor-pointer"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Mis Rutas
        </button>

        <header className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-azul drop-shadow-lg">
            {ruta.nombre}
          </h1>
          <p className="mt-4 text-lg text-black max-w-3xl drop-shadow-md">
            {ruta.descripcion}
          </p>
        </header>

        <div className="space-y-8">
          <div>
            <div className="flex items-center mb-6">
              <BookOpenIcon className="h-7 w-7 text-azul mr-3" />
              <h2 className="text-2xl font-bold text-black drop-shadow-sm">
                Clases ({clases.length})
              </h2>
            </div>
            <div className="space-y-4">
              {clases.map((clase, index) => (
                <ClaseListItem
                  key={clase.id}
                  rutaId={ruta.id}
                  clase={clase}
                  claseIndex={index + 1}
                  tiempoVisto={progresoClases[clase.id] || 0}
                />
              ))}
            </div>
          </div>

          <div className="pt-8 flex justify-center">
            {clases.length > 0 ? (
              <Link
                href={`/clases/${ruta.id}`}
                className="w-full max-w-md text-center inline-block py-4 px-6 text-lg font-bold text-white bg-green-600 rounded-lg shadow-2xl hover:bg-green-700 transition-transform hover:scale-105"
              >
                {Object.keys(progresoClases).length > 0
                  ? "Continuar Ruta"
                  : "Empezar Ruta"}
              </Link>
            ) : (
              <div className="text-center text-white/80 p-4 bg-black/30 rounded-lg">
                Esta ruta aún no tiene clases disponibles.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
