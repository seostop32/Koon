import { serve } from "https://deno.land/std@0.223.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const json = await req.json();
    const { tid, pg_token, userId, amount } = json;

    if (!tid || !pg_token || !userId || !amount) {
      return new Response(
        JSON.stringify({ error: "tid, pg_token, userId, amount are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const kakaoAdminKey = Deno.env.get("KAKAO_ADMIN_KEY");
    if (!kakaoAdminKey) {
      throw new Error("KAKAO_ADMIN_KEY is not set");
    }

    // 카카오페이 결제 승인 API 호출
    const params = new URLSearchParams({
      cid: "TC0ONETIME",
      tid,
      partner_order_id: userId,
      partner_user_id: userId,
      pg_token,
      total_amount: amount.toString(),
    });

    const response = await fetch("https://kapi.kakao.com/v1/payment/approve", {
      method: "POST",
      headers: {
        Authorization: `KakaoAK ${kakaoAdminKey}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Payment approval failed", detail: data }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // TODO: 여기서 DB 업데이트 코드 넣기 (예: supabase에서 user 코인 충전)
    // await supabaseClient.from('users').update(...).eq('id', userId);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("paymentApprove error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", detail: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});