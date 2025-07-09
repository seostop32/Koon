import '../styles/modal.css';
import React, { useState, useEffect } from 'react';
import ReactSlider from 'react-slider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaCoins } from 'react-icons/fa';  // react-icons 설치 필요
import { deductCoinRpc } from '../utils/coinUtils';
import SettingsPageHeader from './SettingsPageHeader';
import Footer from './Footer';


function SettingsPage({ profile, parentData, onSavePartnerSettings, userCoinBalance, onUpdateCoinBalance }) {
  const navigate = useNavigate();

  const [selectedGender, setSelectedGender] = useState('');
  const [isGenderModalOpen, setIsGenderModalOpen] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState('');
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);

  const [ageRange, setAgeRange] = useState([20, 40]);
  const [heightRange, setHeightRange] = useState([150, 180]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coinCount, setCoinCount] = useState(0);

  // state 상단에 추가
  const [selectedJob_title, setSelectedJob_title] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedReligion, setSelectedReligion] = useState('');  
  const [selectedDrinking, setSelectedDrinking] = useState('');
  const [selectedSmoking, setSelectedSmoking] = useState('');
  const [selectedHobby, setSelectedHobby] = useState('');
  const [selectedBlood, setSelectedBlood] = useState('');

  const [isSelectedJob_titleModalOpen, setIsSelectedJob_titleModalOpen] = useState(false); 
  const [isSelectedTypeModalOpen, setIsSelectedTypeModalOpen] = useState(false); 
  const [isReligionModalOpen, setIsReligionModalOpen] = useState(false);
  const [isDrinkingModalOpen, setIsDrinkingModalOpen] = useState(false);
  const [isSmokingModalOpen, setIsSmokingModalOpen] = useState(false);
  const [isHobbyModalOpen, setIsHobbyModalOpen] = useState(false);
  const [isBloodModalOpen, setIsBloodModalOpen] = useState(false);  
  const [isModalOpen, setIsModalOpen] = useState(false);
const [filteredProfiles, setFilteredProfiles] = useState([]);
const [user, setUser] = useState(null);

    // 새로 추가한 상태: settings
    const initialSettings = useState({
      user_id: '',
      gender: '',
      region: '',
      age_min: 20,
      age_max: 40,
      height_min: 150,
      height_max: 180,
      body_type: '',
      religion: '',
      drinking: '',
      smoking: '',
      hobbies: '',
      blood_type: '',
    });
    const [settings, setSettings] = useState(initialSettings);


    useEffect(() => {
      console.log('📌 현재 settings 상태====:', settings);
    }, [settings]);

        
    useEffect(() => {
      if (user) {
        setSettings((prev) => ({
          ...prev,
          user_id: user.id,
          gender: profile?.gender ?? '',
        }));
      }
    }, [user, profile]);

    // useEffect 내부에서 현재 로그인된 유저 정보 가져오기
    useEffect(() => {
      const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      };
      fetchUser();
    }, []);

   // 사용자 데이터 불러오기 (아바타, 코인)
    useEffect(() => {
      const loadUserData = async () => {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
  
        if (userError || !user) {
          console.error('로그인이 필요합니다.');
          navigate('/intro');
          return;
        }
  
        // 아바타 URL / 코인 잔액 불러오기
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url, coin_balance')
          .eq('id', user.id)
          .single();
  
        if (profile && profile.avatar_url) {
          const publicUrlResponse = supabase.storage
            .from('profile-photos')
            .getPublicUrl(profile.avatar_url);
          setAvatarUrl(profile.avatar_url || '');
        }
  
        if (profile && profile.coin_balance !== undefined) {
          setCoinCount(profile.coin_balance || 0);
        }
      };
  
      loadUserData();
    }, [navigate]);
  
    // 기존 설정 불러오기 (나이, 키 등)
    useEffect(() => {
      const loadSettings = async () => {
        const { data: { user }, } = await supabase.auth.getUser();
  
        if (!user) {
          alert('로그인이 필요합니다.');
          navigate('/intro');
          return;
        }
        
        // 1. 이상형 설정 불러오기
        const { data: partnerSettings, error: settingsError } = await supabase
          .from('partner_settings')
          .select('*', {
            headers: { Accept: 'application/json' },  // 👈 이 줄이 중요
          })
          .eq('user_id', user.id)
          .maybeSingle(); // 또는 .single()
                    
        if (settingsError) {
          console.error('설정 불러오기 실패:', settingsError.message);
          return;
        }
  
        if (partnerSettings) {
          setSelectedGender(partnerSettings.gender || '');
          setAgeRange([partnerSettings.age_min || 20, partnerSettings.age_max || 40]);
          setHeightRange([partnerSettings.height_min || 150, partnerSettings.height_max || 180]);
          setSelectedRegion(partnerSettings.region || '');
          setSelectedType(partnerSettings.body_type || '');
          setSelectedReligion(partnerSettings.religion || '');
          setSelectedDrinking(partnerSettings.drinking || '');
          setSelectedSmoking(partnerSettings.smoking || '');
          setSelectedHobby(partnerSettings.hobbies || '');
          setSelectedBlood(partnerSettings.blood_type || '');
        }


        // 2. 설정에 따라 프로필 필터링
        const { gender, age_min, age_max, height_min, height_max, region, body_type, religion, drinking, smoking, hobbies, blood_type } = partnerSettings || {};

        // 필터 조건 구성
        let query = supabase.from('profiles').select('*');

        // 필터 조건별 where절 추가
        if (gender) query = query.eq('gender', gender);
        if (age_min && age_max) query = query.gte('age', age_min).lte('age', age_max);
        if (height_min && height_max) query = query.gte('height', height_min).lte('height', height_max);
        if (region) query = query.eq('region', region);
        if (body_type) query = query.eq('body_type', body_type);
        if (religion) query = query.eq('religion', religion);
        if (drinking) query = query.eq('drinking', drinking);
        if (smoking) query = query.eq('smoking', smoking);
        if (hobbies) query = query.ilike('hobbies', `%${hobbies}%`);
        if (blood_type) query = query.eq('blood_type', blood_type);

        // 본인 제외
        query = query.neq('id', user.id);

        const { data: filteredProfiles, error: profilesError } = await query;

        if (profilesError) {
          console.error('프로필 필터링 실패:', profilesError.message);
          return;
        }

        setFilteredProfiles(filteredProfiles || []);

      };
  
      loadSettings();
    }, [navigate]);
  
    // 슬라이더 변경 핸들러
    const handleAgeChange = (values) => setAgeRange(values);
    const handleHeightChange = (values) => setHeightRange(values);
  
    const handleConfirm = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          alert("로그인이 필요합니다.");
          return;
        }

        console.log("📌 user.id:============ ", user.id);
        // 코인 차감 시도
        const success = await deductCoinRpc(user.id, 'change_setting');
        if (!success) {
          alert("코인이 부족합니다.");
          return;
        }

        // 이상형 조건 저장 등 나머지 로직...
        // ✅ 이상형 조건 저장
              const settings = {
                user_id: user.id,
                gender: selectedGender,
                region: selectedRegion,
                age_min: ageRange[0],
                age_max: ageRange[1],
                height_min: heightRange[0],
                height_max: heightRange[1],
                body_type: selectedType,
                religion: selectedReligion,
                drinking: selectedDrinking,
                smoking: selectedSmoking,
                hobbies: selectedHobby,
                blood_type: selectedBlood,
              };

              console.log("📌 settings: ", settings);

              const { error: settingsError } = await supabase
                .from("partner_settings")
                .upsert(settings, { onConflict: ["user_id"] });

              if (settingsError) {
                console.error("이상형 저장 오류:", settingsError);
                alert("이상형 조건 저장 중 오류가 발생했습니다.");
                return;
              }

              // ✅ 프로필 상태 업데이트
              const { error } = await supabase
                .from('profiles')
                .update({ is_ideal_search_activated: true })
                .eq('id', user.id);

              setIsModalOpen(false);
              navigate('/dashboard');              
      } catch (err) {
        console.error("에러 발생:", err);
        alert("문제가 발생했습니다. 다시 시도해주세요.");
      }
    }; 
  

console.log("📌 현재 settings 상태:", settings);
  const handleFindPartner = async () => {
    const {
      gender, region, age_min, age_max,
      height_min, height_max, body_type,
      religion, drinking, smoking, hobbies, blood_type,
    } = settings;  // 저장된 조건 가져오기
console.log("💡 검색 조건 SQL 디버깅:");    
    console.log('🧪 조건:', {
      gender, age_min, age_max, height_min, height_max, region,
      body_type, religion, drinking, smoking, hobbies, blood_type,
    });
    let whereClauses = [];
    if (gender) whereClauses.push(`gender = '${gender}'`);
    if (age_min !== undefined) whereClauses.push(`age >= ${age_min}`);
    if (age_max !== undefined) whereClauses.push(`age <= ${age_max}`);
    if (height_min !== undefined) whereClauses.push(`height >= ${height_min}`);
    if (height_max !== undefined) whereClauses.push(`height <= ${height_max}`);
    if (region) whereClauses.push(`region = '${region}'`);
    if (body_type) whereClauses.push(`body_type = '${body_type}'`);
    if (religion) whereClauses.push(`religion = '${religion}'`);
    if (drinking) whereClauses.push(`drinking = '${drinking}'`);
    if (smoking) whereClauses.push(`smoking = '${smoking}'`);
    if (hobbies) whereClauses.push(`hobbies LIKE '%${hobbies}%'`);
    if (blood_type) whereClauses.push(`blood_type = '${blood_type}'`);

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const sql = `SELECT * FROM profiles ${whereSql};`;

    console.log('실행할 SQL 쿼리:', sql);

    // supabase 쿼리 실행
    let query = supabase.from('profiles').select('*');
console.log("🔍 필터 결과:", data);
    if (gender) query = query.eq('gender', gender);
    if (age_min !== undefined && age_max !== undefined) query = query.gte('age', age_min).lte('age', age_max);
    if (height_min !== undefined && height_max !== undefined) query = query.gte('height', height_min).lte('height', height_max);
    if (region) query = query.eq('region', region);
    if (body_type) query = query.eq('body_type', body_type);
    if (religion) query = query.eq('religion', religion);
    if (drinking) query = query.eq('drinking', drinking);
    if (smoking) query = query.eq('smoking', smoking);
    if (hobbies) query = query.ilike('hobbies', `%${hobbies}%`);
    if (blood_type) query = query.eq('blood_type', blood_type);

    query = query.neq('id', user.id);  // 본인 제외

    const { data, error } = await query;
    if (error) {
      console.error('필터링 실패:', error.message);
      return;
    }

    setFilteredProfiles(data || []);
  };  

  const renderSelectableRow = (label, value, setValue, setModalOpen) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        padding: '8px 0',
        //px solid #eee',
      }}
    >
      <span style={{ fontSize: '1rem', color: '#333' }}>{label}</span>
      <button
        type="button"
        onClick={() => (value ? setValue('') : setModalOpen(true))}
        style={{
          fontSize: 14,
          padding: '6px 12px',
          border: `1px solid ${value ? '#ff6600' : '#ccc'}`, // ✅ 테두리 조건
          backgroundColor: 'transparent',
          color: value ? '#ff6600' : '#888', // ✅ 글자색 조건
          borderRadius: 4,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minWidth: '4.5rem', // 고정된 너비 (대략 4글자)
          justifyContent: 'center',
          transition: 'color 0.3s ease, border-color 0.3s ease',
        }}
      >
      {value || '선택하기'}
      {value && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            setValue('');
          }}
          style={{ fontWeight: 'bold', cursor: 'pointer' }}
        >
          ×
        </span>
      )}
    </button>
    </div>
  );  

  function Modal({ title, options, selected = [], onToggle, onSelect, onClose, multiple = false }) {
    const handleClick = (option) => {
      if (multiple) {
        onToggle(option); // 다중 선택
      } else {
        onSelect(option); // 단일 선택
      }
    };

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 8,
            width: '80%',
            maxWidth: 300,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          <h3 style={{ marginBottom: 6, fontSize: '0.9rem', color: '#333' }}>{title}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {options.map((option) => (
              <button
              key={option}
              onClick={() => handleClick(option)}
              style={{
                padding: '8px',
                margin: '1px',
                border: selected.includes(option) ? '2px solid #007bff' : '1px solid #ccc',
                borderRadius: '5px',
                backgroundColor: selected.includes(option) ? '#e6f0ff' : '#fff',
                cursor: 'pointer'
              }}
            >
              {option}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            style={{
              marginTop: 10,
              padding: '6px 12px',
              backgroundColor: '#ff6600',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

   return (
    <div style={{ maxWidth: 600, margin: '0px auto', fontFamily: 'Arial, sans-serif' }}>
    {/* 화면 전체 너비 헤더 */}
    <div>
      <SettingsPageHeader />
    </div>    

    {/* 헤더 제외한 본문 전체 감싸는 div */}
    <div style={{ marginLeft: 16, marginRight: 16 }}>
        {/* 설명 텍스트 */}
        <p style={{
          fontSize: 16,
          color: '#ff6600',
          textAlign: 'left',
          marginTop: 4,  // 필요하면 위쪽 마진도 조금 줄여줌
          marginBottom: 6
        }}>
          이상형을 설정 후, 이상형 찾기 버튼을 눌러주세요. <br />
          이상형 찾기를 실행하면 10코인이 차감됩니다.
        </p>


        {/* 👇 지역 선택을 슬라이더 위로 이동 */}
        <section style={{ marginBottom: 6 }}>
          {renderSelectableRow('성별', selectedGender, setSelectedGender, setIsGenderModalOpen)}
        </section>
        <section style={{ marginBottom: 6 }}>
          {renderSelectableRow('지역', selectedRegion, setSelectedRegion, setIsRegionModalOpen)}
        </section>

        {/* 나이 슬라이더 */}
        <section style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h2 style={{ fontSize: '1rem', margin: 0, color: '#333', fontWeight: 'normal' }}>나이</h2>
            <div style={{ fontSize: 14, fontWeight: 'normal', color: '#ff6600' }}>
              {ageRange[0]} 세 ~ {ageRange[1]} 세
            </div>
          </div>
          <ReactSlider
            className="horizontal-slider"
            thumbClassName="thumb"
            trackClassName="track"
            value={ageRange}
            onChange={handleAgeChange}
            min={18}
            max={65}
            pearling
            minDistance={1}
          />
        </section>

        {/* 키 슬라이더 */}
        <section style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h2 style={{ fontSize: '1rem', margin: 0, color: '#333', fontWeight: 'normal' }}>키</h2>
            <div style={{ fontSize: 14, fontWeight: 'normal', color: '#ff6600' }}>
              {heightRange[0]} cm ~ {heightRange[1]} cm
            </div>
          </div>
          <ReactSlider
            className="horizontal-slider"
            thumbClassName="thumb"
            trackClassName="track"
            value={heightRange}
            onChange={handleHeightChange}
            min={120}
            max={200}
            pearling
            minDistance={1}
          />
        </section>

        <section style={{ marginTop: 10 }}>
          {/* profile.job_title */}
          {renderSelectableRow('직업', selectedJob_title, setSelectedJob_title, setIsSelectedJob_titleModalOpen)}
          {renderSelectableRow('체형', selectedType, setSelectedType, setIsSelectedTypeModalOpen)}
          {renderSelectableRow('종교', selectedReligion, setSelectedReligion, setIsReligionModalOpen)}
          {/* {renderSelectableRow('음주', selectedDrinking, setSelectedDrinking, setIsDrinkingModalOpen)} */}
          {/* {renderSelectableRow('흡연', selectedSmoking, setSelectedSmoking, setIsSmokingModalOpen)} */}
          {/* {renderSelectableRow('취미', selectedHobby, setSelectedHobby, setIsHobbyModalOpen)} */}
          {renderSelectableRow('혈액형', selectedBlood, setSelectedBlood, setIsBloodModalOpen)}
        </section>

        {/* 성별 모달 */}
        {isGenderModalOpen && (
          <Modal
            title="성별 선택"
            options={['모두', '남성', '여성']}
            onSelect={(v) => {
              setSelectedGender(v);
              setIsGenderModalOpen(false);
            }}
            onClose={() => setIsGenderModalOpen(false)}
          />
        )}      

        {/* 지역 모달 */}
        {isRegionModalOpen && (
          <Modal
            title="지역 선택"
            options={['서울', '인천', '대전', '대구', '부산', '광주', '경기', '세종', '강원', '충북', '충남', '경북', '경남', '전북', '전남', '제주', '해외']}
            onSelect={(v) => {
              setSelectedRegion(v);
              setIsRegionModalOpen(false);
            }}
            onClose={() => setIsRegionModalOpen(false)}
          />
        )}

        {/* 직업 모달 */}
        {isSelectedJob_titleModalOpen && (
          <Modal
            title="직업 선택"
            options={['학생', '회사원', '프리랜서', '자영업', '전문직', '기타']}
            onSelect={(v) => {
              setSelectedJob_title(v);
              setIsSelectedJob_titleModalOpen(false);
            }}
            onClose={() => setIsSelectedJob_titleModalOpen(false)}
          />
        )}

        {/* 체형 모달 */}
        {isSelectedTypeModalOpen && (
          <Modal
            title="체형 선택"
            options={['마른', '슬림함', '보통 체형', '건장한', '근육질', '글래머', '통통한', '뚱뚱한', '상관없음']}
            onSelect={(v) => {
              setSelectedType(v);
              setIsSelectedTypeModalOpen(false);
            }}
            onClose={() => setIsSelectedTypeModalOpen(false)}
          />
        )}

        {/* 종교 모달 */}
        {isReligionModalOpen && (
          <Modal
            title="종교 선택"
            options={['기독교', '천주교', '불교', '기타', '무교', '상관없음']}
            onSelect={(v) => {
              setSelectedReligion(v);
              setIsReligionModalOpen(false);
            }}
            onClose={() => setIsReligionModalOpen(false)}
          />
        )}

        {/* 음주 모달 */}
        {isDrinkingModalOpen && (
          <Modal
            title="음주 선택"
            options={['안마심', '못마심', '어쩔 수 없을때만', '가끔', '어느정도 마심', '좋아하는 편', '자주 마심', '상관없음']}
            onSelect={(v) => {
              setSelectedDrinking(v);
              setIsDrinkingModalOpen(false);
            }}
            onClose={() => setIsDrinkingModalOpen(false)}
          />
        )}      

        {/* 흡연 모달 */}
        {isSmokingModalOpen && (
          <Modal
            title="흡연 선택"
            options={['비흡연', '흡연(전자담배)', '흡연(일반담배)', '상관없음']}
            onSelect={(v) => {
              setSelectedSmoking(v);
              setIsSmokingModalOpen(false);
            }}
            onClose={() => setIsSmokingModalOpen(false)}
          />
        )}
        
        
        {/* 취미 모달 멀티 */}
        {/*
        {isHobbyModalOpen && (
          <Modal
            title="취미 선택"
            multiple // ← 이게 있으면 멀티 선택으로 동작 
            options={['골프', '공연관람', '국내여행', '해외여행', '기타연주'
              , '낚시', '댄스', '드라마', '드라이브', '등산', '래프팅','맛집탐방'
              , '문학', '미용', '볼링', '봉사활동', '비디오게임'
              , '사진', '산책', '쇼핑', '수영', '스케이트', '스노우보드', '스쿼시', '스킨스쿠버'
              , '와인', '영화', '어학', '요가', '음악감상', '자기개발', '재테크', '캠핑', '필라테스'
              , '피트니스', '헬스', '없음'
            ]}
              selected={selectedHobbies}        // ✅ 여기가 중요!
              onToggle={(hobby) => {
                setSelectedHobbies((prev) =>
                  prev.includes(hobby)
                    ? prev.filter((h) => h !== hobby)
                    : [...prev, hobby]
                );
              }}
              onClose={() => setIsHobbyModalOpen(false)}
              multiSelect={true}
            />
        )} */}

  
        {/* 취미 모달 */}
        {isHobbyModalOpen && (
          <Modal
            title="취미 선택"
            options={['골프', '공연관람', '여행', '낚시'
              , '댄스', '드라이브', '드라마', '등산', '래프팅','맛집탐방'
              , '문학', '미용', '볼링', '봉사활동', '비디오게임'
              , '사진', '산책', '쇼핑', '수영', '스케이트', '스노우보드', '스쿼시', '스킨스쿠버'
              , '와인', '영화', '어학', '요가', '음악감상', '자기개발', '재테크', '캠핑', '필라테스'
              , '피트니스', '헬스', '없음'
            ]}
            onSelect={(v) => {
              setSelectedHobby(v);
              setIsHobbyModalOpen(false);
            }}
            onClose={() => setIsHobbyModalOpen(false)}
          />
        )}
        
        {/* 혈액형 모달 */}
        {isBloodModalOpen && (
          <Modal
            title="혈액형 선택"
            options={['A', 'B', 'AB', 'O']}
            onSelect={(v) => {
              setSelectedBlood(v);
              setIsBloodModalOpen(false);
            }}
            onClose={() => setIsBloodModalOpen(false)}
          />
        )}
        {/* 버튼 영역 */}
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              width: '100%',
              padding: '12px 0',
              backgroundColor: '#ff6600',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            이상형 찾기
          </button>
        </div>
        {/* 이상형 찾기 실행 확인 모달 */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: 24,
                borderRadius: 8,
                width: '80%',
                maxWidth: 300,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 16, marginBottom: 6 }}>
                코인 10개를 사용해서<br />이상형을 찾을까요?
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <button
                  onClick={() => {
                    handleFindPartner();  // 이상형 찾기 실행 함수 호출
                    setIsModalOpen(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#ccc',
                    color: 'black',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  취소
                </button>              
                <button
                  onClick={handleConfirm}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#ff6600',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 슬라이더 CSS */}
        <style>{`
          .horizontal-slider {
            width: 100%;
            height: 30px;
          }
          .thumb {
            height: 20px;
            width: 20px;
            background-color: #ff6600;
            border-radius: 50%;
            cursor: grab;
            top: 5px;
          }
          .track {
            top: 14px; /* 바를 수직 중앙에 위치시키기 위해 약간 올립니다 */
            height: 2px; /* 👉 슬라이드 바 두께 줄임 */
            background: #ddd;
          }
          .track.track-1 {
            background: #ff6600;
          }
        `}</style>
        <footer style={styles.footer}>
          <div style={styles.footerButton} onClick={() => navigate('/')}>🏠</div>
          <div style={styles.footerButton} onClick={() => navigate('/search')}>🔍</div>
          <div style={styles.footerButton} onClick={() => navigate('/favorites')}>💘</div>
          <div style={styles.footerButton} onClick={() => navigate('/chat')}>💬</div>
          <div style={styles.footerButton} onClick={() => navigate('/mypage')}>👤</div>
        </footer>
        </div>
    </div>
  );
}
const styles = {
  header: {
    padding: '1rem',
    fontSize: '1.5rem',
    backgroundColor: '#f8f8f8',
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTop: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '16px 0',
    zIndex: 50,
  },
  footerButton: {
    flex: 1,
    textAlign: 'center',
    fontSize: '1.2rem',
    cursor: 'pointer',
    userSelect: 'none',
  },  

};
export default SettingsPage;