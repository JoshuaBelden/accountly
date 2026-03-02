import { validateEnvelope, type ExportEnvelope } from "$lib/persistence/localStorage"

/** Exports data as a JSON file, prompting the user to choose a save location when supported. */
export async function exportToFile(envelope: ExportEnvelope): Promise<void> {
  const json = JSON.stringify(envelope, null, 2)
  const now = new Date()
  const date = now.toISOString().split("T")[0]
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "-")
  const filename = `accountly-export-${date}_${time}.json`

  if ("showSaveFilePicker" in window) {
    try {
      const handle = await (window as Window & { showSaveFilePicker: Function }).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "JSON file", accept: { "application/json": [".json"] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
      return
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return
      console.warn("showSaveFilePicker failed, falling back to legacy download:", error)
      // Fall through to legacy download on other errors
    }
  }

  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function importFromFile(file: File): Promise<ExportEnvelope> {
  const text = await file.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("Invalid JSON file")
  }
  if (!validateEnvelope(data)) {
    throw new Error("File does not appear to be a valid Accountly export")
  }
  return data
}
