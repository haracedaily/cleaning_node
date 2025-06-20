// 프로필 수정 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeProfileEdit();
});

// 프로필 수정 초기화
function initializeProfileEdit() {
    loadUserProfile();
    setupEventListeners();
    setupPasswordValidation();
}

// 사용자 프로필 로드
async function loadUserProfile() {
    try {
        // JWT 토큰에서 사용자 정보 가져오기
        const token = localStorage.getItem('accessToken');
        if (!token) {
            showMessage('로그인이 필요합니다.', 'error');
            return;
        }

        // 실제 구현에서는 API 호출로 사용자 정보를 가져옵니다
        const userInfo = await getUserInfo(token);
        
        // 폼에 사용자 정보 채우기
        document.getElementById('name').value = userInfo.name || '';
        document.getElementById('email').value = userInfo.email || '';
        document.getElementById('phone').value = userInfo.phone || '';
        
        // 프로필 사진 설정
        if (userInfo.profileImage) {
            document.getElementById('profileImage').src = userInfo.profileImage;
        }
        
        // 알림 설정
        document.getElementById('pushNotification').checked = userInfo.pushNotification || false;
        document.getElementById('emailNotification').checked = userInfo.emailNotification || false;
        
    } catch (error) {
        console.error('프로필 로드 실패:', error);
        showMessage('프로필 정보를 불러오는데 실패했습니다.', 'error');
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 프로필 사진 변경
    const photoInput = document.getElementById('photoInput');
    photoInput.addEventListener('change', handlePhotoChange);
    
    // 폼 제출
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', handleFormSubmit);
    
    // 비밀번호 입력 필드 실시간 검증
    const newPasswordInput = document.getElementById('newPassword');
    newPasswordInput.addEventListener('input', validatePasswordStrength);
    
    const confirmPasswordInput = document.getElementById('confirmPassword');
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
}

// 비밀번호 검증 설정
function setupPasswordValidation() {
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    newPasswordInput.addEventListener('input', function() {
        validatePasswordStrength();
        validatePasswordMatch();
    });
    
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
}

// 프로필 사진 변경 처리
function handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('파일 크기는 5MB 이하여야 합니다.', 'error');
        return;
    }
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
        showMessage('이미지 파일만 업로드 가능합니다.', 'error');
        return;
    }
    
    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('profileImage').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 비밀번호 강도 검증
function validatePasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthElement = document.getElementById('passwordStrength');
    
    if (!password) {
        strengthElement.className = 'password-strength';
        strengthElement.textContent = '';
        return;
    }
    
    let strength = 0;
    let feedback = [];
    
    // 길이 검증
    if (password.length >= 8) {
        strength += 1;
    } else {
        feedback.push('8자 이상');
    }
    
    // 대문자 포함
    if (/[A-Z]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('대문자 포함');
    }
    
    // 소문자 포함
    if (/[a-z]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('소문자 포함');
    }
    
    // 숫자 포함
    if (/\d/.test(password)) {
        strength += 1;
    } else {
        feedback.push('숫자 포함');
    }
    
    // 특수문자 포함
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('특수문자 포함');
    }
    
    // 강도 표시
    strengthElement.className = 'password-strength';
    if (strength <= 2) {
        strengthElement.classList.add('weak');
        strengthElement.textContent = `약함: ${feedback.join(', ')}`;
    } else if (strength <= 3) {
        strengthElement.classList.add('medium');
        strengthElement.textContent = `보통: ${feedback.join(', ')}`;
    } else {
        strengthElement.classList.add('strong');
        strengthElement.textContent = '강함: 안전한 비밀번호입니다!';
    }
}

// 비밀번호 일치 검증
function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    if (confirmPassword && newPassword !== confirmPassword) {
        confirmInput.style.borderColor = '#dc3545';
        confirmInput.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
    } else {
        confirmInput.style.borderColor = '#e9ecef';
        confirmInput.style.boxShadow = 'none';
    }
}

// 비밀번호 표시/숨김 토글
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

// 폼 제출 처리
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const formData = new FormData(event.target);
    const submitButton = event.target.querySelector('.save-btn');
    
    try {
        // 로딩 상태 표시
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> 저장 중...';
        
        // 프로필 업데이트
        await updateProfile(formData);
        
        showMessage('프로필이 성공적으로 업데이트되었습니다.', 'success');
        
        // 잠시 후 이전 페이지로 이동
        setTimeout(() => {
            history.back();
        }, 1500);
        
    } catch (error) {
        console.error('프로필 업데이트 실패:', error);
        showMessage('프로필 업데이트에 실패했습니다.', 'error');
    } finally {
        // 로딩 상태 해제
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="bi bi-check-lg"></i> 저장하기';

    }
}

// 폼 검증
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 이름 검증
    if (!name) {
        showMessage('이름을 입력해주세요.', 'error');
        return false;
    }
    
    // 비밀번호 변경 시 검증
    if (newPassword || currentPassword || confirmPassword) {
        if (!currentPassword) {
            showMessage('현재 비밀번호를 입력해주세요.', 'error');
            return false;
        }
        
        if (!newPassword) {
            showMessage('새 비밀번호를 입력해주세요.', 'error');
            return false;
        }
        
        if (newPassword.length < 8) {
            showMessage('새 비밀번호는 8자 이상이어야 합니다.', 'error');
            return false;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage('새 비밀번호가 일치하지 않습니다.', 'error');
            return false;
        }
    }
    
    return true;
}

// 사용자 정보 가져오기 (실제 구현에서는 API 호출)
async function getUserInfo(token) {
    // 실제 구현에서는 JWT 토큰을 디코드하거나 API 호출
    // 여기서는 예시 데이터를 반환
    return {
        name: '홍길동',
        email: 'hong@example.com',
        phone: '010-1234-5678',
        profileImage: '/images/profile-placeholder.png',
        pushNotification: true,
        emailNotification: false
    };
}

// 프로필 업데이트 (실제 구현에서는 API 호출)
async function updateProfile(formData) {
    // 실제 구현에서는 서버로 데이터 전송
    console.log('프로필 업데이트:', Object.fromEntries(formData));
    
    // 시뮬레이션을 위한 지연
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 성공 응답 시뮬레이션
    return { success: true };
}

// 메시지 표시
function showMessage(message, type = 'info') {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 새 메시지 생성
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // 폼 상단에 삽입
    const form = document.getElementById('profileForm');
    form.insertBefore(messageElement, form.firstChild);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 5000);
}

// 이미지 압축 (선택사항)
function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// 전화번호 포맷팅
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length <= 3) {
        value = value;
    } else if (value.length <= 7) {
        value = value.slice(0, 3) + '-' + value.slice(3);
    } else {
        value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
    
    input.value = value;
}

// 전화번호 입력 필드에 포맷팅 적용
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }
}); 