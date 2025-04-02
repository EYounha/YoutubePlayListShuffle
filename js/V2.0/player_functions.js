// --- YouTube Player 이벤트 핸들러 및 관련 함수 ---

// 이벤트 중복 실행 방지를 위한 플래그들
let isPlayerTransitioning = false; // 비디오 전환 중인지 추적하는 플래그
let playerEventLock = false; // 이벤트 처리 잠금 플래그
let playerEventTimeout = null; // 이벤트 처리 타임아웃 ID

/**
 * 이벤트 처리에 디바운싱을 적용하는 함수
 * @param {Function} callback - 실행할 콜백 함수
 * @param {number} delay - 디바운스 지연 시간(ms)
 */
function debouncePlayerEvent(callback, delay = 300) {
    if (playerEventLock) return; // 이미 잠금 상태면 무시

    playerEventLock = true; // 잠금 설정

    // 기존 타임아웃 취소
    if (playerEventTimeout) {
        clearTimeout(playerEventTimeout);
    }

    // 새 타임아웃 설정
    playerEventTimeout = setTimeout(() => {
        callback();
        playerEventLock = false; // 잠금 해제
    }, delay);
}

/**
 * 현재 재생 중인 영상의 인덱스를 표시하는 함수
 */
function displayCurrentVideoIndex() {
    if (!playlistInfo || playlistInfo.length === 0) {
        console.warn('재생목록 정보가 없습니다.');
        return;
    }

    const currentIndexDisplay = document.getElementById('currentIndexDisplay');
    if (!currentIndexDisplay) {
        console.warn('currentIndexDisplay 요소를 찾을 수 없습니다.');
        return;
    }

    currentIndexDisplay.textContent = `현재 재생 중: ${currentVideoIndex + 1} / ${playlistInfo.length}`;
}

/**
 * 안전하게 다음 비디오로 이동하는 함수
 * 중복 호출을 방지하고 디바운싱 로직을 적용합니다.
 */
function safeNextVideo() {
    if (isPlayerTransitioning) {
        console.log('이미 비디오 전환 중입니다. safeNextVideo 호출 무시.');
        return;
    }

    isPlayerTransitioning = true;

    debouncePlayerEvent(() => {
        try {
            nextVideo();
            displayCurrentVideoIndex(); // 현재 인덱스 업데이트
        } catch (error) {
            console.error('safeNextVideo 실행 중 오류 발생:', error);
        } finally {
            // Ensure the flag is reset even if an error occurs
            isPlayerTransitioning = false;
        }
    }, 300); // Reduced delay to make transitions smoother
}

/**
 * 플레이어 상태가 변경될 때 호출되는 이벤트 핸들러
 * @param {Object} event - YouTube 플레이어 이벤트 객체
 * 
 * 영상 재생 종료 시 자동으로 다음 영상으로 넘어갑니다.
 * 재생 상태가 되면 스크롤 최적화를 적용합니다.
 */
function onPlayerStateChange(event) {
    // 동영상이 종료되면 다음 동영상 재생
    if (event.data === YT.PlayerState.ENDED) {
        console.log('비디오 재생 완료, 다음 비디오로 이동합니다.');
        safeNextVideo();
    }

    // 재생 상태 변경 시 UI 업데이트 시 스크롤 최적화 적용
    if (event.data === YT.PlayerState.PLAYING) {
        optimizePlaylistScroll();
        displayCurrentVideoIndex(); // 현재 인덱스 업데이트

        // SponsorBlock 이벤트 핸들러 호출 (SponsorBlock 기능 통합)
        if (typeof onPlayerStateChangeWithSponsorBlock === 'function') {
            onPlayerStateChangeWithSponsorBlock(event);
        }
    }
}

/**
 * 플레이어 오류 발생 시 호출되는 이벤트 핸들러
 * @param {Object} event - YouTube 플레이어 오류 이벤트 객체
 * 
 * 오류 코드에 따라 적절한 메시지를 표시하고, 
 * 현재 영상에 오류 표시 후 다음 영상으로 자동 이동합니다.
 */
function onPlayerError(event) {
    console.error('플레이어 오류:', event.data);

    // 오류 발생 시에도 항상 다음 비디오로 이동하도록 수정
    let errorMessage = "동영상 재생 중 오류가 발생했습니다.";
    switch (event.data) {
        case 2:
            errorMessage = "잘못된 동영상 ID입니다.";
            break;
        case 5:
            errorMessage = "HTML5 플레이어 관련 오류가 발생했습니다.";
            break;
        case 100:
            errorMessage = "요청한 동영상을 찾을 수 없습니다.";
            break;
        case 101:
        case 150:
            errorMessage = "동영상 소유자가 내장 플레이어에서 재생을 허용하지 않습니다.";
            break;
    }

    showToast(errorMessage);

    // 현재 비디오에 오류 표시 (리스트를 다시 그리지 않고 현재 항목만 업데이트)
    if (playlistInfo && playlistInfo[currentVideoIndex]) {
        playlistInfo[currentVideoIndex].eventError = true;

        const currentItem = document.querySelector(`.video-item-container[data-index="${currentVideoIndex}"]`);
        if (currentItem) {
            currentItem.classList.add('video-item-container-event-error');
        }
    }

    // 오류 발생 시에도 항상 다음 비디오로 이동
    safeNextVideo();
}

// 플레이리스트 정보 표시 함수 래퍼 (기존 함수가 있다고 가정)
const originalDisplayPlaylistInfo = typeof displayPlaylistInfo === 'function' ? displayPlaylistInfo : null;

/**
 * 기존 displayPlaylistInfo 함수를 최적화된 버전으로 래핑하는 코드
 * 표시 후 스크롤 최적화와 이벤트 리스너를 추가합니다.
 */
if (originalDisplayPlaylistInfo) {
    window.displayPlaylistInfo = function (playlistInfo, title) {
        // 원래 함수 호출
        originalDisplayPlaylistInfo(playlistInfo, title);
        // 스크롤 최적화 적용
        setTimeout(optimizePlaylistScroll, 0);
        // 스크롤 이벤트 리스너 설정
        setupScrollListener();
    };
}

// updateCurrentVideoInfo 함수 제거 - script_ui.js에서 통합적으로 관리
// 함수 대신 참조만 유지하여 호환성 보장
if (typeof window.updateCurrentVideoInfo !== 'function') {
    console.warn('updateCurrentVideoInfo 함수가 정의되지 않았습니다. script_ui.js가 먼저 로드되었는지 확인하세요.');
}

// 페이지 로드 시 스크롤 이벤트 리스너 초기화
window.addEventListener('DOMContentLoaded', () => {
    setupScrollListener();
});