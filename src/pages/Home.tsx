import { Link } from "react-router-dom";
import { practices } from "../practices";

export default function Home() {
  return (
    <div>
      <h1>練習目錄</h1>
      <p className="hint">AG Grid + Zustand 的小練習，共 {practices.length} 個。</p>
      <ul className="practice-list">
        {practices.map((p) => (
          <li key={p.slug}>
            <Link to={`/practice/${p.slug}`} className="practice-card">
              <div className="practice-card-head">
                <strong>{p.title}</strong>
                <span className="practice-date">{p.date}</span>
              </div>
              <p>{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
