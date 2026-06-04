import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENROUTER_API_KEY        = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SYSTEM_PROMPT = `You are a moderation assistant for a sports court booking platform called LakersCourt.
Your job is to analyze reports submitted about events (games, matches, sessions).

Given a report comment about an event, you must return a JSON object with:
- "priority": one of "low", "medium", or "high"
  - low: minor complaints, vague issues, general dissatisfaction
  - medium: rule violations, recurring problems, unsafe conditions, organizational issues
  - high: violence, serious safety hazards, discrimination, criminal behavior
- "key_words": an array of issue tags extracted from the comment (e.g. ["Unsafe", "Violence", "Disorganized", "Cheating", "Discrimination", "No-referee", "Field-condition", "No-show", "Overbooking"])

Respond ONLY with a valid JSON object, no markdown, no explanation.
Example: {"priority": "high", "key_words": ["Violence", "Unsafe"]}`;

Deno.serve(async (req: Request) => {
  try {
    const { ereport_id, comment, event_id } = await req.json();

    if (!ereport_id || !comment) {
      return new Response(JSON.stringify({ error: "Missing ereport_id or comment" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[analyze-event-report] Processing report #${ereport_id} for event #${event_id}`);

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://lakerscourt.com",
        "X-Title": "LakersCourt Event Report Analyzer",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Event report comment: "${comment}"` },
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("[analyze-event-report] OpenRouter error:", err);
      return new Response(JSON.stringify({ error: "OpenRouter API failed", detail: err }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "{}";
    console.log(`[analyze-event-report] AI raw response: ${rawContent}`);

    let parsed: { priority: string; key_words: string[] };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error("[analyze-event-report] Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ error: "Invalid AI JSON", raw: rawContent }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const priority  = ["low", "medium", "high"].includes(parsed.priority) ? parsed.priority : "low";
    const key_words = Array.isArray(parsed.key_words) ? parsed.key_words : [];

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: updateError } = await supabase
      .from("event_report")
      .update({ priority, key_words })
      .eq("ereport_id", ereport_id);

    if (updateError) {
      console.error("[analyze-event-report] Supabase update error:", updateError);
      return new Response(JSON.stringify({ error: "DB update failed", detail: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[analyze-event-report]  Report #${ereport_id} → priority: ${priority}, keywords: [${key_words.join(", ")}]`);
    return new Response(JSON.stringify({ success: true, ereport_id, priority, key_words }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[analyze-event-report] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});