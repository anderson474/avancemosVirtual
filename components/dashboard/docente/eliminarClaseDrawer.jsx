import { useMemo } from "react";
import { IoClose } from "react-icons/io5";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function EliminarClaseDrawer({
  visible,
  onClose,
  clases,
  onClaseEliminada,
}) {
  const supabase = useSupabaseClient();

  // Esta lógica de agrupación funciona porque tu getServerSideProps ya trae el nombre de la ruta anidado.
  const clasesAgrupadasPorRuta = useMemo(() => {
    if (!clases || clases.length === 0) return {};

    return clases.reduce((acc, clase) => {
      const nombreRuta = clase.rutas?.nombre || "Clases sin ruta asignada";
      if (!acc[nombreRuta]) {
        acc[nombreRuta] = [];
      }
      acc[nombreRuta].push(clase);
      return acc;
    }, {});
  }, [clases]);

  const handleEliminarClase = async (id) => {
    if (
      !window.confirm(
        "¿Estás seguro de que quieres eliminar esta clase? Se borrarán el video y todos sus recursos asociados. Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      // PASO 1: ELIMINAR LOS ARCHIVOS DE SUPABASE STORAGE
      const bucketId = "videos-clases";
      const folderPath = String(id); // La carpeta se llama como el ID de la clase

      // 1a: Listar todos los archivos en la carpeta de la clase
      const { data: files, error: listError } = await supabase.storage
        .from(bucketId)
        .list(folderPath);

      if (listError) {
        // Si hay un error listando (ej: la carpeta no existe), lo mostramos pero podríamos continuar
        console.warn(
          `No se pudo listar la carpeta ${folderPath} en Storage. Puede que ya estuviera vacía o eliminada. Error:`,
          listError.message
        );
      }

      // 1b: Si se encontraron archivos, eliminarlos
      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${folderPath}/${file.name}`);
        const { error: removeError } = await supabase.storage
          .from(bucketId)
          .remove(filePaths);

        if (removeError) {
          // Si la eliminación de archivos falla, detenemos todo el proceso
          throw new Error(
            `Error al eliminar los archivos de Storage: ${removeError.message}`
          );
        }
      }

      // PASO 2: ELIMINAR EL REGISTRO DE LA BASE DE DATOS
      // Esto también debería eliminar los embeddings y recursos en cascada si tienes 'ON DELETE CASCADE' configurado.
      const { error: dbError } = await supabase
        .from("clases")
        .delete()
        .eq("id", id);

      if (dbError) {
        // Si la eliminación de la base de datos falla, lanzamos un error
        throw new Error(
          `Error al eliminar la clase de la base de datos: ${dbError.message}`
        );
      }

      // PASO 3: ÉXITO TOTAL
      // Notificamos al componente padre para que actualice la UI
      onClaseEliminada(id);
    } catch (error) {
      console.error("Error completo en el proceso de eliminación:", error);
      alert(error.message);
    }
  };

  const nombresDeRutas = Object.keys(clasesAgrupadasPorRuta);

  return (
    <div
      className={`fixed top-5 right-0 w-full max-w-md bg-white shadow-lg rounded-l-2xl z-50
      max-h-screen
      flex flex-col
      transform transition-transform duration-300 ease-in-out ${
        visible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-gray-200 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-gray-800">Eliminar Clases</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <IoClose size={24} className="text-gray-600" />
        </button>
      </div>

      <div
        className="p-4 space-y-6 overflow-y-auto flex-1
      "
      >
        {nombresDeRutas.length > 0 ? (
          nombresDeRutas.map((nombreRuta) => (
            <div key={nombreRuta} className="space-y-3">
              <h3 className="text-md font-semibold text-gray-500 border-b pb-2">
                {nombreRuta}
              </h3>
              {clasesAgrupadasPorRuta[nombreRuta].map((clase) => (
                <div
                  key={clase.id}
                  className="flex justify-between items-center bg-gray-50 hover:bg-white/20 p-3 rounded-lg border border-gray-200"
                >
                  <span className="truncate pr-4 font-medium text-gray-700">
                    {clase.titulo}
                  </span>
                  <button
                    onClick={() => handleEliminarClase(clase.id)}
                    className="text-sm bg-red-500 text-white px-4 py-2 rounded-md hover:bg-white/20 hover:text-red-500 hover:shadow-xl/30 cursor-pointer transition-colors font-semibold flex-shrink-0"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-8">
            No hay clases para eliminar.
          </p>
        )}
      </div>
    </div>
  );
}
