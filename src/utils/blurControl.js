export function shouldBlurPhoto({ isAvatar, mode, isCurrentUser, isFullyUnlocked }) {
  // 내 프로필이거나 완전히 열람한 경우는 블러 해제
  if (isCurrentUser || isFullyUnlocked) return false;

  // 수정 모드면 블러 해제
  if (mode === 'edit') return false;

  // 아바타는 블러 안 함
  if (isAvatar) return false;

  // 그 외엔 블러 처리
  return true;
}