// components/perfil/ProfileForm.jsx
import { useState, useEffect, useCallback } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Image from "next/image";

export default function ProfileForm() {
  // Así obtenemos el cliente de Supabase que creamos en _app.jsx
  const supabase = useSupabaseClient();
  // Opcional pero muy útil: obtenemos el usuario directamente con este hook
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [rol, setRol] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [apellido, setApellido] = useState("");
  const [numeroCelular, setNumeroCelular] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");

  const getProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Usamos el nombre de tu tabla 'perfiles' y tus columnas
      let { data, error, status } = await supabase
        .from("perfiles")
        .select(
          `nombre, apellido, username, avatar_url, rol, numero_celular, fecha_nacimiento, numero_documento`
        )
        .eq("id", user.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setNombre(data.nombre || "");
        setApellido(data.apellido || ""); // <-- NUEVO
        setUsername(data.username || "");
        setRol(data.rol || "");
        setNumeroCelular(data.numero_celular || ""); // <-- NUEVO
        setFechaNacimiento(data.fecha_nacimiento || ""); // <-- NUEVO
        setNumeroDocumento(data.numero_documento || ""); // <-- NUEVO
        // Si hay un avatar_url, construye la URL pública para mostrarlo
        if (data.avatar_url) {
          const { data: publicURLData } = supabase.storage
            .from("avatars")
            .getPublicUrl(data.avatar_url);
          setAvatarUrl(publicURLData.publicUrl);
        } else {
          setAvatarUrl("/default-avatar.jpg"); // Un avatar por defecto
        }
      }
    } catch (error) {
      alert("Error cargando el perfil del usuario: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const handleAvatarChange = (event) => {
    console.log("se entro al handleAvatarChange");
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setNewAvatarFile(file);
      // Previsualización de la imagen
      setAvatarUrl(URL.createObjectURL(file));
      console.log("se coloca el siguiente url en avatar: ", avatarUrl);
    }
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    setLoading(true);
    console.log("Usuario del hook useUser:", user);
    if (!user) {
      console.error("Intento de actualizar sin usuario. Abortando.");
      return;
    }
    let uploadedAvatarPath = null;

    if (newAvatarFile) {
      const fileExt = newAvatarFile.name.split(".").pop();
      // Guardamos el archivo en una carpeta con el ID del usuario para mayor orden
      const filePath = `${user.id}/${new Date().getTime()}.${fileExt}`;
      console.log("detectamos un nuevo avatar");
      let { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, newAvatarFile); // No es necesario upsert si el nombre es único

      if (uploadError) {
        alert("Error al subir la imagen: " + uploadError.message);
        setLoading(false);
        return;
      }
      uploadedAvatarPath = filePath;
    }

    const updates = {
      id: user.id,
      nombre: nombre,
      apellido: apellido,
      username: username,
      numero_celular: numeroCelular, // <-- NUEVO
      fecha_nacimiento: fechaNacimiento || null, // <-- NUEVO
      numero_documento: numeroDocumento, // <-- NUEVO
      updated_at: new Date(),
      // Solo actualiza el avatar_url si se subió uno nuevo
      ...(uploadedAvatarPath && { avatar_url: uploadedAvatarPath }),
    };
    console.log("el path de la foto de perfil: ", uploadedAvatarPath);
    console.log("Objeto de datos a enviar a Supabase (updates):", updates);
    // Usamos 'perfiles'
    let { error } = await supabase
      .from("perfiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      alert("Error actualizando el perfil: " + error.message);
      console.log("El uploadedAvatarPath: ", uploadedAvatarPath);
    } else {
      alert("¡Perfil actualizado con éxito!");
      if (uploadedAvatarPath) {
        // Forzar recarga de la imagen desde la nueva URL pública
        getProfile();
      }
    }
    setNewAvatarFile(null);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 max-w-2xl mx-auto p-8 bg-gradient-to-br from-slate-400 from-1% via-white via-15% to-white to-80% rounded-lg shadow-md overflow-y-auto mt-2">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mi Perfil</h1>

      <form onSubmit={updateProfile} className="space-y-6">
        <div className="flex items-center space-x-6">
          <Image
            src={avatarUrl || "/default-avatar.jpg"}
            alt="Avatar"
            width={100}
            height={100}
            quality={100}
            className="rounded-full object-cover w-[100px] h-[100px]"
            unoptimized
          />
          <div>
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Cambiar foto
            </label>
            <input
              type="file"
              id="avatar-upload"
              className="hidden"
              onChange={handleAvatarChange}
              accept="image/*"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="text"
            value={user?.email || ""}
            disabled
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="rol"
            className="block text-sm font-medium text-gray-700"
          >
            Rol
          </label>
          <input
            id="rol"
            type="text"
            value={rol.charAt(0).toUpperCase() + rol.slice(1)}
            disabled
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm"
          />
        </div>

        {/* Usamos un grid para organizar mejor los campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="apellido"
              className="block text-sm font-medium text-gray-700"
            >
              Apellido
            </label>
            <input
              id="apellido"
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Nombre de Usuario
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="numero_documento"
              className="block text-sm font-medium text-gray-700"
            >
              Número de Documento
            </label>
            <input
              id="numero_documento"
              type="text"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="fecha_nacimiento"
              className="block text-sm font-medium text-gray-700"
            >
              Fecha de Nacimiento
            </label>
            <input
              id="fecha_nacimiento"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="numero_celular"
            className="block text-sm font-medium text-gray-700"
          >
            Número de Celular
          </label>
          <input
            id="numero_celular"
            type="tel"
            value={numeroCelular}
            onChange={(e) => setNumeroCelular(e.target.value)}
            disabled={loading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
