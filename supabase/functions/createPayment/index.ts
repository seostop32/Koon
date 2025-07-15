import { serve } from "https://deno.land/std@0.223.0/http/server.ts";

serve(async (req) => {
  console.log('Function createPayment 시작');
  console.log('요청 method:', req.method);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const json = await req.json();
    console.log('요청 본문:', json);

    const { method, amount, coins, userId } = json;
    const kakaoAdminKey = Deno.env.get('KAKAO_ADMIN_KEY');
    console.log('KAKAO_ADMIN_KEY:', kakaoAdminKey);

    if (!kakaoAdminKey) throw new Error('KAKAO_ADMIN_KEY 환경변수가 설정되어 있지 않습니다.');

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
        approval_url: 'https://your-site.com/payment/success',
        cancel_url: 'https://your-site.com/payment/cancel',
        fail_url: 'https://your-site.com/payment/fail',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('카카오페이 API 오류 응답:', errorBody);
      throw new Error(`카카오페이 요청 실패: ${errorBody}`);
    }

    const data = await response.json();
    console.log('카카오페이 응답 데이터:', data);

    return new Response(JSON.stringify({ paymentUrl: data.next_redirect_pc_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
     console.error('createPayment 함수 에러:', error);
    return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
    });
  }
});