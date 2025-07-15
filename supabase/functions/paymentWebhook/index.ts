import { serve } from "https://deno.land/std@0.223.0/http/server.ts";

// 웹훅은 결제사 서버가 호출 → CORS 필요 없음!
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // ① 카카오페이에서 보내준 바디 파싱
    const body = await req.json();

    // ② (선택) 카카오페이 서명/시크릿 검증
    // verifySignature(body, req.headers);

    // ③ 결제 성공/실패 분기 → DB 업데이트
    // await supabaseClient.from("payments").update(...)

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("paymentWebhook error:", err);
    return new Response(JSON.stringify({ error: "Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});