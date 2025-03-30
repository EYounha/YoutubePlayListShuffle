// --- YouTube Player 이벤트 핸들러 및 관련 함수 ---

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
        // 영상 종료 시 자동 스크롤 함수 호출
        onVideoEnded();
        nextVideo();
    }

    // 재생 상태 변경 시 UI 업데이트 시 스크롤 최적화 적용
    if (event.data === YT.PlayerState.PLAYING) {
        optimizePlaylistScroll();
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

    // 오류 코드 분석
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

        // 올바른 선택자로 현재 항목 찾기
        const currentItem = document.querySelector(`.video-item-container[data-index="${currentVideoIndex}"]`);
        if (currentItem) {
            console.log('에러 클래스 적용할 항목:', currentVideoIndex);

            // CSS 클래스를 사용하여 스타일 적용
            currentItem.classList.add('video-item-container-event-error');
        } else {
            console.warn('에러 표시할 항목을 찾을 수 없습니다:', currentVideoIndex);
        }
    }

    // 다음 동영상으로 더 빠르게 이동 (0.25초)
    setTimeout(() => {
        nextVideo();
    }, 250);
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