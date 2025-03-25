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

// 새로운 컨트롤 함수 추가
const pauseVideo = () => {
    if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
    }
};

const resumeVideo = () => {
    if (player && typeof player.playVideo === 'function') {
        player.playVideo();
    }
};

const muteVideo = () => {
    if (player && typeof player.mute === 'function') {
        player.mute();
        showToast("음소거 되었습니다.");
    }
};

const unmuteVideo = () => {
    if (player && typeof player.unMute === 'function') {
        player.unMute();
        showToast("음소거가 해제되었습니다.");
    }
};
