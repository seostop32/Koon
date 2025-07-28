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
const [userGender, setUserGender] = useState(null);  // 로그인한 유저의 성별
    // 상단의 useState 정의 부분에 추가
    const [selectedGender, setSelectedGender] = useState('');

    useEffect(() => {
      const fetchUserAndGender = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return;

        setUser(user); // 로그인 유저 세팅

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('gender')
          .eq('id', user.id)
          .single();

        if (profile?.gender) {
          console.log('유저 성별:', profile.gender);

          const oppositeGender = profile.gender === '남성' ? '여성' : '남성';
          console.log('설정할 selectedGender:', oppositeGender);
          setSelectedGender(oppositeGender);
        }
      };

      fetchUserAndGender();
    }, []);    

    useEffect(() => {
      const fetchUserGender = async () => {
        if (user?.id) {
          const { data, error } = await supabase
            .from('profiles')
            .select('gender')
            .eq('id', user.id)
            .single();

          if (data) {
            console.log('로그인 유저 성별:', data.gender);
            setUserGender(data.gender);
          } else {
            console.error('성별 조회 에러:', error);
          }
        }
      };

      fetchUserGender();
    }, [user]);

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
      console.log('user:', user);
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
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
              alert('로그인이 필요합니다.');
              navigate('/intro');
              return;
            }

            const { data: partnerSettings, error: settingsError } = await supabase
              .from('partner_settings')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

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

            const {
              gender = '',
              age_min = null,
              age_max = null,
              height_min = null,
              height_max = null,
              region = '',
              body_type = '',
              religion = '',
              drinking = '',
              smoking = '',
              hobbies = '',
              blood_type = '',
            } = partnerSettings || {};

            // 로그 찍기
            console.log('gender:', gender);

            const minAge = age_min ?? 20;
            const maxAge = age_max ?? 40;
            const minHeight = height_min ?? 150;
            const maxHeight = height_max ?? 180;

            console.log('query filters:', {
              gender,
              minAge,
              maxAge,
              minHeight,
              maxHeight,
              region,
              body_type,
              religion,
              drinking,
              smoking,
              hobbies,
              blood_type,
            });

            let query = supabase.from('profiles').select('*');

            if (gender !== '') {
              // 대소문자 문제 있을 경우 ilike 사용
              query = query.ilike('gender', gender);
            }

            if (minAge !== null && maxAge !== null) {
              query = query.gte('age', minAge).lte('age', maxAge);
            }

            if (minHeight !== null && maxHeight !== null) {
              query = query.gte('height', minHeight).lte('height', maxHeight);
            }

            if (region !== '') query = query.eq('region', region);
            if (body_type !== '') query = query.eq('body_type', body_type);
            if (religion !== '') query = query.eq('religion', religion);
            if (drinking !== '') query = query.eq('drinking', drinking);
            if (smoking !== '') query = query.eq('smoking', smoking);
            if (hobbies !== '') query = query.ilike('hobbies', `%${hobbies}%`);
            if (blood_type !== '') query = query.eq('blood_type', blood_type);

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

        // 성별 조회
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("gender")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          console.error("프로필 조회 실패:", profileError);
          alert("사용자 정보를 가져오지 못했습니다.");
          return;
        }

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

        // ✅ 조건 먼저 저장 (성별 무관하게 항상 저장)
        const { error: settingsError } = await supabase
          .from("partner_settings")
          .upsert(settings, { onConflict: ["user_id"] });

        if (settingsError) {
          console.error("이상형 저장 오류:", settingsError);
          alert("이상형 조건 저장 중 오류가 발생했습니다.");
          return;
        }

        // ✅ 남성만 코인 차감
        if (profile.gender === '남성') {
          const success = await deductCoinRpc(user.id, 'change_setting');
          if (!success) {
            console.warn('⛔ 코인 부족 또는 차감 실패');
            return;
          }
        }

        // ✅ 상태 플래그 업데이트
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ is_ideal_search_activated: true })
          .eq('id', user.id);

        if (profileUpdateError) {
          console.error("프로필 상태 업데이트 오류:", profileUpdateError);
          alert("프로필 업데이트 중 문제가 발생했습니다.");
          return;
        }

        setIsModalOpen(false);
        navigate('/dashboard');
      } catch (err) {
        console.error("에러 발생:", err);
        alert("문제가 발생했습니다. 다시 시도해주세요.");
      }
    };    
    
  console.log("selectedGender:", selectedGender);


  console.log("📌 현재 settings 상태:", settings);
  const handleFindPartner = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      const {
        gender,
        region,
        age_min,
        age_max,
        height_min,
        height_max,
        body_type,
        religion,
        drinking,
        smoking,
        hobbies,
        blood_type,
      } = settings;

      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("gender")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("프로필 가져오기 실패:", profileError);
        return;
      }

      // 여성이라면 조건을 먼저 저장
      if (profileData.gender === "여성") {
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

        const { error: settingsError } = await supabase
          .from("partner_settings")
          .upsert(settings, { onConflict: ["user_id"] });

        if (settingsError) {
          console.error("여성 이상형 조건 저장 오류:", settingsError);
          alert("이상형 조건 저장 중 오류가 발생했습니다.");
          return;
        }
      }

    // gender 필터 결정 (선택된 gender가 없으면 반대 성별 필터)
    const genderToFilter = gender && gender.trim() !== ''
      ? gender.trim()
      : profileData.gender.trim() === '남성'
        ? '여성'
        : '남성';

    console.log("🔁 기본 성별 자동 설정:", genderToFilter);

    let query = supabase.from('profiles').select('*');

    if (genderToFilter && genderToFilter.trim() !== '') {
      query = query.eq('gender', genderToFilter);
    }
    if (age_min !== undefined) query = query.gte('age', age_min);
    if (age_max !== undefined) query = query.lte('age', age_max);
    if (height_min !== undefined) query = query.gte('height', height_min);
    if (height_max !== undefined) query = query.lte('height', height_max);
    if (region && region.trim() !== '') query = query.eq('region', region);
    if (body_type && body_type.trim() !== '') query = query.eq('body_type', body_type);
    if (religion && religion.trim() !== '') query = query.eq('religion', religion);
    if (drinking && drinking.trim() !== '') query = query.eq('drinking', drinking);
    if (smoking && smoking.trim() !== '') query = query.eq('smoking', smoking);
    if (hobbies && hobbies.trim() !== '') query = query.ilike('hobbies', `%${hobbies}%`);
    if (blood_type && blood_type.trim() !== '') query = query.eq('blood_type', blood_type);

    // 본인 제외
    query = query.neq('id', user.id);

    const { data, error } = await query;

    if (error) {
      console.error('❌ 필터링 실패:', error.message);
      return;
    }

    setFilteredProfiles(data || []);
    navigate('/dashboard');
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
          {/* 이상형 찾기를 실행하면 10코인이 차감됩니다. */}
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
            options={['남성', '여성']}
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
                onClick={() => {
                  console.log('로그인 유저 성별:', userGender);
                  if (userGender === '남성') {
                    setIsModalOpen(true);  // 여성 아니면 모달 열기
                  } else {
                    handleFindPartner();   // 여성은 바로 실행
                  }
                }}
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
                    handleFindPartner();
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