// filepath: c:\Users\y_man\바탕 화면\작업장\스크립트\html\YoutubePlayListShuffle\js\script_history.js
// --- URL 히스토리 관련 함수 ---

/**
 * 페이지 로드 시 히스토리 데이터를 로딩하는 이벤트 리스너
 * DOM이 완전히 로드된 후 URL 히스토리를 표시합니다.
 */
window.addEventListener('DOMContentLoaded', () => {
    loadUrlHistory();
});

/**
 * localStorage에서 URL 히스토리를 로드하여 UI에 표시하는 함수
 * 
 * 히스토리가 없으면 안내 메시지를 표시하고,
 * 히스토리 항목이 있으면 각 항목을 클릭 가능한 요소로 변환하여 표시합니다.
 * 각 항목은 클릭 시 URL을 입력 필드에 채우고, 삭제 버튼을 통해 항목 제거가 가능합니다.
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
 * 히스토리 패널 표시 여부를 제어하는 함수
 * @param {boolean} show - true면 패널 표시, false면 패널 숨김
 * 
 * 재생 화면으로 전환할 때는 히스토리 패널을 숨기고,
 * 초기 화면으로 돌아올 때는 히스토리 패널을 표시합니다.
 */
function toggleHistoryVisibility(show) {
    const historyWrapper = document.getElementById('historyContainerWrapper');
    if (!historyWrapper) return;

    // true면 보이게, false면 숨기게
    if (show) {
        historyWrapper.style.display = 'flex';
        // 축소된 상태로 시작하기
        historyWrapper.classList.add('collapsed');
        historyWrapper.classList.remove('expanded');

        // 토글 버튼 아이콘 업데이트
        const toggleBtn = document.getElementById('toggleHistoryBtn');
        if (toggleBtn) {
            toggleBtn.querySelector('svg polyline').setAttribute('points', '18 15 12 9 6 15');
        }
    } else {
        historyWrapper.style.display = 'none';
    }
}

/**
 * 히스토리 항목들의 활성화/비활성화 상태를 설정하는 함수
 * @param {boolean} enabled - true면 활성화, false면 비활성화
 * 
 * 데이터 로딩 중에는 항목을 비활성화하여 사용자 혼란을 방지합니다.
 */
function setHistoryItemsEnabled(enabled) {
    const historyItems = document.querySelectorAll('.url-history-item');
    historyItems.forEach(item => {
        if (enabled) {
            item.classList.remove('disabled');
            item.style.pointerEvents = 'auto';
            item.style.opacity = '1';
        } else {
            item.classList.add('disabled');
            item.style.pointerEvents = 'none';
            item.style.opacity = '0.5';
        }
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

/**
 * 히스토리 패널을 펼치고 접는 토글 함수
 * 
 * 히스토리 패널의 확장/축소 상태를 전환하고 토글 버튼의 아이콘을 업데이트합니다.
 */
function toggleHistoryPanel() {
    const historyContainer = document.getElementById('historyContainerWrapper');
    const toggleBtn = document.getElementById('toggleHistoryBtn');

    if (historyContainer.classList.contains('collapsed')) {
        // 접힌 상태에서 펼치기
        historyContainer.classList.remove('collapsed');
        historyContainer.classList.add('expanded');
        // 아이콘 회전 (위쪽 화살표)
        toggleBtn.querySelector('svg polyline').setAttribute('points', '18 9 12 15 6 9');
    } else {
        // 펼쳐진 상태에서 접기
        historyContainer.classList.remove('expanded');
        historyContainer.classList.add('collapsed');
        // 아이콘 회전 (아래쪽 화살표)
        toggleBtn.querySelector('svg polyline').setAttribute('points', '18 15 12 9 6 15');
    }
}

// 전역 접근을 위해 window 객체에 함수 노출
window.loadUrlHistory = loadUrlHistory;
window.saveUrlToHistory = saveUrlToHistory;
window.removeUrlFromHistory = removeUrlFromHistory;
window.setHistoryItemsEnabled = setHistoryItemsEnabled;
window.toggleHistoryVisibility = toggleHistoryVisibility;
window.toggleHistoryPanel = typeof toggleHistoryPanel !== 'undefined' ? toggleHistoryPanel : toggleHistoryPanel;
