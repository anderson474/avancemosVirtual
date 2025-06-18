// src/pages/perfil/index.jsx

import ProfileForm from '@components/dashboard/alumno/profileForm';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'; // Importante para getServerSideProps

export default function PerfilPage() {
  // El componente se renderiza en el cliente.
  // La protección de la ruta se hace abajo en getServerSideProps.
  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <ProfileForm />
    </main>
  );
}

// Esta función se ejecuta en el servidor ANTES de que la página se renderice.
// Es la forma ideal de proteger rutas en el Pages Router.
export const getServerSideProps = async (ctx) => {
  // Crear un cliente de Supabase para el lado del servidor
  const supabase = useSupabaseClient(); 
  // Opcional pero muy útil: obtenemos el usuario directamente con este hook
  const user = useUser(); 
  
  

  // Si no hay sesión, redirigir al usuario a la página de login
  if (!user) {
    return {
      redirect: {
        destination: '/avancemosDigital', // o la ruta que uses para iniciar sesión
        permanent: false,
      },
    };
  }

  // Si hay sesión, permite que la página se renderice
  // y pasa los datos del usuario como props si lo necesitas
  return {
    props: {
      initialSession: session,
    },
  };
};