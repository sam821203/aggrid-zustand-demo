import { Link, useParams } from "react-router-dom";
import { practices } from "../practices";

export default function PracticePage() {
  const { slug } = useParams();
  const practice = practices.find((p) => p.slug === slug);

  if (!practice) {
    return (
      <div>
        <h1>找不到這個練習</h1>
        <Link to="/">回目錄</Link>
      </div>
    );
  }

  const Component = practice.component;

  return (
    <div>
      <h1>{practice.title}</h1>
      <p className="hint">{practice.description}</p>
      <Component />
    </div>
  );
}
