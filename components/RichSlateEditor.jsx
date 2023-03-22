import { useCallback, useMemo } from "react";
import {
  createEditor,
  Editor,
  Descendant,
  Transforms,
  Element as SlateElement,
} from "slate";
import { Slate, Editable, withReact, useSlate } from "slate-react";
import isHotkey from "is-hotkey";

const initialValue = [
  {
    type: "paragraph",
    children: [
      { text: "This is editable " },
      { text: "rich", bold: true },
      { text: " text — " },
      { text: "much", italic: true },
      { text: " better than a " },
      { text: "<textarea>", code: true },
    ],
  },
];

const RichSlateEditor = () => {
  /**
   * Core rendering function, added here so we can pass element details in the props
   * and useCallback'd to memoize the function for subsequent renders
   **/
  const renderElement = useCallback((props) => <Element {...props} />, []);

  /**
   * Render each leaf-level Text nodes
   * within a given Element container node
   * (https://docs.slatejs.org/concepts/02-nodes)
   **/
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  const editor = useMemo(() => withReact(createEditor()), []);

  /**
   * Custom onKeyDown event to handle hotkeys
   */
  const onKeyDown = (event) => {
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault();
        const mark = HOTKEYS[hotkey];
        toggleMark(editor, mark);
      }
    }
  };

  return (
    <Slate editor={editor} value={initialValue}>
      <Toolbar>
        <MarkButton format="bold" icon="B" />
        <MarkButton format="italic" icon="i" />
        <MarkButton format="code" icon="<>" />
        <BlockButton format="heading-one" icon="h1" />
        <BlockButton format="heading-two" icon="h2" />
        <BlockButton format="numbered-list" icon="1." />
        <BlockButton format="bulleted-list" icon="•" />
      </Toolbar>
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter some rich text…"
        spellCheck
        onKeyDown={onKeyDown}
      />
    </Slate>
  );
};

/**
 * Formatted Element node types
 */
const Element = (props) => {
  const { attributes, children, element } = props;
  switch (element.type) {
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>;
    case "heading-two":
      return <h2 {...attributes}>{children}</h2>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "numbered-list":
      return <ol {...attributes}>{children}</ol>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

/**
 * Formatted Leaf node types
 */
const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  return <span {...attributes}>{children}</span>;
};

/**
 * Consts for formatting hotkeys + types
 */
const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+shift+c": "code",
};
const LIST_TYPES = ["numbered-list", "bulleted-list"];

/**
 * Toolbar menu + buttons
 */
const Toolbar = ({ className, ...props }) => (
  <div
    {...props}
    style={{
      background: "#ffffff",
      borderBottom: "1px solid #162020",
      display: "block",
      margin: "0 16px",
      padding: "8px",
    }}
  />
);

const ToolbarButton = ({ className, active, ...props }) => {
  const style = {
    backgroundColor: active ? "#162020" : "transparent",
    border: active ? "1px solid #162020" : "1px solid #515e5f",
    borderRadius: "4px",
    color: active ? "#f3f4f4" : "#515e5f",
    cursor: "pointer",
    display: "inline-block",
    height: "24px",
    width: "24px",
    marginRight: "8px",
    padding: "0",
  };
  return <button {...props} style={style} />;
};

const BlockButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <ToolbarButton
      active={isBlockActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      {icon}
    </ToolbarButton>
  );
};

const MarkButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <ToolbarButton
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      {icon}
    </ToolbarButton>
  );
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format, "type");
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type),
    split: true,
  });
  const newProperties = {
    type: isActive ? "paragraph" : isList ? "list-item" : format,
  };
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor, format, blockType = "type") => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format,
    })
  );

  return !!match;
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

export default RichSlateEditor;
