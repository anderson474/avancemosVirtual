import { useMemo } from 'react';
import { IoClose } from 'react-icons/io5';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function EliminarClaseDrawer({ visible, onClose, clases, onClaseEliminada }) {
  const supabase = useSupabaseClient();

  // Esta lógica de agrupación funciona porque tu getServerSideProps ya trae el nombre de la ruta anidado.
  const clasesAgrupadasPorRuta = useMemo(() => {
    if (!clases || clases.length === 0) return {};
    
    return clases.reduce((acc, clase) => {
      const nombreRuta = clase.rutas?.nombre || 'Clases sin ruta asignada';
      if (!acc[nombreRuta]) {
        acc[nombreRuta] = [];
      }
      acc[nombreRuta].push(clase);
      return acc;
    }, {});
  }, [clases]);

  const handleEliminarClase = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta clase? Esta acción no se puede deshacer.")) {
      return;
    }
    const { error } = await supabase.from('clases').delete().eq('id', id);

    if (error) {
      alert('Error al eliminar la clase: ' + error.message);
    } else {
      onClaseEliminada(id);
    }
  };

  const nombresDeRutas = Object.keys(clasesAgrupadasPorRuta);

  return (
    <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Eliminar Clases</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <IoClose size={24} className="text-gray-600" />
        </button>
      </div>
      
      <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-65px)]">
        {nombresDeRutas.length > 0 ? (
          nombresDeRutas.map((nombreRuta) => (
            <div key={nombreRuta} className="space-y-3">
              <h3 className="text-md font-semibold text-gray-500 border-b pb-2">{nombreRuta}</h3>
              {clasesAgrupadasPorRuta[nombreRuta].map((clase) => (
                <div key={clase.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="truncate pr-4 font-medium text-gray-700">{clase.titulo}</span>
                  <button
                    onClick={() => handleEliminarClase(clase.id)}
                    className="text-sm bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors font-semibold flex-shrink-0"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-8">No hay clases para eliminar.</p>
        )}
      </div>
    </div>
  );
}