export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'get';
    const month = url.searchParams.get('month') || 'SEP26';

    const KV = env.INVOICE_KV;

    if (!KV) {
        return new Response(JSON.stringify({ error: "Binding INVOICE_KV belum terpasang!" }), {
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            }
        });
    }

    let savedMonth = await KV.get('current_month');
    let savedCounterStr = await KV.get('current_counter');
    let savedCounter = savedCounterStr ? parseInt(savedCounterStr, 10) : 1;

    // Jika belum ada data sama sekali di KV
    if (!savedMonth) {
        savedMonth = month;
        savedCounter = 1;
        await KV.put('current_month', month);
        await KV.put('current_counter', '1');
    }
    // Jika ganti bulan baru (misal SEP26 -> OKT26)
    else if (savedMonth !== month) {
        savedCounter = 1;
        savedMonth = month;
        await KV.put('current_month', month);
        await KV.put('current_counter', '1');
    } 
    // Jika tombol "+1 Invoice Baru" diklik
    else if (action === 'increment') {
        savedCounter += 1;
        await KV.put('current_counter', savedCounter.toString());
    } 
    // Jika tombol reset diklik
    else if (action === 'reset') {
        savedCounter = 1;
        await KV.put('current_counter', '1');
    }

    return new Response(JSON.stringify({
        counter: savedCounter,
        month: savedMonth
    }), {
        headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Access-Control-Allow-Origin": "*"
        }
    });
}