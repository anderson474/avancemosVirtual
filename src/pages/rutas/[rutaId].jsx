// pages/rutas/[rutaId].jsx

import { useRouter } from "next/router";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpenIcon,
  PlayCircleIcon,
  ArrowLeftIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";

// -> 1. MODIFICAMOS ClaseItem para el efecto GLASSMORPHISM
// Puedes mantener este componente en pages/rutas/[rutaId].jsx o moverlo a su propio archivo

const ClaseItem = ({ ruta, clase, isLocked }) => {
  // Clases base para todas las tarjetas, manteniendo el efecto vidrio
  const baseClasses =
    "flex items-center rounded-xl transition-all duration-300 backdrop-blur-md border border-white/20 shadow-lg";

  // Clases para la tarjeta desbloqueada
  const unlockedClasses = "hover:bg-white/20";

  // Clases para la tarjeta bloqueada
  const lockedClasses = "cursor-not-allowed";

  // Usamos el mismo truco que en el componente del docente
  const videoPreviewUrl = `${clase.video_url}#t=2`;
  console.log("preview video", videoPreviewUrl);

  return (
    // El Link ahora apunta a la clase específica: /clases/ID_DE_LA_CLASE
    <Link
      href={isLocked ? "#" : `/clases/${ruta.id}`}
      // Hacemos que la tarjeta bloqueada no sea "clickeable" visualmente
      className={`${baseClasses} ${isLocked ? lockedClasses : unlockedClasses}`}
      style={{ pointerEvents: isLocked ? "none" : "auto" }} // Previene el click en JS
    >
      {/* --- CONTENEDOR DE LA VISTA PREVIA --- */}
      <div className="flex-shrink-0 w-32 h-20 rounded-md overflow-hidden bg-black/30 flex items-center justify-center mr-4 shadow-inner">
        {isLocked ? (
          // Si está bloqueada, mostramos un ícono grande
          <LockClosedIcon className="h-8 w-8 text-white/50" />
        ) : (
          // Si está desbloqueada, mostramos el video
          <video
            src={videoPreviewUrl}
            className="w-full h-full object-cover"
            preload="metadata" // Muy importante para el rendimiento
            muted
            playsInline
          >
            Tu navegador no soporta vistas previas de video.
          </video>
        )}
      </div>

      {/* --- CONTENEDOR DEL TEXTO --- */}
      <div className="flex-grow">
        <h3
          className={`font-semibold px-3 ${
            isLocked ? "text-slate-300" : "text-slate-800"
          }`}
        >
          {clase.titulo}
        </h3>
        <p
          className={`text-sm px-3 ${
            isLocked ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {clase.duracion || "10 min"}
        </p>
      </div>

      {/* --- INDICADOR DE ACCIÓN (DERECHA) --- */}
      {!isLocked && (
        <span className="ml-4 p-3 text-sm font-medium text-blue-500 flex-shrink-0">
          Empezar
        </span>
      )}
    </Link>
  );
};
// --- Componente principal de la página ---
export default function RutaDetallePage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const [rutaData, setRutaData] = useState(null);
  const [clasesData, setClasesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // La lógica de fetching de datos no cambia
    if (router.query.rutaData) {
      const data = JSON.parse(router.query.rutaData);
      setRutaData(data);
      const fetchClases = async () => {
        const { data: clases, error } = await supabase
          .from("clases")
          .select("id, titulo, video_url")
          .eq("ruta_id", data.id);
        if (error) console.error("Error fetching clases:", error);
        else setClasesData(clases);
        setIsLoading(false);
      };
      fetchClases();
    } else if (router.isReady) {
      // ... Lógica de fallback ...
      console.log();
      setIsLoading(false);
    }
  }, [router.isReady, router.query, supabase]);

  if (isLoading || !rutaData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-black">
        Cargando...
      </div>
    );
  }

  return (
    // -> 2. Contenedor principal ahora es relativo para que el fondo se posicione detrás
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/fondo/fondoRuta.jpg')" }} // <-- ¡IMPORTANTE! CAMBIA ESTO SI TU IMAGEN SE LLAMA DIFERENTE
    >
      {/* -> 3. DIV PARA EL FONDO ANIMADO */}
      <div className="absolute inset-0" />

      {/* -> 4. Contenido principal con padding y centrado */}
      <div className="relative z-10">
        <button
          onClick={() => router.push("/Dashboard/alumno")}
          // -> Texto del link de regreso con mejor contraste
          className="flex items-center text-sm text-slate-600 hover:text-black mb-4 cursor-pointer pt-16 pl-16"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Mis Rutas
        </button>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* --- Header de la Ruta --- */}
          <header className="mb-12">
            {/* -> 5. Títulos con sombra para mejorar legibilidad */}
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-600 drop-shadow-md">
              {rutaData.titulo}
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-3xl">
              {rutaData.descripcion}
            </p>
          </header>

          {/* --- Contenido Principal (Lista de Clases + Video Preview) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <BookOpenIcon className="h-7 w-7 text-slate-600 mr-3" />
                <h2 className="text-2xl font-bold text-slate-600 drop-shadow-sm">
                  Clases ({clasesData.length})
                </h2>
              </div>
              <div className="space-y-4">
                {clasesData.map((clase, index) => (
                  <ClaseItem
                    key={clase.id} // Corregido: La key debe ser única para el elemento, como clase.id
                    ruta={rutaData} // Pasamos la ruta completa para el contexto
                    clase={clase} // Corregido: Pasar el objeto 'clase' en lugar de 'rutaData'
                    isLocked={index > 0} // La primera clase (índice 0) está desbloqueada
                  />
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              {/* El botón de Empezar Ruta puede quedar sólido para ser el CTA principal */}
              <div className="sticky top-12">
                {clasesData && clasesData.length > 0 ? (
                  <Link
                    href={`/clases/${clasesData[0].id}`} // Link a la primera clase de la ruta
                    className="w-full text-center inline-block py-3 px-6 text-lg font-bold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 transition-transform hover:scale-105"
                  >
                    Empezar Ruta
                  </Link>
                ) : (
                  <div className="w-full text-center py-3 px-6 text-lg font-bold text-white bg-gray-400 rounded-lg cursor-not-allowed">
                    Cargando...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
