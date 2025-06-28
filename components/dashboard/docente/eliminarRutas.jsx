// src/components/dashboard/docente/eliminarRutas.jsx

import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function EliminarRutaDrawer({ visible, onClose, rutas, onRutaEliminada }) {
  const supabase = useSupabaseClient();
  const [deletingId, setDeletingId] = useState(null);
  // El estado de feedback ya está bien implementado, lo conservamos.
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const handleEliminarRuta = async (ruta) => {
    setDeletingId(ruta.id);
    setFeedback({ type: '', message: '' });

    // 1. MEJORAMOS EL MENSAJE DE CONFIRMACIÓN CON EL NÚMERO DE CLASES
    const classCount = ruta.clases?.length || 0;
    const confirmationMessage = classCount > 0 
      ? `¿Estás seguro de que quieres eliminar la ruta "${ruta.nombre}"? Se eliminarán también las ${classCount} clases que contiene. Esta acción es irreversible.`
      : `¿Estás seguro de que quieres eliminar la ruta vacía "${ruta.nombre}"? Esta acción es irreversible.`;

    if (!window.confirm(confirmationMessage)) {
      setDeletingId(null);
      return;
    }
    
    const { error } = await supabase
      .from('rutas')
      .delete()
      .eq('id', ruta.id);

    if (error) {
      setFeedback({ type: 'error', message: 'Error al eliminar la ruta: ' + error.message });
    } else {
      setFeedback({ type: 'success', message: `¡Ruta "${ruta.nombre}" eliminada con éxito!` });
      onRutaEliminada(ruta.id);
    }
    
    // El reseteo del estado es una buena UX
    setTimeout(() => {
        setDeletingId(null);
        if (!error) {
            setFeedback({ type: '', message: '' });
        }
    }, 3000);
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* 2. ENCABEZADO CONSISTENTE Y PULIDO */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Eliminar Rutas</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <IoClose size={24} className="text-gray-600" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-65px)]">
        {feedback.message && (
          <div className={`p-3 rounded-md text-sm text-center mb-4 ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.message}
          </div>
        )}

        {/* 3. RENDERIZADO CON DISEÑO DE TARJETAS */}
        {rutas && rutas.length > 0 ? (
          rutas.map((ruta) => {
            const classCount = ruta.clases?.length || 0;
            return (
              <div key={ruta.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                {/* Información de la ruta */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{ruta.nombre}</h3>
                  <p className="text-sm text-gray-600">{ruta.nivel} - {ruta.idioma}</p>
                </div>

                {/* Información crítica (conteo de clases) */}
                <div className={`text-sm font-medium p-2 rounded-md text-center ${classCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                  {classCount > 0 ? `Contiene ${classCount} clase(s)` : 'Esta ruta no tiene clases'}
                </div>

                {/* Botón de acción */}
                <button
                  onClick={() => handleEliminarRuta(ruta)}
                  disabled={deletingId === ruta.id}
                  className="w-full text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deletingId === ruta.id ? 'Eliminando...' : 'Eliminar Ruta Permanentemente'}
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 mt-8">No hay rutas para eliminar.</p>
        )}
      </div>
    </div>
  );
}