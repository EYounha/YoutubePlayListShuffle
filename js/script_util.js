// --- 유틸리티 및 API 호출 함수 ---

/**
 * YouTube URL에서 재생목록 ID를 추출하는 함수
 * @param {string} url - 사용자가 입력한 YouTube URL
 * @returns {string|null} 추출된 재생목록 ID 또는 추출 실패시 null
 */
function extractPlaylistId(url) {
    const regex = /(?:list=)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * YouTube URL에서 비디오 ID를 추출하는 함수
 * @param {string} url - YouTube 비디오 URL
 * @returns {string|null} 추출된 비디오 ID 또는 추출 실패시 null
 */
function extractVideoId(url) {
    const regex = /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// 캐시 객체 추가: API 사용량을 줄이기 위해 동일 재생목록에 대해 캐싱함
const playlistCache = {};        // 재생목록 정보 캐시
const playlistTitleCache = {};   // 재생목록 제목 캐시

/**
 * YouTube API에 요청을 보내는 공통 함수
 * @param {string} url - 요청할 API URL
 * @returns {Promise<Object>} API 응답 데이터
 * @throws {Error} API 요청 실패 시 에러
 * 
 * API 키 확인, 오류 처리, 응답 변환 등의 공통 로직을 처리합니다.
 */
async function apiFetch(url) {
    try {
        // API 키 유효성 검사
        if (!getapi || getapi.trim() === '') {
            showToast("API 키가 설정되지 않았습니다.");
            throw new Error("API 키가 설정되지 않았습니다.");
        }

        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 403) {
                showToast("API 키가 유효하지 않거나 할당량이 초과되었습니다.");
            } else if (res.status === 400) {
                showToast("잘못된 요청입니다.");
            }
            throw new Error("Request failed with status " + res.status);
        }
        return res.json();
    } catch (error) {
        if (error.message.includes("API 키")) {
            showToast(error.message);
        }
        throw error;
    }
}

/**
 * 재생목록의 모든 영상 정보를 가져오는 함수
 * @param {string} playlistId - YouTube 재생목록 ID
 * @param {Function} progressCallback - 진행 상황을 알려주는 콜백 함수(선택적)
 * @returns {Promise<Array>} 영상 정보 객체의 배열
 * 
 * 페이지네이션을 자동으로 처리하며, 캐싱 기능을 통해 중복 요청을 방지합니다.
 * 각 비디오 객체에는 다음 정보가 포함됩니다:
 * - number: 순서 번호
 * - thumbnail: 썸네일 URL
 * - title: 영상 제목
 * - channel: 채널명
 * - url: 영상 URL
 * - isError: 오류 여부 플래그
 * - errorType: 오류 유형 (private, deleted 등)
 * - eventError: 재생 중 발생한 오류 플래그
 */
async function fetchAllPlaylistInfo(playlistId, progressCallback = null) {
    // 캐시된 결과가 있으면 바로 반환
    if (playlistCache[playlistId]) {
        if (progressCallback) {
            const totalItems = playlistCache[playlistId].length;
            progressCallback(totalItems, totalItems, 1);
        }

        return playlistCache[playlistId];
    }

    const baseUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&fields=nextPageToken,items(snippet(resourceId, title, thumbnails/default/url, videoOwnerChannelTitle))&playlistId=${encodeURIComponent(playlistId)}`;

    let playlistInfo = [];
    let nextPageToken = '';
    let pageCount = 0;
    let totalItems = 0;  // 예상 총 항목 수 (첫 페이지 응답에서 업데이트됨)

    try {
        // 페이지네이션 처리: 모든 페이지를 로드할 때까지 반복
        do {
            const pageParam = nextPageToken ? `&pageToken=${nextPageToken}` : '';
            const cleanApiKey = getapi.replace(/["']/g, '');
            const apiUrl = baseUrl + `&key=${cleanApiKey}` + pageParam;

            const data = await apiFetch(apiUrl);

            // 항목이 없으면 처리 중단
            if (!data.items || data.items.length === 0) {
                if (pageCount === 0) {
                    return [];
                }
                break;
            }

            // 응답 데이터를 가공하여 일관된 형식의 객체로 변환
            const newItems = data.items.map((item, index) => {
                const videoId = item.snippet?.resourceId?.videoId;
                if (!videoId) {
                    return {
                        number: playlistInfo.length + index + 1,
                        thumbnail: '',
                        title: "Failed to load video",
                        channel: "",
                        url: "#",
                        isError: true,
                        errorType: "failed",
                        eventError: false
                    };
                }

                let errorType = "";
                let title = item.snippet.title;
                const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

                // 특수 케이스 처리: 비공개 및 삭제된 영상
                if (title === 'Private video') {
                    title = "Private Video";
                    errorType = "private";
                }
                else if (title === 'Deleted video') {
                    title = "Deleted Video";
                    errorType = "deleted";
                }

                return {
                    number: playlistInfo.length + index + 1,
                    thumbnail: item.snippet.thumbnails?.default?.url || "",
                    title: title,
                    channel: errorType ? "" : item.snippet.videoOwnerChannelTitle || "",
                    url: videoUrl,
                    isError: !!errorType,
                    errorType: errorType,
                    eventError: false
                };
            });

            // 결과 배열에 새 항목 추가
            playlistInfo = playlistInfo.concat(newItems);
            nextPageToken = data.nextPageToken;
            pageCount++;

            // 총 항목 수 추정
            if (pageCount === 1) {
                totalItems = nextPageToken ? (pageCount * 50) + 50 : newItems.length;
            } else if (!nextPageToken) {
                totalItems = playlistInfo.length;
            } else {
                totalItems = Math.max(totalItems, playlistInfo.length + 50);
            }

            // 진행 상황 콜백 호출
            if (progressCallback) {
                progressCallback(playlistInfo.length, totalItems, pageCount);
            }

        } while (nextPageToken);

        // 번호 재정렬
        playlistInfo = playlistInfo.map((item, index) => ({
            ...item,
            number: index + 1
        }));

        // 캐시에 저장
        playlistCache[playlistId] = playlistInfo;

        // 최종 진행 상황 업데이트
        if (progressCallback) {
            progressCallback(playlistInfo.length, playlistInfo.length, pageCount);
        }

        return playlistInfo;

    } catch (error) {
        showToast("재생목록 정보를 불러오는 데 실패했습니다.");
        throw error;
    }
}

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