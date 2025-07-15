import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const { method, amount, coins, userId } = await req.json();

    // TODO: 카카오페이 API 호출해서 결제 요청 생성  
    // 여기서 결제 요청 후 paymentUrl 받음

    const paymentUrl = 'https://kakao-pay-payment-url.example.com'; // 예시

    // DB에 결제 정보 저장하거나 후처리 로직 추가 가능

    return new Response(JSON.stringify({ paymentUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('createPayment error:', error);
    return new Response(JSON.stringify({ error: '결제 요청 실패' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});