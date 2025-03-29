// --- 재생목록 로드 오류 처리 및 마무리 함수 ---

/**
 * 재생목록 로드 오류를 처리하는 함수
 * @param {Error} error - 발생한 오류 객체
 * @param {HTMLElement} button - 재생 버튼 요소
 * @param {string} originalButtonHtml - 원래 버튼 HTML
 * @param {string} originalButtonBg - 원래 버튼 배경색
 */
function handlePlaylistLoadError(error, button, originalButtonHtml, originalButtonBg) {
    console.error('Failed to fetch playlist info:', error);
    let msg = "영상 정보를 불러오는데 실패했습니다.";

    if (error.message && error.message.toLowerCase().includes("api") && error.message.toLowerCase().includes("key")) {
        msg = "API 키 오류가 발생했습니다. 나중에 다시 시도해주세요.";
    } else if (error.message && error.message.toLowerCase().includes("quota")) {
        msg = "API 할당량 초과입니다. 나중에 다시 시도해주세요.";
    }

    hideStatus();
    showToast(msg);
    updateButtonState(button, false, originalButtonHtml, originalButtonBg, true);
    setTimeout(() => { button.classList.remove('error'); button.disabled = false; }, 550);

    // 오류 발생 시 히스토리 패널 다시 표시
    toggleHistoryVisibility(true);
}

/**
 * 재생목록 로드 프로세스를 최종 마무리하는 함수
 * @param {HTMLElement} button - 재생 버튼 요소
 * @param {string} originalButtonHtml - 원래 버튼 HTML
 * @param {string} originalButtonBg - 원래 버튼 배경색
 */
function finalizeLoadProcess(button, originalButtonHtml, originalButtonBg) {
    // 작업 완료 후 히스토리 아이템들 다시 활성화
    setHistoryItemsEnabled(true);

    button.disabled = false;
    document.getElementById('playlistUrl').disabled = false;
    button.innerHTML = originalButtonHtml;
    button.style.backgroundColor = originalButtonBg;
}

// 전역으로 함수 노출
window.handlePlaylistLoadError = handlePlaylistLoadError;
window.finalizeLoadProcess = finalizeLoadProcess;