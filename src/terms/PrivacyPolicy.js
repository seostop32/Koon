// terms/PrivacyPolicy.js
import React from 'react';

function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 600, margin: '30px auto', padding: 20, fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <h1 style={{ textAlign: 'center', color: '#e91e63', marginBottom: 20 }}>개인정보 처리방침</h1>
      
      <p style={{ lineHeight: 1.6, fontSize: '1.1em' }}>
        본 개인정보 처리방침은 귀하의 개인정보 보호와 관련된 당사의 원칙과 실천사항을 설명합니다. 
        저희 앱은 귀하의 개인정보를 소중하게 생각하며, 관련 법규를 준수하여 안전하게 관리합니다.
      </p>

      <h2 style={{ marginTop: 30, color: '#c2185b' }}>1. 개인정보 수집 항목 및 방법</h2>
      <p style={{ lineHeight: 1.6 }}>
        회원가입, 서비스 이용, 고객 상담 등을 위해 아래의 개인정보를 수집할 수 있습니다:
      </p>
      <ul style={{ lineHeight: 1.6, fontSize: '1em', paddingLeft: 20 }}>
        <li>이름, 연락처(전화번호, 이메일 등)</li>
        <li>서비스 이용 기록, 접속 로그, 쿠키 등</li>
      </ul>

      <h2 style={{ marginTop: 30, color: '#c2185b' }}>2. 개인정보의 이용 목적</h2>
      <p style={{ lineHeight: 1.6 }}>
        수집된 개인정보는 다음과 같은 목적을 위해 사용됩니다:
      </p>
      <ul style={{ lineHeight: 1.6, fontSize: '1em', paddingLeft: 20 }}>
        <li>서비스 제공 및 회원 관리</li>
        <li>고객 문의 대응 및 맞춤형 서비스 제공</li>
        <li>이용자 보호 및 서비스 개선</li>
      </ul>

      <h2 style={{ marginTop: 30, color: '#c2185b' }}>3. 개인정보 보유 및 이용 기간</h2>
      <p style={{ lineHeight: 1.6 }}>
        원칙적으로 개인정보의 보유 기간은 회원 탈퇴 시까지이며, 관계 법령에 따라 일정 기간 보관 후 안전하게 파기합니다.
      </p>

      <h2 style={{ marginTop: 30, color: '#c2185b' }}>4. 개인정보 보호를 위한 조치</h2>
      <p style={{ lineHeight: 1.6 }}>
        저희는 개인정보를 안전하게 관리하기 위해 기술적, 관리적 조치를 실시하고 있습니다.
        암호화, 접근 통제, 보안 시스템 도입 등을 통해 개인정보를 보호합니다.
      </p>

      <h2 style={{ marginTop: 30, color: '#c2185b' }}>5. 이용자의 권리</h2>
      <p style={{ lineHeight: 1.6 }}>
        이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리 정지 등을 요구할 수 있으며, 
        당사는 이에 대해 지체 없이 조치하겠습니다.
      </p>

      <h2 style={{ marginTop: 30, color: '#c2185b' }}>6. 문의 및 연락처</h2>
      <p style={{ lineHeight: 1.6 }}>
        개인정보 보호 관련 문의는 고객센터 이메일(seostop32@hotmail.com) 또는 전화(010-3293-6841)로 연락주시기 바랍니다.
      </p>

      <p style={{ marginTop: 40, fontSize: '0.9em', color: '#666', textAlign: 'center' }}>
        본 방침은 2025년 6월 6일부터 시행됩니다.
      </p>
    </div>
  );
}

export default PrivacyPolicy;