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
    fetch("http://localhost:8000/api/context/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.context_id) {
          navigate("/interview", { state: { contextId: data.context_id } });
        } else {
          alert("Fehler beim Hochladen der Dokumente");
        }
      })
      .catch(() => {
        alert("Fehler beim Hochladen der Dokumente");
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
