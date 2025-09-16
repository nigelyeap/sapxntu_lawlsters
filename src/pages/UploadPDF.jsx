
import { useState, useEffect } from "react";

function UploadPDF() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [backendFiles, setBackendFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoadingFiles(true);
      try {
        const res = await fetch("/api/list-backend-files");
        const data = await res.json();
        if (res.ok && Array.isArray(data.files)) {
          setBackendFiles(data.files);
        } else {
          setBackendFiles([]);
        }
      } catch {
        setBackendFiles([]);
      } finally {
        setLoadingFiles(false);
      }
    };
    fetchFiles();
  }, [message]); // re-fetch after upload

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) return setMessage("Please select files to upload.");
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
        borderRadius: 12,
        boxShadow: '0 2px 12px #0001',
        padding: 36,
        maxWidth: 520,
        width: '100%',
        marginTop: 40
      }}>
        <h2 style={{ color: '#2c3e50', fontWeight: 700, marginBottom: 12 }}>Upload Files for RAG Ingestion</h2>
        <p style={{ color: '#555', fontSize: 16, marginBottom: 18 }}>
          Select <b>one or more files</b> (PDF, DOCX, TXT, etc.) to upload and update the RAG system.<br />
          <span style={{ color: '#888', fontSize: 14 }}>
            Supported: PDF, DOCX, TXT, CSV, and more. You can select multiple files at once.<br />
            After upload, the system will process and index your documents for retrieval-augmented generation.
          </span>
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ fontSize: 16, padding: 8, borderRadius: 6, border: '1px solid #ccc', background: '#fafbfc' }}
          />
          {files.length > 0 && (
            <div style={{ fontSize: 15, color: '#333', marginBottom: 4 }}>
              <b>Selected files:</b>
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                {files.map((f, i) => (
                  <li key={i}>{f.name} <span style={{ color: '#aaa', fontSize: 13 }}>({(f.size/1024).toFixed(1)} KB)</span></li>
                ))}
              </ul>
            </div>
          )}
          <button type="submit" disabled={uploading} style={{
            marginTop: 8,
            padding: '10px 0',
            fontWeight: 600,
            fontSize: 17,
            borderRadius: 6,
            background: uploading ? '#aaa' : '#3498db',
            color: '#fff',
            border: 'none',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}>
            {uploading ? "Uploading..." : `Upload${files.length ? ` (${files.length})` : ''}`}
          </button>
        </form>
        {message && <div style={{ marginTop: 20, color: message.startsWith('Error') ? '#e74c3c' : '#27ae60', fontWeight: 500 }}>{message}</div>}
        <div style={{ marginTop: 32, color: '#888', fontSize: 14, lineHeight: 1.7 }}>
          <b>How it works:</b><br />
          1. Select your files and click Upload.<br />
          2. The backend will process and extract text from your documents.<br />
          3. The RAG system will update its index for improved retrieval and answers.<br />
          <br />
          <b>Tip:</b> For best results, upload clear, well-formatted documents. Large files may take longer to process.
        </div>
        <div style={{ marginTop: 38, color: '#2c3e50', fontWeight: 700, fontSize: 18 }}>Files in System</div>
        <div style={{ marginTop: 10, marginBottom: 8, color: '#888', fontSize: 14 }}>
          These are the files currently stored in the backend data folder. Click to view or download.
        </div>
        <div style={{ minHeight: 40, marginBottom: 8 }}>
          {loadingFiles ? (
            <span style={{ color: '#888' }}>Loading files...</span>
          ) : backendFiles.length === 0 ? (
            <span style={{ color: '#aaa' }}>No files found.</span>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {backendFiles.map((f, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <a href={`/api/download-backend-file?file=${encodeURIComponent(f)}`} target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'underline', fontSize: 15 }}>{f}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadPDF;
