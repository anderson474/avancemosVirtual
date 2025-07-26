// src/components/dashboard/docente/SubirClaseDrawer.jsx

import { useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { IoClose } from "react-icons/io5";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Toolbar from "@components/dashboard/alumno/editor/toolbar";

export default function SubirClaseDrawer({
  visible,
  onClose,
  rutasDisponibles,
  onClaseCreada,
}) {
  // --- ESTADOS ---
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [rutaId, setRutaId] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const supabase = useSupabaseClient();
  const user = useUser();

  // --- CONFIGURACIÓN DE TIPTAP (CORREGIDA Y SIMPLIFICADA) ---
  // Todas las clases de estilo se centralizan aquí.
  // 'prose' se encarga de la tipografía (h1, p, etc.).
  // 'max-w-none' permite que el editor ocupe todo el ancho.
  // Las demás son clases de utilidad para el tamaño, foco y padding.
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content:
      "<p>Escribe aquí los recursos, o notas importantes para esta clase...</p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none min-h-[150px] p-2",
      },
    },
  });

  // La constante tiptapStyles y la etiqueta <style> se han eliminado.

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rutaId || !videoFile || !editor) {
      setFeedback({
        type: "error",
        message: "Completa todos los campos y selecciona un video.",
      });
      return;
    }
    setIsUploading(true);
    setFeedback({ type: "info", message: "Iniciando proceso..." });

    if (!user) {
      setIsUploading(false);
      setFeedback({
        type: "error",
        message: "Sesión expirada. Por favor, inicia sesión de nuevo.",
      });
      return;
    }

    let nuevaClaseId = null;
    let videoFilePath = null;
    const bucketId = "videos-clases";

    try {
      // PASO 1: CREAR REGISTRO DE CLASE Y RECURSOS
      setFeedback({ type: "info", message: "Creando registro de la clase..." });
      const { data: claseCreada, error: insertError } = await supabase
        .from("clases")
        .insert({ titulo, descripcion, ruta_id: rutaId })
        .select("id")
        .single();
      if (insertError) throw insertError;
      nuevaClaseId = claseCreada.id;

      const recursosHtml = editor.getHTML();
      if (recursosHtml && recursosHtml !== "<p></p>") {
        await supabase
          .from("recursos")
          .insert({ clase_id: nuevaClaseId, contenido: recursosHtml });
      }

      // PASO 2: SUBIR EL VIDEO A STORAGE
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `video.${fileExt}`;
      videoFilePath = `${nuevaClaseId}/${fileName}`;

      setFeedback({ type: "info", message: "Subiendo video..." });
      const { error: uploadError } = await supabase.storage
        .from(bucketId)
        .upload(videoFilePath, videoFile);
      if (uploadError) throw uploadError;

      // PASO 3: ACTUALIZAR CLASE CON LA URL DEL VIDEO
      setFeedback({ type: "info", message: "Guardando URL del video..." });
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketId).getPublicUrl(videoFilePath);
      const { data: claseActualizada, error: updateError } = await supabase
        .from("clases")
        .update({ video_url: publicUrl })
        .eq("id", nuevaClaseId)
        .select("*, rutas(nombre)")
        .single();
      if (updateError) throw updateError;

      // PASO 4: LLAMAR A LA API DE PROCESAMIENTO
      setFeedback({
        type: "info",
        message: "Video subido. Iniciando transcripción en segundo plano...",
      });
      const response = await fetch("/api/clases/procesar-clase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claseId: nuevaClaseId,
          filePath: videoFilePath,
          bucketId: bucketId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `El procesamiento en segundo plano falló: ${
            errorData.error || response.statusText
          }`
        );
      }

      // PASO 5: ÉXITO TOTAL
      setIsUploading(false);
      setFeedback({
        type: "success",
        message:
          "¡Clase subida! La transcripción y los embeddings se están generando.",
      });
      onClaseCreada(claseActualizada);

      // Limpieza del formulario
      setTitulo("");
      setDescripcion("");
      setRutaId("");
      setVideoFile(null);
      editor.commands.clearContent();
      document.getElementById("subir-clase-form").reset();

      setTimeout(() => {
        onClose();
        setFeedback({ type: "", message: "" });
      }, 3000);
    } catch (error) {
      setIsUploading(false);
      setFeedback({ type: "error", message: "Error: " + error.message });

      if (nuevaClaseId) {
        if (videoFilePath) {
          await supabase.storage.from(bucketId).remove([videoFilePath]);
        }
        await supabase.from("clases").delete().eq("id", nuevaClaseId);
        console.log(
          `Proceso de subida fallido. Clase ID ${nuevaClaseId} y sus archivos asociados han sido eliminados.`
        );
      }
    }
  };

  // --- RENDERIZADO DEL JSX ---
  return (
    <div
      className={`fixed top-5 right-0 h-full w-full max-w-md bg-white 
        border border-white shadow-lg z-50 rounded-2xl transform transition-transform duration-300 ease-in-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-300">
        <h2 className="text-xl font-bold text-gray-800">Subir nueva clase</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:text-red-600 hover:bg-red-100 transition-colors"
        >
          <IoClose size={24} />
        </button>
      </div>

      <form
        id="subir-clase-form"
        onSubmit={handleSubmit}
        className="p-4 space-y-6 h-full overflow-y-auto pb-24"
      >
        <div>
          <label htmlFor="titulo" className="block font-medium text-gray-700">
            Título de la clase
          </label>
          <input
            id="titulo"
            type="text"
            className="w-full mt-1 border border-gray-500 p-2 rounded-md"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="descripcion"
            className="block font-medium text-gray-700"
          >
            Descripción
          </label>
          <textarea
            id="descripcion"
            className="w-full mt-1 border border-gray-500 p-2 rounded-md"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          ></textarea>
        </div>
        <div>
          <label htmlFor="ruta" className="block font-medium text-gray-700">
            Ruta asignada
          </label>
          <select
            id="ruta"
            className="w-full mt-1 border border-gray-500 p-2 rounded-md"
            value={rutaId}
            onChange={(e) => setRutaId(e.target.value)}
            required
          >
            <option value="" disabled>
              Selecciona una ruta...
            </option>
            {rutasDisponibles.map((ruta) => (
              <option key={ruta.id} value={ruta.id}>
                {ruta.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Recursos de la clase
          </label>
          {/* --- JSX DEL EDITOR (CORREGIDO Y SIMPLIFICADO) --- */}
          <div className="border border-gray-500 rounded-lg">
            {editor && <Toolbar editor={editor} />}
            {/* EditorContent ahora renderiza el editor con las clases correctas sin necesidad de un div extra */}
            <EditorContent editor={editor} />
          </div>
        </div>
        <div>
          <label
            htmlFor="videoFile"
            className="block font-medium text-gray-700"
          >
            Video de la clase
          </label>
          <input
            id="videoFile"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>
        {feedback.message && (
          <div
            className={`p-3 rounded-md text-sm text-center ${
              feedback.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-black"
            }`}
          >
            {feedback.message}
          </div>
        )}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? "Subiendo..." : "Subir Clase"}
          </button>
        </div>
      </form>
    </div>
  );
}
