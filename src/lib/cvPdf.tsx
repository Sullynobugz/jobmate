'use client'

/**
 * CV-Export als PDF — simples A4-Template via @react-pdf/renderer.
 * Der verbesserte Lebenslauf (Plain Text aus dem Claude-Chat) wird
 * zeilenweise in ein schlichtes, gut lesbares A4-Layout gerendert und
 * als Download ausgegeben.
 *
 * @react-pdf/renderer ist browser-only und schwergewichtig — deshalb wird
 * es per dynamischem import() erst beim Klick geladen, nicht im Bundle der
 * CV-Seite.
 */

export async function downloadCvAsPdf(cvText: string, filename: string) {
  const { Document, Page, Text, View, StyleSheet, pdf } = await import('@react-pdf/renderer')

  const styles = StyleSheet.create({
    page: {
      paddingVertical: 48,
      paddingHorizontal: 56,
      fontFamily: 'Helvetica',
      fontSize: 11,
      lineHeight: 1.5,
      color: '#1a1a1a',
    },
    name: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 4,
      color: '#111111',
    },
    rule: {
      borderBottomWidth: 1,
      borderBottomColor: '#4f46e5',
      marginBottom: 14,
    },
    heading: {
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      marginTop: 14,
      marginBottom: 4,
      color: '#1f2937',
    },
    line: {
      marginBottom: 3,
    },
    spacer: {
      height: 6,
    },
  })

  const lines = cvText.replace(/\r\n/g, '\n').split('\n')
  // Erste nicht-leere Zeile = Name/Titel des Lebenslaufs
  const headerIdx = lines.findIndex(l => l.trim().length > 0)
  const headerText = headerIdx >= 0 ? lines[headerIdx].trim() : (filename || 'Lebenslauf')
  const bodyLines = headerIdx >= 0 ? lines.slice(headerIdx + 1) : lines

  // Heuristik: kurze Großbuchstaben-/Doppelpunkt-Zeilen als Abschnitts-Überschriften
  const isHeading = (raw: string) => {
    const t = raw.trim()
    if (t.length === 0 || t.length > 40) return false
    if (t.endsWith(':')) return true
    return t === t.toUpperCase() && /[A-ZÄÖÜ]/.test(t)
  }

  const Doc = (
    <Document title={headerText} author="JobMate" creator="JobMate">
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{headerText}</Text>
        <View style={styles.rule} />
        {bodyLines.map((raw, i) => {
          const t = raw.trim()
          if (t.length === 0) return <View key={i} style={styles.spacer} />
          if (isHeading(raw)) return <Text key={i} style={styles.heading}>{t}</Text>
          return <Text key={i} style={styles.line}>{t}</Text>
        })}
      </Page>
    </Document>
  )

  const blob = await pdf(Doc).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(filename || 'Lebenslauf').replace(/\.[^.]+$/, '')}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
