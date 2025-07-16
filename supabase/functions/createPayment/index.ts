import { serve } from "https://deno.land/std@0.223.0/http/server.ts";

serve(async (req) => {
  console.log('Function createPayment 시작');
  console.log('요청 method:', req.method);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',            // 혹은 'https://koon.vercel.app' 등 실제 도메인으로 바꿔도 됨
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    // CORS preflight 요청 처리
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST 요청만 허용됩니다.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const json = await req.json();
    console.log('요청 본문:', json);

    const { method, amount, coins, userId } = json;
    const kakaoAdminKey = Deno.env.get('KAKAO_ADMIN_KEY');
    console.log('KAKAO_ADMIN_KEY:', kakaoAdminKey);

    if (!kakaoAdminKey) throw new Error('KAKAO_ADMIN_KEY 환경변수가 설정되어 있지 않습니다.');

    // ✅ 프론트 실도메인으로 교체
    const FRONT = "https://koon.vercel.app";   // 편하게 상수로    
    // 카카오페이 결제 준비 API 호출
    const response = await fetch('https://kapi.kakao.com/v1/payment/ready', {
      method: 'POST',
      headers: {
        'Authorization': `KakaoAK ${kakaoAdminKey}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        cid: 'TC0ONETIME',
        partner_order_id: userId,
        partner_user_id: userId,
        item_name: '코인 충전',
        quantity: '1',
        total_amount: amount.toString(),
        vat_amount: '0',
        tax_free_amount: '0',
        // approval_url: 'https://your-site.com/payment/success',
        // cancel_url: 'https://your-site.com/payment/cancel',
        // fail_url: 'https://your-site.com/payment/fail',
        approval_url: `${FRONT}/payment-success`,  // ← 수정
        cancel_url:   `${FRONT}/payment-cancel`,   // ← 수정
        fail_url:     `${FRONT}/payment-fail`,     // ← 수정        
      }),
    });

    const bodyText = await response.text();  // body를 텍스트로 한 번 읽어 저장
    console.log("카카오 응답:", bodyText);

    if (!response.ok) {
      throw new Error("카카오페이 요청 실패: " + bodyText);
    }

    const data = JSON.parse(bodyText);  // JSON으로 파싱해서 계속 사용
    console.log('카카오페이 응답 데이터:', data);

    return new Response(JSON.stringify({ paymentUrl: data.next_redirect_pc_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error("🔥 createPayment 함수 오류:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", detail: error.message }), {
      status: 500,
    });
  }
});