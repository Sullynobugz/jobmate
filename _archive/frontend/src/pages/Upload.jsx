import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, FileInput, Button, Group, Text, Alert } from "@mantine/core";

export default function Upload() {
  const [companyDoc, setCompanyDoc] = useState(null);
  const [roleDoc, setRoleDoc] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleStartInterview = () => {
    if (!companyDoc || !roleDoc) {
      setError("Bitte wählen Sie beide Dokumente aus, bevor Sie fortfahren.");
      return;
    }
    const formData = new FormData();
    formData.append("company", companyDoc);
    formData.append("role", roleDoc);
    console.log("Starting upload...");
    fetch("http://localhost:8000/api/context/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        console.log("Upload response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Upload success:", data);
        if (data.context_id) {
          navigate("/interview", { state: { contextId: data.context_id } });
        } else {
          alert("Fehler: Keine context_id erhalten");
        }
      })
      .catch((error) => {
        console.error("Upload error:", error);
        alert(`Fehler beim Hochladen: ${error.message}`);
      });
  };

  return (
    <Card withBorder p="lg">
      <Text fw={500} mb="sm">
        Laden Sie Dokumente hoch, um das Interview anzupassen
      </Text>
      {error && (
        <Alert color="red" mb="sm">
          {error}
        </Alert>
      )}
      <FileInput
        label="Unternehmensphilosophie (PDF/Markdown)"
        placeholder="PDF oder .md wählen"
        accept=".pdf,.md,.markdown,application/pdf,text/markdown"
        value={companyDoc}
        onChange={setCompanyDoc}
        mb="md"
      />
      <FileInput
        label="Positionsanforderungen (PDF/Markdown)"
        placeholder="PDF oder .md wählen"
        accept=".pdf,.md,.markdown,application/pdf,text/markdown"
        value={roleDoc}
        onChange={setRoleDoc}
        mb="md"
      />
      <Group justify="flex-end" mt="md">
        <Button onClick={handleStartInterview}>Weiter</Button>
      </Group>
    </Card>
  );
}
