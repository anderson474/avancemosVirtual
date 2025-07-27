import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
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
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [rutaId, setRutaId] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const supabase = useSupabaseClient();

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
    let nuevaClaseId = null;

    try {
      // 1. Pedir a nuestra API que cree la clase en Supabase y nos dé un enlace de subida de Mux.
      setFeedback({
        type: "info",
        message: "Creando registro y solicitando enlace a Mux...",
      });
      const uploadRequestResponse = await fetch("/api/clases/upload-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, descripcion, rutaId }),
      });
      if (!uploadRequestResponse.ok)
        throw new Error(
          (await uploadRequestResponse.json()).message ||
            "Error al solicitar subida."
        );
      const { uploadUrl, claseId } = await uploadRequestResponse.json();
      nuevaClaseId = claseId;

      // 2. Guardar los recursos del editor de texto
      const recursosHtml = editor.getHTML();
      if (recursosHtml && recursosHtml.trim() !== "<p></p>") {
        await supabase
          .from("recursos")
          .insert({ clase_id: nuevaClaseId, contenido: recursosHtml });
      }

      // 3. Subir el archivo de video directamente al enlace seguro de Mux
      setFeedback({
        type: "info",
        message: "Subiendo video a Mux (esto puede tardar)...",
      });
      const uploadToMuxResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: videoFile,
        headers: { "Content-Type": videoFile.type },
      });
      if (!uploadToMuxResponse.ok)
        throw new Error("La subida del video a Mux falló.");

      // 4. ÉXITO del lado del cliente. El backend se encarga del resto.
      setIsUploading(false);
      setFeedback({
        type: "success",
        message: "¡Video subido! Se está procesando en segundo plano.",
      });

      const { data: claseActualizada } = await supabase
        .from("clases")
        .select("*, rutas(nombre)")
        .eq("id", nuevaClaseId)
        .single();
      if (claseActualizada) {
        onClaseCreada(claseActualizada);
      }

      // 5. Limpieza del formulario y cierre
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
      setFeedback({ type: "error", message: `Error: ${error.message}` });
      // Si el proceso falla después de crear la clase, la eliminamos para no dejar basura.
      if (nuevaClaseId) {
        await supabase.from("clases").delete().eq("id", nuevaClaseId);
      }
    }
  };

  return (
    <div
      className={`fixed top-5 right-0 h-full w-full max-w-md bg-white border border-white shadow-lg z-50 rounded-2xl transform transition-transform duration-300 ease-in-out ${
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
        {/* Título */}
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

        {/* Descripción */}
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

        {/* Ruta Asignada */}
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

        {/* Editor de Recursos */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Recursos de la clase
          </label>
          <div className="border border-gray-500 rounded-lg">
            {editor && <Toolbar editor={editor} />}
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Selector de Video */}
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

        {/* Mensajes de Feedback */}
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

        {/* Botón de Envío */}
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
