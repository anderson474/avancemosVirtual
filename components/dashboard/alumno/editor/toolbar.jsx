// @components/dashboard/alumno/editor/Toolbar.jsx
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2,
  Heading3, List, ListOrdered, Quote, Minus
} from 'lucide-react'; // Usaremos Lucide para iconos limpios, pero puedes usar Heroicons

export default function Toolbar({ editor }) {
  if (!editor) {
    return null;
  }

  const buttonClass = (isActive) => 
    `p-2 rounded ${isActive ? 'bg-gray-300' : 'hover:bg-gray-200'}`;

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-b border-gray-300">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        title="Negrita"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        title="Cursiva"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={buttonClass(editor.isActive('strike'))}
        title="Tachado"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <div className="h-6 w-px bg-gray-300" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 1 }))}
        title="Título 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        title="Título 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 3 }))}
        title="Título 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>
      <div className="h-6 w-px bg-gray-300" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        title="Lista"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        title="Lista Numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );
}