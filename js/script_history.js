// --- URL 히스토리 관련 함수 ---

window.addEventListener('DOMContentLoaded', () => {
    loadUrlHistory();
});

function loadUrlHistory() {
    const historyContainer = document.getElementById('urlHistoryContainer');
    if (!historyContainer) return;
    const history = JSON.parse(localStorage.getItem('urlHistory') || '[]');
    historyContainer.innerHTML = '';

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

        // 전체 wrapper를 클릭해도 URL 선택 가능하도록
        wrapper.onclick = () => {
            document.getElementById('playlistUrl').value = item.url;
            document.getElementById('playlistUrl').focus();
        };

        historyContainer.appendChild(wrapper);
    });
}

// 히스토리 패널 보이기/숨기기 토글 함수
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

// 히스토리 아이템들의 클릭 가능 여부를 설정하는 함수 추가
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

function removeUrlFromHistory(url) {
    const history = JSON.parse(localStorage.getItem('urlHistory') || '[]');
    const filtered = history.filter(item => item.url !== url);
    localStorage.setItem('urlHistory', JSON.stringify(filtered));
    loadUrlHistory();
}

function saveUrlToHistory(url, title) {
    const history = JSON.parse(localStorage.getItem('urlHistory') || '[]');
    const filtered = history.filter(item => item.url !== url);
    filtered.unshift({ url, title });
    const newHistory = filtered.slice(0, 3);
    localStorage.setItem('urlHistory', JSON.stringify(newHistory));
    loadUrlHistory();
}

// 전역 접근을 위해 window 객체에 함수 노출
window.loadUrlHistory = loadUrlHistory;
window.saveUrlToHistory = saveUrlToHistory;
window.removeUrlFromHistory = removeUrlFromHistory;
window.setHistoryItemsEnabled = setHistoryItemsEnabled;
window.toggleHistoryVisibility = toggleHistoryVisibility;
window.toggleHistoryPanel = typeof toggleHistoryPanel !== 'undefined' ? toggleHistoryPanel : function () {
    const historyContainer = document.getElementById('historyContainerWrapper');
    const toggleBtn = document.getElementById('toggleHistoryBtn');

    if (historyContainer.classList.contains('collapsed')) {
        historyContainer.classList.remove('collapsed');
        historyContainer.classList.add('expanded');
        // 아이콘 회전
        toggleBtn.querySelector('svg polyline').setAttribute('points', '18 9 12 15 6 9');
    } else {
        historyContainer.classList.remove('expanded');
        historyContainer.classList.add('collapsed');
        // 아이콘 회전
        toggleBtn.querySelector('svg polyline').setAttribute('points', '18 15 12 9 6 15');
    }
};
