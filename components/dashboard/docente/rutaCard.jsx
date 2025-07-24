// /components/dashboard/docente/RutaCard.jsx

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import ClaseCard from "@components/dashboard/docente/claseCard";

export default function RutaCard({ ruta, onPreviewClase }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg overflow-hidden transition-all duration-300">
      {/* Encabezado de la ruta, es clickeable para expandir/colapsar */}
      <div
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-xl font-bold text-gray-800">{ruta.nombre}</h2>
          <p className="text-sm text-gray-600">
            Contiene {ruta.clases.length} clase(s)
          </p>
        </div>
        <ChevronDownIcon
          className={`h-6 w-6 text-gray-500 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Contenido colapsable con las tarjetas de las clases */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ruta.clases.map((clase) => (
            <ClaseCard
              key={clase.id}
              clase={clase}
              onPreviewClick={onPreviewClase} // Pasamos la función para abrir el modal
            />
          ))}
        </div>
      )}
    </div>
  );
}
