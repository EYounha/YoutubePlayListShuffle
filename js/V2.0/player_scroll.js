// --- 스크롤 기능 및 최적화 관련 함수 ---

// 스크롤 관련 변수
let scrollThrottleTimer = null; // 스크롤 성능 최적화를 위한 타이머

// 자동 스크롤 관련 변수
let userScrolledRecently = false;  // 사용자가 최근에 스크롤했는지 여부
let userScrollTimeout = null;      // 사용자 스크롤 타임아웃 ID
const USER_SCROLL_TIMEOUT_MS = 8000; // 사용자 스크롤 후 자동 스크롤 비활성화 시간(ms)

/**
 * 스크롤 이벤트 리스너를 설정하는 함수
 * 사용자가 최근에 스크롤했는지 감지하여 자동 스크롤 동작을 제어합니다.
 */
function setupScrollListener() {
    const playlistContainer = document.querySelector('.playlist-container');
    if (!playlistContainer) return;

    // 사용자가 스크롤하면 일정 시간동안 자동 스크롤 비활성화
    playlistContainer.addEventListener('scroll', () => {
        userScrolledRecently = true;

        // 기존 타이머가 있으면 제거
        if (userScrollTimeout) {
            clearTimeout(userScrollTimeout);
        }

        // 일정 시간 후 자동 스크롤 다시 활성화
        userScrollTimeout = setTimeout(() => {
            userScrolledRecently = false;
        }, USER_SCROLL_TIMEOUT_MS);
    }, { passive: true });
}

/**
 * 현재 재생 중인 영상 항목으로 스크롤하는 함수
 * 사용자가 직접 스크롤한 후에는 일정 시간동안 자동 스크롤되지 않습니다.
 */
function scrollToCurrentVideo() {
    // 사용자가 최근에 스크롤했다면 자동 스크롤하지 않음
    if (userScrolledRecently) return;

    const currentVideoElement = document.querySelector('.current-video');
    const playlistContainer = document.querySelector('.playlist-container');

    if (currentVideoElement && playlistContainer) {
        // 스크롤 위치 계산 (현재 비디오가 컨테이너 중앙에 오도록)
        const containerHeight = playlistContainer.offsetHeight;
        const videoElementPos = currentVideoElement.offsetTop;
        const videoElementHeight = currentVideoElement.offsetHeight;

        const scrollPosition = videoElementPos - (containerHeight / 2) + (videoElementHeight / 2);

        // 부드럽게 스크롤
        playlistContainer.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
        });
    }
}

/**
 * 스크롤 이벤트에 쓰로틀링을 적용하는 함수
 * 너무 많은 스크롤 이벤트 처리를 방지하여 성능을 개선합니다.
 * @param {Event} event - 스크롤 이벤트 객체
 */
function throttleScroll(event) {
    if (!scrollThrottleTimer) {
        scrollThrottleTimer = setTimeout(() => {
            scrollThrottleTimer = null;
            updateVisibleItems(event);
        }, 100); // 100ms 지연
    }
}