export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "get";
  const month = url.searchParams.get("month") || "SEP26";

  // Nama Binding KV Namespace di Dashboard Cloudflare
  const KV = env.INVOICE_KV;

  if (!KV) {
    return new Response(
      JSON.stringify({ error: "KV Binding 'INVOICE_KV' not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let savedMonth = await KV.get("current_month");
  let savedCounter = parseInt((await KV.get("current_counter")) || "1", 10);

  // Jika bulan berubah, reset otomatis ke 1
  if (savedMonth !== month) {
    savedCounter = 1;
    savedMonth = month;
    await KV.put("current_month", month);
    await KV.put("current_counter", "1");
  } else if (action === "increment") {
    savedCounter += 1;
    await KV.put("current_counter", savedCounter.toString());
  } else if (action === "reset") {
    savedCounter = 1;
    await KV.put("current_counter", "1");
  }

  return new Response(
    JSON.stringify({
      counter: savedCounter,
      month: savedMonth,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}
