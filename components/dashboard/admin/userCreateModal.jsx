// @components/dashboard/admin/UserCreateModal.jsx
import { useState } from 'react';

export default function UserCreateModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    username: '',
    numero_celular: '',
    fecha_nacimiento: '',
    numero_documento: '',
    rol: 'alumno', // Rol por defecto
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Llamamos a la función onSave pasada desde el padre
    onSave(formData).finally(() => setIsLoading(false));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Crear Nuevo Usuario</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campos del formulario */}
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="p-2 border rounded" />
            <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required className="p-2 border rounded" />
            <input name="nombre" placeholder="Nombre" onChange={handleChange} required className="p-2 border rounded" />
            <input name="apellido" placeholder="Apellido" onChange={handleChange} required className="p-2 border rounded" />
            <input name="username" placeholder="Nombre de usuario" onChange={handleChange} required className="p-2 border rounded" />
            <input name="numero_documento" placeholder="Nº Documento" onChange={handleChange} required className="p-2 border rounded" />
            <input name="numero_celular" placeholder="Nº Celular" onChange={handleChange} className="p-2 border rounded" />
            <input name="fecha_nacimiento" type="date" placeholder="Fecha de Nacimiento" onChange={handleChange} className="p-2 border rounded" />
            <select name="rol" value={formData.rol} onChange={handleChange} required className="p-2 border rounded md:col-span-2">
              <option value="alumno">Alumno</option>
              <option value="docente">Docente</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4 mt-8">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {isLoading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}