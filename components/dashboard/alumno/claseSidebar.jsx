// /components/dashboard/alumno/ClaseSidebar.jsx
export default function ClaseSidebar({ rutaTitulo, clases, claseActivaId, onSelectClase }) {
  return (
    <aside className="w-full md:w-80 bg-white shadow-lg p-6 flex-shrink-0">
      <h2 className="text-xl font-bold text-gray-800 mb-1">{rutaTitulo}</h2>
      <p className="text-sm text-gray-500 mb-6">Contenido del curso</p>
      
      <ul className="space-y-2">
        {clases.map((clase, index) => (
          <li key={clase.id}>
            <button
              onClick={() => onSelectClase(clase)}
              className={`w-full text-left p-3 rounded-lg transition-colors flex items-center ${
                clase.id === claseActivaId
                  ? 'bg-green-100 text-green-800 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="bg-gray-200 text-gray-700 rounded-full h-6 w-6 text-xs flex items-center justify-center mr-3">
                {index + 1}
              </span>
              {clase.titulo}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}