import { useState, useRef, useEffect } from "react";

export default function Microphone({ onTranscript, listening }) {
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef(null);

  // Call onTranscript only when transcript changes, not during render
  useEffect(() => {
    if (onTranscript) onTranscript(transcript);
  }, [transcript, onTranscript]);

  useEffect(() => {
    console.log(listening)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
      setInterim(interimTranscript);
    };

    recognitionRef.current = recognition;

    if (listening) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => {
      recognition.stop();
    };
  }, [listening]);

  return (
    <div>
      <div>
        <strong>Transcript:</strong>
        <div style={{ minHeight: 40, border: "1px solid #ccc", padding: 8, marginTop: 8 }}>
          {transcript}
          <span style={{ color: "#888" }}>{interim}</span>
        </div>
      </div>
    </div>
  );
}