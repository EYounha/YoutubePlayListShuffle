// --- 상태 표시 관련 함수 ---

/**
 * 현재 작업 상태를 UI에 업데이트하는 함수
 * @param {string} message - 표시할 상태 메시지
 * @param {number} progress - 진행률(0~100), -1이면 진행바를 표시하지 않음
 * 
 * 사용자에게 현재 작업 진행 상황을 알려주는 UI 요소를 업데이트합니다.
 */
function updateStatus(message, progress = -1) {
    const statusContainer = document.getElementById('statusContainer');
    const statusMessage = document.getElementById('statusMessage');
    const progressBar = document.getElementById('progressBar');

    if (!statusContainer || !statusMessage || !progressBar) return;

    // 상태 메시지 업데이트
    statusMessage.textContent = message;

    // 진행률 표시 (0~100 사이의 값이면 표시)
    if (progress >= 0 && progress <= 100) {
        progressBar.style.width = `${progress}%`;
        progressBar.style.display = 'block';
    } else {
        progressBar.style.width = '0%';
    }

    // 상태 컨테이너가 보이도록 설정
    statusContainer.style.display = 'block';
}

/**
 * 상태 표시를 화면에서 숨기는 함수
 * 
 * 작업이 완료되거나 오류 발생 시 상태 표시를 숨깁니다.
 */
function hideStatus() {
    const statusContainer = document.getElementById('statusContainer');
    if (statusContainer) {
        statusContainer.style.display = 'none';
    }
}

/**
 * 버튼 상태 업데이트 헬퍼 함수
 * @param {HTMLElement} button - 상태를 변경할 버튼 요소
 * @param {boolean} disabled - 버튼 비활성화 여부
 * @param {string} html - 버튼 내부 HTML
 * @param {string} bg - 배경색
 * @param {boolean} addError - 오류 강조 클래스 추가 여부
 */
function updateButtonState(button, disabled, html, bg, addError = false) {
    button.disabled = disabled;
    button.innerHTML = html;
    button.style.backgroundColor = bg;
    if (addError) button.classList.add('error');
    else button.classList.remove('error');
}

// 전역으로 함수 노출
window.updateStatus = updateStatus;
window.hideStatus = hideStatus;
window.updateButtonState = updateButtonState;