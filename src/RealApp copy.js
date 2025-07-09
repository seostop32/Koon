// src/RealApp.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

import Intro from './components/Intro';
import AuthPage from './components/AuthPage';

import TermsOfService from './terms/TermsOfService';
import PrivacyPolicy from './terms/PrivacyPolicy';
import MyPage from './components/MyPage';
import CoinCharge from './components/CoinCharge';
import AccountManagement from './components/AccountManagement';
import BuyTicket from './components/BuyTicket'; // 경로는 실제 위치에 맞게 수정

import Dashboard from './components/Dashboard';
import ProfileIntro from './components/ProfileIntro';
import ProfileDetail from './components/ProfileDetail';
import ProfileDetailEdit from './components/ProfileDetailEdit';
import ChatPage from './pages/ChatPage';

function ProtectedRoute({ session, children }) {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function AppRoutes() {
  const navigate = useNavigate();
  const [sessionUserId, setSessionUserId] = useState(null);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('login');

 
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setSessionUserId(data?.user?.id || null);
    };
    fetchUser();

    supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('초기 세션:', session);        
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);



  const handleLoginClick = () => {
    setAuthMode('login');
    navigate('/auth');
  };

  const handleSignUpClick = () => {
    setAuthMode('signup');
    navigate('/auth');
  };

const handleLogout = async () => {
  console.log('로그아웃 시도');
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('로그아웃 실패:', error.message);    
    alert('로그아웃 실패');
    return;
  }

  console.log('로그아웃 성공');
  // ✅ 세션을 수동으로 null 처리
  setSession(null);

  // 로그아웃 후 session null 처리와 강제 이동
  setSession(null);
  console.log('✅ 로그아웃 완료, Intro로 이동');
  navigate(0); // ← 중요!! 페이지 새로고침으로 완전 초기화
};



  return (
    <Routes>
      <Route
        path="/"
        element={
          session ? (
            <Dashboard onSignOut={handleLogout} />
          ) : (
            <Intro onLoginClick={handleLoginClick} onSignUpClick={handleSignUpClick} />
          )
        }
      />
    <Route
        path="/intro"
        element={<Intro onLoginClick={handleLoginClick} onSignUpClick={handleSignUpClick} />}
    />     
      <Route path="/auth" element={<AuthPage mode={authMode} onAuthSuccess={() => navigate('/')} />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/profileintro" element={<ProfileIntro />} />

      {/* 로그인 필요 경로는 ProtectedRoute로 감싸기 */}
      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute session={session}>
            <ProfileDetail modeUserId={sessionUserId} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profiledetail"
        element={
          <ProtectedRoute session={session}>
            <ProfileDetail mode="edit" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:id/edit"
        element={
          <ProtectedRoute session={session}>
            <ProfileDetailEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:recipientId"
        element={
          <ProtectedRoute session={session}>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mypage"
        element={
          <ProtectedRoute session={session}>
            <MyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coin-charge"
        element={
          <ProtectedRoute session={session}>
            <CoinCharge />
          </ProtectedRoute>
        }
      />
        <Route
        path="/account"
        element={
            <ProtectedRoute session={session}>
            <AccountManagement onLogout={handleLogout} />
            </ProtectedRoute>
        }
        />
      <Route path="/buy-ticket" element={<BuyTicket />} />
    </Routes>
  );
}

export default function RealApp() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}