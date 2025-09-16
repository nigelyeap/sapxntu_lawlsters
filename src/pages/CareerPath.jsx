import { useMemo, useState } from "react";

export default function CareerPath() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [svgUrl, setSvgUrl] = useState(null);
  const [tableMd, setTableMd] = useState("");
  const [showChart, setShowChart] = useState(false);

  const timelineHeader = useMemo(() => {
    const lc = headers.map(h => (h || "").toLowerCase());
    const idx = lc.findIndex(h => h.includes("timeline"));
    return idx >= 0 ? headers[idx] : null;
  }, [headers]);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/career-path/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setHeaders(data.headers || []);
      setRows(data.rows || []);
      setSvgUrl(data.svg_url || null);
      setTableMd(data.table_md || "");
      setShowChart(false);
    } catch (e) {
      setError(String(e.message || e));
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
        maxWidth: 900,
        width: '100%',
        marginTop: 40
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ color: '#2c3e50', fontWeight: 700, margin: 0 }}>Career Path</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={generate} disabled={loading} style={{
              padding: '8px 18px', fontWeight: 600, fontSize: 16, borderRadius: 6, background: loading ? '#aaa' : '#3498db', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
            }}>{loading ? "Generating..." : "Generate from Profile"}</button>
            <button onClick={() => setShowChart(v => !v)} disabled={!svgUrl} title={svgUrl ? "Toggle flowchart" : "Generate first to enable"} style={{
              padding: '8px 18px', fontWeight: 600, fontSize: 16, borderRadius: 6, background: !svgUrl ? '#ccc' : '#27ae60', color: '#fff', border: 'none', cursor: !svgUrl ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
            }}>{showChart ? "Hide Flowchart" : "Show Flowchart"}</button>
          </div>
        </div>
        <div style={{ color: '#555', fontSize: 16, marginBottom: 18 }}>
          Generate a personalized career path table and flowchart based on your profile and uploaded documents.<br />
          <span style={{ color: '#888', fontSize: 14 }}>
            The table shows recommended roles, skill gaps, timelines, and next actions. The flowchart visualizes your progression.
          </span>
        </div>
        {error && <div style={{ color: '#e74c3c', fontWeight: 500, marginBottom: 18 }}>{error}</div>}

        {headers.length > 0 && (
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', background: '#f8fafd', borderRadius: 8, boxShadow: '0 1px 4px #0001' }}>
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', background: '#eaf6fb', color: '#2c3e50', fontWeight: 700, fontSize: 16, borderBottom: '2px solid #d0e6f7' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f5f7fa' }}>
                    {headers.map((h, i) => (
                      <td key={i} style={{ padding: '10px 12px', fontSize: 15, color: '#333', borderBottom: '1px solid #e0e4ea' }}>
                        {timelineHeader && h === timelineHeader
                          ? (String(r[h] || "").split(/[,;\n]+/).map((t, j) => (
                              <span key={j} style={{
                                display: 'inline-block',
                                background: '#d0e6f7',
                                color: '#226',
                                borderRadius: 6,
                                padding: '2px 10px',
                                margin: '0 4px 4px 0',
                                fontSize: 14,
                                fontWeight: 500
                              }}>{t.trim()}</span>
                            )))
                          : (r[h] || "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Fallback: show raw markdown if table headers are missing */}
        {headers.length === 0 && tableMd && (
          <div style={{ background: '#f8fafd', border: '1px solid #e0e4ea', borderRadius: 8, padding: 18, marginBottom: 18 }}>
            <h4 style={{ color: '#2c3e50', marginBottom: 8 }}>Table (Markdown)</h4>
            <pre style={{ fontSize: 15, color: '#333', background: 'none', border: 'none', margin: 0 }}>{tableMd}</pre>
          </div>
        )}

        {svgUrl && showChart && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <h3 style={{ color: '#27ae60', fontWeight: 700, marginBottom: 10 }}>Flowchart</h3>
            <img
              src={`${svgUrl}`.startsWith('/api') ? svgUrl : `/api/career-path/flowchart.svg`}
              alt="Career Path Flowchart"
              style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #e0e4ea', boxShadow: '0 1px 4px #0001', marginBottom: 10 }}
              onError={() => {
                setError("Flowchart image failed to load");
                setSvgUrl(null);
                setShowChart(false);
              }}
            />
            <div style={{ marginTop: 6 }}>
              <a href={`${svgUrl}`.startsWith('/api') ? svgUrl : `/api/career-path/flowchart.svg`} target="_blank" rel="noreferrer" style={{ color: '#3498db', fontWeight: 600, fontSize: 15 }}>Open SVG in new tab</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
