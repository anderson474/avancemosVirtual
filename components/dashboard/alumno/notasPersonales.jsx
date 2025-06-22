// @components/dashboard/alumno/NotasPersonales.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Toolbar from '@components/dashboard/alumno/editor/toolbar'; // Asegúrate que la ruta es correcta

// Estilos para el contenido del editor... (esto se queda igual)
const tiptapStyles = `
  /* Contenedor principal del editor */
  .ProseMirror {
    min-height: 16rem; /* 256px */
    padding: 0.75rem;
    outline: none;
    line-height: 1.6; /* Mejora la legibilidad */
  }

  /* Espacio entre párrafos, encabezados, etc. */
  .ProseMirror > * + * {
    margin-top: 0.75em;
  }

  /* ESTILOS PARA LAS LISTAS (LA SOLUCIÓN) */
  .ProseMirror ul {
    list-style-type: disc; /* Dibuja los puntos (viñetas) */
    padding-left: 1.5rem;  /* Añade sangría a la izquierda */
  }

  .ProseMirror ol {
    list-style-type: decimal; /* Dibuja los números */
    padding-left: 1.5rem;   /* Añade sangría a la izquierda */
  }
  
  .ProseMirror li > p {
    margin: 0; /* Evita márgenes dobles dentro de los elementos de la lista */
  }

  /* Estilos para encabezados */
  .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
    line-height: 1.1;
    font-weight: 600; /* semi-bold */
  }

  .ProseMirror h1 { font-size: 1.5em; }
  .ProseMirror h2 { font-size: 1.25em; }
  .ProseMirror h3 { font-size: 1.1em; }

  /* Estilos para código, citas, etc. */
  .ProseMirror code {
    background-color: #F1F5F9; /* bg-slate-100 */
    color: #475569; /* text-slate-600 */
    padding: 0.25em 0.5em;
    border-radius: 0.25em;
    font-family: monospace;
  }
`;

export default function NotasPersonales({ claseId }) {
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [status, setStatus] = useState('Listo');
  const [error, setError] = useState(null);

  // --- ELIMINADO --- No necesitamos el estado 'nota' ni 'handleChange'
  // const [nota, setNota] = useState('');

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content: '',
    editorProps: {
      attributes: { class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none' },
    },
    // El 'onUpdate' ya se encarga de cambiar el estado cuando el usuario escribe
    onUpdate: () => {
      setStatus('Escribiendo...');
    },
  });

  // --- CORRECCIÓN 1: useEffect para cargar la nota ---
  useEffect(() => {
    // La guarda: si no hay usuario, claseId, o el editor no está listo, no hacer nada.
    if (!user || !claseId || !editor) {
      return;
    }

    // Ponemos el editor en modo 'no editable' mientras carga para evitar conflictos
    editor.setEditable(false);
    setStatus('Cargando...');

    const fetchNota = async () => {
      const { data } = await supabase.from('notas_personales').select('contenido').eq('alumno_id', user.id).eq('clase_id', claseId).single();
      const content = data?.contenido || '';
      
      // Verificamos que el contenido sea diferente para evitar un bucle infinito de actualizaciones
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content, false); // 'false' para no disparar el evento onUpdate
      }
      setStatus('Listo');
      editor.setEditable(true); // Volvemos a hacerlo editable
    };

    fetchNota();
  }, [claseId, user, editor]); // Dependencia correcta: solo en editor, no en supabase

  // --- CORRECCIÓN 2: Lógica de autoguardado ---
  const guardarNota = useCallback(async () => {
    // La guarda: si el editor no está listo, no hacer nada.
    if (!user || !claseId || !editor) return;
    
    setStatus('Guardando...');
    const htmlContent = editor.getHTML(); // Obtenemos el contenido directamente del editor

    const { error } = await supabase.from('notas_personales').upsert({
      alumno_id: user.id,
      clase_id: claseId,
      contenido: htmlContent,
      updated_at: new Date().toISOString()
    }, { onConflict: 'alumno_id, clase_id' });
      
    if (error) {
      setError('No se pudo guardar la nota.');
      setStatus('Error');
    } else {
      setStatus('Guardado');
    }
  }, [claseId, user, editor, supabase]); // Añadimos supabase a las dependencias

  // --- CORRECCIÓN 3: useEffect para el autoguardado ---
  useEffect(() => {
    // Si el editor no existe, no configurar el temporizador
    if (!editor) return;

    // Solo configuramos el temporizador si el estado es 'Escribiendo...'
    if (status === 'Escribiendo...') {
      const timeoutId = setTimeout(() => {
        guardarNota();
      }, 1500); // 1.5 segundos

      return () => clearTimeout(timeoutId);
    }
  }, [editor, status, guardarNota]); // Las dependencias son el estado y la función de guardado

  // --- ELIMINADO --- Ya no necesitamos esta función
  // const handleChange = (e) => { ... };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Mis Notas Personales</h3>
      <div className="border border-gray-300 rounded-lg">
        <style>{tiptapStyles}</style>
        {/* La guarda aquí también es importante */}
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
      <div className="text-right text-xs text-gray-500 mt-2">
        {status === 'Guardando...' && 'Guardando...'}
        {status === 'Guardado' && '✓ Todos los cambios guardados'}
        {status === 'Error' && '✗ Error al guardar'}
        {status === 'Escribiendo...' && '...'}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}