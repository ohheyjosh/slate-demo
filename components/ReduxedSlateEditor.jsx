import { useCallback, useMemo } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { createEditor } from "slate";
import { Slate, Editable, withReact } from "slate-react";

const mapStateToProps = createStructuredSelector({
  value: (state) => state.children,
});
const mapDispatchToProps = (dispatch) => ({
  // Action
  onChange: (payload) => {
    console.log('Action payload:', payload);
    dispatch({ type: "UPDATE", payload })
  },
});

const ReduxedSlateEditor = ({ value, onChange }) => {
  const editor = useMemo(() => withReact(createEditor()), []);

  const handleChange = useCallback(
    (nextValue) => onChange(nextValue),
    [onChange]
  );

  return (
    <Slate editor={editor} value={value} onChange={handleChange}>
      <Editable />
    </Slate>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(ReduxedSlateEditor);
