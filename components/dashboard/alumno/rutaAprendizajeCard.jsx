// components/dashboard/alumno/RutaAprendizajeCard.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function RutaAprendizajeCard({ ruta }) {
  // `ruta` es un objeto con la info que pasaremos, como:
  // { id: 1, titulo: 'Inglés para Principiantes', progreso: 30, descripcion: '...' }
  const router = useRouter();

  const handleContinue = () => {
    // Si hay una última clase vista, vamos directamente a ella.
    // Si no, vamos a la primera clase de la ruta (necesitaríamos obtenerla o simplemente ir a la ruta).
    // Por simplicidad, aquí vamos a la página de la ruta y ella se encargará de mostrar la primera o la última.
    router.push(`/clases/${ruta.id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ease-in-out">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{ruta.titulo}</h3>
        <p className="text-gray-600 text-sm mb-4">{ruta.descripcion}</p>
        
        {/* Barra de Progreso */}
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm font-medium text-gray-700">{ruta.progreso}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${ruta.progreso}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-6">
          <Link 
            href={`/clases/${ruta.id}`} // Más adelante, esto llevará a la lista de clases de esa ruta
            className="w-full text-center inline-block px-6 py-2 text-sm font-bold text-white bg-[rgba(45,168,54,1)] rounded-lg hover:bg-green-700 transition-colors"
          >
            Continuar Aprendiendo
          </Link>
        </div>
      </div>
    </div>
  );
}