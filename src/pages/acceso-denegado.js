import Link from 'next/link'
import { useRouter } from 'next/router'
import { createClient } from '@utils/supabase/client' // Ajusta esta ruta a donde tengas tu cliente de Supabase para el frontend

export default function AccesoDenegado() {
  const router = useRouter()
  const supabase = createClient() // Si usas '@supabase/auth-helpers-nextjs', la función podría llamarse createBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login') // Redirige al login después de cerrar sesión
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        
        {/* Ícono de "Stop" o "Prohibido" */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 bg-red-100 rounded-full">
          <svg 
            className="h-10 w-10 text-red-600" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-800">Acceso Denegado</h1>
        
        <p className="text-gray-600">
          Lo sentimos, parece que no tienes los permisos necesarios para ver esta página.
        </p>

        <p className="text-sm text-gray-500">
          Esto puede deberse a que tu rol de usuario (alumno, docente, etc.) no tiene acceso a esta sección específica.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link href="/">
            <a className="w-full sm:w-auto px-4 py-2 text-white bg-[rgba(45,168,54,1)] rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Ir a la Página Principal
            </a>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cerrar sesión e intentarlo de nuevo
          </button>
        </div>

        <div className="pt-4 text-xs text-gray-400">
          <p>Si crees que esto es un error, por favor contacta al administrador del sistema.</p>
        </div>
      </div>
    </div>
  )
}