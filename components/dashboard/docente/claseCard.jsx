// components/dashboard/docente/claseCard.jsx

export default function ClaseCard({ clase }) {
  // Aseguramos que la URL del video termine con la hora para evitar caché
  const videoUrlWithCacheBuster = `${clase.video_url}#t=0.1`;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      
      {/* Contenedor de la vista previa del video */}
      <div className="w-full h-40 bg-black flex items-center justify-center">
        <video 
          src={videoUrlWithCacheBuster}
          className="w-full h-full object-cover"
          preload="metadata" // Le dice al navegador que solo cargue los metadatos (como el primer frame)
          muted
          playsInline
        >
          Tu navegador no soporta vistas previas de video.
        </video>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{clase.titulo}</h3>
        <p className="text-sm text-gray-600 mb-2 h-10 overflow-hidden">{clase.descripcion}</p>
        <p className="text-sm text-gray-500">
          <span className="font-semibold">Ruta:</span> {clase.rutas?.nombre || 'Sin ruta'}
        </p>
        <a
          href={clase.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm block mt-2 font-medium"
        >
          Ver video completo
        </a>
      </div>
    </div>
  );
}
