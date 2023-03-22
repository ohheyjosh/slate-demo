import { Provider } from "react-redux";
import { createStore } from "redux";
import ReduxedSlateEditor from "../components/ReduxedSlateEditor";

const initialState = () => ({
  children: [
    {
      type: "paragraph",
      children: [
        {
          text: "This is editable plain text, just like a <textarea> but stored in Redux",
        },
      ],
    },
  ],
});

// Reducer
const editorValue = (prevState = initialState(), action) => {
  let state = prevState;

  switch (action.type) {
    case "UPDATE":
      state = {
        ...state,
        children: action.payload,
      };
      break;
    default:
      state = prevState;
  }

  return state;
};

const store = createStore(editorValue);

const Redux = () => (
  <main>
    <h1>Redux'd @mentions editor</h1>
    <Provider store={store}>
      <ReduxedSlateEditor />
    </Provider>
  </main>
);

export default Redux;
