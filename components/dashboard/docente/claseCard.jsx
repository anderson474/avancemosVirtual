// /components/dashboard/docente/ClaseCard.jsx

// La prop 'onPreviewClick' viene desde RutaCard -> ListaClasesDocente
export default function ClaseCard({ clase, onPreviewClick }) {
  const videoUrlWithCacheBuster = `${clase.video_url}#t=0.1`;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="w-full h-40 bg-black">
        <video
          src={videoUrlWithCacheBuster}
          className="w-full h-full object-cover"
          preload="metadata"
          muted
          playsInline
        >
          Tu navegador no soporta vistas previas de video.
        </video>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
          {clase.titulo}
        </h3>
        <p className="text-sm text-gray-600 mb-2 h-10 overflow-hidden">
          {clase.descripcion}
        </p>
        <div className="mt-auto pt-2">
          {/* Este es el cambio principal: ahora es un botón que llama a onPreviewClick */}
          <button
            onClick={() => onPreviewClick(clase)}
            className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Previsualizar Clase
          </button>
        </div>
      </div>
    </div>
  );
}
