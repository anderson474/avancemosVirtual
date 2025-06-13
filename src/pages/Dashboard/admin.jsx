// src/pages/Dashboard/admin.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@utils/supabase/client';

// Importa los componentes de admin
import SlidebarAdmin from '@components/dashboard/admin/slidebarAdmin';
import UserTable from '@components/dashboard/admin/userTable';
import UserEditModal from '@components/dashboard/admin/userEditModal';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  // --- ESTADOS PARA CONTROLAR EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // --- DATOS DE PRUEBA ---
  const users = [
    { id: 1, nombre: 'Ana García', email: 'ana.g@email.com', rol: 'alumno' },
    { id: 2, nombre: 'Luis Pérez', email: 'luis.p@email.com', rol: 'docente' },
    { id: 3, nombre: 'Sofía López', email: 'sofia.l@email.com', rol: 'admin' },
    { id: 4, nombre: 'Carlos Ruiz', email: 'carlos.r@email.com', rol: 'alumno' },
  ];
  // --- FIN DE DATOS DE PRUEBA ---

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  const handleOpenModal = (user = null) => {
    setEditingUser(user); // Si no hay usuario, es para crear uno nuevo
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };
  
  const handleSaveUser = (event) => {
    event.preventDefault();
    // Aquí iría la lógica para guardar en Supabase
    console.log("Guardando usuario...");
    handleCloseModal();
  };

  const handleDeleteUser = (user) => {
    // Confirmación antes de borrar
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${user.nombre}?`)) {
      // Aquí iría la lógica para borrar de Supabase
      console.log(`Eliminando a ${user.nombre}...`);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <SlidebarAdmin onLogout={handleLogout} />
      
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
        
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Gestión de Usuarios</h2>
            <button 
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
            >
              + Crear Nuevo Perfil
            </button>
          </div>
          
          <UserTable users={users} onEdit={handleOpenModal} onDelete={handleDeleteUser} />
        </div>
      </main>

      <UserEditModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
}