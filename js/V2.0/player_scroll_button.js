// --- 현재 재생중인 영상으로 이동 버튼 관련 함수 ---

/**
 * '현재 재생 영상으로 이동' 버튼을 표시하는 함수
 */
function showScrollToCurrentButton() {
    const scrollToCurrentBtn = document.getElementById('scrollToCurrentBtn');
    if (!scrollToCurrentBtn) return;

    // 이미 보이는 상태라면 무시
    if (scrollToCurrentBtn.classList.contains('visible')) return;

    // 버튼 상태 변수 업데이트 (전역 변수 사용)
    window.isScrollButtonVisible = true;

    // 먼저 display 속성 설정
    scrollToCurrentBtn.style.display = 'flex';

    // 강제 리플로우 트리거하여 transition이 제대로 작동하도록 함
    void scrollToCurrentBtn.offsetWidth;

    // visible 클래스 추가
    scrollToCurrentBtn.classList.add('visible');
}

/**
 * '현재 재생 영상으로 이동' 버튼을 숨기는 함수
 */
function hideScrollToCurrentButton() {
    const scrollToCurrentBtn = document.getElementById('scrollToCurrentBtn');
    if (!scrollToCurrentBtn) return;

    // 이미 숨겨진 상태라면 무시
    if (!scrollToCurrentBtn.classList.contains('visible')) return;

    // 버튼 상태 변수 업데이트 (전역 변수 사용)
    window.isScrollButtonVisible = false;

    // visible 클래스 제거
    scrollToCurrentBtn.classList.remove('visible');

    // 애니메이션이 끝난 후 요소 숨기기
    setTimeout(() => {
        if (!scrollToCurrentBtn.classList.contains('visible')) {
            scrollToCurrentBtn.style.display = 'none';
        }
    }, 300);
}

// 스크롤 버튼 초기화 함수
function initScrollButton() {
    const scrollToCurrentBtn = document.getElementById('scrollToCurrentBtn');
    if (!scrollToCurrentBtn) return;

    // 버튼 클릭 이벤트가 직접 HTML에 연결되어 있지 않은 경우를 대비
    scrollToCurrentBtn.addEventListener('click', () => {
        if (typeof window.scrollToCurrentVideo === 'function') {
            window.scrollToCurrentVideo(true);
        }
    });
}

// DOM 로드 후 버튼 초기화
document.addEventListener('DOMContentLoaded', initScrollButton);

// 전역으로 함수 노출
window.showScrollToCurrentButton = showScrollToCurrentButton;
window.hideScrollToCurrentButton = hideScrollToCurrentButton;