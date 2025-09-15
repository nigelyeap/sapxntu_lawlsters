import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import Message from "./Message";
import { Routes, Route, Link } from "react-router-dom";
import ChartDemo from "./pages/ChartDemo";
import CareerPath from "./pages/CareerPath";
import ChartBar from "./components/ChartBar";
import Webcam from "./components/Webcam";
import Microphone from "./components/Microphone";
import UploadPDF from "./pages/UploadPDF";

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
  const [emotion, setEmotion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [advice, setAdvice] = useState("");
  const [listening, setListening] = useState(false);
  const intervalRef = useRef(null);
  const ttsPlayedRef = useRef(false);
  const playTTS = async () => {
  if (ttsPlayedRef.current) return;
  ttsPlayedRef.current = true;
  const audio = new Audio("/api/tts");
  audio.play();
  setTimeout(() => { ttsPlayedRef.current = false; }, 2000); // reset after 2s
};  

  useEffect(() => {
    if (listening) {
      intervalRef.current = setInterval(() => {
        fetch("/api/advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emotion, transcript }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.advice) {
  setAdvice(prev => prev.includes(data.advice) ? prev : prev + "\n" + data.advice);
}
          })
          .catch(() => setAdvice(prev => prev + "\nError contacting backend"));
      }, 5000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [listening, emotion, transcript]);

  return (
    <div>
      <h2>Real-time Service Grading</h2>
      <Webcam onEmotion={setEmotion} />
      <Microphone onTranscript={setTranscript} listening={listening} />
      <div>
        <h3>Advice:</h3>
        <pre>{advice}</pre>
      </div>
      
      <button
  onClick={() => {
    setListening(l => {
      if (!l) playTTS(); // Only play if we are starting (was false)
      console.log("Button clicked, listening now:", !l);
      return !l;
    });
  }}
>
      {listening ? "Stop Listening" : "Start Listening"}
    </button>
    </div>
  );
}

export default function App() {
  return (
    <>
      <nav style={{ padding: 16 }}>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/chart" style={{ marginRight: 12 }}>Chart</Link>
        <Link to="/webcam" style={{ marginRight: 12 }}>Webcam</Link>
        <Link to="/career" style={{ marginRight: 12 }}>Career Path</Link>
        <Link to="/upload" style={{ marginRight: 12 }}>Upload PDFs</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chart" element={<ChartDemo />} />
        <Route path="/webcam" element={<WebcamPage />} />
        <Route path="/career" element={<CareerPath />} />
        <Route path="/upload" element={<UploadPDF />} />
        {/* later: <Route path="/chart/:id" element={<ChartDemo />} /> */}
      </Routes>
    </>
  );
}
