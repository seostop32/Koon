// supabase/functions/createPayment/index.ts
import { serve } from "https://deno.land/std@0.223.0/http/server.ts";

// 1) 공통 CORS 헤더
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://koon.vercel.app",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // 2) OPTIONS 프리플라이트 요청 처리
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 3) POST 이외 메서드 차단
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // 4) 본 로직 (결제 준비 등)
    const { method, amount, coins, userId } = await req.json();

    // 👉 카카오페이 결제 준비 호출 (예시)
    // const paymentUrl = await requestKakaoPay(method, amount, coins, userId);
    const paymentUrl = "https://example.com/pay";  // 임시

    // 5) 성공 응답
    return new Response(
      JSON.stringify({ paymentUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("createPayment error:", err);

    // 6) 실패 응답
    return new Response(
      JSON.stringify({ error: "Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});