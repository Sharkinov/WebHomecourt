import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SYSTEM_PROMPT = `You are a moderation assistant for a sports court booking platform called LakersCourt.
Your job is to analyze user behavior reports submitted by other players.

Given a report comment, you must return a JSON object with:
- "priority": one of "low", "medium", or "high"
  - low: minor complaints, poor sportsmanship, vague or unsubstantiated
  - medium: repeated bad behavior, aggressive language, rule violations
  - high: threats, physical altercations, harassment, discriminatory language
- "key_words": an array of behavior tags extracted from the comment (e.g. ["Aggressive", "Toxic", "Threatening", "Unsportsmanlike", "Cheating", "Harassment", "Late", "No-show"])

Respond ONLY with a valid JSON object, no markdown, no explanation.
Example: {"priority": "high", "key_words": ["Aggressive", "Threatening"]}`;
Deno.serve(async (req)=>{
  try {
    const { ureport_id, comment } = await req.json();
    if (!ureport_id || !comment) {
      return new Response(JSON.stringify({
        error: "Missing ureport_id or comment"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    console.log(`[analyze-report] Processing report #${ureport_id}`);
    // ---  OpenRouter AI ---
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://lakerscourt.com",
        "X-Title": "LakersCourt Report Analyzer"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: `Report comment: "${comment}"`
          }
        ],
        temperature: 0.2,
        max_tokens: 200
      })
    });
    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("[analyze-report] OpenRouter error:", err);
      return new Response(JSON.stringify({
        error: "OpenRouter API failed",
        detail: err
      }), {
        status: 502,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "{}";
    console.log(`[analyze-report] AI raw response: ${rawContent}`);
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch  {
      console.error("[analyze-report] Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({
        error: "Invalid AI JSON",
        raw: rawContent
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const priority = [
      "low",
      "medium",
      "high"
    ].includes(parsed.priority) ? parsed.priority : "low";
    const key_words = Array.isArray(parsed.key_words) ? parsed.key_words : [];
    // --- Update user_report row ---
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: updateError } = await supabase.from("user_report").update({
      priority,
      key_words
    }).eq("ureport_id", ureport_id);
    if (updateError) {
      return new Response(JSON.stringify({
        error: "DB update failed",
        detail: updateError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      ureport_id,
      priority,
      key_words
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: "Internal error",
      detail: String(err)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
