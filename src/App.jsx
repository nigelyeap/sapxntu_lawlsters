import { useState, useEffect, useRef } from "react";
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
  const [emotion, setEmotion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [advice, setAdvice] = useState("");
  const [listening, setListening] = useState(false);
  const intervalRef = useRef(null);
  const ttsPlayedRef = useRef(false);
  const playTTS = async () => {
  if (ttsPlayedRef.current) return;
  ttsPlayedRef.current = true;
  const audio = new Audio("http://localhost:5000/api/tts");
  audio.play();
  setTimeout(() => { ttsPlayedRef.current = false; }, 2000); // reset after 2s
};  

  useEffect(() => {
    if (listening) {
      intervalRef.current = setInterval(() => {
        fetch("http://localhost:5000/api/advice", {
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
