// --- 스크롤 기능 및 최적화 관련 함수 ---

// 스크롤 관련 변수
let scrollThrottleTimer = null; // 스크롤 성능 최적화를 위한 타이머

// 자동 스크롤 관련 변수
let userScrolledRecently = false;  // 사용자가 최근에 스크롤했는지 여부
let userScrollTimeout = null;      // 사용자 스크롤 타임아웃 ID
const USER_SCROLL_TIMEOUT_MS = 1500; // 사용자 스크롤 후 자동 스크롤 비활성화 시간(ms)
let scrollVisibilityCheckInterval = null; // 현재 재생 비디오 가시성 확인 인터벌

// 전역 변수로 스크롤 버튼 가시성 상태 공유
window.isScrollButtonVisible = false; // 스크롤 버튼이 현재 표시되고 있는지 여부

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
            // 스크롤 버튼이 표시되지 않을 때만 자동 스크롤 수행
            if (!window.isScrollButtonVisible) {
                scrollToCurrentVideo();
            }
        }, USER_SCROLL_TIMEOUT_MS);

        // 스크롤할 때마다 현재 비디오 가시성 확인
        checkCurrentVideoVisibility();
    }, { passive: true });

    // 주기적으로 현재 비디오 가시성 체크 (스크롤 이벤트와 별개로)
    startCurrentVideoVisibilityCheck();

    // 초기 로드 시 한 번 체크
    setTimeout(checkCurrentVideoVisibility, 1000);
}

/**
 * 현재 재생 중인 영상 항목으로 스크롤하는 함수
 * 사용자가 직접 스크롤한 후에는 일정 시간동안 자동 스크롤되지 않습니다.
 * @param {boolean} force - true일 경우 사용자 스크롤 상태와 상관없이 강제 스크롤
 */
function scrollToCurrentVideo(force = false) {
    // 사용자가 최근에 스크롤했고 강제 스크롤이 아니라면 자동 스크롤하지 않음
    if (userScrolledRecently && !force) return;

    // 스크롤 버튼이 표시중이고 강제 스크롤이 아니라면 자동 스크롤하지 않음
    if (window.isScrollButtonVisible && !force) return;

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

        // 스크롤 후 현재 비디오는 보이게 되므로 버튼 숨기기
        // 직접 함수를 호출하지 않고 작업 요청만 보냄
        setTimeout(() => {
            if (typeof window.hideScrollToCurrentButton === 'function') {
                window.hideScrollToCurrentButton();
            }
        }, 500);
    }
}

/**
 * 주기적으로 현재 비디오의 가시성을 확인하는 함수를 시작합니다.
 * 플레이어가 준비되고 재생목록이 로드된 후 호출됩니다.
 */
function startCurrentVideoVisibilityCheck() {
    // 기존 인터벌이 있다면 제거
    if (scrollVisibilityCheckInterval) {
        clearInterval(scrollVisibilityCheckInterval);
    }

    // 1초마다 가시성 확인
    scrollVisibilityCheckInterval = setInterval(checkCurrentVideoVisibility, 1000);
}

/**
 * 현재 재생 중인 영상이 화면에 보이는지 확인하고
 * 보이지 않을 경우 스크롤 버튼을 표시합니다.
 */
function checkCurrentVideoVisibility() {
    const playlistContainer = document.querySelector('.playlist-container');
    const currentVideoElement = document.querySelector('.current-video');

    // 필요한 요소가 없거나, 플레이리스트가 표시되지 않은 경우
    if (!playlistContainer || !currentVideoElement || getComputedStyle(playlistContainer).display === 'none') {
        // 직접 함수 호출 대신 외부 함수 실행
        if (typeof window.hideScrollToCurrentButton === 'function') {
            window.hideScrollToCurrentButton();
        }
        return;
    }

    // 현재 비디오 요소의 위치 정보
    const containerRect = playlistContainer.getBoundingClientRect();
    const videoRect = currentVideoElement.getBoundingClientRect();

    // 현재 비디오가 컨테이너 영역에 보이는지 확인 (완전히 보이는지 확인)
    const isVisible = (
        videoRect.top >= containerRect.top &&
        videoRect.bottom <= containerRect.bottom
    );

    // 가시성에 따라 버튼 표시/숨김 (직접 호출하지 않고 외부 함수 참조)
    if (isVisible) {
        if (typeof window.hideScrollToCurrentButton === 'function') {
            window.hideScrollToCurrentButton();
        }
    } else {
        if (typeof window.showScrollToCurrentButton === 'function') {
            window.showScrollToCurrentButton();
        }
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

/**
 * 영상 재생이 종료되었을 때 호출되는 함수
 * 영상이 끝난 후 다음 영상으로 이동할 때 자동 스크롤을 수행합니다.
 */
function onVideoEnded() {
    // 스크롤 타이머가 있다면 제거
    if (userScrollTimeout) {
        clearTimeout(userScrollTimeout);
    }

    // 사용자 스크롤 상태 초기화 - 영상이 끝나면 항상 스크롤 허용
    userScrolledRecently = false;

    // 현재 비디오로 스크롤 (강제)
    // 버튼이 표시되지 않을 때만 스크롤하거나 강제 스크롤
    if (!window.isScrollButtonVisible) {
        setTimeout(() => scrollToCurrentVideo(true), 300);
    }
}

/**
 * 페이지를 떠날 때 정리 작업 수행
 */
function cleanupScrollListeners() {
    if (scrollVisibilityCheckInterval) {
        clearInterval(scrollVisibilityCheckInterval);
        scrollVisibilityCheckInterval = null;
    }

    if (userScrollTimeout) {
        clearTimeout(userScrollTimeout);
        userScrollTimeout = null;
    }
}

// 페이지를 떠날 때 정리 작업
window.addEventListener('beforeunload', cleanupScrollListeners);

// 전역으로 함수 노출
window.setupScrollListener = setupScrollListener;
window.scrollToCurrentVideo = scrollToCurrentVideo;
window.throttleScroll = throttleScroll;
window.onVideoEnded = onVideoEnded;
window.startCurrentVideoVisibilityCheck = startCurrentVideoVisibilityCheck;
window.checkCurrentVideoVisibility = checkCurrentVideoVisibility;