// components/dashboard/alumno/RutaAprendizajeCard.jsx
//import Link from 'next/link';
import { motion } from "framer-motion";
import { useRouter } from "next/router";

export default function RutaAprendizajeCard({ ruta }) {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(
      {
        pathname: `/rutas/${ruta.id}`,
        // Pasamos los datos de la ruta como 'query'.
        // No aparecerán en la URL visible, pero estarán disponibles en el router.
        query: { rutaData: JSON.stringify(ruta) },
      },
      `/rutas/${ruta.id}` // Esta es la URL "limpia" que el usuario verá.
    );
  };

  return (
    <div
      className="backdrop-blur-xs rounded-xl shadow-lg shadow-gray-700 overflow-hidden hover:shadow-2xl 
    transition-shadow duration-300 ease-in-out"
    >
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{ruta.titulo}</h3>
        <p className="text-gray-600 text-sm mb-4">{ruta.descripcion}</p>

        {/* Barra de Progreso animada */}
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm font-medium text-gray-700">
              {ruta.progreso}%
            </span>
          </div>
          <div className="w-full backdrop-blur-xs rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="bg-slate-200 rounded-full h-2.5 overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${ruta.progreso}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleNavigate}
            className="w-full text-center inline-block px-6 py-2 text-sm font-bold 
            text-white bg-verde rounded-lg hover:bg-white hover:text-verde hover:border 
            hover:border-gray-300 transition-colors hover:shadow-2xl cursor-pointer"
          >
            Continuar Aprendiendo
          </button>
        </div>
      </div>
    </div>
  );
}
