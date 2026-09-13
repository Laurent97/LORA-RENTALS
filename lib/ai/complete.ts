// Shared LLM dispatcher. Tries Anthropic → OpenAI → Gemini → Cloudflare Workers AI.
// Falls back to null so callers can use their own rule-based fallback.

export async function callLlm(prompt: string): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const cfToken = process.env.CF_AI_TOKEN;
  const cfAccount = process.env.CF_ACCOUNT_ID;

  if (anthropicKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text ?? "";
        if (text) return text;
      }
    } catch {
      /* continue to next provider */
    }
  }

  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${openaiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        if (text) return text;
      }
    } catch {
      /* continue */
    }
  }

  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (text) return text;
      }
    } catch {
      /* continue */
    }
  }

  if (cfToken && cfAccount) {
    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/meta/llama-3-8b-instruct-awq`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${cfToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            stream: false,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.result?.response ?? "";
        if (text) return text;
      }
    } catch {
      /* continue */
    }
  }

  return null;
}
