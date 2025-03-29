// YouTube IFrame Player API 관련 변수 선언
let player;                   // YouTube 플레이어 인스턴스
let isPlayerReady = false;    // 플레이어 초기화 상태
let scrollThrottleTimer = null; // 스크롤 성능 최적화를 위한 타이머

// 자동 스크롤 관련 변수
let userScrolledRecently = false;  // 사용자가 최근에 스크롤했는지 여부
let userScrollTimeout = null;      // 사용자 스크롤 타임아웃 ID
const USER_SCROLL_TIMEOUT_MS = 8000; // 사용자 스크롤 후 자동 스크롤 비활성화 시간(ms)

/**
 * YouTube IFrame API가 로드되면 자동으로 호출되는 콜백 함수
 * 플레이어를 초기화하고 준비합니다.
 */
function onYouTubeIframeAPIReady() {
    console.log('YouTube IFrame API 준비 완료');
    isPlayerReady = true;

    // 플레이어 생성
    player = new YT.Player('videoPlayer', {
        height: '100%',
        width: '100%',
        playerVars: {
            'autoplay': 0,          // 자동 재생 비활성화
            'rel': 0,               // 관련 동영상 표시 비활성화
            'modestbranding': 1,    // YouTube 로고 최소화
            'enablejsapi': 1,       // JavaScript API 활성화
            'controls': 1,          // 플레이어 컨트롤 표시
            'fs': 1,                // 전체 화면 버튼 활성화
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

/**
 * 플레이어가 준비되면 호출되는 이벤트 핸들러
 * @param {Object} event - YouTube 플레이어 이벤트 객체
 */
function onPlayerReady(event) {
    console.log('플레이어 준비 완료');
    // 플레이어가 준비되면 스크롤 이벤트 리스너 설정
    setupScrollListener();
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

    // 현재 비디오에 오류 표시
    if (playlistInfo && playlistInfo[currentVideoIndex]) {
        playlistInfo[currentVideoIndex].eventError = true;
        displayPlaylistInfo(playlistInfo, document.getElementById('playlistTitle').textContent);
    }

    // 다음 동영상으로 이동
    setTimeout(() => {
        nextVideo();
    }, 2000);
}

/**
 * YouTube 영상 재생 함수
 * @param {string} videoUrl - 재생할 영상의 YouTube URL
 * 
 * URL에서 동영상 ID를 추출하여 플레이어에 로드합니다.
 * 플레이어가 준비되지 않았다면 초기화합니다.
 */
function playVideo(videoUrl) {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
        console.error("유효한 비디오 ID를 찾을 수 없습니다:", videoUrl);
        return;
    }

    console.log('재생 요청된 비디오 ID:', videoId);

    if (!isPlayerReady || !player) {
        console.log('플레이어가 준비되지 않았습니다. 플레이어를 초기화합니다.');

        // 플레이어가 준비되지 않았다면 초기화 후 로드
        const videoPlayer = document.getElementById('videoPlayer');
        if (!videoPlayer) {
            console.error("videoPlayer 컨테이너를 찾을 수 없습니다.");
            return;
        }

        videoPlayer.innerHTML = '';

        player = new YT.Player('videoPlayer', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,  // 자동 재생 활성화
                'rel': 0,       // 관련 동영상 표시 비활성화
                'modestbranding': 1,  // YouTube 로고 최소화
                'enablejsapi': 1,     // JavaScript API 활성화
                'controls': 1,        // 플레이어 컨트롤 표시
                'fs': 1,              // 전체 화면 버튼 활성화
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });

        isPlayerReady = true;
    } else {
        // 이미 플레이어가 존재한다면 loadVideoById로 새 비디오 로드
        console.log('기존 플레이어로 비디오를 로드합니다:', videoId);
        player.loadVideoById(videoId);
    }

    // 비디오가 변경되면 리스트의 해당 항목으로 자동 스크롤
    setTimeout(() => scrollToCurrentVideo(), 300);
}

/**
 * 재생목록의 스크롤 성능을 최적화하는 함수
 * CSS 변환과 최적화 속성을 적용하여 스크롤이 부드럽게 동작하도록 합니다.
 */
function optimizePlaylistScroll() {
    // 플레이리스트 컨테이너 찾기
    const playlistContainer = document.querySelector('.playlist-container');
    if (!playlistContainer) return;

    // passive 옵션으로 스크롤 이벤트 리스너 설정
    playlistContainer.addEventListener('scroll', throttleScroll, { passive: true });

    // CSS 최적화 적용
    playlistContainer.style.willChange = 'transform';
    playlistContainer.style.transform = 'translateZ(0)';

    // 플레이리스트 아이템에 최적화 적용
    const playlistItems = document.querySelectorAll('.playlist-item');
    playlistItems.forEach(item => {
        item.style.willChange = 'transform';
        item.style.transform = 'translateZ(0)';
    });
}

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

/**
 * 화면에 보이는 항목만 고품질로 렌더링하는 최적화 함수
 * @param {Event} event - 스크롤 이벤트 객체
 * 
 * 가상화(Virtualization) 개념을 적용한 최적화 함수로,
 * 현재 화면에 보이는 항목만 풀 렌더링하고 보이지 않는 항목은 렌더링을 최적화합니다.
 */
function updateVisibleItems(event) {
    const container = event.target;
    const items = container.querySelectorAll('.playlist-item');

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    items.forEach(item => {
        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.offsetHeight;

        // 화면에 보이는 항목만 고품질로 렌더링
        if (itemBottom >= containerTop && itemTop <= containerBottom) {
            if (item.style.opacity !== '1') {
                item.style.opacity = '1';
                item.style.transform = 'translateZ(0)';
            }
        } else {
            // 화면 밖 항목은 최적화
            if (item.style.opacity !== '0.8') {
                item.style.opacity = '0.8';
                item.style.transform = 'none';
            }
        }
    });
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

/**
 * YouTube 플레이어 초기화 함수
 * @param {string} videoId - 초기화할 영상의 YouTube ID
 * 
 * YouTube API가 로드된 상태에서 플레이어를 초기화합니다.
 */
function initYouTubePlayer(videoId) {
    if (!window.YT || !YT.Player) {
        console.error("YouTube IFrame API가 로드되지 않았습니다.");
        return;
    }
    player = new YT.Player('videoPlayer', {
        videoId: videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
            onReady: () => { /* ...existing code... */ },
            onError: () => { console.error("동영상 재생 오류"); }
        }
    });
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
