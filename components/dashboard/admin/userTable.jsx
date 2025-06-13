// components/dashboard/admin/UserTable.jsx
const RoleBadge = ({ role }) => {
  const baseClasses = "px-2 py-1 text-xs font-bold rounded-full text-white";
  const roleStyles = {
    admin: `${baseClasses} bg-red-500`,
    docente: `${baseClasses} bg-blue-500`,
    alumno: `${baseClasses} bg-green-500`,
  };
  return <span className={roleStyles[role] || `${baseClasses} bg-gray-500`}>{role}</span>;
};

export default function UserTable({ users, onEdit, onDelete }) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full leading-normal">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm">
            <th className="px-5 py-3 border-b-2 border-gray-200">Nombre</th>
            <th className="px-5 py-3 border-b-2 border-gray-200">Email</th>
            <th className="px-5 py-3 border-b-2 border-gray-200">Rol</th>
            <th className="px-5 py-3 border-b-2 border-gray-200 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-5 py-4 border-b border-gray-200 text-sm">{user.nombre}</td>
              <td className="px-5 py-4 border-b border-gray-200 text-sm">{user.email}</td>
              <td className="px-5 py-4 border-b border-gray-200 text-sm">
                <RoleBadge role={user.rol} />
              </td>
              <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                <button 
                  onClick={() => onEdit(user)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4 font-medium"
                >
                  Editar
                </button>
                <button 
                  onClick={() => onDelete(user)}
                  className="text-red-600 hover:text-red-900 font-medium"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}