// src/RealApp.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Intro from './components/Intro';
import AuthPage from './components/AuthPage';

import TermsOfService from './terms/TermsOfService';
import PrivacyPolicy from './terms/PrivacyPolicy';
import MyPage from './components/MyPage';
import CoinCharge from './components/CoinCharge';
import AccountManagement from './components/AccountManagement';
import BuyTicket from './components/BuyTicket';

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
import BlockList from './components/BlockedList';
import AdminMessagesList from './admin/HelpDeskAdmin'; 
import NotificationsList from './pages/NotificationsList'; 
import NotificationSettings from './pages/NotificationSettings'; 

import CoinHistoryPage from './components/CoinHistoryPage';
import ResetPasswordPage from './components/ResetPasswordPage';  

// 로그인 안 된 사용자는 /auth로 보내고, 로그인 된 사용자만 children 렌더링
function ProtectedRoute({ session, children }) {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

// 프로필 존재 여부 검사 (필요시 프로필 편집 페이지로 이동)
function ProfileGuard({ children }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          navigate('/');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          navigate(`/profile/${user.id}/edit`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    };

    checkProfile();
  }, [navigate]);

  if (checking) return <div>로딩 중...</div>; // 빈 화면 대신 로딩 표시 추천

  return children;
}

function AppRoutes() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sessionUserId, setSessionUserId] = useState(null);
  const [authMode, setAuthMode] = useState('login');

  // 세션 불러오기 및 변경 감지
  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user?.id) setSessionUserId(session.user.id);
    };
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) setSessionUserId(session.user.id);
      else setSessionUserId(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 로그인 상태에서 프로필 체크 (세션 변경 시)
  useEffect(() => {
    const checkProfile = async () => {
      if (!session?.user?.id) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        navigate(`/profile/${session.user.id}/edit`);
      }
    };

    checkProfile();
  }, [session, navigate]);

  const handleLoginClick = () => {
    setAuthMode('login');
    navigate('/auth');
  };

  const handleSignUpClick = () => {
    setAuthMode('signup');
    navigate('/auth');
  };

  const handleLogout = async () => {
    localStorage.clear(); // 세션 관련 정보 초기화
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('로그아웃 실패: ' + error.message);
      return;
    }
    setSession(null);
    navigate(0); // 새로고침으로 초기화
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
      <Route path="/intro" element={<Intro onLoginClick={handleLoginClick} onSignUpClick={handleSignUpClick} />} />
      <Route path="/auth" element={<AuthPage mode={authMode} onAuthSuccess={() => navigate('/')} />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/profileintro" element={<ProfileIntro />} />

      <Route path="/dashboard" element={<ProfileGuard><Dashboard /></ProfileGuard>} />

      <Route
        path="/profile/:id/edit"
        element={
          <ProtectedRoute session={session}>
            <ProfileDetailEdit />
          </ProtectedRoute>
        }
      />

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
        path="/chat/:userId"
        element={
          <ProtectedRoute session={session}>
            <ChatPage />
          </ProtectedRoute>
        }
      />
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

      <Route
        path="/account"
        element={
          <ProtectedRoute session={session}>
            <AccountManagement onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

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
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  );
}

export default function RealApp() {
  useEffect(() => {
    // 두 손가락 터치(줌 방지)
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
    <>
      <Router>
        <div className="app-layout">
          <UnreadMessagesBadge />
          <AppRoutes />
        </div>
      </Router>
      <ToastContainer position="top-center" />
    </>
  );
}