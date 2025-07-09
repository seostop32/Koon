// utils/zodiac.js
export const zodiacSigns = ['쥐띠', '소띠', '호랑이띠', '토끼띠', '용띠', '뱀띠', '말띠', '양띠', '원숭이띠', '닭띠', '개띠', '돼지띠'];

export function getZodiac(age) {
  if (!age) return '띠 정보 없음';
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const zodiacIndex = (birthYear - 4) % 12;
  return zodiacSigns[zodiacIndex < 0 ? zodiacIndex + 12 : zodiacIndex];
}