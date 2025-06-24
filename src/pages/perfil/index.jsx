// src/pages/perfil/index.jsx

import ProfileForm from '@components/dashboard/alumno/profileForm';
// IMPORTANTE: Esta es la función correcta para el servidor
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

// El componente de la página se queda igual
export default function PerfilPage() {
  return (
    <main className="bg-fixed bg-center bg-cover min-h-screen"
      style={{ backgroundImage: "url('/FotoCoorporativa.jpeg')" }}>
      <ProfileForm />
    </main>
  );
}

// ESTA ES LA FUNCIÓN QUE CORREGIMOS
export const getServerSideProps = async (ctx) => {
  // 1. Crear un cliente de Supabase para el SERVIDOR
  const supabase = createPagesServerClient(ctx);
  
  // 2. Obtener la sesión del usuario DESDE EL SERVIDOR
  const { data: { session } } = await supabase.auth.getSession();

  // 3. Si no hay sesión, redirigir
  if (!session) {
    return {
      redirect: {
        destination: '/login', // o tu ruta de login
        permanent: false,
      },
    };
  }

  // 4. Si hay sesión, permitir que la página se renderice
  // Pasamos 'initialSession' como prop para que el contexto del lado del cliente se cargue más rápido
  return {
    props: {
      initialSession: session,
    },
  };
};