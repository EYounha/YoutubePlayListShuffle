// --- YouTube Player 코어 기능 ---

// YouTube IFrame Player API 관련 변수 선언
let player;                   // YouTube 플레이어 인스턴스
let isPlayerReady = false;    // 플레이어 초기화 상태

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