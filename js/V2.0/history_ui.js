// --- 히스토리 패널 UI 관련 함수 ---

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
 * 히스토리 패널을 펼치고 접는 토글 함수
 * 
 * 히스토리 패널의 확장/축소 상태를 전환합니다.
 */
function toggleHistoryPanel() {
    const historyContainer = document.getElementById('historyContainerWrapper');
    if (!historyContainer) return;

    if (historyContainer.classList.contains('collapsed')) {
        // 접힌 상태에서 펼치기
        historyContainer.classList.remove('collapsed');
        historyContainer.classList.add('expanded');
    } else {
        // 펼쳐진 상태에서 접기
        historyContainer.classList.remove('expanded');
        historyContainer.classList.add('collapsed');
    }
}

// 전역으로 함수 노출
window.toggleHistoryVisibility = toggleHistoryVisibility;
window.setHistoryItemsEnabled = setHistoryItemsEnabled;
window.toggleHistoryPanel = toggleHistoryPanel;