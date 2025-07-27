// src/components/dashboard/docente/EliminarRutaDrawer.jsx

import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function EliminarRutaDrawer({
  visible,
  onClose,
  rutas,
  onRutaEliminada,
}) {
  const supabase = useSupabaseClient();
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [rutasConConteo, setRutasConConteo] = useState([]);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  useEffect(() => {
    if (!rutas || rutas.length === 0) {
      setRutasConConteo([]);
      setIsLoadingCounts(false);
      return;
    }
    const fetchClassCounts = async () => {
      setIsLoadingCounts(true);
      try {
        const countPromises = rutas.map((ruta) =>
          supabase
            .from("clases")
            .select("*", { count: "exact", head: true })
            .eq("ruta_id", ruta.id)
        );
        const countsResults = await Promise.all(countPromises);
        const rutasActualizadas = rutas.map((ruta, index) => ({
          ...ruta,
          classCount: countsResults[index].count || 0,
        }));
        setRutasConConteo(rutasActualizadas);
      } catch (error) {
        console.error("Error al obtener el conteo de clases:", error);
        setRutasConConteo(rutas.map((r) => ({ ...r, classCount: 0 })));
      } finally {
        setIsLoadingCounts(false);
      }
    };
    fetchClassCounts();
  }, [rutas, supabase]);

  // --- FUNCIÓN DE ELIMINACIÓN CON LOGS DETALLADOS ---
  const handleEliminarRuta = async (ruta) => {
    setDeletingId(ruta.id);
    setFeedback({ type: "", message: "" });

    const confirmationMessage =
      ruta.classCount > 0
        ? `¿Estás seguro de que quieres eliminar la ruta "${ruta.nombre}"? Se eliminarán también sus ${ruta.classCount} clases y todos sus videos asociados. Esta acción es irreversible.`
        : `¿Estás seguro de que quieres eliminar la ruta vacía "${ruta.nombre}"?`;

    if (!window.confirm(confirmationMessage)) {
      setDeletingId(null);
      return;
    }

    try {
      // --- INICIO DE LA LÓGICA MODIFICADA ---
      // PASO 1: LLAMAR A NUESTRA API SEGURA PARA ELIMINAR LA RUTA
      const response = await fetch("/api/rutas/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rutaId: ruta.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar la ruta.");
      }
      // --- FIN DE LA LÓGICA MODIFICADA ---

      // PASO 2: ÉXITO
      setFeedback({
        type: "success",
        message: `¡Ruta "${ruta.nombre}" eliminada con éxito!`,
      });
      onRutaEliminada(ruta.id);
      setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
    } catch (error) {
      console.error("Error en el proceso de eliminación de ruta:", error);
      setFeedback({ type: "error", message: `Error: ${error.message}` });
    } finally {
      setDeletingId(null);
    }
  };

  // --- RENDERIZADO DEL JSX (CON TUS ESTILOS ORIGINALES) ---
  return (
    <div
      className={`fixed top-5 right-0 w-full max-w-md bg-white shadow-lg rounded-l-2xl z-50 max-h-screen overflow-y-auto transform transition-transform duration-300 ease-in-out ${
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
        {isLoadingCounts ? (
          <p className="text-center text-gray-500 mt-8">Cargando datos...</p>
        ) : rutasConConteo && rutasConConteo.length > 0 ? (
          rutasConConteo.map((ruta) => (
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
                  ruta.classCount > 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {ruta.classCount > 0
                  ? `Contiene ${ruta.classCount} clase(s)`
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
          ))
        ) : (
          <p className="text-center text-gray-500 mt-8">
            No hay rutas para eliminar.
          </p>
        )}
      </div>
    </div>
  );
}
