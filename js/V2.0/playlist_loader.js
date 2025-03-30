// --- 재생목록 로드 관련 함수 ---

// 전역 변수
if (typeof playlistInfo === 'undefined') {
    var playlistInfo = [];      // 현재 불러온 재생목록 정보
}
if (typeof currentVideoIndex === 'undefined') {
    var currentVideoIndex = 0;  // 현재 재생 중인 비디오 인덱스
}

/**
 * 재생목록 정보를 가져와서 표시하는 메인 함수
 * 
 * 1. 사용자가 입력한 YouTube 재생목록 URL에서 ID를 추출
 * 2. YouTube API를 통해 재생목록 정보 로드
 * 3. 재생목록 제목과 영상 목록을 화면에 표시
 * 4. 첫 번째 영상부터 재생 시작
 * 5. URL을 히스토리에 저장
 * 
 * 오류 발생 시 적절한 오류 메시지를 토스트로 표시합니다.
 */
async function fetchAndDisplayPlaylist() {
    const playlistUrl = document.getElementById('playlistUrl').value;
    const button = document.querySelector('button');
    const originalButtonHtml = button.innerHTML;
    const originalButtonBg = window.getComputedStyle(button).backgroundColor;

    // 버튼 상태 업데이트
    updateButtonState(button, true, `<div class="spinner"></div>`, "transparent");
    document.getElementById('playlistUrl').disabled = true;

    // 히스토리 아이템들 비활성화
    setHistoryItemsEnabled(false);

    // 상태 초기화 및 표시
    updateStatus("재생목록 ID 확인 중...");

    const playlistId = extractPlaylistId(playlistUrl);
    if (playlistId) {
        try {
            // 먼저 재생목록의 실제 영상 갯수를 API로 가져옴
            updateStatus("재생목록 정보 확인 중...");
            const totalVideosCount = await fetchPlaylistCount(playlistId);

            updateStatus("재생목록 영상 불러오는 중...");

            // progressCallback 함수를 통해 불러오는 진행 상황을 업데이트
            playlistInfo = await fetchAllPlaylistInfo(playlistId, (loaded, total, pageNum) => {
                const progress = total > 0 ? Math.round((loaded / total) * 100) : -1;
                updateStatus(`${totalVideosCount}개 영상 중 ${loaded}개 불러옴 | ${pageNum}페이지`, progress);
            });
            await new Promise(resolve => setTimeout(resolve, 500));

            if (playlistInfo.every(video => video.isError)) {
                hideStatus();
                showToast("모든 영상이 불러올 수 없습니다.");
                throw new Error("유효한 영상이 없습니다.");
            }

            updateStatus("재생목록 제목 불러오는 중...");
            const playlistTitle = await fetchPlaylistTitle(playlistId);

            // 모든 영상 로드 완료 후 지연
            updateStatus("불러오기 완료, 재생 준비중...", 100);
            await new Promise(resolve => setTimeout(resolve, 100));

            // 재생목록 로드 및 재생 시작
            await startPlayback(playlistTitle, playlistUrl);

            // 모든 작업이 완료되면 상태 표시 숨기기
            hideStatus();
            updateButtonState(button, false, originalButtonHtml, originalButtonBg);
        } catch (error) {
            handlePlaylistLoadError(error, button, originalButtonHtml, originalButtonBg);
        }
    } else {
        hideStatus();
        showToast("유효하지 않은 URL입니다.");
        updateButtonState(button, false, originalButtonHtml, originalButtonBg, true);
        setTimeout(() => { button.classList.remove('error'); button.disabled = false; }, 550);

        // 잘못된 URL일 때도 히스토리 패널 표시
        toggleHistoryVisibility(true);
    }

    // 작업 완료 후 UI 원상 복구
    finalizeLoadProcess(button, originalButtonHtml, originalButtonBg);
}

/**
 * 재생목록 정보를 이용해 재생을 시작하는 함수
 * @param {string} playlistTitle - 재생목록 제목
 * @param {string} playlistUrl - 재생목록 URL (히스토리 저장용)
 */
async function startPlayback(playlistTitle, playlistUrl) {
    // 추가 0.5초 지연으로 자연스러운 전환 
    await new Promise(resolve => setTimeout(resolve, 500));

    updateStatus("재생목록 표시 준비 중...");
    displayPlaylistInfo(playlistInfo, playlistTitle);

    document.getElementById('playlistInfo').style.display = 'block';
    document.getElementById('controlPanel').style.display = 'block';
    document.getElementById('videoPlayerContainer').style.display = 'block';

    // 재생 모드일 때는 히스토리 패널을 숨김
    toggleHistoryVisibility(false);

    updateStatus("플레이어 초기화 중...");
    currentVideoIndex = 0;
    if (playlistInfo[currentVideoIndex].isError) {
        for (let i = 0; i < playlistInfo.length; i++) {
            if (!playlistInfo[i].isError) { currentVideoIndex = i; break; }
        }
    }

    playVideo(playlistInfo[currentVideoIndex].url);
    updateCurrentVideoInfo(playlistInfo[currentVideoIndex]);
    document.getElementById('playlistUrl').value = '';
    saveUrlToHistory(playlistUrl, playlistTitle);
}

// 전역으로 함수 노출
window.fetchAndDisplayPlaylist = fetchAndDisplayPlaylist;