import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import * as faceapi from 'face-api.js';
import YearPicker from './YearPicker'; // 경로는 실제 위치에 따라 조정

function ProfileDetailEdit() {
  const { id } = useParams();
  //const [profile, setProfile] = useState(null);
  const [assets, setAssets] = useState(null);  
  const [profile, setProfile] = useState({
    annual_income: '',
    assets: '',
    // 필요한 다른 필드들 초기값도 같이 넣으면 편해요
  });  

  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(null); // 메인 사진 인덱스
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);  

  const [selectedRegion, setSelectedRegion] = useState('');
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);  

  const [isYearofbirthYearModalOpen, setIsYearofbirthModalOpen] = useState(false);  

  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);  

  const [selectedHometown, setSelectedHometown] = useState('');
  const [isHometownModalOpen, setIsHometownModalOpen] = useState(false);    

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 20; // 20살 되는 해
  const length = 50;
  const yearOptions = Array.from({ length }, (_, i) => startYear - i);

  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isJobtitleModalOpen, setIsJobtitleModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);  
  const [isBodyTypeModalOpen, setIsBodyTypeModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);  

  const [isPersonalityModalOpen, setIsPersonalityModalOpen] = useState(false);
  const [isHobbiesModalOpen, setIsHobbiesModalOpen] = useState(false);
  const [isMbtiModalOpen, setIsMbtiModalOpen] = useState(false);
  const [isSignupSourceModalOpen, setIsSignupSourceModalOpen] = useState(false);

  const [isLifeStyleModalOpen, setIsLifeStyleModalOpen] = useState(false);
  const [isReligionModalOpen, setIsReligionModalOpen] = useState(false);

  const incomeOptions = ['소득없음','5,000만원 미만', '5,000만 ~ 1억원', '1억원 이상'];  
  const assetsOptions = ['소득없음', '1천만 이하', '1천만 ~ 5천만', '5천만 ~ 1억', '1억 ~ 5억', '5억 이상', ];

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [searchParams]);


  // face-api 모델 로딩
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models/ssd_mobilenetv1');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector');
        // 아래 모델들은 실제로 모델 파일이 없으면 주석 처리하세요.
        // await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68');
        // await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition');
        // await faceapi.nets.faceExpressionNet.loadFromUri('/models/face_expression');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Face API 모델 로딩 실패:', error);
      }
    };
    loadModels();
  }, []);


  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('프로필 불러오기 오류:', error);
        setProfile(null);
      } else {
        setProfile(data);
        // 메인 사진 인덱스 초기값 설정: avatar_url이 profile_photos에 있으면 해당 인덱스, 없으면 null
        if (data.profile_photos && data.avatar_url) {
          const idx = data.profile_photos.findIndex((url) => url === data.avatar_url);
          setMainPhotoIndex(idx >= 0 ? idx : null);
        } else {
          setMainPhotoIndex(null);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleYearofbirthSelect = (selectedOption) => {
    setProfile((prev) => ({
      ...prev,
      yearofbirth: selectedOption,
    }));
    setIsYearofbirthModalOpen(false);
  };  
  const handleLocationSelect = (selectedOption) => {
    setProfile((prev) => ({
      ...prev,
      location: selectedOption,
    }));
    setIsLocationModalOpen(false);
  };  
  const handleHometownSelect = (selectedOption) => {
    setProfile((prev) => ({
      ...prev,
      hometown: selectedOption,
    }));
    setIsHometownModalOpen(false);
  };

  const uploadToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 1. 업로드  
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error('업로드 실패: ' + uploadError.message);
    }

    // 2. 업로드 경로가 맞는지 로그
    console.log('uploadData:', uploadData);


    // 3. 퍼블릭 URL 얻기 (uploadData.path가 실제 저장된 경로)
      const { data: publicUrlData, error: urlError } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      if (urlError) {
        throw new Error('퍼블릭 URL 획득 실패: ' + urlError.message);
      }

      const publicUrl = publicUrlData.publicUrl;
      console.log('publicUrl:', publicUrl); // URL 값이 나오는지 확인

      if (!publicUrl) {
        throw new Error('publicUrl이 유효하지 않습니다.');
      }


    // 4. 기존 배열에 추가
    const updatedPhotos = [...(profile.profile_photos || []), publicUrl];

    // 5. DB 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        profile_photos: updatedPhotos,
      })
      .eq('id', profile.id);

    if (updateError) {
      throw new Error('DB 저장 실패: ' + updateError.message);
    }

    // 6. 상태 동기화
    setProfile((prev) => ({
      ...prev,
      avatar_url: publicUrl,
      profile_photos: updatedPhotos,
    }));

    return publicUrl;
  };

  //파일업로드벨리데이션  
  const handleSpecialPhotoChange = async (e) => {
    if (!modelsLoaded) {
      alert("모델이 아직 로드되지 않았습니다. 잠시만 기다려주세요.");
      return;
    }
    const files = Array.from(e.target.files).slice(0, 3);  
    setIsProcessing(true);

    for (const file of files) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 쉬어가기 (UI 블럭 방지)
      try {
        const img = await faceapi.bufferToImage(file);
        const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options());
        //const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions());
console.log('파일 타입:', file.type);
console.log('instanceof Blob:', file instanceof Blob); // true여야 정상

        if (!detection) {
          alert("얼굴을 찾을 수 없습니다.");
          continue;
        }
        await uploadToSupabase(file);
      } catch (err) {
        console.error(err);
      }
    }

    setIsProcessing(false);
  };

  // 사진 삭제 함수: 삭제 후 mainPhotoIndex 보정
  const handleDeletePhoto = async (indexToDelete) => {
    const fullUrl = profile.profile_photos[indexToDelete];
    // supabase storage 경로만 추출 (publicUrl에서 경로로 변환)
    const filePath = fullUrl.replace(/^.*\/profile-photos\//, 'profile-photos/');

    // 1. 스토리지에서 삭제
    const { error: deleteError } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);

    if (deleteError) {
      alert('스토리지에서 삭제 실패: ' + deleteError.message);
      return;
    }

    // 2. 로컬 상태에서 제거
    const updatedPhotos = profile.profile_photos.filter((_, idx) => idx !== indexToDelete);

    // 3. mainPhotoIndex 보정
    let newMainPhotoIndex = mainPhotoIndex;
    if (mainPhotoIndex === indexToDelete) {
      newMainPhotoIndex = null;
    } else if (mainPhotoIndex > indexToDelete) {
      newMainPhotoIndex = mainPhotoIndex - 1;
    }

    setMainPhotoIndex(newMainPhotoIndex);

    // 상태도 동기화
    setProfile((prev) => ({
      ...prev,
      avatar_url: updatedPhotos,
     //profile_photos: publicUrl,
      profile_photos: updatedPhotos,
    }));

    // 4. DB 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: updatedPhotos,
        profile_photos: updatedPhotos })
      .eq('id', profile.id);

    if (updateError) {
      alert('DB 반영 실패: ' + updateError.message);
    } else {
      console.log('사진 삭제 및 DB 반영 성공');
    }
  };

  const onClickUploadButton = () => {
    fileInputRef.current.click();
  };

  const handleSave = async () => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      avatar_url:
        typeof mainPhotoIndex === 'number'
          ? profile.profile_photos?.[mainPhotoIndex] || null
          : null,
      profile_completed: true,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updatedProfile)
      .eq('id', id);

    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      alert('저장 완료!');
      navigate(`/profile/${id}`);
    }
  };

  // 섹션별로 다른 고정 너비를 설정 (예시)
  const sectionLabelWidths = {
    personalInfo: 80,
    personality: 80,
    jobtitle: 80,
    lifestyle: 80,
    selfIntro: 80,
    partnerPreference: 80,
    family: 80,
    profilePhoto: 80,
  };

  const radio_options = {
    marriage_type: ['초혼', '재혼'],
    gender: ['남성', '여성'],
    // 필요 시 다른 항목도 추가
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

    function Modal({ title, options = [], selected = [], onToggle, onSelect, onClose, multiple = false }) {
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
                className={(selected || []).includes(option) ? "selected" : ""}
                onClick={() => handleClick(option)}
                style={{
                  padding: '8px',
                  margin: '1px',
                  border: (selected || []).includes(option) ? '2px solid #007bff' : '1px solid #ccc',
                  borderRadius: '5px',
                  backgroundColor: (selected || []).includes(option) ? '#e6f0ff' : '#fff',
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

  // 모달 열림 상태 관리 (필드별)
  const [modalState, setModalState] = useState({
    preferred_region: false,
    preferred_body_type: false,
    preferred_religion: false,
    preferred_hobbies: false,
  });

  // 모달 열기
  function openModal(name) {
    setModalState((prev) => ({ ...prev, [name]: true }));
  }

  // 모달 닫기
  function closeModal(name) {
    setModalState((prev) => ({ ...prev, [name]: false }));
  }

  // 라디오 버튼 옵션 함수
  function getRadioOptions(name) {
    switch (name) {
      case 'preferred_drinking':
        return ['안함', '가끔', '자주'];
      case 'preferred_smoking':
        return ['안함', '가끔', '자주'];
      case 'preferred_blood_type':
        return ['A', 'B', 'O', 'AB'];
      default:
        return [];
    }
  }  

    const handleIncomeSelect = (selectedOption) => {
      setProfile(prev => ({
        ...prev,
        annual_income: selectedOption,
      }));
      setIsIncomeModalOpen(false);
    };

    const handleAssetsSelect = (selectedAsset) => {
      setProfile(prev => ({
        ...prev,
        assets: selectedAsset,
      }));
      setIsAssetsModalOpen(false);
    };     

    // function handleAssetsSelect(selectedAsset) {
    //   setProfile((prev) => ({ ...prev, assets: selectedAsset }));
    // }

  if (loading) return <div>로딩 중...</div>;
  if (!profile) return <div>프로필을 찾을 수 없습니다.</div>;

  return (
    <div style={styles.container}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid #ddd',
      fontSize: 18,
      fontWeight: 'bold',
      userSelect: 'none',
      position: 'relative',  // 중요!
    }}>
      <span
        style={{ cursor: 'pointer', zIndex: 1 }}
        onClick={() => navigate(-1)}
      >
        &lt; 내프로필
      </span>

      <span
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none', // 클릭 방지(뒤에 요소 방해 방지)
        }}
      >
        프로필 등록
      </span>

      <span
        style={{ cursor: 'pointer', fontSize: 24, zIndex: 1 }}
        onClick={() => navigate('/')}
        aria-label="홈으로 이동"
      >
        🏠
      </span>
    </div>

      <div style={styles.form}>
          <section style={styles.section}>
              <div style={styles.sectionTitle}>
                <span><span style={styles.orangeStar}>✦</span> 기본 정보</span>
              </div>
              {[
                  ['nickname', '닉네임'],
                  ['age', '나이'],
                  ['username', '이름'],
                  ['gender', '성별'],
                  ['yearofbirth', '출생년도'],  // 여기 label 변경해도 됨                  
                  ['marriage_type', '결혼여부'],  
                ].map(([name, label]) => {
                  if (name === 'gender' || name === 'marriage_type') {
                    const options = radio_options[name] || [];
                    return (
                      <div key={name} style={{ marginBottom: 12 }}>
                        <span
                          style={{
                            ...styles.labelText,
                            width: sectionLabelWidths.personalInfo,
                            display: 'inline-block',
                          }}
                        >
                          {label}:
                        </span>
                        {options.map((option) => (
                          <label key={option} style={{ marginRight: 15, cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={name}
                              value={option}
                              checked={profile[name] === option}
                              onChange={(e) =>
                                setProfile((prev) => ({ ...prev, [name]: e.target.value }))
                              }
                              style={{ marginRight: 4 }}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    );
                  }
                  
                  if (name === 'yearofbirth') {
                    // 출생년도는 input + 버튼 같이 렌더링
                    return (
                      <label key={name} style={styles.label}>
                        <span style={{ ...styles.labelText, width: sectionLabelWidths.personalInfo }}>
                          {label}:
                        </span>
                        <input
                          type="text"
                          name={name}
                          value={profile[name] || ''}
                          onChange={handleChange}
                          readOnly
                          style={{ ...styles.input, width: '60%', marginRight: 8, cursor: 'pointer', backgroundColor: '#f0f0f0' }}
                        />
                        <button
                          type="button"
                          onClick={() => setIsYearofbirthModalOpen(true)}
                          style={{ padding: '4px 8px', cursor: 'pointer' }}
                        >
                          선택하기
                        </button>
                      </label>
                    );
                  }

                  // 기본 텍스트 input 렌더링
                  return (
                    <label key={name} style={styles.label}>
                      <span style={{ ...styles.labelText, width: sectionLabelWidths.personalInfo }}>
                        {label}:
                      </span>
                      <input
                        type="text"
                        name={name}
                        value={profile[name] || ''}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </label>
                  );
                })}

              {/* 거주지 입력창 + 지역 선택 버튼 */}
              <label style={styles.label}>
                <span style={{ ...styles.labelText, width: sectionLabelWidths.personalInfo }}>
                  거주지:
                </span>
                <input
                  type="text"
                  name="location"
                  value={profile.location || ''}
                  onChange={handleChange}
                  readOnly
                  style={{ ...styles.input, width: '60%', marginRight: 8, cursor: 'pointer', backgroundColor: '#f0f0f0' }}
                />
                <button
                  type="location"
                  onClick={() => setIsLocationModalOpen(true)}
                  style={{ padding: '4px 8px', cursor: 'pointer' }}
                >
                  선택하기
                </button>
              </label>
              {/* 고향 입력창 + 지역 선택 버튼 */}
              <label style={styles.label}>
                <span style={{ ...styles.labelText, width: sectionLabelWidths.personalInfo }}>
                  고향:
                </span>
                <input
                  type="text"
                  name="hometown"
                  value={profile.hometown || ''}
                  onChange={handleChange}
                  readOnly
                  style={{ ...styles.input, width: '60%', marginRight: 8, cursor: 'pointer', backgroundColor: '#f0f0f0' }}
                />
                <button
                  type="button"
                  onClick={() => setIsHometownModalOpen(true)}
                  style={{ padding: '4px 8px', cursor: 'pointer' }}
                >
                  선택하기
                </button>
              </label>              
            </section>
            

            {/* <div hidden>
              {renderSelectableRow(
                '고향',
                profile.hometown,
                (val) => setProfile(prev => ({ ...prev, hometown: val })),
                setIsHometownModalOpen
              )}
            </div> */}       

           <div hidden>
              {renderSelectableRow(
                '출생년도',
                profile.yearofbirth,
                (val) => setProfile(prev => ({ ...prev, yearofbirth: val })),
                setIsYearofbirthModalOpen
              )}
            </div>                 
            {isYearofbirthYearModalOpen && (
              <Modal
                title="출생년도 선택"
                options={yearOptions}
                selected={[profile.birthYear]}
                onSelect={handleYearofbirthSelect}
                onClose={() => setIsYearofbirthModalOpen(false)}
              />
            )}                       
            {isLocationModalOpen && (
              <Modal
                title="거주지 선택"
                options={['서울', '인천', '대전', '대구', '부산', '광주', '경기', '세종', '강원', '충북', '충남', '경북', '경남', '전북', '전남', '제주', '해외']}
                selected={[profile.location]}
                onSelect={handleLocationSelect}
                onClose={() => setIsLocationModalOpen(false)}
              />
            )}
            {isHometownModalOpen && (
              <Modal
                title="고향 선택"
                options={['서울', '인천', '대전', '대구', '부산', '광주', '경기', '세종', '강원', '충북', '충남', '경북', '경남', '전북', '전남', '제주', '해외']}
                selected={[profile.hometown]}
                onSelect={handleHometownSelect}
                onClose={() => setIsHometownModalOpen(false)}
              />
            )}

        <section style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>
                <span style={styles.orangeStar}>✦</span> 학력/직업/스타일
              </span>
            </div>

            {/* 학력 */}
            <label style={styles.label}>
              <span style={{ ...styles.labelText, width: sectionLabelWidths.personalInfo }}>학력:</span>
              <input
                type="text"
                name="education"
                value={profile.education || ''}
                onChange={handleChange}
                readOnly
                style={{ ...styles.input, width: '60%', marginRight: 8, cursor: 'pointer', backgroundColor: '#f0f0f0' }}

              />
              <button
                type="button"
                onClick={() => setIsEducationModalOpen(true)}
                style={{ padding: '4px 8px', cursor: 'pointer' }}
              >
                선택하기
              </button>
            </label>

            {/* 직업 */}
            <label style={styles.label}>
              <span style={{ ...styles.labelText, width: sectionLabelWidths.personalInfo }}>직업:</span>
              <input
                type="text"
                name="jobtitle"
                value={profile.job_title || ''}
                onChange={handleChange}
                readOnly
                style={{ ...styles.input, width: '60%', marginRight: 8, cursor: 'pointer', backgroundColor: '#f0f0f0' }}

              />
              <button
                type="button"
                onClick={() => setIsJobtitleModalOpen(true)}
                style={{ padding: '4px 8px', cursor: 'pointer' }}
              >
                선택하기
              </button>
            </label>

            {/* 나머지 필드 */}
            {[
              ['annual_income', '연 소득'],
              ['assets', '총 자산'],              
              ['height', '키'],
              ['body_type', '체형'],
              ['style', '스타일'],
            ].map(([name, label]) => {
              const isModalField = ['annual_income', 'assets', 'body_type', 'style'].includes(name);
              const openModal = () => {
                if (name === 'annual_income') setIsIncomeModalOpen(true);
                else if (name === 'assets') setIsAssetsModalOpen(true);
                else if (name === 'body_type') setIsBodyTypeModalOpen(true);
                else if (name === 'style') setIsStyleModalOpen(true);
              };

              return (
                <label key={name} style={styles.label}>
                  <span style={{ ...styles.labelText, width: sectionLabelWidths.personalInfo }}>{label}:</span>
                  <input
                    type="text"
                    name={name}
                    value={profile[name] || ''}
                    onChange={handleChange}
                    readOnly={isModalField} // 선택 필드일 땐 입력 막기
                    onClick={isModalField ? openModal : undefined} // 선택 필드일 땐 클릭으로 모달
                    style={{
                      ...styles.input,
                      width: isModalField ? '60%' : '100%',
                      marginRight: isModalField ? 8 : 0,
                      cursor: isModalField ? 'pointer' : 'text',
                      backgroundColor: isModalField ? '#f0f0f0' : 'white',
                    }}
                  />
                  {isModalField && (
                    <button
                      type="button"
                      onClick={openModal}
                      style={{ padding: '4px 8px', cursor: 'pointer' }}
                    >
                      선택하기
                    </button>
                  )}
                </label>
              );
            })}
          </section>
        {isEducationModalOpen && (
          <Modal
            title="학력 선택"
            options={['고졸', '전문대졸', '대학교졸', '대학원졸']}
            selected={[profile.education]}
            onSelect={(selected) => {
              setProfile(prev => ({ ...prev, education: selected }));
              setIsEducationModalOpen(false);
            }}
            onClose={() => setIsEducationModalOpen(false)}
          />
        )}
        {isJobtitleModalOpen && (
          <Modal
            title="직업 선택"
            options={['학생', '회사원', '프리랜서', '자영업', '전문직', '기타']}
            selected={[profile.job_title]}
            onSelect={(selected) => {
              setProfile(prev => ({ ...prev, job_title: selected }));
              setIsJobtitleModalOpen(false);
            }}
            onClose={() => setIsJobtitleModalOpen(false)}
          />
        )}

        
        {isIncomeModalOpen && (
          <Modal
            title="연 소득 선택"
            options={incomeOptions}  // 연 소득 옵션 배열
            selected={[profile.annual_income]}
            onSelect={handleIncomeSelect}
            onClose={() => setIsIncomeModalOpen(false)}
          />
        )}

        {isAssetsModalOpen && (
          <Modal
            title="총 자산 선택"
            options={assetsOptions}
            selected={[profile.assets]}  // profile.assets로 배열 형태로 넘김
            onSelect={handleAssetsSelect}
            onClose={() => setIsAssetsModalOpen(false)}
          />
        )}

        {isBodyTypeModalOpen && (
          <Modal
            title="체형 선택"
            options={['마른', '슬림함', '보통 체형', '건장한', '근육질', '글래머', '통통한', '뚱뚱한']}
            selected={[profile.body_type]}
            onSelect={(selected) => {
              setProfile(prev => ({ ...prev, body_type: selected }));
              setIsBodyTypeModalOpen(false);
            }}
            onClose={() => setIsBodyTypeModalOpen(false)}
          />
        )}
        {isStyleModalOpen && (
          <Modal
            title="스타일 선택"
            options={['단정한', '캐주얼', '스포티', '힙한', '세련된', '자연스러운']}
            selected={[profile.style]}
            onSelect={(selected) => {
              setProfile(prev => ({ ...prev, style: selected }));
              setIsStyleModalOpen(false);
            }}
            onClose={() => setIsStyleModalOpen(false)}
          />
        )}

        {/* 성격/취미/생활 섹션 */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>
            <span>
              <span style={styles.orangeStar}>✦</span> 성격/취미/생활
            </span>
          </div>

          {[
            ['personality', '성격'],
            ['hobbies', '취미'],
            ['blood_type', '혈액형'],
            ['mbti_type', 'MBTI 유형'],
            ['signup_source', '가입경로'],
          ].map(([name, label]) => {
            if (name === 'blood_type') {
              return (
                <label key={name} style={{ ...styles.label, alignItems: 'flex-start' }}>
                  <span style={{ ...styles.labelText, width: sectionLabelWidths.personality }}>{label}:</span>
                  <div>
                    {['A', 'B', 'O', 'AB'].map((type) => (
                      <label key={type} style={{ marginRight: 12 }}>
                        <input
                          type="radio"
                          name="blood_type"
                          value={type}
                          checked={profile.blood_type === type}
                          onChange={handleChange}
                        />{' '}
                        {type}
                      </label>
                    ))}
                  </div>
                </label>
              );
            }

            // 기타 항목: 선택 버튼과 모달 열기
            const modalOpeners = {
              personality: () => setIsPersonalityModalOpen(true),
              hobbies: () => setIsHobbiesModalOpen(true),
              mbti_type: () => setIsMbtiModalOpen(true),
              signup_source: () => setIsSignupSourceModalOpen(true),
            };

            return (
              <label key={name} style={styles.label}>
                <span style={{ ...styles.labelText, width: sectionLabelWidths.personality }}>{label}:</span>
                <input
                  type="text"
                  name={name}
                  value={profile[name] || ''}
                  onChange={handleChange}
                  //style={{ ...styles.input, width: '60%', marginRight: 8 }}
                  readOnly
                  style={{ ...styles.input, width: '60%', marginRight: 8, cursor: 'pointer', backgroundColor: '#f0f0f0' }}
                />
                <button
                  type="button"
                  onClick={modalOpeners[name]}
                  style={{ padding: '4px 8px', cursor: 'pointer' }}
                >
                  선택하기
                </button>
              </label>
            );
          })}
        </section>
        {isPersonalityModalOpen && (
          <Modal
            title="성격 선택"
            options={['외향적', '내향적', '계획형', '즉흥형', '낙천적', '분석적']}
            selected={profile.personality ? [profile.personality] : []}
            onSelect={(selected) => {
              setProfile(prev => ({ ...prev, personality: selected }));
              setIsPersonalityModalOpen(false);
            }}
            onClose={() => setIsPersonalityModalOpen(false)}
          />
        )}

        {isHobbiesModalOpen && (
          <Modal
            title="취미 선택"
            options={['운동', '골프', '음악', '공연관람', '여행', '낚시'
              , '댄스', '드라이브', '드라마', '등산', '래프팅','맛집탐방'
              , '독서', '문학', '게임', '요리', '미용', '볼링', '봉사활동', '비디오게임'
              , '사진', '산책', '쇼핑', '수영', '스케이트', '스노우보드', '스쿼시', '스킨스쿠버'
              , '와인', '영화', '어학', '요가', '음악감상', '자기개발', '재테크', '캠핑', '필라테스'
              , '피트니스', '헬스', '없음'
            ]}            
            selected={profile.hobbies ? [profile.hobbies] : []}
            onSelect={(selected) => {
              setProfile(prev => ({ ...prev, hobbies: selected }));
              setIsHobbiesModalOpen(false);
            }}
            onClose={() => setIsHobbiesModalOpen(false)}
          />
        )}

        {isMbtiModalOpen && (
          <Modal
            title="MBTI 유형 선택"
            options={[
              'INTJ', 'INTP', 'ENTJ', 'ENTP',
              'INFJ', 'INFP', 'ENFJ', 'ENFP',
              'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
              'ISTP', 'ISFP', 'ESTP', 'ESFP',
            ]}
            selected={profile.mbti_type ? [profile.mbti_type] : []}
            onSelect={(selected) => {
              setProfile(prev => ({ ...prev, mbti_type: selected }));
              setIsMbtiModalOpen(false);
            }}
            onClose={() => setIsMbtiModalOpen(false)}
          />
        )}

        {isSignupSourceModalOpen && (
          <Modal
            title="가입경로 선택"
            options={['지인 추천', 'SNS 광고', '검색', '기타']}
            selected={profile.signup_source ? [profile.signup_source] : []}
            onSelect={(selected) => {
              setProfile(prev => ({ ...prev, signup_source: selected }));
              setIsSignupSourceModalOpen(false);
            }}
            onClose={() => setIsSignupSourceModalOpen(false)}
          />
        )}

        <section style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>
                <span style={styles.orangeStar}>✦</span> 라이프 스타일
              </span>
            </div>
            {[
              ['life_style', '생활 패턴', 'LifeStyleModal'],
              ['drinking', '음주 여부', null],
              ['smoking', '흡연 여부', null],
              ['religion', '종교', 'ReligionModal'],
            ].map(([name, label, modalName]) => {
              if (name === 'drinking' || name === 'smoking') {
                const options = name === 'drinking' ? ['안 함', '가끔', '자주'] : ['비흡연', '흡연'];
                return (
                  <div key={name} style={styles.label}>
                    <span style={{ ...styles.labelText, width: sectionLabelWidths.lifestyle }}>
                      {label}:
                    </span>
                    {options.map(option => (
                      <label key={option} style={{ marginRight: 12, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={name}
                          value={option}
                          checked={profile[name] === option}
                          onChange={handleChange}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                );
              }

              return (
                <label key={name} style={styles.label}>
                  <span style={{ ...styles.labelText, width: sectionLabelWidths.lifestyle }}>
                    {label}:
                  </span>
                  <input
                    type="text"
                    name={name}
                    value={profile[name] || ''}
                    onChange={handleChange}
                    // style={{ ...styles.input, width: '60%', marginRight: 8 }}
                  readOnly
                  style={{ ...styles.input, width: '60%', marginRight: 8, cursor: 'pointer', backgroundColor: '#f0f0f0' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (modalName === 'LifeStyleModal') setIsLifeStyleModalOpen(true);
                      if (modalName === 'ReligionModal') setIsReligionModalOpen(true);
                    }}
                    style={{ padding: '4px 8px', cursor: 'pointer' }}
                  >
                    선택하기
                  </button>
                </label>
              );
            })}
          </section>

          {/* 모달 컴포넌트 예시 */}
          {isLifeStyleModalOpen && (
            <Modal
              title="생활 패턴 선택"
              options={['아침형', '저녁형', '불규칙']}
              selected={[profile.life_style]}
              onSelect={(selected) => {
                setProfile(prev => ({ ...prev, life_style: selected }));
                setIsLifeStyleModalOpen(false);
              }}
              onClose={() => setIsLifeStyleModalOpen(false)}
            />
          )}

          {isReligionModalOpen && (
            <Modal
              title="종교 선택"
              options={['무교', '기독교', '천주교', '불교', '기타']}
              selected={[profile.religion]}
              onSelect={(selected) => {
                setProfile(prev => ({ ...prev, religion: selected }));
                setIsReligionModalOpen(false);
              }}
              onClose={() => setIsReligionModalOpen(false)}
            />
          )}

        <section style={styles.section}>
          <div style={styles.sectionTitle}>
            <span>
              <span style={styles.orangeStar}>✦</span> 자기 소개
            </span>
          </div>              
            {[
              ['bio', '소개글'],
              ['ideal_type', '이상형'],
            ].map(([name, label]) => (
              <label key={name} style={styles.label}>
                <span style={{ ...styles.labelText, width: sectionLabelWidths.selfIntro }}>
                  {label}:
                </span>
                <textarea
                  name={name}
                  value={profile[name] || ''}
                  onChange={handleChange}
                  style={{ ...styles.input, height: 80, resize: 'vertical' }}
                  rows={4}
                />
              </label>
            ))}
        </section>

        <section style={styles.section}>
            <div style={styles.sectionTitle}>
                <span>
                  <span style={styles.orangeStar}>✦</span> 희망 상대
                </span>
              </div>
              {[
                ['preferred_region', '지역'],
                // ['preferred_age', '나이'],
                // ['preferred_height', '키'],
                ['preferred_body_type', '체형'],
                ['preferred_religion', '종교'],
                ['preferred_drinking', '음주 여부'],
                ['preferred_smoking', '흡연 여부'],
                ['preferred_blood_type', '혈액형'],
                ['preferred_hobbies', '취미'],
              ].map(([name, label]) => {
                // 라디오 버튼 필드들
                if (['preferred_drinking', 'preferred_smoking', 'preferred_blood_type'].includes(name)) {
                  return (
                    <div key={name} style={{ ...styles.label, alignItems: 'flex-start' }}>
                      <span style={{ ...styles.labelText, width: sectionLabelWidths.personality }}>
                        {label}:
                      </span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {getRadioOptions(name).map((option) => (
                          <label key={option} style={{ marginRight: 0 }}>
                            <input
                              type="radio"
                              name={name}
                              value={option}
                              checked={profile[name] === option}
                              onChange={handleChange}
                              style={{ marginRight: 4 }}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                // 선택하기 버튼 필드들
                if (['preferred_region', 'preferred_body_type', 'preferred_religion', 'preferred_hobbies'].includes(name)) {
                  return (
                    <label key={name} style={styles.label}>
                      <span style={{ ...styles.labelText, width: sectionLabelWidths.partnerPreference }}>
                        {label}:
                      </span>
                      <input
                        type="text"
                        name={name}
                        value={profile[name] || ''}
                        readOnly
                        style={{ ...styles.input, width: '60%', marginRight: 8, cursor: 'pointer', backgroundColor: '#f0f0f0' }}
                        onClick={() => openModal(name)}
                      />
                      <button
                        type="button"
                        onClick={() => openModal(name)}
                        style={{ padding: '4px 8px', cursor: 'pointer' }}
                      >
                        선택하기
                      </button>
                    </label>
                  );
                }

                // 기본 텍스트 input
                return (
                  <label key={name} style={styles.label}>
                    <span style={{ ...styles.labelText, width: sectionLabelWidths.partnerPreference }}>
                      {label}:
                    </span>
                    <input
                      type="text"
                      name={name}
                      value={profile[name] || ''}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </label>
                );
              })}

              {/* 모달 컴포넌트들 */}
              {modalState.preferred_region && (
                <Modal
                  title="지역 선택"
                  options={['서울', '인천', '대전', '대구', '부산', '광주', '경기', '세종', '강원', '충북', '충남', '경북', '경남', '전북', '전남', '제주', '해외']}
                  selected={[profile.preferred_region]}
                  onSelect={(selected) => {
                    setProfile((prev) => ({ ...prev, preferred_region: selected }));
                    closeModal('preferred_region');
                  }}
                  onClose={() => closeModal('preferred_region')}
                />
              )}
              {modalState.preferred_body_type && (
                <Modal
                  title="체형 선택"
                  options={['마른', '슬림함', '보통 체형', '건장한', '근육질', '글래머', '통통한', '뚱뚱한']}
                  selected={[profile.preferred_body_type]}
                  onSelect={(selected) => {
                    setProfile((prev) => ({ ...prev, preferred_body_type: selected }));
                    closeModal('preferred_body_type');
                  }}
                  onClose={() => closeModal('preferred_body_type')}
                />
              )}
              {modalState.preferred_religion && (
                <Modal
                  title="종교 선택"
                  options={['무교', '기독교', '천주교', '불교', '기타']}
                  selected={[profile.preferred_religion]}
                  onSelect={(selected) => {
                    setProfile((prev) => ({ ...prev, preferred_religion: selected }));
                    closeModal('preferred_religion');
                  }}
                  onClose={() => closeModal('preferred_religion')}
                />
              )}
              {modalState.preferred_hobbies && (
                <Modal
                  title="취미 선택"
                  options={['운동', '골프', '음악', '공연관람', '여행', '낚시'
                    , '댄스', '드라이브', '드라마', '등산', '래프팅','맛집탐방'
                    , '독서', '문학', '게임', '요리', '미용', '볼링', '봉사활동', '비디오게임'
                    , '사진', '산책', '쇼핑', '수영', '스케이트', '스노우보드', '스쿼시', '스킨스쿠버'
                    , '와인', '영화', '어학', '요가', '음악감상', '자기개발', '재테크', '캠핑', '필라테스'
                    , '피트니스', '헬스', '없음'
                  ]}
                  selected={[profile.preferred_hobbies]}
                  onSelect={(selected) => {
                    setProfile((prev) => ({ ...prev, preferred_hobbies: selected }));
                    closeModal('preferred_hobbies');
                  }}
                  onClose={() => closeModal('preferred_hobbies')}
                />
              )}
            </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>
            <span>
              <span style={styles.orangeStar}>✦</span> 본인 가족 관계
            </span>
          </div>          
          {[
            ['children_plan', '자녀 유무'],
            ['siblings_count', '형제 자매'],
          ].map(([name, label]) => (
            <label key={name} style={styles.label}>
              <span style={{ ...styles.labelText, width: sectionLabelWidths.family }}>
                {label}:
              </span>
              <input
                name={name}
                value={profile[name] || ''}
                onChange={handleChange}
                style={styles.input}
              />
            </label>
          ))}
        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>
            <span>
              <span style={styles.orangeStar}>✦</span> 프로필 사진
            </span>
          </div>

          <div style={styles.photoContainer}>
                  {profile.profile_photos?.map((photoUrl, index) => {
                    const isMain = index === mainPhotoIndex;
                    const isBlurred = false; // 편집 화면에서는 항상 false

                    return (
                      <div key={index} style={styles.photoWrapper}>
                        <img
                          src={photoUrl}
                          alt={`Profile ${index}`}
                          style={{
                            ...styles.photo,
                            filter: isBlurred ? 'blur(8px)' : 'none',
                            border: isMain ? '2px solid #4CAF50' : '1px solid #ccc',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(index)}
                          style={styles.deleteButton}
                          title="사진 삭제"
                        >
                          삭제
                        </button>
                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={mainPhotoIndex === index}
                            onChange={() => setMainPhotoIndex(index)}
                          />
                          메인
                        </label>
                      </div>
                    );
                  })}            
            {/* {profile.profile_photos?.map((photoUrl, index) => (
              <div key={index} style={styles.photoWrapper}>
                <img
                  src={photoUrl}
                  alt={`Profile ${index}`}
                  style={styles.photo}
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(index)}
                  style={styles.deleteButton}
                  title="사진 삭제"
                >
                  삭제
                </button>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={mainPhotoIndex === index}
                    onChange={() => setMainPhotoIndex(index)}
                  />
                  메인
                </label>
              </div>
            ))} */}

          <div style={styles.uploadWrapper}>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleSpecialPhotoChange}
              disabled={isProcessing}
            />
            <button
              type="button"
              onClick={onClickUploadButton}
              style={styles.uploadButton}
              disabled={isProcessing}
            >
              {isProcessing ? '업로드 중...' : '사진 업로드'}
            </button>
          </div>
          </div>
        </section>

        <button onClick={handleSave} style={styles.saveButton}>
          저장하기
        </button>
      </div>

        {/* 화면 하단 고정 네비게이션 */}
        <footer style={styles.footer}>
          <div style={styles.footerTopButtons}>
            <div style={styles.footerButton} onClick={() => navigate('/')}>🏠</div>
            <div style={styles.footerButton} onClick={() => navigate('/search')}>🔍</div>
            <div style={styles.footerButton} onClick={() => navigate('/favorites')}>💘</div>
            <div style={styles.footerButton} onClick={() => navigate('/chat')}>💬</div>
            <div style={styles.footerButton} onClick={() => navigate('/mypage')}>👤</div>
          </div>
        </footer>      
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 680,
    margin: '20px auto',
    padding: '10px 20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  back: {
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: 18,
    userSelect: 'none',
  },
  home: {
    cursor: 'pointer',
    fontSize: 20,
    userSelect: 'none',
  },
  form: {
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: 20,
    backgroundColor: '#fefefe',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    display: 'flex',      // 추가: 가로 정렬
    alignItems: 'center', // 세로 가운데 정렬
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottom: '2px solid #ff7f00',
    paddingBottom: 4,
  },
  orangeStar: {
    color: '#ff7f00',
    marginRight: 6,
    flexShrink: 0, // 아이콘 크기 고정
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  labelText: {
    flexShrink: 0,
    textAlign: 'left',
    paddingRight: 6,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    padding: '6px 8px',
    fontSize: 14,
    borderRadius: 4,
    border: '1px solid #ccc',
  },
  textarea: {
    flex: 1,
    padding: '8px 10px',
    fontSize: 14,
    borderRadius: 6,
    border: '1px solid #ccc',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  photoContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',  // 한 줄에 3개
    gap: 15,
    alignItems: 'center',
    marginBottom: '16px'
  },
  photoWrapper: {
    width: '100%',  // 그리드 셀에 꽉 차도록
    aspectRatio: '1 / 1',  // 정사각형 유지 (height 대신)
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 0 6px rgba(0,0,0,0.1)',
    border: '1px solid #ddd',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff4d4f',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    padding: '2px 6px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    padding: '2px 6px',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  uploadWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    border: '2px dashed #ccc',
    borderRadius: 8,
    cursor: 'pointer',
  },  
  uploadButton: {
    backgroundColor: '#1890ff',
    color: 'white',
    padding: '8px 14px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
  },
  saveButton: {
    marginTop: '0px',
    backgroundColor: '#52c41a',
    color: 'white',
    padding: '10px 18px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 16,
    width: '100%',
    marginBottom: '20px'
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTop: '1px solid #ccc',
    padding: '10px 0',
    boxShadow: '0 -1px 5px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  footerTopButtons: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  footerButton: {
    fontSize: 24,
    cursor: 'pointer',
  },  
};

export default ProfileDetailEdit;