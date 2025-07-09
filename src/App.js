// src/App.js
import React from 'react';
import TestLogin from './components/TestLogin';
import RealApp from './RealApp';

const isTestMode = process.env.REACT_APP_TEST_MODE === 'true';  // true면 테스트용, false면 실제 앱

export default function App() {
  return isTestMode ? <TestLogin /> : <RealApp />;
}