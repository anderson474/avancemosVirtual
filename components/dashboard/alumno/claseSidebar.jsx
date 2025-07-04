// /components/dashboard/alumno/ClaseSidebar.jsx
import { CheckBadgeIcon } from '@heroicons/react/24/solid';


export default function ClaseSidebar({ rutaTitulo, clases, claseActivaId, onSelectClase,clasesVistasIds }) {
  return (
    <aside className="w-full md:w-80 bg-white shadow-lg p-6 flex-shrink-0">
      <h2 className="text-xl font-bold text-gray-800 mb-1">{rutaTitulo}</h2>
      <p className="text-sm text-gray-500 mb-6">Contenido del curso</p>
      
      <ul className="space-y-2">
        {clases.map((clase, index) => {
          const esActiva = clase.id === claseActivaId;
          const esVista = clasesVistasIds.includes(clase.id);

          return (
            <li key={clase.id}>
              <button onClick={() => onSelectClase(clase)} className={`w-full text-left p-3 rounded-lg flex items-center transition-colors ${esActiva ? 'bg-green-100 text-green-800' : 'hover:bg-gray-200'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${esActiva ? 'bg-green-500 text-white' : 'bg-gray-300'} ${esVista ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}>
                  {index + 1}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{clase.titulo}</p>
                  {esVista && (
                    <div className="flex items-center text-xs text-green-600 mt-1">
                      <CheckBadgeIcon className="h-4 w-4 mr-1" />
                      Completado
                    </div>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}