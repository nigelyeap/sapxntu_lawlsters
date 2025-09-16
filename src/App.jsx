import { useState, useEffect, useRef } from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import CareerPath from "./pages/CareerPath";
import Webcam from "./components/Webcam";
import Microphone from "./components/Microphone";
import UploadPDF from "./pages/UploadPDF";

function Home() {
  return (
    <div style={{
      minHeight: '90vh',
      background: 'linear-gradient(120deg, #f5f7fa 0%, #eaf6fb 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '48px 0 0 0'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px #0002',
        padding: '40px 36px 32px 36px',
        maxWidth: 700,
        width: '100%',
        marginBottom: 32
      }}>
        <h1 style={{ fontWeight: 800, color: '#2c3e50', fontSize: 36, marginBottom: 10, letterSpacing: 1 }}>Project Lawlsters</h1>
        <div style={{ color: '#3498db', fontWeight: 600, fontSize: 20, marginBottom: 18 }}>AI-powered Service Training & Career Pathways</div>
        <div style={{ color: '#555', fontSize: 17, marginBottom: 30, lineHeight: 1.7 }}>
          Welcome to Lawlsters! This platform leverages Retrieval-Augmented Generation (RAG) and real-time AI to help organizations train, assess, and upskill their workforce.<br />
          <span style={{ color: '#888', fontSize: 15 }}>
            Upload your documents, generate career paths, and get instant feedback on service skills—all in one place.
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, justifyContent: 'center' }}>
          <FeatureCard icon="📄" title="Document Upload & RAG" desc="Upload PDFs, DOCX, TXT, and more. The system ingests and indexes your files for smart retrieval and Q&A." />
          <FeatureCard icon="🧑‍💼" title="Career Path Generation" desc="Generate personalized career path tables and flowcharts based on your profile and uploaded data." />
          <FeatureCard icon="🎥" title="Real-time Service Grading" desc="Use your webcam and microphone for live emotion detection, speech transcription, and instant feedback." />
          <FeatureCard icon="💬" title="Conversational LLM" desc="Ask direct questions to the RAG LLM and get concise, actionable answers." />
        </div>
        <div style={{ marginTop: 36, color: '#888', fontSize: 14, textAlign: 'center' }}>
          <b>Tip:</b> Use the navigation bar above to access each feature.<br />
          For best results, upload clear, well-formatted documents and speak clearly during service training.
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      background: '#f8fafd',
      borderRadius: 12,
      boxShadow: '0 2px 8px #0001',
      padding: '22px 20px',
      minWidth: 180,
      maxWidth: 220,
      flex: '1 1 180px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      marginBottom: 8
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: '#2c3e50', fontSize: 18, marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#555', fontSize: 15 }}>{desc}</div>
    </div>
  );
}

function DirectLLMQuery() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/direct-llm-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        // If response is not valid JSON or empty
        setAnswer("[Error] Invalid or empty response from server.");
        return;
      }
      if (!res.ok) {
        setAnswer("[Error] " + (data.error || res.statusText));
      } else if (data.answer) {
        setAnswer(data.answer);
      } else if (data.error) {
        setAnswer("[Error] " + data.error);
      } else {
        setAnswer("No response.");
      }
    } catch (e) {
      setAnswer("[Error] " + e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: '#f5f7fa',
      padding: 32
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 2px 12px #0001',
        padding: '38px 36px 32px 36px',
        maxWidth: 540,
        width: '100%',
        marginTop: 40
      }}>
        <h2 style={{ color: '#2c3e50', fontWeight: 700, marginBottom: 10 }}>Direct LLM Query</h2>
        <div style={{ color: '#555', fontSize: 16, marginBottom: 18 }}>
          Ask any question directly to the RAG-powered LLM.<br />
          <span style={{ color: '#888', fontSize: 14 }}>
            The model will use your uploaded documents and its own knowledge to answer concisely.<br />
            <b>Tip:</b> For best results, ask clear, specific questions.
          </span>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            rows={4}
            style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 7, border: "1px solid #ccc", background: '#fafbfc', resize: 'vertical' }}
            placeholder="Type your question for the RAG LLM..."
          />
          <button type="submit" disabled={loading || !query.trim()} style={{
            marginTop: 2,
            padding: '10px 0',
            fontWeight: 600,
            fontSize: 17,
            borderRadius: 6,
            background: loading ? '#aaa' : '#3498db',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}>
            {loading ? "Generating..." : "Ask"}
          </button>
        </form>
        {answer && (
          <div style={{ background: "#f8fafd", border: "1px solid #e0e4ea", borderRadius: 7, padding: 18, fontSize: 16, color: "#333", marginTop: 8 }}>
            <strong style={{ color: '#3498db' }}>Answer:</strong>
            <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{answer}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function WebcamPage() {
  // Reset to first prompt on mount (page load/refresh)
  useEffect(() => {
    setConvIdx(0);
    intervalRef.current = setInterval(() => {
  // Only send if transcript or emotion is non-empty
  if (transcript || emotion) {
    fetch("/api/advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emotion, transcript }),
    })
      .then(res => res.json())
      .then(data => {
        setGenerating(false);
        if (data.advice) {
          setAdvice(prev => prev.includes(data.advice) ? prev : prev + "\n" + data.advice);
        }
      })
      .catch(() => {
        setGenerating(false);
        setAdvice(prev => prev + "\nError contacting backend");
      });
  }
}, 5000);
  }, []);
  const [emotion, setEmotion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [advice, setAdvice] = useState("");
  const [generating, setGenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [convIdx, setConvIdx] = useState(0);
  const intervalRef = useRef(null);
  const ttsTimeoutRef = useRef(null);

  const conversationPlan = [
    "Welcome! Let's begin our patient simulation.",
    "I'm not feeling very well today, I threw up in the morning, what do you think is happening to me",
    "I feel like I might be getting sicker... are you sure you're correct?",
    "What medicine would you prescribe to me?",
  ];
  const sessionCompleteLine = "Training session complete. Thank you!";

  // Play a single voiceline by index
  const playVoiceline = (idx) => {
    let line = idx < conversationPlan.length ? conversationPlan[idx] : sessionCompleteLine;
    const utter = new SpeechSynthesisUtterance(line);
    window.speechSynthesis.speak(utter);
  };

  // Start/stop TTS and advice polling

  // Play voiceline on each start/stop listening
  useEffect(() => {
    if (listening) {
      setGenerating(true); // Show generating as soon as listening starts
      // Play current voiceline
      playVoiceline(convIdx);
      intervalRef.current = setInterval(() => {
        // Only send if transcript or emotion is non-empty
        if (transcript || emotion) {
          fetch("/api/advice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emotion, transcript }),
          })
            .then(res => res.json())
            .then(data => {
              setGenerating(false); // Hide generating when advice is received
              if (data.advice) {
                setAdvice(prev => prev.includes(data.advice) ? prev : prev + "\n" + data.advice);
              } else if (data.error) {
                setAdvice(prev => prev + "\n[Error] " + data.error);
              }
            })
            .catch(() => {
              setGenerating(false);
              setAdvice(prev => prev + "\nError contacting backend");
            });
        }
      }, 5000);
    } else {
      window.speechSynthesis.cancel();
      clearInterval(intervalRef.current);
      setGenerating(false);
      // On stop, increment to next voiceline (unless already at end)
      setConvIdx(idx => {
        if (idx < conversationPlan.length) return idx + 1;
        return idx;
      });
    }
    return () => {
      clearInterval(intervalRef.current);
      window.speechSynthesis.cancel();
      setGenerating(false);
    };
    // eslint-disable-next-line
  }, [listening]);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', background: '#f5f7fa' }}>
      <h2 style={{ margin: '32px 0 24px 0', fontWeight: 600, color: '#222' }}>Real-time Service Grading</h2>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40, width: '100%', maxWidth: 950, justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 32, minWidth: 340, maxWidth: 400 }}>
          <Webcam onEmotion={setEmotion} />
          <div style={{ margin: '18px 0 0 0', width: '100%' }}>
            <Microphone onTranscript={setTranscript} listening={listening} />
          </div>
          <button
            onClick={() => setListening(l => !l)}
            style={{ marginTop: 24, width: '100%', padding: '10px 0', fontWeight: 500, fontSize: 16, borderRadius: 6, background: listening ? '#e74c3c' : '#3498db', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
          >
            {listening ? "Stop Listening" : "Start Listening"}
          </button>
          <div style={{ marginTop: 16, color: '#555', fontSize: 15, textAlign: 'center' }}>
            <strong>Current prompt:</strong> {convIdx < conversationPlan.length ? conversationPlan[convIdx] : sessionCompleteLine}
          </div>
        </div>
        <div style={{ minWidth: 340, maxWidth: 420, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <h3 style={{ margin: 0, marginBottom: 12, color: '#2c3e50', fontWeight: 600 }}>Advice</h3>
          {generating && (
            <div style={{ color: '#888', fontStyle: 'italic', marginBottom: 8 }}>Generating...</div>
          )}
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 15, color: '#333', background: '#f8fafd', borderRadius: 6, padding: 16, width: '100%', minHeight: 180, boxSizing: 'border-box', border: '1px solid #e0e4ea' }}>{advice}</pre>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <nav style={{ padding: 16 }}>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/webcam" style={{ marginRight: 12 }}>Service Grading</Link>
        <Link to="/career" style={{ marginRight: 12 }}>Career Path</Link>
        <Link to="/upload" style={{ marginRight: 12 }}>Upload PDFs</Link>
        <Link to="/llm" style={{ marginRight: 12 }}>Direct LLM Query</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/webcam" element={<WebcamPage />} />
        <Route path="/career" element={<CareerPath />} />
        <Route path="/upload" element={<UploadPDF />} />
        <Route path="/llm" element={<DirectLLMQuery />} />
      </Routes>
    </>
  );
}
