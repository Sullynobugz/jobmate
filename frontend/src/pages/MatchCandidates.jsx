import React, { useState } from "react";
import axios from "axios";

export default function MatchCandidates() {
  const [docId, setDocId] = useState("");
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState("");

  const handleMatch = async () => {
    try {
      const res = await axios.post(
        "http://localhost:8000/match-candidates/",
        null,
        {
          params: { doc_id: docId },
          headers: { Authorization: "Bearer fake-token" },
        }
      );
      setMatches(res.data);
      setError("");
    } catch (err) {
      setError("Matching failed");
      setMatches(null);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 32 }}>
      <h2>Match Candidates</h2>
      <input
        type="text"
        placeholder="Enter Doc ID"
        value={docId}
        onChange={(e) => setDocId(e.target.value)}
      />
      <button onClick={handleMatch} style={{ marginTop: 16 }}>
        Match
      </button>
      {matches && (
        <pre style={{ marginTop: 16 }}>{JSON.stringify(matches, null, 2)}</pre>
      )}
      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
    </div>
  );
}
