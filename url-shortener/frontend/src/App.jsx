import { useState } from "react";

export default function App() {
  const [longUrl, setLongUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  async function handleShorten(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ longUrl })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics(shortCode) {
    const res = await fetch(`/api/analytics/${shortCode}`);
    const data = await res.json();
    setAnalytics(data);
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>URL Shortener</h1>
      <p style={styles.subheading}>
        Custom base62 encoding + token-bucket rate limiting, built from scratch.
      </p>

      <form onSubmit={handleShorten} style={styles.form}>
        <input
          type="text"
          placeholder="Paste a long URL..."
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Shortening..." : "Shorten"}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {result && (
        <div style={styles.resultBox}>
          <p>
            Short URL:{" "}
            <a href={result.shortUrl} target="_blank" rel="noreferrer">
              {result.shortUrl}
            </a>
          </p>
          <button onClick={() => fetchAnalytics(result.shortCode)} style={styles.linkButton}>
            View Analytics
          </button>
        </div>
      )}

      {analytics && (
        <div style={styles.analyticsBox}>
          <h3>Analytics for {analytics.shortCode}</h3>
          <p>Total Clicks: {analytics.totalClicks}</p>
          <p>Created: {new Date(analytics.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: 480, margin: "60px auto", fontFamily: "sans-serif", padding: 20 },
  heading: { fontSize: 28, marginBottom: 4 },
  subheading: { color: "#666", marginBottom: 24, fontSize: 14 },
  form: { display: "flex", gap: 8 },
  input: { flex: 1, padding: "10px 12px", fontSize: 14, border: "1px solid #ccc", borderRadius: 6 },
  button: { padding: "10px 16px", fontSize: 14, background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  error: { color: "#c0392b", marginTop: 12 },
  resultBox: { marginTop: 20, padding: 16, background: "#f5f5f5", borderRadius: 8 },
  linkButton: { marginTop: 8, background: "none", border: "1px solid #111", padding: "6px 10px", borderRadius: 6, cursor: "pointer" },
  analyticsBox: { marginTop: 16, padding: 16, background: "#eef", borderRadius: 8 }
};
