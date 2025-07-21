// @components/dashboard/alumno/editor/BubbleMenuToolbar.jsx

import { Bold, Italic, Strikethrough, Link } from 'lucide-react'; // Usaremos iconos para un look más limpio

// Componente del Toolbar para el BubbleMenu
export default function BubbleMenuToolbar({ editor }) {
  if (!editor) {
    return null;
  }
  
  // Función para añadir/editar un enlace
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return; // El usuario canceló
    if (url === '') { // El usuario quiere quitar el enlace
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex items-center gap-1 bg-slate-800 text-white p-2 rounded-lg shadow-xl">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded ${editor.isActive('bold') ? 'bg-slate-600' : 'hover:bg-slate-700'}`}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded ${editor.isActive('italic') ? 'bg-slate-600' : 'hover:bg-slate-700'}`}
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1 rounded ${editor.isActive('strike') ? 'bg-slate-600' : 'hover:bg-slate-700'}`}
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <button
        onClick={setLink}
        className={`p-1 rounded ${editor.isActive('link') ? 'bg-slate-600' : 'hover:bg-slate-700'}`}
      >
        <Link className="h-4 w-4" />
      </button>
    </div>
  );
}