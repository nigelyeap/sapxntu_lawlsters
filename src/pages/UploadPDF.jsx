import { useState } from "react";

export default function UploadPDF() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) return setMessage("Please select PDF files to upload.");
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    files.forEach((file) => formData.append("pdfs", file));
    try {
      const res = await fetch("/api/upload-pdfs", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMessage("Upload successful! " + (data.message || ""));
    } catch (e) {
      setMessage("Error: " + (e.message || e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Upload PDF Files or Folders</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          webkitdirectory="true"
          directory="true"
        />
        <button type="submit" disabled={uploading} style={{ marginLeft: 12 }}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {message && <div style={{ marginTop: 16 }}>{message}</div>}
    </div>
  );
}
