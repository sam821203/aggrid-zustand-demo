import { Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { practices } from "../practices";

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <NavLink to="/" end className="brand">
          AG Grid × Zustand
        </NavLink>
        <nav>
          {practices.map((p, i) => (
            <NavLink key={p.slug} to={`/practice/${p.slug}`} className="nav-item">
              <span className="nav-index">{String(i + 1).padStart(2, "0")}</span>
              {p.title}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Suspense fallback={<p className="hint">載入中…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
