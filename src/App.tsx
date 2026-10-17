import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "./layout/Layout";
import Home from "./pages/Home";
import PracticePage from "./pages/PracticePage";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="practice/:slug" element={<PracticePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
