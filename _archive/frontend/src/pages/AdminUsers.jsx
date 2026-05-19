import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8000/admin/users/", {
        headers: { Authorization: "Bearer fake-token" },
      })
      .then((res) => setUsers(res.data))
      .catch(() => setError("Not authorized or error"));
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 32 }}>
      <h2>Admin - Users</h2>
      {users ? (
        <pre>{JSON.stringify(users, null, 2)}</pre>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
