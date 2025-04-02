// --- YouTube Player 코어 기능 ---

// YouTube IFrame Player API 관련 변수 선언
let player;                   // YouTube 플레이어 인스턴스
let isPlayerReady = false;    // 플레이어 초기화 상태

// Add a counter to track consecutive errors
let consecutiveErrorCount = 0;

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
            'playsinline': 1        // 모바일에서 인라인 재생 허용
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
 * YouTube IFrame API 로드 상태를 확인하고 필요 시 재시도합니다.
 * @param {Function} callback - API 로드 후 실행할 콜백 함수
 */
function ensureYouTubeAPIReady(callback) {
    if (window.YT && YT.Player) {
        callback();
    } else {
        console.warn("YouTube IFrame API가 아직 로드되지 않았습니다. 500ms 후 재시도합니다.");
        setTimeout(() => ensureYouTubeAPIReady(callback), 500);
    }
}

/**
 * 동적으로 videoPlayer 컨테이너를 생성합니다.
 */
function ensureVideoPlayerContainer() {
    let videoPlayer = document.getElementById('videoPlayer');
    if (!videoPlayer) {
        console.warn("videoPlayer 컨테이너가 존재하지 않습니다. 새로 생성합니다.");
        videoPlayer = document.createElement('div');
        videoPlayer.id = 'videoPlayer';
        document.body.appendChild(videoPlayer); // 기본적으로 body에 추가 (필요 시 위치 조정 가능)
    }
    return videoPlayer;
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
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
            onReady: () => { /* 플레이어 준비 완료 시 처리 */ },
            onError: () => { console.error("동영상 재생 오류"); }
        }
    });
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
        showToast("유효하지 않은 비디오 URL입니다.");
        return;
    }

    console.log('재생 요청된 비디오 ID:', videoId);

    // Check if the requested video is already playing
    if (player && player.getVideoData().video_id === videoId) {
        console.log('이미 재생 중인 비디오입니다. 요청이 무시되었습니다:', videoId);
        return;
    }

    ensureYouTubeAPIReady(() => {
        const videoPlayer = ensureVideoPlayerContainer();

        if (!isPlayerReady || !player) {
            console.log('플레이어가 준비되지 않았습니다. 플레이어를 초기화합니다.');

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
                    'playsinline': 1      // 모바일에서 인라인 재생 허용
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
    });
}

/**
 * 플레이어 오류 발생 시 호출되는 이벤트 핸들러
 * @param {Object} event - YouTube 플레이어 이벤트 객체
 */
function onPlayerError(event) {
    console.error("동영상 재생 오류 발생:", event);

    // Increment the consecutive error count
    consecutiveErrorCount++;

    if (consecutiveErrorCount >= 2) {
        console.warn("연속된 두 개의 오류 영상이 발견되었습니다. 다음 영상으로 건너뜁니다.");
        consecutiveErrorCount = 0; // Reset the counter

        // Skip to the next video in the playlist
        currentVideoIndex++;
        if (currentVideoIndex >= playlistInfo.length) {
            console.warn("재생 가능한 영상이 더 이상 없습니다.");
            showToast("재생 가능한 영상이 없습니다.");
            return;
        }

        // Play the next video
        playVideo(playlistInfo[currentVideoIndex].url);
    } else {
        console.warn("단일 오류 발생. 다음 영상으로 이동하지 않습니다.");
    }
}