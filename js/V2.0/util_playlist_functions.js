// --- 재생목록 데이터 로드 함수 ---

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

            // Sanitize API key from potential logs
            console.log = function (...args) {
                const sanitizedArgs = args.map(arg => {
                    if (typeof arg === 'string' && arg.includes(cleanApiKey)) {
                        return arg.replace(cleanApiKey, '[API KEY REDACTED]');
                    }
                    return arg;
                });
                originalConsoleLog.apply(console, sanitizedArgs);
            };

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