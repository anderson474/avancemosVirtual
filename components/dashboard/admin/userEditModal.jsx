// components/dashboard/admin/UserEditModal.jsx
export default function UserEditModal({ isOpen, onClose, user, onSave }) {
  if (!isOpen) return null;

  const isNewUser = !user?.id;
  const rutasMock = ['Inglés A1', 'Excel Básico', 'Liderazgo', 'Marketing Digital'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">{isNewUser ? 'Crear Nuevo Perfil' : `Editando a ${user.nombre}`}</h2>
        
        <form onSubmit={onSave}>
          {/* SECCIÓN DATOS DEL PERFIL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input type="text" name="nombre" defaultValue={user?.nombre} placeholder="Nombre Completo" className="p-2 border rounded" required />
            <input type="email" name="email" defaultValue={user?.email} placeholder="Correo Electrónico" className="p-2 border rounded" required />
            {isNewUser && <input type="password" name="password" placeholder="Contraseña" className="p-2 border rounded" required />}
            <select name="rol" defaultValue={user?.rol || 'alumno'} className="p-2 border rounded" required>
              <option value="alumno">Alumno</option>
              <option value="docente">Docente</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* SECCIÓN ASIGNAR RUTAS (SOLO PARA ALUMNOS) */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Asignar Rutas de Aprendizaje</h3>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {rutasMock.map(ruta => (
                <label key={ruta} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                  <input type="checkbox" name="rutasAsignadas" value={ruta} />
                  <span>{ruta}</span>
                </label>
              ))}
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex justify-end mt-6 space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              {isNewUser ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}