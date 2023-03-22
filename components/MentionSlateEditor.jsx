import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  createEditor,
  Editor,
  Descendant,
  Range,
  Transforms,
  Element as SlateElement,
} from "slate";
import {
  Slate,
  Editable,
  ReactEditor,
  withReact,
  useSlate,
  useSelected,
  useFocused,
} from "slate-react";
import isHotkey from "is-hotkey";

const initialValue = [
  {
    type: "paragraph",
    children: [
      {
        text: "This rich text editor supports @-mentions. Try mentioning anyone in the working group, like ",
      },
      {
        type: "mention",
        username: "margie",
        children: [{ text: "" }],
      },
      { text: " or " },
      {
        type: "mention",
        username: "tim.deuchler",
        children: [{ text: "" }],
      },
      { text: "!" },
    ],
  },
];

const MentionSlateEditor = () => {
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  // Added withMentions() provider
  const editor = useMemo(() => withMentions(withReact(createEditor())), []);

  // Added username search state and parser
  const ref = useRef();
  const [target, setTarget] = useState();
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");
  const users = USERNAMES.filter((u) =>
    u.toLowerCase().startsWith(search.toLowerCase())
  ).slice(0, 10);

  const onKeyDown = useCallback(
    (event) => {
      for (const hotkey in HOTKEYS) {
        if (isHotkey(hotkey, event)) {
          event.preventDefault();
          const mark = HOTKEYS[hotkey];
          toggleMark(editor, mark);
        }
      }

      /**
       * Navigate through Portal'd search menu
       */
      if (target && users.length > 0) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            const prevIndex = index >= users.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
            break;
          case "ArrowUp":
            event.preventDefault();
            const nextIndex = index <= 0 ? users.length - 1 : index - 1;
            setIndex(nextIndex);
            break;
          case "Tab":
          case "Enter":
            event.preventDefault();
            Transforms.select(editor, target);
            insertMention(editor, users[index]);
            setTarget(null);
            break;
          case "Escape":
            event.preventDefault();
            setTarget(null);
            break;
        }
      }
    },
    [index, search, target]
  );

  /**
   * Effect loop to render Portal'd search results
   */
  useEffect(() => {
    if (target && users.length > 0) {
      const el = ref.current;
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange.getBoundingClientRect();
      el.style.top = `${rect.top + window.pageYOffset + 24}px`;
      el.style.left = `${rect.left + window.pageXOffset}px`;
    }
  }, [users.length, editor, index, search, target]);

  return (
    <Slate
      editor={editor}
      value={initialValue}
      onChange={() => {
        const { selection } = editor;

        if (selection && Range.isCollapsed(selection)) {
          const [start] = Range.edges(selection);
          const wordBefore = Editor.before(editor, start, { unit: "word" });
          const before = wordBefore && Editor.before(editor, wordBefore);
          const beforeRange = before && Editor.range(editor, before, start);
          const beforeText = beforeRange && Editor.string(editor, beforeRange);
          const beforeMatch = beforeText && beforeText.match(/^@(\w+)$/);
          const after = Editor.after(editor, start);
          const afterRange = Editor.range(editor, start, after);
          const afterText = Editor.string(editor, afterRange);
          const afterMatch = afterText.match(/^(\s|$)/);

          if (beforeMatch && afterMatch) {
            setTarget(beforeRange);
            setSearch(beforeMatch[1]);
            setIndex(0);
            return;
          }
        }

        setTarget(null);
      }}
    >
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
      {target && users.length > 0 && (
        <Portal>
          <div
            ref={ref}
            style={{
              top: "-9999px",
              left: "-9999px",
              position: "absolute",
              zIndex: 1,
              background: "#f3f4f4",
              borderRadius: "4px",
              boxShadow: "0 1px 4px rgba(0,0,0,.2)",
              padding: "4px",
            }}
          >
            {users.map((user, i) => (
              <div
                key={user}
                onClick={() => {
                  Transforms.select(editor, target);
                  insertMention(editor, user);
                  setTarget(null);
                }}
                style={{
                  padding: "4px",
                  borderRadius: "4px",
                  background: i === index ? "#0ca750" : "transparent",
                  color: i === index ? "#f3f4f4" : "#162020",
                }}
              >
                {user}
              </div>
            ))}
          </div>
        </Portal>
      )}
    </Slate>
  );
};

/**
 * Custom Mention element type + mentionable usernames
 */
const Mention = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();

  return (
    <span
      {...attributes}
      contentEditable={false}
      style={{
        backgroundColor: "#f3f4f4",
        borderRadius: "4px",
        display: "inline-block",
        margin: "0 auto",
        padding: "4px",
      }}
    >
      @{element.username}
      {children}
    </span>
  );
};

const withMentions = (editor) => {
  const { isInline, isVoid, markableVoid } = editor;

  editor.isInline = (element) => {
    return element.type === "mention" ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === "mention" ? true : isVoid(element);
  };

  editor.markableVoid = (element) => {
    return element.type === "mention" || markableVoid(element);
  };

  return editor;
};

const insertMention = (editor, username) => {
  const mention = {
    type: "mention",
    username,
    children: [{ text: "" }],
  };
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
};

const USERNAMES = [
  "ben",
  "CJ",
  "cory.faller",
  "daniel.macdonald",
  "doug",
  "erinn",
  "henry",
  "Jason",
  "josh.barnett",
  "jritterbush",
  "margie",
  "mark",
  "matt.wade",
  "mattpilla",
  "Rob Bruhn",
  "ryanskurkis",
  "Stephanie Barker",
  "tim.deuchler",
  "travis",
];

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
    // added Mention type
    case "mention":
      return <Mention {...props} />;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

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

const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+shift+c": "code",
};
const LIST_TYPES = ["numbered-list", "bulleted-list"];

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

/**
 * Simple createPortal wrapper for rendering mentions
 */
const Portal = ({ children }) => createPortal(children, document.body);

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

export default MentionSlateEditor;
