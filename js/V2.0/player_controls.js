// --- 재생 제어 관련 함수 ---

/**
 * 이전 영상 재생 함수
 * 현재 영상에서 순차적으로 이전 영상으로 이동하며, 에러가 있는 영상은 자동으로 건너뜁니다.
 * 모든 영상에 에러가 있을 경우 경고 메시지를 표시합니다.
 */
const prevVideo = () => {
    if (!playlistInfo || playlistInfo.length === 0) return;

    console.log('이전 영상으로 이동 요청, 현재 인덱스:', currentVideoIndex);

    // 현재 영상의 순서(순번) 찾기
    const currentNumber = playlistInfo[currentVideoIndex].number;
    console.log('현재 영상 순번:', currentNumber);

    // 이전 순번의 영상 찾기 (순번 기준으로 정렬된 순서로 이전 영상 찾기)
    let prevNumber = currentNumber - 1;
    if (prevNumber < 1) {
        prevNumber = playlistInfo.length; // 첫 번째 영상이면 마지막으로 이동
    }

    console.log('이전 영상 순번을 찾는 중:', prevNumber);

    // 이전 순번의 영상 인덱스 찾기
    let foundPrevIndex = -1;
    for (let i = 0; i < playlistInfo.length; i++) {
        if (playlistInfo[i].number === prevNumber && !playlistInfo[i].isError && !playlistInfo[i].eventError) {
            foundPrevIndex = i;
            break;
        }
    }

    // 이전 순번 영상에 에러가 있으면 그 이전 영상 찾기
    if (foundPrevIndex === -1) {
        console.log('이전 순번 영상에 에러가 있거나 찾을 수 없음, 재생 가능한 이전 영상 탐색');
        for (let num = prevNumber - 1; num >= prevNumber - playlistInfo.length; num--) {
            const checkNumber = (num < 1) ? playlistInfo.length + num : num;
            for (let i = 0; i < playlistInfo.length; i++) {
                if (playlistInfo[i].number === checkNumber &&
                    !playlistInfo[i].isError &&
                    !playlistInfo[i].eventError) {
                    foundPrevIndex = i;
                    break;
                }
            }
            if (foundPrevIndex !== -1) break;
        }
    }

    // 재생 가능한 영상을 찾았으면 재생
    if (foundPrevIndex !== -1) {
        console.log('이전 재생할 영상 인덱스:', foundPrevIndex, '순번:', playlistInfo[foundPrevIndex].number);
        currentVideoIndex = foundPrevIndex;
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
    } else {
        console.warn("재생 가능한 이전 영상을 찾을 수 없습니다.");
        showToast("재생 가능한 이전 영상이 없습니다.");
    }
};

/**
 * 다음 영상 재생 함수
 * 현재 영상에서 순차적으로 다음 영상으로 이동하며, 에러가 있는 영상은 자동으로 건너뜁니다.
 * 모든 영상에 에러가 있을 경우 경고 메시지를 표시합니다.
 */
const nextVideo = () => {
    if (!playlistInfo || playlistInfo.length === 0) return;

    console.log('다음 영상으로 이동 요청, 현재 인덱스:', currentVideoIndex);

    // 현재 영상의 순서(순번) 찾기
    const currentNumber = playlistInfo[currentVideoIndex].number;
    console.log('현재 영상 순번:', currentNumber);

    // 다음 순번의 영상 찾기 (순번 기준으로 정렬된 순서로 다음 영상 찾기)
    let nextNumber = currentNumber + 1;
    if (nextNumber > playlistInfo.length) {
        nextNumber = 1; // 마지막 영상이면 첫 번째로 돌아감
    }

    console.log('다음 영상 순번을 찾는 중:', nextNumber);

    // 다음 순번의 영상 인덱스 찾기
    let foundNextIndex = -1;
    for (let i = 0; i < playlistInfo.length; i++) {
        if (playlistInfo[i].number === nextNumber && !playlistInfo[i].isError && !playlistInfo[i].eventError) {
            foundNextIndex = i;
            break;
        }
    }

    // 다음 순번 영상에 에러가 있으면 그 다음 영상 찾기
    if (foundNextIndex === -1) {
        console.log('다음 순번 영상에 에러가 있거나 찾을 수 없음, 재생 가능한 다음 영상 탐색');
        for (let num = nextNumber + 1; num <= playlistInfo.length + nextNumber; num++) {
            const checkNumber = (num > playlistInfo.length) ? num - playlistInfo.length : num;
            for (let i = 0; i < playlistInfo.length; i++) {
                if (playlistInfo[i].number === checkNumber &&
                    !playlistInfo[i].isError &&
                    !playlistInfo[i].eventError) {
                    foundNextIndex = i;
                    break;
                }
            }
            if (foundNextIndex !== -1) break;
        }
    }

    // 재생 가능한 영상을 찾았으면 재생
    if (foundNextIndex !== -1) {
        console.log('다음 재생할 영상 인덱스:', foundNextIndex, '순번:', playlistInfo[foundNextIndex].number);
        currentVideoIndex = foundNextIndex;
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
    } else {
        console.warn("재생 가능한 다음 영상을 찾을 수 없습니다.");
        showToast("재생 가능한 다음 영상이 없습니다.");
    }
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