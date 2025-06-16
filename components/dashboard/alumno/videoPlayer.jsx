// /components/dashboard/alumno/VideoPlayer.jsx
export default function VideoPlayer({ videoUrl, claseTitulo }) {
  // Supabase Storage devuelve un link público, por lo que podemos usarlo directamente.
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="aspect-w-16 aspect-h-9">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-cover"
          >
            Tu navegador no soporta el elemento de video.
          </video>
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
             <p className="text-white">Video no disponible.</p>
          </div>
        )}
      </div>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900">{claseTitulo}</h1>
      </div>
    </div>
  );
}