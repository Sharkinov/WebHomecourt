import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const NEWSAPI_KEY = Deno.env.get("NEWSAPI_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
function categorize(title, description) {
  const text = (title + " " + description).toLowerCase();
  if (text.includes("injur") || text.includes("questionable") || text.includes("doubtful")) return 3;
  if (text.includes("trade") || text.includes("sign") || text.includes("waiv") || text.includes("roster") || text.includes("draft")) return 2;
  if (text.includes("recap") || text.includes("beat") || text.includes("loss") || text.includes("win") || text.includes("score")) return 1;
  return 4;
}
Deno.serve(async ()=>{
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = `https://newsapi.org/v2/everything?q=Lakers&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWSAPI_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    // Return full NewsAPI response for debugging
    if (data.status !== "ok") {
      return new Response(JSON.stringify({
        newsapi_error: data
      }), {
        status: 400
      });
    }
    const articles = data.articles.filter((a)=>a.url && a.title && a.urlToImage).map((a)=>({
        title: a.title.substring(0, 250),
        news_url: a.url.substring(0, 200),
        news_category: categorize(a.title, a.description ?? ""),
        photo_url: (a.urlToImage ?? "").substring(0, 255),
        date_posted: a.publishedAt
      }));
    if (articles.length === 0) {
      return new Response(JSON.stringify({
        message: "No articles with image found"
      }), {
        status: 200
      });
    }
    const { error } = await supabase.from("news").upsert(articles, {
      onConflict: "news_url",
      ignoreDuplicates: true
    });
    if (error) throw error;
    return new Response(JSON.stringify({
      success: true,
      inserted: articles.length
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500
    });
  }
});
