import { embedding } from "@/actions/ai/chat/voice/embedding";

export async function POST(req: Request) {
  const res = await req.json();

  const voice = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "Cartesia-Version": "2024-06-30",
      "Content-Type": "application/json",
      "X-API-Key": "9b6a5add-8697-40ad-a44c-734052c2e7a4",
    },
    body: JSON.stringify({
      model_id: "sonic-english",
      transcript: res.transcript,
      voice: {
        mode: "embedding",
        embedding,
      },
      output_format: {
        container: "raw",
        encoding: "pcm_f32le",
        sample_rate: 24000,
      },
    }),
  });

  return new Response(voice.body);
}
