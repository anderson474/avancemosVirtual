// @components/dashboard/alumno/editor/FloatingMenuToolbar.jsx

import { Heading1, Heading2, List, Code } from 'lucide-react';

export default function FloatingMenuToolbar({ editor }) {
  if (!editor) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg shadow-xl">
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="p-1 text-slate-600 hover:bg-slate-100 rounded">
        <Heading1 className="h-5 w-5" />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="p-1 text-slate-600 hover:bg-slate-100 rounded">
        <Heading2 className="h-5 w-5" />
      </button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="p-1 text-slate-600 hover:bg-slate-100 rounded">
        <List className="h-5 w-5" />
      </button>
       <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="p-1 text-slate-600 hover:bg-slate-100 rounded">
        <Code className="h-5 w-5" />
      </button>
    </div>
  );
}