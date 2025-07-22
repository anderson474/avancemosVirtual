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

// El componente ClaseItem se puede quedar igual
const ClaseItem = ({ clase, isLocked }) => (
  <Link
    href={isLocked ? "#" : `/clases/${clase.id}`}
    className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
      isLocked
        ? "bg-gray-100 cursor-not-allowed"
        : "bg-white hover:bg-gray-50 hover:shadow-md"
    }`}
  >
    {/* ... contenido del componente sin cambios ... */}
    <div className="flex items-center">
      <div
        className={`mr-4 p-2 rounded-full ${
          isLocked ? "bg-gray-300" : "bg-blue-100"
        }`}
      >
        {isLocked ? (
          <LockClosedIcon className="h-6 w-6 text-gray-500" />
        ) : (
          <PlayCircleIcon className="h-6 w-6 text-blue-600" />
        )}
      </div>
      <div>
        <h3
          className={`font-semibold ${
            isLocked ? "text-gray-500" : "text-gray-800"
          }`}
        >
          {clase.titulo}
        </h3>
        <p className="text-sm text-gray-500">{clase.duracion || "10 min"}</p>
      </div>
    </div>
    {!isLocked && (
      <span className="text-sm font-medium text-blue-600">Empezar</span>
    )}
  </Link>
);

// --- Componente principal de la página (AHORA MÁS SIMPLE) ---
export default function RutaDetallePage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const [rutaData, setRutaData] = useState(null);
  const [clasesData, setClasesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Si los datos de la ruta ya vienen en el router.query, los usamos.
    if (router.query.rutaData) {
      const data = JSON.parse(router.query.rutaData);
      setRutaData(data);
      // Ahora necesitamos buscar SOLO las clases para esta ruta
      const fetchClases = async () => {
        const { data: clases, error } = await supabase
          .from("clases")
          .select("id, titulo,video_url") // Ajusta las columnas que necesites
          .eq("ruta_id", data.id);
        // .order('orden', { ascending: true }); // Si tienes una columna de orden

        if (error) {
          console.error("Error fetching clases:", error);
        } else {
          setClasesData(clases);
        }
        setIsLoading(false);
      };
      fetchClases();
    } else if (router.isReady) {
      // Fallback: Si se accede a la URL directamente, SÍ necesitamos buscar todo
      const fetchRutaCompleta = async () => {
        const { rutaId } = router.query;
        // ... aquí iría la lógica de fetch completa que tenías en getServerSideProps ...
        // Esto asegura que la página no se rompa si alguien la guarda en favoritos o comparte el link
        console.warn("Navegación directa, se realiza fetch completo.");
        setIsLoading(false); // Asegúrate de manejar la carga aquí también
      };
      fetchRutaCompleta();
    }
    console.log(clasesData.imagen_url);
  }, [router.isReady, router.query, supabase]);

  if (isLoading || !rutaData) {
    return <div>Cargando...</div>; // O un skeleton loader
  }

  // El resto del JSX es idéntico al que te di antes
  return (
    <div className="bg-gray-50 min-h-screen">
      <button
        onClick={() => router.push("/Dashboard/alumno")}
        className="flex items-center text-sm text-gray-500
         hover:text-gray-800 mb-4 cursor-pointer pt-16 pl-16
         hover:text-base"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Mis Rutas
      </button>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* --- Header de la Ruta --- */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">
            {rutaData.titulo}
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            {rutaData.descripcion}
          </p>
        </header>

        {/* --- Contenido Principal (Lista de Clases + Video Preview) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <BookOpenIcon className="h-7 w-7 text-gray-700 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                Clases ({clasesData.length})
              </h2>
            </div>
            <div className="space-y-4">
              {clasesData.map((clase, index) => (
                <ClaseItem
                  key={rutaData.id}
                  clase={rutaData}
                  isLocked={index > 0}
                />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-12">
              {/* Solo renderiza el Link si clasesData tiene elementos */}
              {clasesData && clasesData.length > 0 ? (
                <Link
                  href={`/clases/${rutaData.id}`} // Ya no necesitamos el `?` porque sabemos que existe
                  className="w-full text-center inline-block py-3 px-6 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-transform hover:scale-105"
                >
                  Empezar Ruta
                </Link>
              ) : (
                // Opcional: Muestra un estado de carga o deshabilitado mientras se cargan las clases
                <div className="w-full text-center py-3 px-6 text-lg font-bold text-white bg-gray-400 rounded-lg cursor-not-allowed">
                  Cargando...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
