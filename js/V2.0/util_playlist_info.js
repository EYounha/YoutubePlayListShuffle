// --- 재생목록 정보 관련 함수 ---

// 캐시 객체 추가: API 사용량을 줄이기 위해 동일 재생목록에 대해 캐싱함
const playlistCache = {};        // 재생목록 정보 캐시
const playlistTitleCache = {};   // 재생목록 제목 캐시

/**
 * 재생목록 제목을 가져오는 함수
 * @param {string} playlistId - YouTube 재생목록 ID
 * @returns {Promise<string>} 재생목록 제목
 * 
 * 캐싱 기능을 통해 중복 요청을 방지하며, 오류 발생 시 기본 제목을 반환합니다.
 */
async function fetchPlaylistTitle(playlistId) {
    // 캐시된 결과가 있으면 바로 반환
    if (playlistTitleCache[playlistId]) {
        return playlistTitleCache[playlistId];
    }

    try {
        const cleanApiKey = getapi.replace(/["']/g, '');
        const apiUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&fields=items(snippet(title))&id=${encodeURIComponent(playlistId)}&key=${cleanApiKey}`;
        const data = await apiFetch(apiUrl);

        // 데이터가 없으면 기본 제목 반환
        if (!data.items || data.items.length === 0) {
            return "YouTube 재생목록";
        }

        const title = data.items[0].snippet.title;
        playlistTitleCache[playlistId] = title;
        return title;

    } catch (error) {
        // 오류 발생 시 기본 제목 반환
        return "YouTube 재생목록";
    }
}

/**
 * 재생목록을 무작위로 섞는 함수
 * 
 * Fisher-Yates 알고리즘을 사용하여 재생목록의 순서를 무작위로 변경합니다.
 * 섞은 후 목록을 다시 표시하고 첫 번째 재생 가능한 영상부터 재생을 시작합니다.
 */
function shufflePlaylistOrder() {
    // Fisher-Yates 셔플 알고리즘
    for (let i = playlistInfo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlistInfo[i], playlistInfo[j]] = [playlistInfo[j], playlistInfo[i]];
    }

    // 변경된 목록으로 UI 업데이트
    displayPlaylistInfo(playlistInfo, document.getElementById('playlistTitle').textContent);

    // 첫 번째 재생 가능한(오류 없는) 영상을 찾아 재생
    currentVideoIndex = 0;
    if (playlistInfo[currentVideoIndex].isError) {
        for (let i = 0; i < playlistInfo.length; i++) {
            if (!playlistInfo[i].isError) {
                currentVideoIndex = i;
                break;
            }
        }
    }

    // 선택된 영상 재생 및 UI 업데이트
    playVideo(playlistInfo[currentVideoIndex].url);
    updateCurrentVideoInfo(playlistInfo[currentVideoIndex]);
}