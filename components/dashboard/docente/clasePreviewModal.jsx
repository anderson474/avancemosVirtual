import { XMarkIcon } from "@heroicons/react/24/solid";
// --- NUEVO IMPORT ---
// Importamos el reproductor oficial de Mux para React.
import MuxPlayer from "@mux/mux-player-react";

// El hook useUser ya no es necesario aquí si solo lo usabas para el VideoPlayer antiguo.
// import { useUser } from "@supabase/auth-helpers-react";

export default function ClasePreviewModal({ clase, isOpen, onClose }) {
  // const user = useUser(); // Ya no es necesario para el MuxPlayer

  if (!isOpen) return null;

  return (
    // Overlay oscuro
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      {/* Contenedor del modal */}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Encabezado del modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 truncate">
            {clase.titulo}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-4 md:p-6 overflow-y-auto">
          {/* Contenedor del video con aspect ratio */}
          <div className="w-full aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden mb-4">
            {/* 
              --- INICIO DEL CAMBIO ---
              Aquí reemplazamos tu VideoPlayer por MuxPlayer.
            */}
            {clase.mux_playback_id ? (
              <MuxPlayer
                // La prop más importante: el ID de reproducción de Mux.
                playbackId={clase.mux_playback_id}
                // Propiedades para mejorar la experiencia de usuario.
                // autoPlay -> El video empieza automáticamente al abrir el modal.
                autoPlay={true}
                // muted={false} // Si quieres que empiece con sonido (opcional)

                // Personalización del color de la barra de progreso y controles.
                accentColor="#2563eb" // Un azul similar al de tu UI.
                // Muestra los metadatos como el título del video en el reproductor.
                metadata={{
                  video_id: clase.id,
                  video_title: clase.titulo,
                  // Puedes añadir más datos si quieres
                }}
              />
            ) : (
              // Mensaje de fallback si el video aún se está procesando.
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                <p>El video no está disponible o se está procesando.</p>
              </div>
            )}
            {/* --- FIN DEL CAMBIO --- */}
          </div>

          <h3 className="text-lg font-semibold mt-4">Descripción</h3>
          <p className="text-gray-600 mt-1">
            {clase.descripcion || "Esta clase no tiene descripción."}
          </p>
        </div>
      </div>
    </div>
  );
}
