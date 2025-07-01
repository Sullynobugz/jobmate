import React, { useState } from "react";
import { Card, FileInput, Button, Group, Text, Alert } from "@mantine/core";

export default function Upload() {
  const [companyDoc, setCompanyDoc] = useState(null);
  const [roleDoc, setRoleDoc] = useState(null);
  const [error, setError] = useState("");

  const handleStartInterview = () => {
    if (!companyDoc || !roleDoc) {
      setError("Bitte wählen Sie beide Dokumente aus, bevor Sie fortfahren.");
      return;
    }
    // TODO: upload to backend and navigate to interview console
    console.log("Company doc:", companyDoc);
    console.log("Role doc:", roleDoc);
    alert("Dokumente erfasst – Backend-Upload noch nicht implementiert.");
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
