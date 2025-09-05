import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import Message from "./Message";
import { Routes, Route, Link } from "react-router-dom";
import ChartDemo from "./pages/ChartDemo";
import ChartBar from "./components/ChartBar";

function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>Vite + React</h1>

      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <h1><Message /></h1>
    </div>
  );
}



export default function App() {
  return (
    <>
      <nav style={{ padding: 16 }}>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/chart">Chart</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chart" element={<ChartDemo />} />
        {/* later: <Route path="/chart/:id" element={<ChartDemo />} /> */}
      </Routes>
    </>
  );
}
