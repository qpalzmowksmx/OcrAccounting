// ./frontend/html/app.js

// 백엔드 API의 기본 경로 설정
// Nginx가 '/api/'로 오는 요청을 백엔드로 넘겨주므로, 이 경로를 사용
const API_BASE_URL = '/api';

// --- DOM 요소 가져오기 ---
// 각 사분면의 내용이 표시될 영역을 미리 찾아두기
const q2Content = document.querySelector('#q2 .content-area');
const q4Content = document.querySelector('#q4 .content-area');
const q3Content = document.querySelector('#q3 .content-area');
const q3Form = document.querySelector('#category-form');

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
            return;
        }

        receipts.forEach(receipt => {
            const receiptElement = document.createElement('div');
            receiptElement.className = 'receipt-card';
            // items_json은 문자열이므로 JSON.parse()로 객체로 변환
            const items = JSON.parse(receipt.items_json || '[]');
            receiptElement.innerHTML = `
                <strong>상호명:</strong> ${receipt.vendor_name || 'N/A'}<br>
                <strong>구매일:</strong> ${receipt.purchase_date || 'N/A'}<br>
                <strong>승인일:</strong> ${new Date(receipt.approved_at).toLocaleString()}<br>
                <strong>총액:</strong> ${Number(receipt.total_amount).toLocaleString()}원<br>
                 <ul>
                    ${items.map(item => `<li>${item.name} (${item.category}): ${Number(item.price).toLocaleString()}원</li>`).join('')}
                </ul>
            `;
            q4Content.appendChild(receiptElement);
        });
    } catch (error) {
        q4Content.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

/**
 * [화면 3] 카테고리 목록을 가져와 화면에 표시하는 함수
 */
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('서버에서 카테고리 목록을 가져오는데 실패했습니다.');

        const categories = await response.json();
        const listElement = q3Content.querySelector('.category-list');
        listElement.innerHTML = '<h4>등록된 카테고리</h4>';
        
        const ul = document.createElement('ul');
        categories.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = `${cat.name} (${cat.description || '설명 없음'})`;
            ul.appendChild(li);
        });
        listElement.appendChild(ul);

    } catch (error) {
        q3Content.innerHTML += `<p style="color: red;">${error.message}</p>`;
    }
}


/**
 * 영수증을 승인하는 함수 (Redis -> MySQL)
 * @param {string} receiptId - 승인할 영수증의 고유 ID
 */
async function approveReceipt(receiptId) {
    try {
        const response = await fetch(`${API_BASE_URL}/approve-receipt/${receiptId}`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('영수증 승인에 실패했습니다.');

        alert('성공적으로 승인되었습니다!');
        // 데이터가 변경되었으므로, 화면 2와 화면 4의 목록을 모두 새로고침!!
        fetchUnverifiedReceipts();
        fetchVerifiedReceipts();
    } catch (error) {
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