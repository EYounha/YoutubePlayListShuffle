// --- 유틸리티 및 API 호출 함수 ---
function extractPlaylistId(url) {
    const regex = /(?:list=)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function extractVideoId(url) {
    const regex = /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    if (!match) console.error("비디오 id 추출 실패:", url);
    return match ? match[1] : null;
}

// 캐시 객체 추가: API 사용량을 줄이기 위해 동일 재생목록에 대해 캐싱함
const playlistCache = {};
const playlistTitleCache = {};

async function apiFetch(url) {
    try {
        // API 키 유효성 검사
        if (!getapi || getapi.trim() === '') {
            promptForApiKey();
            throw new Error("API 키가 설정되지 않았습니다. API 키를 설정해주세요.");
        }

        console.log("API 요청:", url);
        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 403) {
                showToast("API 키가 유효하지 않거나 할당량이 초과되었습니다.");
                promptForApiKey();
            }
            throw new Error("Request failed with status " + res.status);
        }
        return res.json();
    } catch (error) {
        console.error("API 요청 실패:", error.message);
        throw error;
    }
}

// progressCallback 파라미터 추가 - 현재 로드된 항목 수, 총 항목 수, 현재 페이지 번호를 알려줌
async function fetchAllPlaylistInfo(playlistId, progressCallback = null) {
    if (playlistCache[playlistId]) {
        console.log("캐시된 재생목록 정보 사용:", playlistId);

        // 캐시된 데이터를 사용할 때도 콜백 호출 (100% 완료로)
        if (progressCallback) {
            const totalItems = playlistCache[playlistId].length;
            progressCallback(totalItems, totalItems, 1);
        }

        return playlistCache[playlistId];
    }

    console.log("재생목록 정보 불러오기 시작:", playlistId);
    const baseUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&fields=nextPageToken,items(snippet(resourceId, title, thumbnails/default/url, videoOwnerChannelTitle))&playlistId=${encodeURIComponent(playlistId)}`;

    let playlistInfo = [];
    let nextPageToken = '';
    let pageCount = 0;
    let totalItems = 0;  // 예상 총 항목 수 (첫 페이지 응답에서 업데이트됨)

    try {
        do {
            const pageParam = nextPageToken ? `&pageToken=${nextPageToken}` : '';
            const apiUrl = baseUrl + `&key=${getapi}` + pageParam;

            console.log(`재생목록 페이지 ${pageCount + 1} 로드 중...`);
            const data = await apiFetch(apiUrl);

            if (!data.items || data.items.length === 0) {
                if (pageCount === 0) {
                    console.warn("재생목록에 항목이 없습니다");
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

            // 첫 번째 페이지에서 총 예상 항목 수 설정 (대략적으로)
            if (pageCount === 1) {
                // 여러 페이지가 있을 경우 50개씩 있다고 가정
                totalItems = nextPageToken ? (pageCount * 50) + 50 : newItems.length;
            } else if (!nextPageToken) {
                // 마지막 페이지일 경우 정확한 총 항목 수 설정
                totalItems = playlistInfo.length;
            } else {
                // 중간 페이지마다 예상 총 항목 수 업데이트
                totalItems = Math.max(totalItems, playlistInfo.length + 50);
            }

            // 진행 상황 콜백 호출
            if (progressCallback) {
                progressCallback(playlistInfo.length, totalItems, pageCount);
            }

            console.log(`페이지 ${pageCount} 완료, ${newItems.length}개 항목 추가됨`);

        } while (nextPageToken);

        console.log(`총 ${playlistInfo.length}개 영상을 성공적으로 불러왔습니다`);

        // 번호 재정렬
        playlistInfo = playlistInfo.map((item, index) => ({
            ...item,
            number: index + 1
        }));

        // 캐시에 저장
        playlistCache[playlistId] = playlistInfo;

        // 최종 진행 상황 보고 (100% 완료)
        if (progressCallback) {
            progressCallback(playlistInfo.length, playlistInfo.length, pageCount);
        }

        return playlistInfo;

    } catch (error) {
        console.error("재생목록 정보 로드 실패:", error);
        throw error;
    }
}

async function fetchPlaylistTitle(playlistId) {
    if (playlistTitleCache[playlistId]) {
        console.log("캐시된 재생목록 제목 사용:", playlistId);
        return playlistTitleCache[playlistId];
    }

    try {
        console.log("재생목록 제목 불러오기:", playlistId);
        const apiUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&fields=items(snippet(title))&id=${encodeURIComponent(playlistId)}&key=${getapi}`;
        const data = await apiFetch(apiUrl);

        if (!data.items || data.items.length === 0) {
            console.warn("재생목록 제목을 찾을 수 없습니다");
            return "YouTube 재생목록";
        }

        const title = data.items[0].snippet.title;
        playlistTitleCache[playlistId] = title;
        return title;

    } catch (error) {
        console.error("재생목록 제목 로드 실패:", error);
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
    // 현재 첫 번째 영상이 에러 영상이면 에러가 아닌 첫 번째 영상으로 currentVideoIndex 설정
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