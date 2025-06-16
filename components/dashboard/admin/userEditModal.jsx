// src/components/dashboard/admin/userEditModal.jsx
import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function UserEditModal({ isOpen, onClose, user, allRutas, onSave }) {
  const supabase = useSupabaseClient();

  const [isLoading, setIsLoading] = useState(false);
  // Usamos un Set para manejar eficientemente los IDs de las rutas seleccionadas
  const [selectedRutaIds, setSelectedRutaIds] = useState(new Set());
  // Guardamos los IDs originales para saber qué ha cambiado
  const [originalRutaIds, setOriginalRutaIds] = useState([]);
  
  // Este efecto se ejecuta cada vez que el modal se abre para un nuevo usuario
  useEffect(() => {
    if (user && user.rol === 'alumno') {
      setIsLoading(true);
      // Reseteamos el estado anterior
      setSelectedRutaIds(new Set());

      // Buscamos las rutas que este alumno ya tiene asignadas
      const fetchAssignedRutas = async () => {
        const { data, error } = await supabase
          .from('rutas_alumnos')
          .select('ruta_id')
          .eq('alumno_id', user.id);
        
        if (error) {
          console.error("Error fetching assigned rutas:", error);
        } else {
          const assignedIds = data.map(r => r.ruta_id);
          setSelectedRutaIds(new Set(assignedIds));
          setOriginalRutaIds(assignedIds); // Guardamos el estado original
        }
        setIsLoading(false);
      };
      
      fetchAssignedRutas();
    }
  }, [user, supabase]);

  if (!isOpen) return null;

  const handleCheckboxChange = (rutaId) => {
    setSelectedRutaIds(prevIds => {
      const newIds = new Set(prevIds);
      if (newIds.has(rutaId)) {
        newIds.delete(rutaId); // Desmarcar: quitar del set
      } else {
        newIds.add(rutaId); // Marcar: añadir al set
      }
      return newIds;
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave({
      userData: user, // Pasamos los datos del usuario
      assignedRutaIds: Array.from(selectedRutaIds), // La nueva lista de IDs
      originalRutaIds: originalRutaIds, // La lista original para comparar
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-2">Editar Usuario: {user.nombre}</h2>
        <p className="text-gray-500 mb-6">{user.email}</p>

        <form onSubmit={handleFormSubmit}>
          {/* Aquí podrías añadir campos para editar nombre o rol si lo necesitas */}
          
          {user.rol === 'alumno' && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Asignar Rutas de Aprendizaje</h3>
              {isLoading ? (
                <p>Cargando rutas asignadas...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-2 border rounded">
                  {allRutas.length > 0 ? allRutas.map(ruta => (
                    <label key={ruta.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedRutaIds.has(ruta.id)}
                        onChange={() => handleCheckboxChange(ruta.id)}
                      />
                      <span className="text-gray-700">{ruta.nombre}</span>
                    </label>
                  )) : <p className="text-gray-500">No hay rutas disponibles para asignar.</p>}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}