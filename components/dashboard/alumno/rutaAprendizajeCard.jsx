// components/dashboard/alumno/RutaAprendizajeCard.jsx
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RutaAprendizajeCard({ ruta }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ease-in-out">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{ruta.titulo}</h3>
        <p className="text-gray-600 text-sm mb-4">{ruta.descripcion}</p>

        {/* Barra de Progreso animada */}
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm font-medium text-gray-700">{ruta.progreso}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="bg-verde h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${ruta.progreso}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        <div className="mt-6">
          <Link
            href={`/clases/${ruta.id}`}
            className="w-full text-center inline-block px-6 py-2 text-sm font-bold text-white bg-verde rounded-lg hover:bg-verde/80 transition-colors"
          >
            Continuar Aprendiendo
          </Link>
        </div>
      </div>
    </div>
  );
}
