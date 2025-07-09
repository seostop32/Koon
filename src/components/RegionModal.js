// components/RegionModal.jsx
import React, { useState } from 'react';

const REGION_LIST = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

export default function RegionModal({ onClose, onSave, initialRegions = [] }) {
  const [selected, setSelected] = useState(initialRegions);

  const toggleRegion = (region) => {
    setSelected((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  return (
    <div className="modal">
      <h2>지역 선택</h2>
      <div className="region-list">
        {REGION_LIST.map((region) => (
          <button
            key={region}
            onClick={() => toggleRegion(region)}
            className={selected.includes(region) ? 'selected' : ''}
          >
            {region}
          </button>
        ))}
      </div>
      <button onClick={() => onSave(selected)}>확인</button>
      <button onClick={onClose}>닫기</button>
    </div>
  );
}