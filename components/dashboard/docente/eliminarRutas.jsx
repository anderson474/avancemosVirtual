// 1. Importamos los hooks que necesitaremos: useState y useEffect
import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function EliminarRutaDrawer({
  visible,
  onClose,
  rutas, // Esta prop 'rutas' original no tiene el conteo de clases
  onRutaEliminada,
}) {
  const supabase = useSupabaseClient();
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // 2. NUEVOS ESTADOS
  // Guardaremos aquí las rutas con su conteo de clases ya calculado.
  const [rutasConConteo, setRutasConConteo] = useState([]);
  // Para una mejor experiencia de usuario mientras cargan los datos.
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  // 3. USAMOS useEffect PARA OBTENER EL CONTEO DE CLASES
  // Este código se ejecutará cuando el componente se monte o cuando la prop 'rutas' cambie.
  useEffect(() => {
    // Si no hay rutas, no hacemos nada.
    if (!rutas || rutas.length === 0) {
      setRutasConConteo([]);
      setIsLoadingCounts(false);
      return;
    }

    // Definimos una función asíncrona para cargar los conteos
    const fetchClassCounts = async () => {
      setIsLoadingCounts(true);

      // Basado en tu esquema, la tabla 'clases' tiene una columna 'ruta_id'.
      // Haremos una consulta para contar cuántas clases corresponden a cada ID de ruta.
      try {
        // Creamos un array de "promesas". Usar Promise.all es mucho más eficiente
        // que hacer un 'await' dentro de un bucle.
        const countPromises = rutas.map((ruta) =>
          supabase
            .from("clases")
            // 'head: true' es una optimización clave: solo nos trae el conteo, no los datos.
            .select("*", { count: "exact", head: true })
            .eq("ruta_id", ruta.id)
        );

        // Esperamos a que todas las consultas de conteo se completen
        const countsResults = await Promise.all(countPromises);

        // Ahora, combinamos la información original de las rutas con su nuevo conteo.
        const rutasActualizadas = rutas.map((ruta, index) => ({
          ...ruta, // Mantenemos toda la información original de la ruta
          classCount: countsResults[index].count || 0, // Añadimos la propiedad con el conteo
        }));

        setRutasConConteo(rutasActualizadas);
      } catch (error) {
        console.error("Error al obtener el conteo de clases:", error);
        // Si hay un error, mostramos las rutas sin conteo para no romper la UI.
        const rutasSinConteo = rutas.map((r) => ({ ...r, classCount: 0 }));
        setRutasConConteo(rutasSinConteo);
      } finally {
        setIsLoadingCounts(false);
      }
    };

    fetchClassCounts();
  }, [rutas, supabase]); // Dependencias del efecto

  const handleEliminarRuta = async (ruta) => {
    setDeletingId(ruta.id);
    setFeedback({ type: "", message: "" });

    // 4. AHORA USAMOS 'ruta.classCount' que ya hemos calculado
    const classCount = ruta.classCount;
    const confirmationMessage =
      classCount > 0
        ? `¿Estás seguro de que quieres eliminar la ruta "${ruta.nombre}"? Se eliminarán también las ${classCount} clases que contiene. Esta acción es irreversible.`
        : `¿Estás seguro de que quieres eliminar la ruta vacía "${ruta.nombre}"? Esta acción es irreversible.`;

    if (!window.confirm(confirmationMessage)) {
      setDeletingId(null);
      return;
    }

    const { error } = await supabase.from("rutas").delete().eq("id", ruta.id);

    if (error) {
      setFeedback({
        type: "error",
        message: "Error al eliminar la ruta: " + error.message,
      });
    } else {
      setFeedback({
        type: "success",
        message: `¡Ruta "${ruta.nombre}" eliminada con éxito!`,
      });
      onRutaEliminada(ruta.id);
    }

    setTimeout(() => {
      setDeletingId(null);
      if (!error) {
        setFeedback({ type: "", message: "" });
      }
    }, 3000);
  };

  return (
    <div
      className={`fixed top-5 right-0 w-full max-w-md backdrop-blur-sm shadow-lg rounded-l-2xl z-50
      max-h-screen overflow-y-auto
      transform transition-transform duration-300 ease-in-out ${
        visible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-gray-200 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-gray-800">Eliminar Rutas</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <IoClose size={24} className="text-gray-600" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-65px)]">
        {feedback.message && (
          <div
            className={`p-3 rounded-md text-sm text-center mb-4 ${
              feedback.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* 5. MODIFICAMOS EL RENDERIZADO PARA USAR LOS NUEVOS DATOS Y MOSTRAR UN ESTADO DE CARGA */}
        {isLoadingCounts ? (
          <p className="text-center text-gray-500 mt-8">
            Cargando datos de las rutas...
          </p>
        ) : rutasConConteo && rutasConConteo.length > 0 ? (
          rutasConConteo.map((ruta) => {
            // Usamos directamente 'ruta.classCount'. ¡Mucho más limpio!
            const classCount = ruta.classCount;
            return (
              <div
                key={ruta.id}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {ruta.nombre}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {ruta.nivel} - {ruta.idioma}
                  </p>
                </div>

                <div
                  className={`text-sm font-medium p-2 rounded-md text-center ${
                    classCount > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {classCount > 0
                    ? `Contiene ${classCount} clase(s)`
                    : "Esta ruta no tiene clases"}
                </div>

                <button
                  onClick={() => handleEliminarRuta(ruta)}
                  disabled={deletingId === ruta.id}
                  className="w-full text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:shadow-xl/30 hover:bg-white/20 hover:text-red-500 cursor-pointer transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deletingId === ruta.id
                    ? "Eliminando..."
                    : "Eliminar Ruta Permanentemente"}
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 mt-8">
            No hay rutas para eliminar.
          </p>
        )}
      </div>
    </div>
  );
}
