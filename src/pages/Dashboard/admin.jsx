// src/pages/Dashboard/admin.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

// Importa los componentes
import SlidebarAdmin from '@components/dashboard/admin/slidebarAdmin';
import UserTable from '@components/dashboard/admin/userTable';
import UserEditModal from '@components/dashboard/admin/userEditModal';

export default function AdminPage({ initialUsers, initialRutas }) {
  const router = useRouter();
  const supabase = useSupabaseClient(); // Hook para operaciones en el cliente

  const [users, setUsers] = useState(initialUsers);
  const [rutas, setRutas] = useState(initialRutas);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/avancemosDigital'); // O la ruta de login que uses
  };

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Función clave para guardar los cambios del usuario y sus rutas
  const handleSaveUser = async ({ userData, assignedRutaIds, originalRutaIds }) => {
    console.log("Guardando cambios para el usuario:", userData.nombre);
    console.log("Rutas asignadas originalmente:", originalRutaIds);
    console.log("Nuevas rutas asignadas:", assignedRutaIds);

    // --- Lógica para actualizar las rutas asignadas ---

    // 1. Calcular las rutas a AÑADIR (están en la nueva lista pero no en la original)
    const rutasParaAsignar = assignedRutaIds
      .filter(id => !originalRutaIds.includes(id))
      .map(rutaId => ({
        alumno_id: userData.id,
        ruta_id: rutaId
      }));

    // 2. Calcular las rutas a QUITAR (están en la original pero no en la nueva)
    const rutasParaQuitar = originalRutaIds.filter(id => !assignedRutaIds.includes(id));

    // 3. Ejecutar las operaciones en Supabase
    try {
      if (rutasParaAsignar.length > 0) {
        const { error: insertError } = await supabase
          .from('rutas_alumnos')
          .insert(rutasParaAsignar);
        if (insertError) throw insertError;
        console.log("Rutas asignadas con éxito:", rutasParaAsignar);
      }

      if (rutasParaQuitar.length > 0) {
        const { error: deleteError } = await supabase
          .from('rutas_alumnos')
          .delete()
          .eq('alumno_id', userData.id)
          .in('ruta_id', rutasParaQuitar);
        if (deleteError) throw deleteError;
        console.log("Rutas desasignadas con éxito:", rutasParaQuitar);
      }

      // Aquí también podrías añadir la lógica para actualizar el perfil del usuario (nombre, rol) si es necesario.
      // Por ejemplo: await supabase.from('perfiles').update({ rol: userData.rol }).eq('id', userData.id);

      alert('¡Usuario actualizado correctamente!');
      handleCloseModal();
      // Opcional: Refrescar la lista de usuarios si es necesario
      // router.replace(router.asPath); 
    } catch (error) {
      console.error("Error al actualizar las asignaciones de rutas:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${user.nombre}? Esta acción es IRREVERSIBLE y borrará todos sus datos.`)) {
      try {
        // Obtenemos el cliente de Supabase del contexto
        const { data, error } = await supabase.functions.invoke('delete-user', {
          method: 'POST',
          body: { user_id: user.id }
        });

        if (error) {
          throw error;
        }

        console.log('Respuesta de la función:', data);
        alert(`${user.nombre} ha sido eliminado permanentemente.`);
        // Actualizar la UI eliminando al usuario de la lista local
        setUsers(users.filter(u => u.id !== user.id));

      } catch (error) {
        console.error("Error al llamar a la función delete-user:", error);
        alert(`Error al eliminar el usuario: ${error.message}`);
      }
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
            {/* El botón de crear nuevo usuario se puede habilitar después */}
            {/* <button onClick={() => handleOpenModal()} className="...">+ Crear Nuevo Perfil</button> */}
          </div>
          
          <UserTable users={users} onEdit={handleOpenModal} onDelete={handleDeleteUser} />
        </div>
      </main>

      {isModalOpen && (
        <UserEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          user={editingUser}
          allRutas={rutas} // Pasamos todas las rutas disponibles al modal
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}

// --- CARGA DE DATOS DEL LADO DEL SERVIDOR ---
export async function getServerSideProps(ctx) {
  const supabase = createPagesServerClient(ctx);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { redirect: { destination: '/avancemosDigital', permanent: false } };
  }

  // Podrías añadir una verificación para asegurar que solo los 'admin' accedan aquí

  // 1. Obtener todos los perfiles de usuarios
  const { data: users, error: usersError } = await supabase
    .from('perfiles')
    .select('id, nombre, rol');

  // 2. Obtener todas las rutas de aprendizaje disponibles
  const { data: rutas, error: rutasError } = await supabase
    .from('rutas')
    .select('id, nombre');
    
  if (usersError || rutasError) {
    console.error("Error fetching data in SSR:", usersError || rutasError);
  }
  console.log('las rutas son ',rutas)
  return {
    props: {
      initialUsers: users || [],
      initialRutas: rutas || [],
    },
  };
}