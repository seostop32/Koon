import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
// import ProfileHeader from './ProfileHeader';
import ProfileDetailHeader from './ProfileDetailHeader';
// import ProfileIntro from './ProfileIntro';
// import { coinPrices } from '../constants/coinPrices';  //코인가격
import { deductCoinRpc } from '../utils/coinUtils';    //코인차감함수

import useMyCoin from '../hooks/useMyCoin';
import { shouldBlurPhoto } from '../utils/blurControl';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ProfileDetail({ onUnlock }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const photoUrl = params.get('photoUrl');
  const navigate = useNavigate(); // navigate 추가
  const { loading: coinLoading, myCoin } = useMyCoin();

  const { id } = useParams();
    // console.log('받은 id:', id);

  const [profile, setProfile] = useState({ photos: [] });
  const [loading, setLoading] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState([]);  // 배열로 초기화 했나요?
  const [isFullyUnlocked, setIsFullyUnlocked] = useState(false);  // 전체 열람 상태
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0); // ← 여기 추가


  const [showModal, setShowModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);  
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);  
  // const [unlockedPhotos, setUnlockedPhotos] = useState([]); // 언락된 사진 ID 리스트
  const [unlockedPhotos, setUnlockedPhotos] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null)
  const [loggedInUserGender, setLoggedInUserGender] = useState('');

  useEffect(() => {
    if (!sessionUserId) return;

    async function fetchMyProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', sessionUserId)
        .single();

      if (!error && data) {
        setLoggedInUserGender(data.gender);
      } else {
        console.error('내 프로필 성별 가져오기 실패:', error);
      }
    }

    fetchMyProfile();
  }, [sessionUserId]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 👇 이 부분이 반드시 필요합니다!
  const { photos = [] } = location.state || {};
    
  const [photoList, setPhotoList] = useState(() => {
    if (!Array.isArray(photos)) return [];
    return photos.map(url => ({ url, isBlurred: true }));
  });

  // 모든 항목 기본 블러 처리 상태
  const [blurredFields, setBlurredFields] = useState({
    hometown: true,
    birth_year: true,
    job: true,
  });

  const unblurField = (fieldName) => {
    setBlurredFields(prev => ({ ...prev, [fieldName]: false }));
  };  

  function shouldBlurPhoto({ isUnlocked, isFullyUnlocked, photoUrl, avatarUrl }) {
    if (isFullyUnlocked) return false; // 전체 열람이면 블러 안함 (전부 공개)
    
    if (!Array.isArray(isUnlocked)) {
      isUnlocked = [];
    }

    // 개별 사진 unlock 여부 판단
    if (photoUrl === avatarUrl) return false; // 아바타 사진은 기본 공개
    if (isUnlocked.includes(photoUrl)) return false; // 언락된 사진은 공개

    return true; // 그 외는 블러
  }

  useEffect(() => {
    console.log('isFullyUnlocked 변경:', isFullyUnlocked);
  }, [isFullyUnlocked]);

  // 전체 해제 여부 체크 (viewer = 로그인 사용자, profile = id)
  useEffect(() => {
    const checkUnlock = async () => {
      if (!sessionUserId || !id) return; // 로그인 아이디 또는 프로필 id 없으면 종료

      const { data, error } = await supabase
        .from('unlocks')
        .select('*')
        .eq('from_user_id', sessionUserId)
        .eq('to_user_id', id)
        .eq('type', 'full_profile')
        .maybeSingle();

      if (error) {
        console.error('Unlock check error:', error);
        setIsFullyUnlocked(false);
      } else {
        setIsFullyUnlocked(!!data);
      }
    };

    checkUnlock();
  }, [sessionUserId, id]);

  // 싱글 해제 여부 체크 (viewer = 로그인 사용자, profile = id)
    useEffect(() => {
      if (!currentUser || !profile) return;

      const fetchUnlocked = async () => {
        const { data, error } = await supabase
          .from('unlocks')
          .select('photo_url')
          .eq('user_id', currentUser.id)
          .eq('target_profile_id', profile.id);

        if (error) {
          console.error(error);
          return;
        }

        setUnlockedPhotos(new Set(data.map(item => item.photo_url)));
      };

      fetchUnlocked();
    }, [currentUser, profile]);



  const checkPhotoUnlock = async (photoUrl) => {
    const { data, error } = await supabase
      .from('unlocks')
      .select('*')
      .eq('from_user_id', sessionUserId)
      .eq('to_user_id', id)
      .eq('type', 'photo')
      .eq('photo_url', photoUrl)
      .maybeSingle();

    if (error) {
      console.error('Photo unlock check error:', error);
      return false;
    }

    return !!data; // unlock 상태 true/false 반환
  };  

  // 전체 프로필 열람 버튼 클릭 시 실행되는 함수입니다.
  // 코인을 차감하고 열람 기록을 저장하며, 성공 시 전체 열람 상태를 업데이트합니다.
  // 코인이 부족할 경우 충전 페이지로 이동합니다. 
  const handleUnlockClick = async () => {
  setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        alert('사용자 정보를 불러올 수 없습니다.');
        setLoading(false);
        return;
      }

      const userGender = profileData.gender;

      if (userGender === '여성') {
        alert('전체 열람이 완료되었습니다!');
        setIsFullyUnlocked(true);
        setLoading(false);
        return;
      }

      // 이제 남성인 경우만 얼러트 띄움
      const confirm = window.confirm('전체사진들을 보려면 코인이 차감됩니다. 계속하시겠습니까?');
      if (!confirm) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('deduct_coins_and_unlock', {
          p_user_id: user.id,
          p_target_user_id: profile.id,
          p_event_key: 'full_profile_view',
          p_photo_url: selectedPhotoUrl,
        });

        if (error) throw error;

        alert('전체 열람이 완료되었습니다!');
        setIsFullyUnlocked(true);
      } catch (error) {
        alert(`코인이 부족하거나 오류가 발생했습니다.\n${error.message}`);
        navigate('/coin-charge');
      } finally {
        setLoading(false);
      }
    };

    /**
   * 사용자 코인을 차감하고 이벤트에 맞는 후처리를 수행합니다.
   * (예: 관심 표시, 설정 변경, 사진 언락 등) 
   * 코인 부족, 중복 처리 등 예외 상황을 포함한 공통 함수입니다.
   */
    const handleLike = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      // 사용자 성별 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        alert('사용자 정보를 불러올 수 없습니다.');
        setLoading(false);
        return;
      }

      const isMale = profile.gender === '남성';

      // 남성일 경우에만 confirm
      if (isMale) {
        const confirm = window.confirm('관심 등록 시 코인이 차감됩니다. 계속하시겠습니까?');
        if (!confirm) {
          setLoading(false);
          return;
        }
      }

      try {
        const { data, error } = await supabase.rpc('deduct_coin_for_like', {
          p_user_id: user.id,
          p_target_id: id,
        });

        if (error) throw error;

        alert('관심 등록이 완료되었습니다!');
        navigate('/favorites');
      } catch (error) {
        alert(`코인이 부족하거나 오류가 발생했습니다.\n${error.message}`);
        navigate('/coin-charge');
      } finally {
        setLoading(false);
      }
    };     


  const handleContactClick = () => {
    // const confirm = window.confirm('연락을 위해서 3코인이 필요합니다. 계속하시겠습니까?');
    // 코인 충분 → 채팅 페이지로 이동
    if (myCoin > 0) {
      navigate(`/chat/${id}`);
    // 코인 부족 → 코인 충전 페이지로 이동  
    } else {
      navigate('/coin-charge');
    }
  }; 

  // 블러사진 클릭시
  async function handleClickPhoto(index) {
    console.log('스페셜 사진 클릭:', index);
    console.log('전달할 사진 배열:', orderedPhotos);
console.log('현재 유저 성별:', profile.gender);

    const selectedPhotoUrl = orderedPhotos[index];
    const unlockedArray = Array.isArray(isUnlocked) ? isUnlocked : [];
    const userGender = loggedInUserGender; // 여기만 바꿈

    const isBlurred = shouldBlurPhoto({
      isUnlocked: unlockedArray,
      isFullyUnlocked,
      userId: sessionUserId,
      profileUserId: profile.id,
      photoUrl: selectedPhotoUrl,
      avatarUrl: profile.avatar_url,
    });

    console.log('🔍 isUnlocked 배열:', isUnlocked);
    console.log('🔍 selectedPhotoUrl:', selectedPhotoUrl);
    console.log('🔍 포함 여부:', isUnlocked.includes(selectedPhotoUrl));
    console.log(`사진 ${index} 블러 상태:`, isBlurred);

    let newlyUnlocked = unlockedArray;

    // 여성 무료 체크
    // const userGender = profile.gender; // '여성'이 정확히 들어있어야 함

    if (isBlurred) {
      if (userGender === '여성') {
        // 여성은 무료, 얼럿 최소화
        // alert는 원하면 넣고, 안 넣어도 됨
        newlyUnlocked = [...unlockedArray, selectedPhotoUrl];
        setIsUnlocked(newlyUnlocked);
        setUnlockedPhotos(new Set(newlyUnlocked));
      } else {
        // 남성은 코인 차감 프로세스
        const confirmResult = window.confirm(
          `사진을 보려면 10코인이 차감됩니다. 진행하시겠습니까?`
        );
        if (!confirmResult) return;

        const { error: deductError } = await supabase.rpc('deduct_coins_and_unlock', {
          p_user_id: sessionUserId,
          p_target_user_id: profile.id,
          p_event_key: 'single_profile_view',
          p_photo_url: selectedPhotoUrl,
        });

        if (deductError) {
          alert('코인 부족이나 오류가 발생했어요.');
          navigate('/coin-charge');
          return;
        }

        alert('사진이 성공적으로 열람되었습니다.');

        newlyUnlocked = [...unlockedArray, selectedPhotoUrl];
        setIsUnlocked(newlyUnlocked);
        setUnlockedPhotos(new Set(newlyUnlocked));
      }
    }

    navigate('/profileintro', {
      state: {
        photos: orderedPhotos,
        startIndex: index,
        isUnlocked: newlyUnlocked,
        isFullyUnlocked,
        userId: sessionUserId,
        profileUserId: profile.id,
        avatarUrl: profile.avatar_url,
      },
    });
  }
  


  // 아바타 클릭 시
  const handleAvatarClick = () => {
    if (!profile || !profile.avatar_url) {
      console.log('아직 profile 정보가 로딩되지 않았습니다.');
      return;
    }

    // 블러가 풀린 상태만 클릭 허용 예시
    if (!isFullyUnlocked) {
      toast.warning('전체 열람을 먼저 해주세요.');
      return;
    }

  };

  useEffect(() => {
    const fetchAvatarImage = async () => {
      if (!profile.avatar_url) return;


      if (profile.avatar_url.startsWith('http')) {
        setImageUrl(profile.avatar_url);
        return;
      }
console.log('profile.avatar_url=========',profile.avatar_url)
console.log('profile.profile_photos=========',profile.profile_photos[0])
      const { data, error } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(profile.avatar_url);

      if (error) {
        console.error('❌ getPublicUrl error:', error.message);
      }

      if (data?.publicUrl) {
        setImageUrl(data.publicUrl);
      }
    };

    fetchAvatarImage();
  }, [profile.avatar_url]);

  useEffect(() => {
    console.log('useEffect triggered with:', { sessionUserId, profileId: profile?.id });

    const checkFullUnlock = async () => {
      if (!sessionUserId || !profile?.id) return;

      const { data, error } = await supabase
        .from('unlocks')
        .select('id')
        .eq('from_user_id', sessionUserId)
        .eq('to_user_id', profile.id)
        .eq('type', 'full_profile')
        .limit(1) // ✅ 이걸로 row 1개만 가져오도록 제한
        .maybeSingle();

      console.log('unlock check result:', data, error);

      if (data && !error) {
        setIsFullyUnlocked(true);
      }
    };

    if (profile?.id && sessionUserId) {
      checkFullUnlock();
    }
  }, [profile?.id, sessionUserId]);

  useEffect(() => {
    if (sessionUserId && id) {
      setMode(sessionUserId === id ? 'edit' : 'view');
    }
  }, [sessionUserId, id]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id || null;
      setSessionUserId(userId);

      if (userId && id) {
        setMode(userId === id ? 'edit' : 'view');
      } else {
        setMode('view');
      }
    };

    fetchUser();
  }, [id]);

  console.log('Current id:=====', id);
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

          console.log('Fetched profile gender:====', data?.gender);  

          if (error) throw error;

          console.log('profile_photos:', data.profile_photos);
          setProfile(data);
          console.log('profile state gender:', data.gender);

        } catch (error) {
          console.error(error);
        }
      setLoading(false);
    };

    fetchProfile();
  }, [id]);

  const orderedPhotos = useMemo(() => {
    const photos = profile?.profile_photos || [];
    console.log('useMemo orderedPhotos 계산:', photos, imageUrl);

    if (photos.length === 0) return [];

    if (!imageUrl) return [...photos];

    const mainPhoto = photos.find(photo => photo === imageUrl);
    const otherPhotos = photos.filter(photo => photo !== imageUrl);

    if (!mainPhoto) return [...photos];

    console.log('profile:', profile);
    console.log('imageUrl:', imageUrl);

    return [mainPhoto, ...otherPhotos];
  }, [profile?.profile_photos, imageUrl]);


  useEffect(() => {
    console.log('🔍 profile:', profile);
    console.log('🎯 profile_photos:', profile?.profile_photos);
  }, [profile]);


  const renderSectionTitle = (title) => (
    <div style={styles.sectionTitle}>
      <span><span style={styles.orangeStar}>✦</span> {title}</span>
      <span
        style={styles.actionText}
        onClick={() => {
          if (mode === 'edit') {
            navigate(`/profile/${id}/edit?section=${title}`);
          }
        }}
      >
        {mode === 'edit' ? '수정하기 >' : '상세정보'}
      </span>
    </div>
  );

  if (sessionUserId === null) return <div>로딩 중...</div>;
  if (loading) return <div>프로필 로딩 중...</div>;
  if (!profile) return <div>프로필을 찾을 수 없습니다.</div>;

  // 블러 처리할 항목 리스트         
  const blurFields = ['이름', '생년', '고향', '연수입', '체형'];

  return (
    <div>
      <ProfileDetailHeader otherUserId={id} user={user} profile={profile}/>
      {/* <ProfileDetailHeader profile={profile} /> */}
      {/* <ProfileHeader profile={profile} /> */}
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <img
              src={imageUrl || 'https://placehold.co/150x150?text=No+Image'}
              alt="아바타 이미지"
              style={styles.avatarSmall}
              onClick={() => handleClickPhoto(0)}  // 여기서 아바타 이미지 URL 넘김
            />

            <div style={styles.userInfo}>
              <h2 style={styles.username}>
              {profile.marriage_type === '재혼' && (
                  <button style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    marginRight: '6px',
                    backgroundColor: '#4caf50', // 초록색
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'default',
                  }}>
                    재혼
                  </button>
                )}
                {profile.marriage_type === '초혼' && (
                  <button style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    marginRight: '6px',
                    backgroundColor: '#ff9800', // 주황색
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'default',
                  }}>
                    초혼
                  </button>
                )}

                {profile.nickname || '별명 없음'}
              </h2>
              <p style={styles.userDetails}>
                {(() => {
                  const label = '이름';
                  const isInBlurFields = blurFields.includes(label);
                  const isUnlockedForLabel = isUnlocked.includes(label);
                  const isBlurred = isInBlurFields && !(isUnlockedForLabel || isFullyUnlocked);
                  const username = profile.username;

                  if (!username) return '이름 없음';
                  if (isBlurred) {
                    return `${username.charAt(0)}OO`;
                  } else {
                    return username;
                  }
                })()} · {profile.age ? `${profile.age}세` : '나이 정보 없음'} · {profile.location || '지역 없음'}                
              </p>
            </div>
          </div>

          {/* 기본정보 */}
          <div style={styles.details}>
            {renderSectionTitle('기본정보')}
            <div style={styles.profileBox}>
              {[['닉네임', profile.nickname]
              , ['나이', profile.age]
              , ['이름', profile.username]
              , ['성별', profile.gender]
              , ['생년', profile.yearofbirth]
              , ['거주지', profile.location]
              , ['고향', profile.hometown]
              , ['결혼여부', profile.marriage_type]
              ].map(([label, value]) => {
                    const isInBlurFields = blurFields.includes(label);
                    const isUnlockedForLabel = isUnlocked.includes(label);
                    const isBlurred = isInBlurFields && !(isUnlockedForLabel || isFullyUnlocked);             

                    let displayValue = value || '미입력';

                    // 이름 처리 로직
                    if (label === '이름' && isBlurred) {
                      if (value && value.length > 0) {
                        // 성은 첫 글자, 이름은 OO로 표시
                        displayValue = value.charAt(0) + 'OO';
                      } else {
                        displayValue = '미입력';
                      }
                    }                    
                    //console.log('label:', label, 'is in blurFields?', isInBlurFields, 'isUnlocked:', isUnlocked, 'isFullyUnlocked:', isFullyUnlocked, 'isBlurred:', isBlurred);


                    return (
                      <div style={styles.detailRow} key={label}>
                        <strong style={styles.detailLabel}>{label}:</strong>
                        <span
                          style={{
                            ...styles.detailValue,
                            filter: label === '이름' && isBlurred ? 'none' : (isBlurred ? 'blur(5px)' : 'none'),
                            // filter: isBlurred ? 'blur(5px)' : 'none',
                          }}
                        >
                          {/* {value || '미입력'} */}
                          {displayValue}
                        </span>
                      </div>
                    );
              })}
            </div>
          </div>

          {/* 학력/직업/스타일 */}
          <div style={styles.details}>
            {renderSectionTitle('학력/직업/스타일')}
            <div style={styles.profileBox}>
              {[
                ['학력', profile.education],
                ['직업', profile.job_title],
                ['연수입', profile.annual_income],
                ['키', `${profile.height || '미입력'} cm`],
                ['체형', profile.body_type],
                ['스타일', profile.style],
              ].map(([label, value]) => {

                    const isInBlurFields = blurFields.includes(label);
                    const isUnlockedForLabel = isUnlocked.includes(label);
                    const isBlurred = isInBlurFields && !(isUnlockedForLabel || isFullyUnlocked);             

                    //console.log('label:', label, 'is in blurFields?', isInBlurFields, 'isUnlocked:', isUnlocked, 'isFullyUnlocked:', isFullyUnlocked, 'isBlurred:', isBlurred);

                    return (
                      <div style={styles.detailRow} key={label}>
                        <strong style={styles.detailLabel}>{label}:</strong>
                        <span
                          style={{
                            ...styles.detailValue,
                            filter: isBlurred ? 'blur(5px)' : 'none',
                          }}
                        >
                          {value || '미입력'}
                        </span>
                      </div>
                    );
              })}
            </div>
          </div>

         
          {/* 학력/직업/스타일 */}
          <div style={{...styles.details, display: 'none'}}>
            {renderSectionTitle('학력/직업/스타일')}
            <div style={styles.profileBoxNoBorder}>
              <strong style={styles.detailLabel}>음주/흡연:</strong> <span style={styles.detailValue}>{profile.drinking_smoking || '미입력'}</span>
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <strong style={styles.detailLabel}>선호음식:</strong> <span style={styles.detailValue}>{profile.favorite_food || '미입력'}</span>
            </div>
          </div>

          {/* 성격/취미/생활 */}
          <div style={{...styles.details, display: 'none'}}>
            {renderSectionTitle('성격/취미/생활')}
            <div style={styles.profileBoxNoBorder}>
              <strong style={styles.detailLabel}>음주/흡연:</strong> <span style={styles.detailValue}>{profile.drinking_smoking || '미입력'}</span>
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <strong style={styles.detailLabel}>선호음식:</strong> <span style={styles.detailValue}>{profile.favorite_food || '미입력'}</span>
            </div>
          </div>          

          {/* 자기소개 */}
          <div style={{...styles.details, display: 'none'}}>
            {renderSectionTitle('자기소개')}
            <div style={styles.profileBoxNoBorder}>
              <p style={styles.detailValue}>{profile.bio || '자기소개가 없습니다.'}</p>
            </div>
          </div>

          {/* 희망상대 */}
          <div style={{...styles.details, display: 'none'}}>
            {renderSectionTitle('희망상대')}
            <div style={styles.profileBox}>
              <div style={styles.detailRow}>
                <strong style={styles.detailLabel}>지역:</strong>
                <span style={styles.detailValue}>{profile.desired_location || '미입력'}</span>
              </div>
              <div style={styles.detailRow}>
                <strong style={styles.detailLabel}>취미:</strong>
                <span style={styles.detailValue}>{profile.desired_hobbies || '미입력'}</span>
              </div>
              <div style={styles.detailRow}>
                <strong style={styles.detailLabel}>종교:</strong>
                <span style={styles.detailValue}>{profile.desired_religion || '미입력'}</span>
              </div>
              <div style={styles.detailRow}>
                <strong style={styles.detailLabel}>기피스타일:</strong>
                <span style={styles.detailValue}>{profile.undesired_style || '미입력'}</span>
              </div>
              <div style={styles.detailRow}>
                <strong style={styles.detailLabel}>자녀계획:</strong>
                <span style={styles.detailValue}>{profile.children_plan || '미입력'}</span>
              </div>
            </div>
          </div>

          {/* 가족관계 */}
          <div style={{...styles.details, display: 'none'}}>
            {renderSectionTitle('가족관계')}
            <div style={styles.profileBox}>
              <div style={styles.detailRow}>
                <strong style={styles.detailLabel}>부모님:</strong>
                <span style={styles.detailValue}>{profile.parents_info || '미입력'}</span>
              </div>
              <div style={styles.detailRow}>
                <strong style={styles.detailLabel}>형제:</strong>
                <span style={styles.detailValue}>{profile.siblings_info || '미입력'}</span>
              </div>
            </div>
          </div>

          {/* 가족소개 */}
          <div style={{...styles.details, display: 'none'}}>
            {renderSectionTitle('가족소개')}
            <div style={styles.profileBoxNoBorder}>
              <p style={styles.detailValue}>{profile.family_intro || '가족소개가 없습니다.'}</p>
            </div>
          </div>
          {/* 스페셜 사진 영역 */}
          <div style={styles.details}>
            <div style={styles.sectionTitle}>
              <span><span style={styles.orangeStar}>✦</span> 스페셜 사진</span>
            </div>
            
            <div style={styles.profileBox}>  {/* 타이틀 바깥에 profileBox 스타일 적용 */}
              <div style={styles.photoSection}>
                <div style={styles.photoGrid}>
                  {orderedPhotos.length > 0 ? (
                    orderedPhotos.map((photoUrl, index) => {
                      const isBlurred = index > 0 && shouldBlurPhoto({
                        isUnlocked,
                        isFullyUnlocked,
                        userId: sessionUserId,
                        profileUserId: id,
                        photoUrl,
                        avatarUrl: imageUrl,
                        unlockedPhotos,
                      });

                      const isVideo = photoUrl.toLowerCase().endsWith('.mp4');

                      return (
                        <div key={index} style={{ position: 'relative' }}>
                          {isVideo ? (
                            <video
                              src={photoUrl}
                              autoPlay
                              muted
                              loop
                              playsInline
                              style={{ ...styles.photo, filter: isBlurred ? 'blur(8px)' : 'none', cursor: 'pointer' }}
                              onClick={() => {
                                console.log('동영상 클릭됨!', index);
                                handleClickPhoto(index);
                              }}
                            />
                          ) : (
                            <img
                              src={photoUrl}
                              alt={`special-${index}`}
                              style={{ ...styles.photo, filter: isBlurred ? 'blur(8px)' : 'none', cursor: 'pointer' }}
                              onClick={() => {
                                console.log('이미지 클릭됨!', index);
                                handleClickPhoto(index);
                              }}
                            />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p>스페셜 사진이 없습니다.</p>
                  )}
                </div>                                
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 버튼들 바로 넣기 */}
      {/* <div style={styles.fixedButtons} className="flex justify-center space-x-4"> */}
      <div style={styles.buttonContainer}>
        <button
          style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
          onClick={handleUnlockClick}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          {loading ? '처리 중...' : '전체 열람'}
        </button>
        <button
          style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
          onClick={handleLike}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded"
        >
          {loading ? '처리중...' : '관심있어요'}
        </button>
        <button
          style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
          onClick={handleContactClick}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
        >
          {loading ? '확인 중...' : '연락하기'}
        </button>
      </div>      
      <div style={{ paddingBottom: '80px', position: 'relative' }}>
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
        {showModal && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <img
              src={selectedPhoto}
              alt="확대 이미지"
              style={{
                ...styles.modalImage,
                filter: shouldBlurPhoto({
                  isUnlocked,
                  isFullyUnlocked,
                  userId: sessionUserId,
                  profileUserId: id,
                  photoUrl: selectedPhoto,
                  avatarUrl: imageUrl,
                }) ? 'blur(8px)' : 'none',
              }}
            />
          </div>
        )}

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    paddingBottom: -40,  // 여기에 푸터 높이만큼 공간 확보
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
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
  profileActionButtonsContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  footerTopButtons: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  footerButton: {
    fontSize: 24,
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
  },
  avatarSmall: {
    width: '5rem',
    height: '5rem',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  username: {
    margin: 0,
    fontSize: '1.25rem',
  },
  userDetails: {
    fontSize: '1rem',
    color: '#555',
    marginTop: '0.25rem',
  },
  details: {
    lineHeight: 1.6,
    fontSize: '1rem',
  },
  profileBox: {
    border: '1px solid #ccc',
    borderRadius: '0.75rem',
    padding: '0.9375rem',
    marginTop: '0.625rem',
    backgroundColor: '#fff',
  },
  profileBoxNoBorder: {
    border: '1px solid #ccc',
    borderRadius: '0.75rem',
    padding: '0.9375rem',
    backgroundColor: '#fff',
    marginTop: '0.625rem',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '0.75rem',
    padding: '0.5rem 0',
    borderBottom: '1px solid #eee',
    fontSize: '0.9375rem',
    alignItems: 'center',
  },
  detailLabel: {
    width: '5.625rem',
    fontWeight: 'bold',
    color: '#555',
  },
  detailValue: {
    color: '#555',
  },
  orangeStar: {
    color: '#ff8c00',
    marginRight: '0.25rem',
  },
  sectionTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1.875rem',
    fontWeight: 'bold',
    fontSize: '1.125rem',
    paddingRight: '0.75rem',
  },
  actionText: {
    fontSize: '0.875rem',
    color: '#ff8c00',
    cursor: 'pointer',
    marginLeft: 'auto',
  },

  // 여기에 캐러셀 스타일 추가
  carouselImage: {
    width: 250,
    height: 250,
    objectFit: 'cover',
    borderRadius: '1rem',
    border: '1px solid #ccc',
  },
  carouselButtonLeft: {
    position: 'absolute',
    top: '50%',
    left: 10,
    transform: 'translateY(-50%)',
    fontSize: '2rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#ff8c00',
  },
  carouselButtonRight: {
    position: 'absolute',
    top: '50%',
    right: 10,
    transform: 'translateY(-50%)',
    fontSize: '2rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#ff8c00',
  },
    fixedButtons: {
      display: 'flex',
      justifyContent: 'space-evenly',  // 버튼 사이 균등 간격 부여
      width: '100%',                    // 부모 컨테이너(즉 photoGrid) 너비 꽉 채우기
      maxWidth: '600px',                // photoGrid 최대 너비와 맞춰주세요 (photoGrid maxWidth와 동일하게)
      marginTop: '10px',                // 위쪽 여백
      boxSizing: 'border-box',         // padding, border 포함 너비 계산
      padding: '20px',           // photoGrid와 같은 padding 넣기
    },
    button: {
      minWidth: 100,
      flexShrink: 0,
      //padding: '12px 24px',
      padding: '6px 12px',  // 위아래 6px, 좌우 12px
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'opacity 0.3s',
      backgroundColor: '#f97316',
      color: 'white',
      border: 'none',
      borderRadius: 6,
      boxShadow: '0 2px 6px rgba(249, 115, 22, 0.5)',
      // marginLeft 제거하고 대신 marginRight를 마지막 버튼 제외하고 줌
      marginRight: 12,
    },
    photoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',  // 한 줄에 3개
      gap: '0.5rem', // 사진 간 간격 조절
    },
    photoSection: {
      marginTop: '0.5rem',
      width: '100%',   // 이걸 넣어서 부모도 꽉 채우기
    }, 
    photo: {
      width: '100%',  // 각 그리드 셀에 꽉 차게
      height: 'auto',
      borderRadius: '0.5rem',
      objectFit: 'cover',
      cursor: 'pointer',
      aspectRatio: '1 / 1',  // 정사각형 유지
    },       
    buttonContainer: {
      display: 'flex',
      // justifyContent: 'space-between',
      marginTop: '10px',
      justifyContent: 'space-evenly',  // 버튼 사이 균등 간격 부여
    },  
};

export default ProfileDetail;