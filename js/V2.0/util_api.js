// --- YouTube API 통신 관련 함수 ---

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