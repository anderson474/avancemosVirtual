// /components/dashboard/docente/ClasePreviewModal.jsx

import { XMarkIcon } from "@heroicons/react/24/solid";
// ¡Reutilizamos tu componente de reproductor de video!
import VideoPlayer from "@components/dashboard/alumno/videoPlayer";
import { useUser } from "@supabase/auth-helpers-react";

export default function ClasePreviewModal({ clase, isOpen, onClose }) {
  const user = useUser();

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
          <div className="w-full aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden mb-4">
            {/* 
              Aquí reutilizamos tu VideoPlayer.
              Pasamos los props necesarios. Si tu VideoPlayer no necesita onVideoEnded, lo puedes omitir.
            */}
            <VideoPlayer
              videoUrl={clase.video_url}
              claseId={clase.id}
              userId={user.id}
              onVideoEnded={() => console.log("Video preview ended")} // Puedes poner una función vacía o lógica simple
            />
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
