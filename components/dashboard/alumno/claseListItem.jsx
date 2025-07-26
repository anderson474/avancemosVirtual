// src/components/dashboard/alumno/ClaseListItem.jsx

import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/solid";

const ProgressBar = ({ progress }) => (
  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
    <div
      className="h-full bg-green-500 transition-all duration-500"
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
  const videoPreviewUrl = clase.video_url ? `${clase.video_url}#t=2` : "";

  return (
    // --- CORRECCIÓN AQUÍ: Quitamos la <a> y pasamos className al Link ---
    <Link
      href={`/clases/${rutaId}?clase=${clase.id}`}
      className="relative flex items-center p-4 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white  shadow-xl/30 hover:bg-white/20 overflow-hidden"
    >
      <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center mr-4 shadow-inner">
        {videoPreviewUrl ? (
          <video
            src={videoPreviewUrl}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
            playsInline
          />
        ) : (
          <LockClosedIcon className="h-8 w-8 text-white/50" />
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
