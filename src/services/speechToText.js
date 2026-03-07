import "dotenv/config";

const OPENAI_TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";
const DEFAULT_TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing in .env");
}

export async function transcribeAudioBuffer(buffer, filename = "voice.ogg") {
  const form = new FormData();
  const blob = new Blob([buffer], { type: "audio/ogg" });
  form.append("file", blob, filename);
  form.append("model", DEFAULT_TRANSCRIBE_MODEL);
  form.append("response_format", "verbose_json");

  const response = await fetch(OPENAI_TRANSCRIBE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`STT request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const text = (data?.text || "").trim();
  if (!text) {
    throw new Error("STT returned empty text");
  }

  return {
    text,
    language: (data?.language || "").toLowerCase(),
  };
}
