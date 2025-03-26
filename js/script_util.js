// --- 유틸리티 및 API 호출 함수 ---
function extractPlaylistId(url) {
    const regex = /(?:list=)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function extractVideoId(url) {
    const regex = /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// 캐시 객체 추가: API 사용량을 줄이기 위해 동일 재생목록에 대해 캐싱함
const playlistCache = {};
const playlistTitleCache = {};

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

// progressCallback 파라미터 추가 - 현재 로드된 항목 수, 총 항목 수, 현재 페이지 번호를 알려줌
async function fetchAllPlaylistInfo(playlistId, progressCallback = null) {
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
        do {
            const pageParam = nextPageToken ? `&pageToken=${nextPageToken}` : '';
            const cleanApiKey = getapi.replace(/["']/g, '');
            const apiUrl = baseUrl + `&key=${cleanApiKey}` + pageParam;

            const data = await apiFetch(apiUrl);

            if (!data.items || data.items.length === 0) {
                if (pageCount === 0) {
                    return [];
                }
                break;
            }

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

            playlistInfo = playlistInfo.concat(newItems);
            nextPageToken = data.nextPageToken;
            pageCount++;

            if (pageCount === 1) {
                totalItems = nextPageToken ? (pageCount * 50) + 50 : newItems.length;
            } else if (!nextPageToken) {
                totalItems = playlistInfo.length;
            } else {
                totalItems = Math.max(totalItems, playlistInfo.length + 50);
            }

            if (progressCallback) {
                progressCallback(playlistInfo.length, totalItems, pageCount);
            }

        } while (nextPageToken);

        playlistInfo = playlistInfo.map((item, index) => ({
            ...item,
            number: index + 1
        }));

        playlistCache[playlistId] = playlistInfo;

        if (progressCallback) {
            progressCallback(playlistInfo.length, playlistInfo.length, pageCount);
        }

        return playlistInfo;

    } catch (error) {
        showToast("재생목록 정보를 불러오는 데 실패했습니다.");
        throw error;
    }
}

async function fetchPlaylistTitle(playlistId) {
    if (playlistTitleCache[playlistId]) {
        return playlistTitleCache[playlistId];
    }

    try {
        const cleanApiKey = getapi.replace(/["']/g, '');
        const apiUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&fields=items(snippet(title))&id=${encodeURIComponent(playlistId)}&key=${cleanApiKey}`;
        const data = await apiFetch(apiUrl);

        if (!data.items || data.items.length === 0) {
            return "YouTube 재생목록";
        }

        const title = data.items[0].snippet.title;
        playlistTitleCache[playlistId] = title;
        return title;

    } catch (error) {
        return "YouTube 재생목록";
    }
}

// 기존 동기 셔플 기능 -> shufflePlaylistOrder
function shufflePlaylistOrder() {
    for (let i = playlistInfo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlistInfo[i], playlistInfo[j]] = [playlistInfo[j], playlistInfo[i]];
    }
    displayPlaylistInfo(playlistInfo, document.getElementById('playlistTitle').textContent);
    currentVideoIndex = 0;
    if (playlistInfo[currentVideoIndex].isError) {
        for (let i = 0; i < playlistInfo.length; i++) {
            if (!playlistInfo[i].isError) {
                currentVideoIndex = i;
                break;
            }
        }
    }
    playVideo(playlistInfo[currentVideoIndex].url);
    updateCurrentVideoInfo(playlistInfo[currentVideoIndex]);
}