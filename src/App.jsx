import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import Message from "./Message";
import { Routes, Route, Link } from "react-router-dom";
import ChartDemo from "./pages/ChartDemo";
import ChartBar from "./components/ChartBar";
import Webcam from "./components/Webcam";
import Microphone from "./components/Microphone";

function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">

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

export function WebcamPage() {
  return (
    <div>
      <h2>SYBAU BITCH</h2>
      <Webcam />
      <Microphone />
    </div>
  );
}

export default function App() {
  return (
    <>
      <nav style={{ padding: 16 }}>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/chart">Chart</Link>
        <Link to="/webcam" style={{ marginLeft: 12 }}>Webcam</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chart" element={<ChartDemo />} />
        <Route path="/webcam" element={<WebcamPage />} />
        {/* later: <Route path="/chart/:id" element={<ChartDemo />} /> */}
      </Routes>
    </>
  );
}
