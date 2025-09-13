import { useState, useRef } from "react";

export default function Microphone() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API not supported in this browser.");
      return;
    }
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
      if (finalTranscript) setTranscript(prev => prev + finalTranscript);
      setInterim(interimTranscript);
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
      // Optionally send transcript to backend here
      sendTranscriptToBackend(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const sendTranscriptToBackend = async (text) => {
    try {
      const response = await fetch("http://localhost:5000/process-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await response.json();
      // Optionally handle backend response
      // e.g., setTranscript(data.result || text);
    } catch (err) {
      // Handle error
    }
  };

  return (
    <div>
      <h3>Microphone</h3>
      <button onClick={listening ? stopListening : startListening}>
        {listening ? "Stop Listening" : "Start Listening"}
      </button>
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