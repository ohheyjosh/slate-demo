import { useMemo } from "react";
import { createEditor } from "slate";
import { Slate, Editable, withReact } from "slate-react";

/**
 * Initial state for editor.children, an array of Nodes
 * (https://docs.slatejs.org/concepts/02-nodes)
 */
const initialValue = [
  {
    type: "paragraph",
    children: [{ text: "This is editable plain text, just like a <textarea>" }],
  },
];

const BasicSlateEditor = () => {
  /** 
   * createEditor() instantiates an empty Editor object,
   * which holds all state, actions, and plugins
   **/
  const editor = useMemo(() => withReact(createEditor()), []);

  return (
    <Slate editor={editor} value={initialValue}>
      <Editable />
    </Slate>
  );
};

export default BasicSlateEditor;