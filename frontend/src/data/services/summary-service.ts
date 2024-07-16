export async function generateSummaryService(videoId: string) {
  const url = "/api/summarize"
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ videoId }),
    })
    return await response.json()
  } catch (error) {
    console.error("An error occurred", error)
    if (error instanceof Error) return { error: { message: error.message } };
    return { data: null, error: { message: "Unknown error" } };
  }
}