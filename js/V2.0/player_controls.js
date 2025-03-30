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

            // 이전곡으로 이동 후 현재 영상이 보이는지 확인
            setTimeout(() => {
                // 현재 화면에 보이지 않을 경우 자동 스크롤 실행 (1초 지연)
                if (!isScrollButtonVisible) {
                    setTimeout(() => scrollToCurrentVideo(true), 1000);
                }
                // 현재 비디오 가시성 체크
                checkCurrentVideoVisibility();
            }, 300);

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

            // 다음곡으로 이동 후 현재 영상이 보이는지 확인
            setTimeout(() => {
                // 현재 화면에 보이지 않을 경우 자동 스크롤 실행 (1초 지연)
                if (!isScrollButtonVisible) {
                    setTimeout(() => scrollToCurrentVideo(true), 1000);
                }
                // 현재 비디오 가시성 체크
                checkCurrentVideoVisibility();
            }, 300);

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

/**
 * 재생목록 순서를 셔플하는 함수
 * 현재 재생목록의 순서를 무작위로 변경하고 UI를 업데이트합니다.
 * 셔플 후에는 항상 첫 번째 영상을 재생합니다.
 */
function shufflePlaylistOrder() {
    if (!playlistInfo || playlistInfo.length <= 1) {
        showToast("셔플할 영상이 충분하지 않습니다.");
        return;
    }

    // Fisher-Yates 알고리즘을 사용한 배열 셔플
    for (let i = playlistInfo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlistInfo[i], playlistInfo[j]] = [playlistInfo[j], playlistInfo[i]];
    }

    // 번호 재정렬
    playlistInfo = playlistInfo.map((item, index) => ({
        ...item,
        number: index + 1
    }));

    // 화면에 셔플된 재생목록 표시
    const title = document.getElementById('playlistTitle').textContent;
    displayPlaylistInfo(playlistInfo, title);

    // 셔플 후 항상 첫 번째 영상을 재생
    currentVideoIndex = 0;

    // 에러가 있는 영상일 경우 다음 재생 가능한 영상 찾기
    if (playlistInfo[currentVideoIndex].isError || playlistInfo[currentVideoIndex].eventError) {
        for (let i = 0; i < playlistInfo.length; i++) {
            if (!playlistInfo[i].isError && !playlistInfo[i].eventError) {
                currentVideoIndex = i;
                break;
            }
        }
    }

    // 새 영상 재생
    playVideo(playlistInfo[currentVideoIndex].url);
    updateCurrentVideoInfo(playlistInfo[currentVideoIndex]);

    // 현재 재생 중인 영상으로 스크롤
    setTimeout(() => {
        // 현재 비디오 가시성 체크
        checkCurrentVideoVisibility();

        // 항상 새로 선택된 영상으로 스크롤 (강제)
        setTimeout(() => scrollToCurrentVideo(true), 1000);
    }, 300);

    showToast("재생목록이 셔플되었습니다.");
}

// 전역으로 함수 노출
window.prevVideo = prevVideo;
window.nextVideo = nextVideo;
window.shareVideo = shareVideo;
window.shufflePlaylistOrder = shufflePlaylistOrder;