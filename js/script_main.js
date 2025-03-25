// --- 메인 처리 및 이벤트 핸들러 ---

// URL 히스토리 관련 코드는 script_history.js로 이동

// 현재 작업 상태를 업데이트하는 함수
function updateStatus(message, progress = -1) {
    const statusContainer = document.getElementById('statusContainer');
    const statusMessage = document.getElementById('statusMessage');
    const progressBar = document.getElementById('progressBar');

    if (!statusContainer || !statusMessage || !progressBar) return;

    // 상태 메시지 업데이트
    statusMessage.textContent = message;

    // 진행률 표시 (0~100 사이의 값이면 표시)
    if (progress >= 0 && progress <= 100) {
        progressBar.style.width = `${progress}%`;
        progressBar.style.display = 'block';
    } else {
        progressBar.style.width = '0%';
    }

    // 상태 컨테이너가 보이도록 설정
    statusContainer.style.display = 'block';
}

// 상태 표시를 숨기는 함수
function hideStatus() {
    const statusContainer = document.getElementById('statusContainer');
    if (statusContainer) {
        statusContainer.style.display = 'none';
    }
}

async function fetchAndDisplayPlaylist() {
    const playlistUrl = document.getElementById('playlistUrl').value;
    const button = document.querySelector('button');
    const originalButtonHtml = button.innerHTML;
    const originalButtonBg = window.getComputedStyle(button).backgroundColor;

    // 단일 헬퍼로 버튼 상태 업데이트
    const setButtonState = (disabled, html, bg, addError = false) => {
        button.disabled = disabled;
        button.innerHTML = html;
        button.style.backgroundColor = bg;
        if (addError) button.classList.add('error');
        else button.classList.remove('error');
    };

    setButtonState(true, `<div class="spinner"></div>`, "transparent");
    document.getElementById('playlistUrl').disabled = true;

    // 히스토리 아이템들 비활성화
    setHistoryItemsEnabled(false);

    // 상태 초기화 및 표시
    updateStatus("재생목록 ID 확인 중...");

    const playlistId = extractPlaylistId(playlistUrl);
    if (playlistId) {
        try {
            updateStatus("재생목록 정보 불러오는 중...");

            // progressCallback 함수를 통해 불러오는 진행 상황을 업데이트
            playlistInfo = await fetchAllPlaylistInfo(playlistId, (loaded, total, pageNum) => {
                const progress = total > 0 ? Math.round((loaded / total) * 100) : -1;
                updateStatus(`재생목록 정보 불러오는 중... (${loaded}/${total} 영상, 페이지 ${pageNum})`, progress);
            });

            if (playlistInfo.every(video => video.isError)) {
                hideStatus();
                showToast("모든 영상이 불러올 수 없습니다.");
                throw new Error("유효한 영상이 없습니다.");
            }

            updateStatus("재생목록 제목 불러오는 중...");
            const playlistTitle = await fetchPlaylistTitle(playlistId);

            updateStatus("재생목록 표시 준비 중...");
            displayPlaylistInfo(playlistInfo, playlistTitle);

            document.getElementById('playlistInfo').style.display = 'block';
            document.getElementById('controlPanel').style.display = 'block';
            document.getElementById('videoPlayerContainer').style.display = 'block';

            // 재생 모드일 때는 히스토리 패널이 공간을 차지하지 않도록 숨김
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
            saveUrlToHistory(playlistUrl, playlistTitle); // script_history.js의 함수 호출

            // 모든 작업이 완료되면 상태 표시 숨기기
            hideStatus();
            setButtonState(false, originalButtonHtml, originalButtonBg);
        } catch (error) {
            console.error('Failed to fetch playlist info:', error);
            const msg = error.message && error.message.toLowerCase().includes("quota") ?
                "API 할당량 초과입니다. 나중에 다시 시도해주세요." :
                "영상 정보를 불러오는데 실패했습니다. 나중에 다시 시도해주세요.";

            hideStatus();
            showToast(msg);
            setButtonState(false, originalButtonHtml, originalButtonBg, true);
            setTimeout(() => { button.classList.remove('error'); button.disabled = false; }, 550);

            // 오류 발생 시 히스토리 패널 다시 표시
            toggleHistoryVisibility(true);
        }
    } else {
        hideStatus();
        showToast("유효하지 않은 URL입니다.");
        setButtonState(false, originalButtonHtml, originalButtonBg, true);
        setTimeout(() => { button.classList.remove('error'); button.disabled = false; }, 550);

        // 잘못된 URL일 때도 히스토리 패널 표시
        toggleHistoryVisibility(true);
    }

    // 작업 완료 후 히스토리 아이템들 다시 활성화
    setHistoryItemsEnabled(true);

    button.disabled = false;
    document.getElementById('playlistUrl').disabled = false;
    button.innerHTML = originalButtonHtml;
    button.style.backgroundColor = originalButtonBg;
}

// 메인 페이지로 돌아가기 함수 (필요시 추가)
function returnToMainPage() {
    // 재생 관련 요소 숨기기
    document.getElementById('playlistInfo').style.display = 'none';
    document.getElementById('controlPanel').style.display = 'none';
    document.getElementById('videoPlayerContainer').style.display = 'none';

    // 히스토리 패널 표시
    toggleHistoryVisibility(true);

    // 상태 표시 숨기기
    hideStatus();
}

function validateAndPlay() {
    const urlField = document.getElementById('playlistUrl');
    const rawUrl = urlField.value.trim();

    if (!rawUrl) {
        showToast("URL을 입력해주세요.");
        return;
    }
    // YouTube URL인지 확인
    if (!/^https?:\/\/(www\.)?youtube\.com|youtu\.be\//i.test(rawUrl)) {
        showToast("유효한 YouTube URL이 아닙니다.");
        return;
    }
    // 클립보드 권한 예시
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'clipboard-write' }).then(result => {
            if (result.state === 'denied') {
                console.warn("클립보드 접근 권한이 없습니다.");
            }
        });
    }

    fetchAndDisplayPlaylist(); // 기존 함수 호출
}