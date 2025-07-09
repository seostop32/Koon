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
import SettingsPage from './components/SettingsPage';
import ChatPage from './pages/ChatPage';
import ChatListPage from './pages/ChatListPage'; 
import FavoritesPage from './components/FavoritesPage';
import UnreadMessagesBadge from './components/UnreadMessagesBadge';
import HelpDesk from './components/HelpDesk';
import BlockList from './components/BlockedList'; // 경로는 너 파일 위치에 따라 맞춰
import AdminMessagesList from './admin/HelpDeskAdmin'; 
import NotificationsList from './pages/NotificationsList'; 
import NotificationSettings from './pages/NotificationSettings'; 

import CoinHistoryPage from './components/CoinHistoryPage';
  


function ProtectedRoute({ session, children }) {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function AppRoutes() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sessionUserId, setSessionUserId] = useState(null); // ✅ 추가
  const [authMode, setAuthMode] = useState('login');

 
useEffect(() => {
  const checkProfile = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      navigate('/'); // 로그인 안 되어 있음
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      navigate(`/profile/${user.id}/edit`); // 📍 프로필 없으면 수정 페이지로
    }
  };

  if (session?.user?.id) {
    checkProfile();
  }
}, []);

function ProfileGuard({ children }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
console.log('user:', user, 'error:', error);

      if (error || !user) {
        console.log('No user, redirect to /');
        navigate('/'); // 로그인 안 되어 있음
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('profile:', profile, 'profileError:', profileError);

      if (profileError || !profile) {
        console.log('No profile found, redirect to profile edit');
        navigate(`/profile/${user.id}/edit`);
      } else {
        setChecking(false);
      }
    };

    checkProfile();
  }, [navigate]);

  if (checking) return null; // or loading indicator

  return children;
}

useEffect(() => {
  const loadSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session?.user?.id) {
      setSessionUserId(session.user.id); // ✅ 유저 ID 저장
    }
  };
  loadSession();

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    console.log('✅ auth 상태 변경됨:', session);
    setSession(session);
    if (session?.user?.id) {
      setSessionUserId(session.user.id); // ✅ 유저 ID 저장
    } else {
      setSessionUserId(null);
    }    
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
     
      <Route path="/dashboard" element={<ProfileGuard><Dashboard /></ProfileGuard>} />
      <Route path="/profile/:id/edit" element={
        <ProtectedRoute session={session}>
          <ProfileDetailEdit />
        </ProtectedRoute>
      } />
      
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
      <Route path="/chat/:userId" element={
        <ProtectedRoute session={session}>
          <ChatPage />
        </ProtectedRoute>
      } />
      <Route path="/chat" element={<ChatListPage />} />
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
      <Route path="/account" element={<ProtectedRoute session={session}><AccountManagement onLogout={handleLogout} /></ProtectedRoute>}/>
      <Route path="/buy-ticket" element={<BuyTicket />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/search" element={<SettingsPage />} /> 
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/help" element={<HelpDesk />} />
      <Route path="/admin/HelpDeskAdmin" element={<AdminMessagesList />} />
      <Route path="/blockList" element={<BlockList />} />
      <Route path="/notifications" element={<NotificationsList />} />
      <Route path="/notificationSettings" element={<NotificationSettings />} />
      <Route path="/profile/:userId" element={<ProfileDetail />} />
      <Route path="/coin-history" element={<CoinHistoryPage />} />
    </Routes>
  );
}

export default function RealApp() {
  useEffect(() => {
    const preventZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    window.addEventListener('touchmove', preventZoom, { passive: false });
    window.addEventListener('touchstart', preventZoom, { passive: false });
    return () => {
      window.removeEventListener('touchmove', preventZoom);
      window.removeEventListener('touchstart', preventZoom);
    };
  }, []);

  return (
    <Router>
      <div className="app-layout">
        <UnreadMessagesBadge />
        <AppRoutes />
      </div>
    </Router>
  );
}