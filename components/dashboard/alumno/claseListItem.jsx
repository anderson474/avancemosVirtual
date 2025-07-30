import { useState } from "react"; // <-- Paso 1: Importar useState
import Link from "next/link";
import { PhotoIcon } from "@heroicons/react/24/solid";

const ProgressBar = ({ progress }) => (
  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
    <div
      className="h-full bg-verde transition-all duration-500"
      style={{ width: `${progress}%` }}
    />
  </div>
);

export default function ClaseListItem({
  rutaId,
  clase,
  claseIndex,
  tiempoVisto,
}) {
  const duracion = clase.duracion_segundos || 0;
  const progreso = duracion > 0 ? (tiempoVisto / duracion) * 100 : 0;
  const minutos = duracion > 0 ? Math.ceil(duracion / 60) : 0;

  // --- INICIO DE LA LÓGICA DE HOVER ---

  // Paso 2: Añadir un estado para controlar si el cursor está encima.
  const [isHovering, setIsHovering] = useState(false);

  // Define la imagen de placeholder una sola vez.
  // Asegúrate de tener esta imagen en tu carpeta /public.
  const placeholderImage = "/placeholder-procesando.png";

  // Paso 3: Definir AMBAS URLs: la estática y la animada.
  const staticThumbnailUrl = clase.mux_playback_id
    ? `https://image.mux.com/${clase.mux_playback_id}/thumbnail.jpg?time=2&width=400`
    : placeholderImage;

  const animatedGifUrl = clase.mux_playback_id
    ? `https://image.mux.com/${clase.mux_playback_id}/animated.gif?start=1&end=4&width=400`
    : placeholderImage;

  // Paso 4: Decidir qué URL mostrar basándose en el estado 'isHovering'.
  const thumbnailUrl = isHovering ? animatedGifUrl : staticThumbnailUrl;

  // --- FIN DE LA LÓGICA DE HOVER ---

  return (
    // Añadimos los eventos onMouseEnter y onMouseLeave al componente Link.
    <Link
      href={`/clases/${rutaId}?clase=${clase.id}&start=${tiempoVisto}`}
      className="relative flex items-center p-4 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white shadow-xl/30 hover:bg-white/20 overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center mr-4 shadow-inner">
        {clase.mux_playback_id ? (
          <img
            // La 'src' es ahora dinámica y cambiará con el hover.
            src={thumbnailUrl}
            // La 'key' fuerza al navegador a recargar la imagen al cambiar de estática a GIF.
            key={thumbnailUrl}
            alt={`Miniatura de ${clase.titulo}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          // Si no hay playback_id, mostramos un ícono.
          <PhotoIcon className="h-8 w-8 text-white/50" />
        )}
      </div>

      <div className="flex-grow">
        <p className="text-sm font-medium text-black">Clase {claseIndex}</p>
        <h3 className="text-lg font-semibold text-azul drop-shadow-sm">
          {clase.titulo}
        </h3>
      </div>

      <div className="ml-4 p-3 text-right flex-shrink-0">
        <p className="font-semibold text-azul">{minutos} min</p>
      </div>

      <ProgressBar progress={progreso} />
    </Link>
  );
}
