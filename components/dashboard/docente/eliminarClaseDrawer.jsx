// src/components/dashboard/docente/eliminarClaseDrawer.jsx

import { IoClose } from 'react-icons/io5';
// 1. IMPORTAMOS EL HOOK CORRECTO
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function EliminarClaseDrawer({ visible, onClose, clases, onClaseEliminada }) {
  // 2. OBTENEMOS EL CLIENTE COMPARTIDO DESDE EL CONTEXTO
  const supabase = useSupabaseClient();

  const handleEliminarClase = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta clase? Esta acción no se puede deshacer.")) {
      return;
    }
    
    // 3. AHORA USAMOS EL CLIENTE CORRECTO Y AUTENTICADO
    const { error } = await supabase
      .from('clases')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error al eliminar la clase: ' + error.message);
    } else {
      onClaseEliminada(id);
      // Opcional: mostrar un mensaje de éxito más sutil que un alert
    }
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold">Eliminar clase</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:text-red-600 hover:bg-red-100 transition-colors">
          <IoClose size={24} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {clases && clases.length > 0 ? (
          clases.map((clase) => (
            <div key={clase.id} className="flex justify-between items-center border-b pb-2">
              <span className="truncate pr-4">{clase.titulo}</span>
              <button
                onClick={() => handleEliminarClase(clase.id)}
                className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex-shrink-0"
              >
                Eliminar
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-8">No hay clases para eliminar.</p>
        )}
      </div>
    </div>
  );
}