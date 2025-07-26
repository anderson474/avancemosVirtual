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

  // useEffect no necesita cambios, está correcto.
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
      console.log(
        `%c[INICIO] Proceso de eliminación para la ruta ID: ${ruta.id}, Nombre: "${ruta.nombre}"`,
        "color: blue; font-weight: bold;"
      );

      // PASO 1: OBTENER LOS IDs DE LAS CLASES
      console.log(
        "[LOG] PASO 1: Obteniendo IDs de las clases asociadas a la ruta..."
      );
      const { data: clasesAEliminar, error: fetchError } = await supabase
        .from("clases")
        .select("id")
        .eq("ruta_id", ruta.id);

      if (fetchError) {
        throw new Error(
          `Paso 1 fallido: No se pudieron obtener las clases. ${fetchError.message}`
        );
      }
      console.log(
        `[LOG] PASO 1 COMPLETADO: Se encontraron ${clasesAEliminar.length} clases. IDs:`,
        clasesAEliminar.map((c) => c.id)
      );

      // PASO 2: LIMPIAR STORAGE
      if (clasesAEliminar && clasesAEliminar.length > 0) {
        const bucketId = "videos-clases";
        console.log(
          `%c[LOG] PASO 2: Iniciando limpieza de Storage en el bucket '${bucketId}'...`,
          "color: purple; font-weight: bold;"
        );

        const deleteStoragePromises = clasesAEliminar.map(async (clase) => {
          const folderPath = String(clase.id);
          console.log(
            `%c  [Procesando Clase ID: ${clase.id}]`,
            "color: orange;"
          );
          console.log(
            `    - Intentando listar archivos en la "carpeta": '${folderPath}'`
          );

          const { data: files, error: listError } = await supabase.storage
            .from(bucketId)
            .list(folderPath);

          if (listError) {
            console.warn(
              `    - ADVERTENCIA: No se pudo listar la carpeta '${folderPath}'. Error: ${listError.message}. Saltando a la siguiente.`
            );
            return; // Continuamos con la siguiente clase.
          }

          if (files && files.length > 0) {
            console.log(
              `    - ARCHIVOS ENCONTRADOS: ${files.length}. Nombres:`,
              files.map((f) => f.name)
            );

            const filePathsToRemove = files.map(
              (file) => `${folderPath}/${file.name}`
            );
            console.log(
              `    - CONSTRUYENDO RUTAS PARA BORRAR:`,
              filePathsToRemove
            );

            console.log(`    - Ejecutando comando remove()...`);
            const { error: removeError } = await supabase.storage
              .from(bucketId)
              .remove(filePathsToRemove);

            if (removeError) {
              console.error(
                `    - ERROR al eliminar archivos de la carpeta '${folderPath}': ${removeError.message}`
              );
              // Podríamos lanzar un error aquí si queremos que el proceso se detenga por completo.
              // throw new Error(`Fallo al eliminar de storage: ${removeError.message}`);
            } else {
              console.log(
                `    - ÉXITO: Archivos eliminados de la carpeta '${folderPath}'.`
              );
            }
          } else {
            console.log(
              `    - INFO: La carpeta '${folderPath}' está vacía o no existe. No hay nada que eliminar.`
            );
          }
        });

        await Promise.all(deleteStoragePromises);
        console.log(
          `%c[LOG] PASO 2 COMPLETADO: Limpieza de Storage finalizada.`,
          "color: purple; font-weight: bold;"
        );
      } else {
        console.log(
          "[LOG] PASO 2 OMITIDO: No hay clases asociadas, no se necesita limpiar Storage."
        );
      }

      // PASO 3: ELIMINAR LA RUTA DE LA BD
      console.log(
        `%c[LOG] PASO 3: Eliminando la ruta ID ${ruta.id} de la base de datos (se espera CASCADE)...`,
        "color: green; font-weight: bold;"
      );
      const { error: deleteRutaError } = await supabase
        .from("rutas")
        .delete()
        .eq("id", ruta.id);
      if (deleteRutaError) {
        throw new Error(
          `Paso 3 fallido: Error al eliminar la ruta. ${deleteRutaError.message}`
        );
      }
      console.log(
        `[LOG] PASO 3 COMPLETADO: Ruta eliminada de la base de datos.`
      );

      // PASO 4: ÉXITO
      setFeedback({
        type: "success",
        message: `¡Ruta "${ruta.nombre}" y todo su contenido eliminados con éxito!`,
      });
      onRutaEliminada(ruta.id);
      setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
      console.log(
        `%c[FIN] Proceso de eliminación finalizado con ÉXITO.`,
        "color: blue; font-weight: bold;"
      );
    } catch (error) {
      console.error(
        "%c[ERROR FATAL] El proceso de eliminación se detuvo.",
        "color: red; font-size: 16px; font-weight: bold;"
      );
      console.error("Mensaje del Error:", error.message);
      console.error("Objeto de Error Completo:", error);
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
