// --- 재생 제어 관련 함수 ---

/**
 * 이전 영상 재생 함수
 * 현재 영상에서 이전 영상으로 이동하며, 에러가 있는 영상은 자동으로 건너뜁니다.
 * 모든 영상에 에러가 있을 경우 경고 메시지를 표시합니다.
 */
const prevVideo = () => {
    if (!playlistInfo || playlistInfo.length === 0) return;
    for (let i = 0; i < playlistInfo.length; i++) {
        const prevIndex = (currentVideoIndex - i - 1 + playlistInfo.length) % playlistInfo.length;
        if (!playlistInfo[prevIndex].isError && !playlistInfo[prevIndex].eventError) {
            currentVideoIndex = prevIndex;
            playVideo(playlistInfo[currentVideoIndex].url);
            updateCurrentVideoInfo(playlistInfo[currentVideoIndex]);
            return;
        }
    }
    console.warn("정상적인 영상을 찾을 수 없습니다.");
};

/**
 * 다음 영상 재생 함수
 * 현재 영상에서 다음 영상으로 이동하며, 에러가 있는 영상은 자동으로 건너뜁니다.
 * 모든 영상에 에러가 있을 경우 경고 메시지를 표시합니다.
 */
const nextVideo = () => {
    if (!playlistInfo || playlistInfo.length === 0) return;
    for (let i = 0; i < playlistInfo.length; i++) {
        const nextIndex = (currentVideoIndex + i + 1) % playlistInfo.length;
        if (!playlistInfo[nextIndex].isError && !playlistInfo[nextIndex].eventError) {
            currentVideoIndex = nextIndex;
            playVideo(playlistInfo[currentVideoIndex].url);
            updateCurrentVideoInfo(playlistInfo[currentVideoIndex]);
            return;
        }
    }
    console.warn("정상적인 영상을 찾을 수 없습니다.");
};

/**
 * 현재 재생 중인 영상 공유 함수
 * 현재 영상의 URL을 클립보드에 복사합니다.
 * 성공/실패 여부에 따라 토스트 메시지를 표시합니다.
 */
const shareVideo = () => {
    const video = playlistInfo && playlistInfo[currentVideoIndex];
    if (video && video.url) {
        navigator.clipboard.writeText(video.url)
            .then(() => showToast("영상 URL이 클립보드에 복사되었습니다."))
            .catch(err => console.error("URL 복사 실패:", err));
    } else {
        console.error("공유할 영상이 존재하지 않습니다.");
    }
};