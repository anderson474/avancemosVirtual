import { useState } from "react"; // Necesitamos importar useState

export default function ClaseCard({ clase, onPreviewClick }) {
  // 1. Añadimos un estado para controlar si el cursor está encima.
  const [isHovering, setIsHovering] = useState(false);

  // 2. Definimos AMBAS URLs: la estática y la animada.
  const staticThumbnailUrl = clase.mux_playback_id
    ? `https://image.mux.com/${clase.mux_playback_id}/thumbnail.jpg?time=2&width=400`
    : "/placeholder-procesando.png";

  const animatedGifUrl = clase.mux_playback_id
    ? `https://image.mux.com/${clase.mux_playback_id}/animated.gif?start=1&end=4&width=400`
    : "/placeholder-hover.png";

  // 3. Decidimos qué URL mostrar basándonos en el estado 'isHovering'.
  const thumbnailUrl = isHovering ? animatedGifUrl : staticThumbnailUrl;

  return (
    <div
      className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 flex flex-col"
      // 4. Añadimos los eventos onMouseEnter y onMouseLeave al contenedor principal.
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="w-full h-40 bg-black flex items-center justify-center">
        <img
          // La 'src' ahora es dinámica y cambiará cuando cambie el estado.
          src={thumbnailUrl}
          // Añadimos una 'key' que cambia para forzar al navegador a recargar la imagen
          // cuando pasamos de estática a GIF.
          key={thumbnailUrl}
          alt={`Previsualización de ${clase.titulo}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* El resto del componente no cambia */}
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
          {clase.titulo}
        </h3>
        <p className="text-sm text-gray-600 mb-2 h-10 overflow-hidden">
          {clase.descripcion || "Sin descripción."}
        </p>
        <div className="mt-auto pt-2">
          <button
            onClick={() => onPreviewClick(clase)}
            disabled={!clase.mux_playback_id}
            className="w-full cursor-pointer text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {clase.mux_playback_id ? "Previsualizar Clase" : "Procesando..."}
          </button>
        </div>
      </div>
    </div>
  );
}
