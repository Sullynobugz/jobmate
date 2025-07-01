import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8000/dashboard/", {
        headers: { Authorization: "Bearer fake-token" },
      })
      .then((res) => setData(res.data));
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 32 }}>
      <h2>Dashboard</h2>
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
