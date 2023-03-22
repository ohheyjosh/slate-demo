import BasicSlateEditor from '../components/BasicSlateEditor';
import RichSlateEditor from '../components/RichSlateEditor';
import MentionSlateEditor from '../components/MentionSlateEditor';

const Index = () => {
  return (
    <main>
      <h1>Basic editor</h1>
      <BasicSlateEditor />
      <hr />
      <h1>Rich text editor</h1>
      <RichSlateEditor />
      <hr />
      <h1>@mentions editor</h1>
      <MentionSlateEditor />
    </main>
  );
};

export default Index;
