'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    if (!email || !password) {
      setError('Por favor ingrese su correo y contraseña')
      return
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    //console.log(data)
    if (res.status !== 200) {
      setError(data.error)
      setIsLoading(false)
      console.log(data.error)
      return
    }
    setIsLoading(false)
    const rol = data.rol
    switch (rol) {
      case 'admin':
        router.push('/Dashboard/admin')
        break
      case 'docente':
        router.push('/Dashboard/docente')
        break
      case 'alumno':
        router.push('/Dashboard/alumno')
        break
      default:
        setError('Rol no reconocido')
        break
    }
  }

  return (
    <div 
      className="bg-fixed bg-center bg-cover min-h-screen"
      style={{ backgroundImage: "url('/FotoCoorporativa.jpeg')" }}
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-white p-8 rounded-lg shadow-lg w-80 mx-auto mt-20">
          <Image src="/logo.ico" width={500} height={100} alt="Logo" />
          <h2 className="text-2xl font-bold text-center text-black mb-4">Iniciar Sesión</h2>
          <form onSubmit={handleLogin} className="flex flex-col">
            <input
              className="border p-2 rounded mb-4 text-gray-500"
              type="email"
              placeholder="Ingrese su correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="border p-2 rounded mb-4 text-gray-500"
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <div className="bg-red-100 text-red-700 border border-red-400 p-2 rounded mb-4">
                {error}
              </div>
            )}
            {isLoading ? (
              <button
              type="submit"
              className="bg-gray-400 text-white py-2 rounded cursor-not-allowed"
              >
                Ingresando...
              </button>
            ) : (
              <button
              type="submit"
              className="bg-verde text-white py-2 rounded hover:bg-blue-600 transition cursor-pointer"
              >
                Entrar
              </button>
            )}
            
          </form>
        </div>
      </div>
    </div>
  )
}