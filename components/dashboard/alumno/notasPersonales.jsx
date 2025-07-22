// @components/dashboard/alumno/NotasPersonales.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Toolbar from '@components/dashboard/alumno/editor/toolbar';
import BubbleMenuToolbar from '@components/dashboard/alumno/editor/bubbleMenuToolbar';
import Lottie from 'lottie-react';
import NoteDocument from "@public/animation/NotesDocument.json";
import Link from '@tiptap/extension-link'; 

// Estilos (sin cambios)
const tiptapStyles = `
  .ProseMirror { min-height: 20rem; padding: 1.5rem; outline: none; font-size: 1rem; line-height: 1.7; color: #334155; caret-color: #4f46e5; }
  .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #94a3b8; pointer-events: none; height: 0; }
  .ProseMirror > * + * { margin-top: 1em; } .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; } .ProseMirror ul { list-style-type: disc; } .ProseMirror ol { list-style-type: decimal; } .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { line-height: 1.2; font-weight: 700; } .ProseMirror h1 { font-size: 2em; } .ProseMirror h2 { font-size: 1.5em; } .ProseMirror h3 { font-size: 1.25em; } .ProseMirror code { background-color: #e2e8f0; color: #475569; padding: 0.25em 0.5em; border-radius: 0.375rem; } .ProseMirror pre { background: #1e293b; color: #e2e8f0; font-family: 'JetBrains Mono', monospace; padding: 1rem; border-radius: 0.5rem; }
`;

export default function NotasPersonales({ claseId }) {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [status, setStatus] = useState('Cargando...'); 
  const [error, setError] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: 'Empieza a escribir tus notas aquí. Selecciona texto para formatearlo...',
      }),
      Link.configure({
        // Opcional: abre los enlaces en una nueva pestaña
        openOnClick: 'whenNotEditable', // o true si quieres que se abran siempre
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: { class: 'focus:outline-none' },
    },
    // --> Activamos el estado 'Escribiendo...' solo cuando el usuario edita
    onUpdate: () => {
      setStatus('Escribiendo...');
    },
  });

  // ---- LÓGICA DE GUARDADO (UPSERT) ----
  // --> useCallback memoriza la función para que no se recree innecesariamente.
  const guardarNota = useCallback(async () => {
    // --> Validaciones para asegurar que tenemos todo lo necesario para guardar.
    if (!editor || !user || !claseId || status === 'Guardando...') return;

    setStatus('Guardando...');
    setError(null);
    const contenidoJSON = editor.getJSON();

    // Usamos `upsert` con la opción `onConflict`.
    // Esto le dice a Supabase: "Intenta insertar esta fila. Si viola la restricción
    // 'notas_personales_user_id_clase_id_key' (la que creamos antes),
    // no falles. En su lugar, ACTUALIZA la fila existente con los nuevos datos".
    const { error: upsertError } = await supabase
      .from('notas_personales')
      .upsert(
        {
          // Datos para insertar o actualizar
          user_id: user.id,
          clase_id: claseId,
          contenido: contenidoJSON,
          // --> Es buena práctica incluir una columna de 'última actualización'
          // updated_at: new Date().toISOString(), 
        },
        {
          // --> Indicamos en qué columnas se basa el conflicto de unicidad.
          onConflict: 'user_id, clase_id',
        }
      );

    if (upsertError) {
      console.error('Error al guardar la nota (upsert):', upsertError);
      setError('No se pudo guardar la nota. Revisa tu conexión.');
      setStatus('Error');
    } else {
      setStatus('Guardado');
    }
  }, [supabase, user, claseId, editor, status]);


  // ---- LÓGICA DE CARGA INICIAL (FETCH) ----
  useEffect(() => {
    // --> No hacemos nada si el editor no está listo o si no tenemos los datos del usuario/clase.
    if (!editor || !user || !claseId) return;

    // --> Variable para evitar actualizaciones de estado en un componente desmontado.
    let isMounted = true; 

    const cargarNotaExistente = async () => {
      if (!isMounted) return;
      setStatus('Cargando...');
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notas_personales')
        .select('contenido')
        .eq('user_id', user.id)
        .eq('clase_id', claseId)
        .maybeSingle(); // --> .maybeSingle() es más seguro: devuelve null si no hay filas, sin lanzar error.

      if (!isMounted) return; // --> Comprobación por si el componente se desmonta durante la petición.

      if (fetchError) {
        console.error('Error al cargar la nota:', fetchError);
        setError('No se pudo recuperar tu nota guardada.');
        setStatus('Error');
      } else if (data && data.contenido) {
        // --> Si encontramos una nota, la cargamos en el editor.
        // El `false` como segundo argumento evita que se dispare el evento `onUpdate` al cargar.
        editor.commands.setContent(data.contenido, false);
        setStatus('Guardado'); // --> La nota ya está guardada.
      } else {
        // --> Si no hay nota, el editor ya está vacío. Estamos listos para escribir.
        setStatus('Listo');
      }
    };

    cargarNotaExistente();

    // --> Función de limpieza: se ejecuta si el componente se desmonta.
    return () => {
      isMounted = false;
    };
  }, [claseId, user, editor, supabase]); // --> Dependencias del efecto.


  // ---- LÓGICA DE AUTOGUARDADO (DEBOUNCING) ----
  useEffect(() => {
    // --> Solo activamos el autoguardado si el usuario está activamente escribiendo.
    if (status !== 'Escribiendo...') {
      return;
    }

    // --> Se crea un temporizador. Si el usuario deja de escribir por 1.5s, se guarda.
    const timerId = setTimeout(() => {
      guardarNota();
    }, 1500);

    // --> Función de limpieza: si el usuario vuelve a escribir antes de 1.5s,
    // el temporizador anterior se cancela y se inicia uno nuevo.
    return () => {
      clearTimeout(timerId);
    };
  }, [status, guardarNota]);


  // ---- RENDERIZADO DEL COMPONENTE (sin grandes cambios) ----
  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">Mis Notas Personales</h3>
        {/* Lottie y Status UI (sin cambios) */}
        <Lottie 
            animationData={NoteDocument} 
            loop={true} 
            className="w-14 h-14" 
          />
        <div className="flex items-center gap-2 text-sm text-slate-500 transition-opacity duration-300">
          {status === 'Guardando...' && <span className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></span>}
          {status === 'Guardado' && <span className="text-green-500">✓</span>}
          <span>
            {status === 'Cargando...' && 'Cargando notas...'}
            {status === 'Guardando...' && 'Guardando...'}
            {status === 'Guardado' && 'Guardado'}
            {status === 'Error' && 'Error al guardar'}
            {status === 'Listo' && 'Listo para escribir'}
            {status === 'Escribiendo...' && '...'}
          </span>
        </div>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-sm border border-slate-200">
        <style>{tiptapStyles}</style>
        {editor && (
            <BubbleMenu editor={editor} tippyOptions={{ duration: 100, placement: 'top-start' }}>
              <BubbleMenuToolbar editor={editor} />
            </BubbleMenu>
        )}
        {editor && (
          <div className="sticky top-0 z-10 bg-white/75 backdrop-blur-sm border-b border-slate-200">
            <Toolbar editor={editor} />
          </div>
        )}
        
        <EditorContent editor={editor} />
      </div>

      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  );
}
