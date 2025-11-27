// ./frontend/html/app.js

// 백엔드 API의 기본 경로 설정
// Nginx가 '/api/'로 오는 요청을 백엔드로 넘겨주므로, 이 경로를 사용
const API_BASE_URL = '/api';

// --- DOM 요소 가져오기 ---
// 각 사분면의 내용이 표시될 영역을 미리 찾아두기
// 1차 선언모음인데 주석처리
// const q2Content = document.querySelector('#q2 .content-area');
// const q4Content = document.querySelector('#q4 .content-area');
// const q3Content = document.querySelector('#q3 .content-area');
// const q3Form = document.querySelector('#category-form');

// ./frontend/html/app.js

// 백엔드 API의 기본 경로 설정
const API_BASE_URL = '/api';

// --- DOM 요소 가져오기 (모든 요소를 이 곳에서 한번만 선언합니다) ---
// [화면 1]
const uploadForm = document.querySelector('#upload-form');
const fileInput = document.querySelector('#receipt-file-input');
const uploadStatus = document.querySelector('#upload-status');

// [화면 2]
const q2Content = document.querySelector('#q2 .content-area');

// [화면 3]
const q3Content = document.querySelector('#q3 .content-area');
const q3Form = document.querySelector('#category-form');

// [화면 4]
const q4Content = document.querySelector('#q4 .content-area');


// --- API 호출 함수들 ---
// (이 아래부터는 기존 함수 코드 그대로...)

/**
 * [화면 2] 미승인 영수증 목록을 가져와 화면에 표시하는 함수
 */
async function fetchUnverifiedReceipts() {
    // ...
}

/**
 * [화면 4] 승인 완료된 영수증 목록을 가져와 화면에 표시하는 함수
 */
async function fetchVerifiedReceipts() {
    // ...
}

// ... 나머지 모든 함수와 이벤트 리스너 코드들 ...

// --- API 호출 함수들 ---

/**
 * [화면 2] 미승인 영수증 목록을 가져와 화면에 표시하는 함수
 */
async function fetchUnverifiedReceipts() {
    try {
        const response = await fetch(`${API_BASE_URL}/unverified-receipts`);
        if (!response.ok) throw new Error('서버에서 미승인 목록을 가져오는데 실패했습니다.');
        
        const receipts = await response.json();
        
        // 내용을 표시하기 전에 이전 목록을 깨끗하게 비우기!!
        q2Content.innerHTML = '<h3>승인 대기중인 영수증</h3>';
        
        if (receipts.length === 0) {
            q2Content.innerHTML += '<p>승인 대기중인 영수증이 없습니다.</p>';
            return;
        }

        receipts.forEach(receipt => {
            const receiptElement = document.createElement('div');
            receiptElement.className = 'receipt-card';
            receiptElement.innerHTML = `
                <strong>상호명:</strong> ${receipt.vendor || 'N/A'}<br>
                <strong>날짜:</strong> ${receipt.purchase_date || 'N/A'}<br>
                <strong>총액:</strong> ${Number(receipt.total_amount).toLocaleString()}원<br>
                <ul>
                    ${receipt.items.map(item => `<li>${item.name} (${item.category}): ${Number(item.price).toLocaleString()}원</li>`).join('')}
                </ul>
                <button class="approve-btn" data-id="${receipt.id}">승인</button>
            `;
            q2Content.appendChild(receiptElement);
        });
    } catch (error) {
        q2Content.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

/**
 * [화면 4] 승인 완료된 영수증 목록을 가져와 화면에 표시하는 함수
 */
async function fetchVerifiedReceipts() {
    try {
        const response = await fetch(`${API_BASE_URL}/verified-receipts`);
        if (!response.ok) throw new Error('서버에서 승인 완료 목록을 가져오는데 실패했습니다.');

        const receipts = await response.json();
        q4Content.innerHTML = '<h3>승인 완료된 영수증</h3>';

        if (receipts.length === 0) {
            q4Content.innerHTML += '<p>승인 완료된 영수증이 없습니다.</p>';

        alert(error.message);
    }
}

/**
 * [화면 3] 새로운 카테고리를 추가하는 함수
 * @param {Event} event - 폼 제출 이벤트 객체
 */
async function addCategory(event) {
    // 폼 제출 시 페이지가 새로고침되는 기본 동작을 막기
    event.preventDefault();

    const nameInput = event.target.elements['category-name'];
    const descInput = event.target.elements['category-desc'];

    const newCategory = {
        name: nameInput.value,
        description: descInput.value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newCategory)
        });

        if (!response.ok) throw new Error('카테고리 추가에 실패했습니다.');

        alert('새 카테고리가 추가되었습니다.');
        nameInput.value = ''; // 입력 필드 초기화
        descInput.value = '';
        fetchCategories(); // 카테고리 목록 새로고침
    } catch (error) {
        alert(error.message);
    }
}

// ./frontend/html/app.js

// ... 기존 코드 상단 ...
// --- DOM 요소 가져오기 ---
const q2Content = document.querySelector('#q2 .content-area');
// ...
const uploadForm = document.querySelector('#upload-form'); // 새로 추가
const fileInput = document.querySelector('#receipt-file-input'); // 새로 추가
const uploadStatus = document.querySelector('#upload-status'); // 새로 추가

// ... 기존 API 호출 함수들 ...

/**
 * [화면 1] 파일을 서버로 업로드하는 함수
 * @param {Event} event - 폼 제출 이벤트 객체
 */
async function handleUpload(event) {
    event.preventDefault(); // 폼 제출 시 새로고침 방지

    const files = fileInput.files;
    if (files.length === 0) {
        uploadStatus.textContent = '업로드할 파일을 선택해주세요.';
        uploadStatus.style.color = 'orange';
        return;
    }

    // 파일들을 담을 FormData 객체 생성
    const formData = new FormData();
    for (const file of files) {
        formData.append('receipts', file); // 백엔드에서 받을 키('receipts')와 파일 추가
    }

    uploadStatus.textContent = '업로드 중...';
    uploadStatus.style.color = 'blue';

    try {
        const response = await fetch(`${API_BASE_URL}/upload-receipts`, {
            method: 'POST',
            body: formData 
            // 중요: FormData를 사용할 때는 'Content-Type' 헤더를 절대 설정하지 말것!
            // 브라우저가 자동으로 'multipart/form-data'와 경계(boundary)를 설정해줌
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || '서버 오류가 발생했습니다.');
        }
        
        uploadStatus.textContent = result.message;
        uploadStatus.style.color = 'green';
        uploadForm.reset(); // 성공 시 폼 초기화

    } catch (error) {
        uploadStatus.textContent = `오류: ${error.message}`;
        uploadStatus.style.color = 'red';
    }
}


// --- 이벤트 리스너 설정 ---

// ... 기존 이벤트 리스너들 ...
// q2Content.addEventListener(...);
// q3Form.addEventListener(...);

// 파일 업로드 폼의 'submit' 이벤트에 handleUpload 함수를 연결 (새로 추가)
uploadForm.addEventListener('submit', handleUpload);


// ...
// document.addEventListener('DOMContentLoaded', initializeApp);

// --- 이벤트 리스너 설정 ---

// 페이지가 처음 로드되었을 때 실행될 메인 함수
function initializeApp() {
    // 각 사분면의 데이터를 서버에서 가져와 채워넣기
    fetchUnverifiedReceipts();
    fetchVerifiedReceipts();
    fetchCategories();
}

// 미승인 목록 영역(q2)에서 발생하는 클릭 이벤트를 감지 (이벤트 위임)
// .approve-btn은 동적으로 생성되므로, 부모 요소에 이벤트 리스너를 달기
q2Content.addEventListener('click', (event) => {
    // 클릭된 요소가 'approve-btn' 클래스를 가진 버튼인지 확인
    if (event.target.classList.contains('approve-btn')) {
        const receiptId = event.target.dataset.id;
        if (confirm(`ID: ${receiptId}\n이 영수증을 승인하시겠습니까?`)) {
            approveReceipt(receiptId);
        }
    }
});

// 카테고리 추가 폼의 'submit' 이벤트에 addCategory 함수를 연결
q3Form.addEventListener('submit', addCategory);

// HTML 문서의 모든 요소가 로드된 후, 앱을 초기화
document.addEventListener('DOMContentLoaded', initializeApp);

