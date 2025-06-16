// src/components/dashboard/docente/eliminarRutas.jsx

import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
// 1. IMPORTAMOS EL HOOK CORRECTO
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function EliminarRutaDrawer({ visible, onClose, rutas, onRutaEliminada }) {
  // 2. OBTENEMOS EL CLIENTE COMPARTIDO DESDE EL CONTEXTO
  const supabase = useSupabaseClient();
  
  // Estados para una mejor UX
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const handleEliminarRuta = async (ruta) => {
    // Usamos el ID de la ruta para saber cuál botón deshabilitar
    setDeletingId(ruta.id); 
    setFeedback({ type: '', message: '' });

    if (!window.confirm(`¿Estás seguro de que quieres eliminar la ruta "${ruta.nombre}"? Todas las clases asociadas también serán eliminadas. Esta acción no se puede deshacer.`)) {
      setDeletingId(null);
      return;
    }
    
    // 3. AHORA USAMOS EL CLIENTE CORRECTO Y AUTENTICADO
    // Supabase se encargará de borrar en cascada las clases asociadas
    // gracias al 'ON DELETE CASCADE' que definimos en la tabla 'clases'.
    const { error } = await supabase
      .from('rutas')
      .delete()
      .eq('id', ruta.id);

    if (error) {
      setFeedback({ type: 'error', message: 'Error al eliminar la ruta: ' + error.message });
      setDeletingId(null);
      return;
    }
    
    // Si todo sale bien, actualizamos la UI
    setFeedback({ type: 'success', message: `¡Ruta "${ruta.nombre}" eliminada con éxito!` });
    onRutaEliminada(ruta.id);
    
    // Reseteamos el estado del botón después de un momento
    setTimeout(() => {
        setDeletingId(null);
        setFeedback({ type: '', message: '' });
    }, 2000);
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold">Eliminar ruta</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:text-red-600 hover:bg-red-100 transition-colors">
          <IoClose size={24} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {feedback.message && (
          <div className={`p-3 rounded-md text-sm text-center mb-4 ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.message}
          </div>
        )}

        {rutas && rutas.length > 0 ? (
          rutas.map((ruta) => (
            <div key={ruta.id} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-semibold">{ruta.nombre}</p>
                <p className="text-sm text-gray-500">{ruta.nivel} - {ruta.idioma}</p>
              </div>
              <button
                onClick={() => handleEliminarRuta(ruta)}
                disabled={deletingId === ruta.id}
                className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex-shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {deletingId === ruta.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-8">No hay rutas para eliminar.</p>
        )}
      </div>
    </div>
  );
}