const $modal = document.querySelector('#completionModal');
let currentReservation = null;

function modal_open(res_no, user_name, date, time, model, addr, phone,mode = 'complete', details = {}) {
    const preview = document.getElementById('filePreview');
    preview.innerHTML = '';
    console.log('모달 열기:', res_no, user_name, date, time, model, addr, mode,phone);
    currentReservation = {res_no, user_name, date, time, model, addr,phone};

// 모달 내용 업데이트
    document.getElementById('modalUserName').textContent = user_name;
    document.getElementById('modalDate').textContent = date;
    document.getElementById('modalTime').textContent = time;
    document.getElementById('modalModel').textContent = model;
    document.getElementById('modalAddr').textContent = addr;
    document.getElementById('modalHiddenPhone').value = phone;

    const modalContent = document.getElementById('modalContent');
    const modalImage = document.getElementById('modalImage');
    const confirmBtn = document.querySelector('#completionModal .btn-confirm');
    const cancelBtn = document.querySelector('#completionModal .btn-cancel');
    console.log("이력 조회 모달 : ", details);
    console.log(details.memo);
    console.log(details.files);
    if (mode === 'history') {
        modalContent.value = details.memo || '';
        modalContent.readOnly = true;
        modalImage.style.display = 'none';

        if (details.files && details.files.length > 0) {
            details.files.forEach(fileUrl => {
                const img = document.createElement('img');
                img.src = fileUrl;
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.margin = '5px';
                img.style.border = '1px solid #ddd';
                img.style.borderRadius = '5px';
                preview.appendChild(img);
            });
        }

        confirmBtn.innerHTML = '<i class="bi bi-pencil-square"></i> 수정';
        confirmBtn.onclick = () => {
            // TODO: 수정 기능 구현
            modal_open(res_no, user_name, date, time, model, addr,null, 'complete', details);
        };

    } else { // 'complete' 모드
        modalContent.value = '';
        modalContent.readOnly = false;
        modalImage.value = '';
        modalImage.style.display = 'block';
        document.getElementById('modalHiddenPhone').value = phone;
        confirmBtn.innerHTML = '<i class="bi bi-check2-circle"></i> 청소 완료 확인';
        confirmBtn.onclick = () => confirmCompletion(confirmBtn);
    }

    cancelBtn.onclick = modalClose;

    $modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function modalClose() {
    $modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentReservation = null;
}

async function confirmCompletion(submitBtn) {
    currentReservation.files = document.getElementById('modalImage').files;
    currentReservation.memo = document.getElementById('modalContent').value;
    currentReservation.phone = document.getElementById('modalHiddenPhone').value;

    try {
// 파일들을 Base64로 변환
        const files = [];
        for (let i = 0; i < currentReservation?.files.length; i++) {
            const file = currentReservation.files[i];
            console.log('업로드 파일', file);
// 파일 크기 검증 (50MB)
            if (file.size > 50 * 1024 * 1024) {
                Swal.fire({
                    position: "center",
                    icon: "warning",
                    title: `파일 ${file.name}이 50MB를 초과합니다.`,
                    showConfirmButton: false,
                    timer: 1000
                });
                submitBtn.disabled = false;
                submitBtn.textContent = '완료 처리';
                return;
            }

// 이미지 파일 검증
            if (!file.type.startsWith('image/')) {
                Swal.fire({
                    position: "center",
                    icon: "warning",
                    title: `파일 ${file.name}은 이미지 파일이 아닙니다.`,
                    showConfirmButton: false,
                    timer: 1000
                });

                submitBtn.disabled = false;
                submitBtn.textContent = '완료 처리';
                return;
            }

            const base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
            console.log(file);
            files.push({
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64Data
            });
        }
        console.log('왜 없지', files);

        currentReservation.files = files;
        const result = await axios.post('/gisa/complete', currentReservation, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (result.data.status === 'success') {
            Swal.fire({
                position: "center",
                icon: "success",
                title: '청소완료 처리가 성공적으로 완료되었습니다.',
                showConfirmButton: false,
                timer: 1000
            });
            location.reload();
        } else if (result.data.status === 'fail') {
            Swal.fire({
                position: "center",
                icon: "error",
                title: result.data.message || '로그인이 필요합니다.',
                showConfirmButton: false,
                timer: 1000
            });
        } else {
            Swal.fire({
                position: "center",
                icon: "error",
                title: result.data.message || '처리 중 오류가 발생했습니다.',
                showConfirmButton: false,
                timer: 1000
            });
        }
    } catch (error) {
        console.error('Error:', error);
        if (error.response && error.response.data && error.response.data.message) {
            Swal.fire({
                position: "center",
                icon: "error",
                title: error.response.data.message,
                showConfirmButton: false,
                timer: 1000
            });
        } else {
            Swal.fire({
                position: "center",
                icon: "error",
                title: '서버 오류가 발생했습니다.',
                showConfirmButton: false,
                timer: 1000
            });
        }
    } finally {
// 버튼 다시 활성화
        submitBtn.disabled = false;
        submitBtn.textContent = '완료 처리';
    }
    modalClose();
}

// file preview 제공
document.getElementById('modalImage').addEventListener('change', function (e) {
    const preview = document.getElementById('filePreview');
    preview.innerHTML = '';

    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.margin = '5px';
                img.style.border = '1px solid #ddd';
                img.style.borderRadius = '5px';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    }
});

// 모달 외부 클릭시 닫기
$modal.addEventListener('click', function (e) {
    if (e.target === $modal) {
        modalClose();
    }
});
