import React, { useState } from "react";
import axios from "axios";

export default function ExtractionReview() {
  const [docId, setDocId] = useState("");
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");

  const handleReview = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/extraction-review/${docId}`,
        {
          headers: { Authorization: "Bearer fake-token" },
        }
      );
      setReview(res.data);
      setError("");
    } catch (err) {
      setError("Review failed");
      setReview(null);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 32 }}>
      <h2>Extraction Review</h2>
      <input
        type="text"
        placeholder="Enter Doc ID"
        value={docId}
        onChange={(e) => setDocId(e.target.value)}
      />
      <button onClick={handleReview} style={{ marginTop: 16 }}>
        Review
      </button>
      {review && (
        <pre style={{ marginTop: 16 }}>{JSON.stringify(review, null, 2)}</pre>
      )}
      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
    </div>
  );
}
