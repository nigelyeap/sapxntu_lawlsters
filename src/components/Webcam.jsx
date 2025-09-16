import { useRef, useEffect, useState } from "react";

export default function Webcam({ onEmotion }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [result, setResult] = useState(null);
  const [detectedEmotion, setDetectedEmotion] = useState("");

  useEffect(() => {
    let intervalId;

    async function enableWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = startCaptureInterval;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  }
    enableWebcam();

    // Start interval after video is ready
    function startCaptureInterval() {
      intervalId = setInterval(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.videoWidth && video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/png");
          // Send to backend and get result
          try {
            const response = await fetch("http://localhost:5000/process-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: dataUrl }),
            });
            const data = await response.json();
            setResult(data.result || JSON.stringify(data));
            if (data.result && data.result.startsWith("Detected emotion: ")) {
              const emotion = data.result.replace("Detected emotion: ", "").trim();
              setDetectedEmotion(emotion);
              if (onEmotion) onEmotion(emotion);
            }
          } catch (err) {
            setResult("Error contacting backend");
          }
        }
      }, 1000); // every second
    }

    // (Removed invalid reference to 'stream' here)

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline width={400} height={300} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {detectedEmotion && (
        <div style={{ marginTop: 12, fontWeight: 600, color: '#2c3e50', fontSize: 18 }}>
          Detected Emotion: <span style={{ color: '#0074d9' }}>{detectedEmotion}</span>
        </div>
      )}
      <div>
        <h3>Processed Result:</h3>
        <pre>{result}</pre>
      </div>
    </div>
  );
}