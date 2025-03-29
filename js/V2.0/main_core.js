// --- 메인 코어 기능 (URL 검증 등) ---

/**
 * URL 입력 검증 및 재생 시작 함수
 * 
 * 사용자가 URL을 입력하고 재생 버튼을 눌렀을 때 호출됩니다.
 * 1. URL이 비어있는지 확인
 * 2. YouTube URL 형식인지 검증
 * 3. 재생목록 불러오기 시작
 */
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

    // 클립보드 권한 확인
    checkClipboardPermission();

    // 재생목록 로드 시작
    fetchAndDisplayPlaylist();
}

/**
 * 클립보드 권한을 확인하는 함수
 * 공유 기능을 위해 클립보드 권한이 필요합니다.
 */
function checkClipboardPermission() {
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'clipboard-write' }).then(result => {
            if (result.state === 'denied') {
                console.warn("클립보드 접근 권한이 없습니다.");
            }
        });
    }
}

/**
 * 재생 페이지에서 다시 초기 페이지로 돌아가는 함수
 * 재생 UI를 숨기고 입력 폼을 다시 표시합니다.
 */
function returnToMainPage() {
    // 재생 관련 UI 요소 숨기기
    document.getElementById('playlistInfo').style.display = 'none';
    document.getElementById('controlPanel').style.display = 'none';
    document.getElementById('videoPlayerContainer').style.display = 'none';

    // 상태 초기화
    hideStatus();

    // 히스토리 패널 다시 표시
    toggleHistoryVisibility(true);

    // URL 입력창 초기화
    document.getElementById('playlistUrl').value = '';
    document.getElementById('playlistUrl').disabled = false;
    document.getElementById('playlistUrl').focus();
}

// 전역으로 함수 노출
window.validateAndPlay = validateAndPlay;
window.returnToMainPage = returnToMainPage;