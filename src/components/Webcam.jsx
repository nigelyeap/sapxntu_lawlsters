import { useRef, useEffect, useState } from "react";

export default function Webcam({ onEmotion }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let intervalId;

    async function enableWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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
              const detectedEmotion = data.result.replace("Detected emotion: ", "").trim();
              if (onEmotion) onEmotion(detectedEmotion);
            }
          } catch (err) {
            setResult("Error contacting backend");
          }
        }
      }, 1000); // every second
    }

    if (videoRef.current) {
      videoRef.current.onloadedmetadata = startCaptureInterval;
    }

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
      <div>
        <h3>Processed Result:</h3>
        <pre>{result}</pre>
      </div>
    </div>
  );
}