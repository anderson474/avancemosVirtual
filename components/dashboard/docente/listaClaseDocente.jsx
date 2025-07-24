// /components/dashboard/docente/ListaClasesDocente.jsx

import { useState, useMemo } from "react";
import RutaCard from "@components/dashboard/docente/rutaCard";
import ClasePreviewModal from "@components/dashboard/docente/clasePreviewModal";

// 1. Aceptamos AMBAS props: clases y rutas
export default function ListaClasesDocente({ clases, rutas }) {
  console.log("Clases recibidas:", clases);
  console.log("Rutas recibidas:", rutas);
  const [claseEnPreview, setClaseEnPreview] = useState(null);

  // 2. LÓGICA CORREGIDA Y EFICIENTE
  const rutasAgrupadas = useMemo(() => {
    // Si no hay un array de rutas, no podemos hacer nada.
    if (!rutas || rutas.length === 0) {
      console.warn("No hay rutas disponibles.");
      return [];
    }

    // El array de clases puede estar vacío, eso está bien.
    const clasesDisponibles = clases || [];

    // Iteramos sobre el array de RUTAS, que es nuestra fuente principal.
    return rutas.map((ruta) => {
      // Para cada ruta, filtramos el array completo de CLASES.
      // Buscamos todas las clases cuyo 'ruta_id' coincida con el 'id' de la ruta actual.
      // Esto está basado en tu esquema de base de datos (clases.ruta_id -> rutas.id).
      const clasesDeEstaRuta = clasesDisponibles.filter(
        (clase) => clase.ruta_id === ruta.id
      );

      // Devolvemos un nuevo objeto que contiene toda la información original de la ruta
      // y le añadimos una propiedad 'clases' con el array que acabamos de filtrar.
      return {
        ...ruta,
        clases: clasesDeEstaRuta,
      };
    });
  }, [rutas, clases]); // <-- Ahora dependemos de AMBAS props.

  const handleOpenPreview = (clase) => {
    setClaseEnPreview(clase);
  };

  const handleClosePreview = () => {
    setClaseEnPreview(null);
  };

  // El resto del return (el JSX) no necesita cambios, ya que la estructura
  // de 'rutasAgrupadas' sigue siendo la misma que esperaba.
  return (
    <>
      <div className="min-h-screen bg-cover bg-center bg-fixed">
        <div className="p-6 w-full pt-20 space-y-6">
          {rutasAgrupadas.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg text-center text-gray-600 shadow-md">
              <p>No tienes rutas asignadas aún.</p>
            </div>
          ) : (
            rutasAgrupadas.map((ruta) => (
              <RutaCard
                key={ruta.id}
                ruta={ruta}
                onPreviewClase={handleOpenPreview}
              />
            ))
          )}
        </div>
      </div>

      {claseEnPreview && (
        <ClasePreviewModal
          clase={claseEnPreview}
          isOpen={!!claseEnPreview}
          onClose={handleClosePreview}
        />
      )}
    </>
  );
}
