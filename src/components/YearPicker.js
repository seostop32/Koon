// components/YearPicker.jsx
import React from 'react';

const YearPicker = ({ selectedYear, onChange }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i); // 최근 100년

  return (
    <select
      value={selectedYear || ''}
      onChange={(e) => onChange(Number(e.target.value))}
      className="border p-2 rounded w-full"
    >
      <option value="">연도 선택</option>
      {years.map((year) => (
        <option key={year} value={year}>
          {year}년
        </option>
      ))}
    </select>
  );
};

export default YearPicker;