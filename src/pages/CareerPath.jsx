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
    <div className="cp-container">
      <div className="cp-header">
        <h2>Career Path</h2>
        <div className="cp-controls">
          <button className="cp-btn" onClick={generate} disabled={loading}>
            {loading ? "Generating..." : "Generate from Profile"}
          </button>
          <button
            className="cp-btn secondary"
            onClick={() => setShowChart(v => !v)}
            disabled={!svgUrl}
            title={svgUrl ? "Toggle flowchart" : "Generate first to enable"}
          >
            {showChart ? "Hide Flowchart" : "Show Flowchart"}
          </button>
        </div>
      </div>
      {error && <div className="cp-error">{error}</div>}

      {headers.length > 0 && (
        <div className="cp-table-wrap">
          <table className="cp-table">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  {headers.map((h, i) => (
                    <td key={i}>
                      {timelineHeader && h === timelineHeader
                        ? (String(r[h] || "").split(/[,;\n]+/).map((t, j) => (
                            <span key={j} className="cp-chip">{t.trim()}</span>
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
        <div className="cp-md-fallback">
          <h4>Table (Markdown)</h4>
          <pre>{tableMd}</pre>
        </div>
      )}

      {svgUrl && showChart && (
        <div className="cp-chart">
          <h3>Flowchart</h3>
          <img
            src={`${svgUrl}`.startsWith('/api') ? svgUrl : `/api/career-path/flowchart.svg`}
            alt="Career Path Flowchart"
            onError={() => {
              setError("Flowchart image failed to load");
              setSvgUrl(null);
              setShowChart(false);
            }}
          />
          <div className="cp-chart-link">
            <a href={`${svgUrl}`.startsWith('/api') ? svgUrl : `/api/career-path/flowchart.svg`} target="_blank" rel="noreferrer">Open SVG in new tab</a>
          </div>
        </div>
      )}
    </div>
  );
}
