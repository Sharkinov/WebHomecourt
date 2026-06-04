import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async (req)=>{
  // Validar que venga del cron (bearer secret)
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", {
      status: 401
    });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  // 1. Buscar eventos que ya pasaron y siguen como 'active' (status_id = 1)
  const { data: finishedEvents, error: fetchError } = await supabase.from("event").select("event_id").lt("date", new Date().toISOString()).eq("event_status_id", 1);
  if (fetchError) {
    return new Response(JSON.stringify({
      error: fetchError.message
    }), {
      status: 500
    });
  }
  if (!finishedEvents || finishedEvents.length === 0) {
    return new Response(JSON.stringify({
      message: "No events to close",
      updated: 0
    }), {
      status: 200
    });
  }
  const eventIds = finishedEvents.map((e)=>e.event_id);
  // 2. Marcarlos como 'finished' (status_id = 2)
  const { error: updateError } = await supabase.from("event").update({
    event_status_id: 2
  }).in("event_id", eventIds);
  if (updateError) {
    return new Response(JSON.stringify({
      error: updateError.message
    }), {
      status: 500
    });
  }
  return new Response(JSON.stringify({
    message: "Events closed successfully",
    updated: eventIds.length
  }), {
    status: 200
  });
});
