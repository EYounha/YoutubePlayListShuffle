// --- URL 히스토리 관련 기능 ---

/**
 * localStorage에서 URL 히스토리를 로드하여 UI에 표시하는 함수
 * 
 * 히스토리가 없으면 안내 메시지를 표시하고,
 * 히스토리 항목이 있으면 각 항목을 클릭 가능한 요소로 변환하여 표시합니다.
 */
function loadUrlHistory() {
    const historyContainer = document.getElementById('urlHistoryContainer');
    if (!historyContainer) return;
    const history = JSON.parse(localStorage.getItem('urlHistory') || '[]');
    historyContainer.innerHTML = '';

    // 히스토리가 비어있을 경우 안내 메시지 표시
    if (history.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = '최근 재생목록이 없습니다.';
        emptyMsg.style.color = '#aaa';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.padding = '10px';
        historyContainer.appendChild(emptyMsg);
        return;
    }

    // URL 히스토리 아이템 추가
    history.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('url-history-item');

        const titleSpan = document.createElement('span');
        titleSpan.textContent = item.title || '(제목 없음)';

        // 삭제 버튼 생성 및 이벤트 연결
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        removeBtn.onclick = (e) => {
            e.stopPropagation(); // 버블링 방지
            removeUrlFromHistory(item.url);
        };

        wrapper.appendChild(titleSpan);
        wrapper.appendChild(removeBtn);

        // 전체 wrapper를 클릭하면 해당 URL 선택
        wrapper.onclick = () => {
            document.getElementById('playlistUrl').value = item.url;
            document.getElementById('playlistUrl').focus();
        };

        historyContainer.appendChild(wrapper);
    });
}

/**
 * URL을 히스토리에서 제거하는 함수
 * @param {string} url - 제거할 URL
 * 
 * localStorage에서 해당 URL을 가진 항목을 제거하고 히스토리 UI를 갱신합니다.
 */
function removeUrlFromHistory(url) {
    const history = JSON.parse(localStorage.getItem('urlHistory') || '[]');
    const filtered = history.filter(item => item.url !== url);
    localStorage.setItem('urlHistory', JSON.stringify(filtered));
    loadUrlHistory();
}

/**
 * URL을 히스토리에 저장하는 함수
 * @param {string} url - 저장할 URL
 * @param {string} title - URL의 제목 (재생목록 제목)
 * 
 * 새 URL을 히스토리 맨 앞에 추가하고, 중복 항목은 제거합니다.
 * 최대 3개 항목만 유지하여 히스토리가 너무 길어지지 않도록 관리합니다.
 */
function saveUrlToHistory(url, title) {
    const history = JSON.parse(localStorage.getItem('urlHistory') || '[]');
    // 기존 항목 중 동일 URL이 있으면 제거
    const filtered = history.filter(item => item.url !== url);
    // 새 항목을 맨 앞에 추가
    filtered.unshift({ url, title });
    // 최대 3개 항목만 유지
    const newHistory = filtered.slice(0, 3);
    localStorage.setItem('urlHistory', JSON.stringify(newHistory));
    loadUrlHistory();
}

// 전역으로 함수 노출
window.loadUrlHistory = loadUrlHistory;
window.removeUrlFromHistory = removeUrlFromHistory;
window.saveUrlToHistory = saveUrlToHistory;