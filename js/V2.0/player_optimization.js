// --- 성능 최적화 관련 함수 ---

/**
 * 재생목록의 스크롤 성능을 최적화하는 함수
 * CSS 변환과 최적화 속성을 적용하여 스크롤이 부드럽게 동작하도록 합니다.
 */
function optimizePlaylistScroll() {
    // 플레이리스트 컨테이너 찾기
    const playlistContainer = document.querySelector('.playlist-container');
    if (!playlistContainer) return;

    // passive 옵션으로 스크롤 이벤트 리스너 설정
    playlistContainer.addEventListener('scroll', throttleScroll, { passive: true });

    // CSS 최적화 적용
    playlistContainer.style.willChange = 'transform';
    playlistContainer.style.transform = 'translateZ(0)';

    // 플레이리스트 아이템에 최적화 적용
    const playlistItems = document.querySelectorAll('.playlist-item');
    playlistItems.forEach(item => {
        item.style.willChange = 'transform';
        item.style.transform = 'translateZ(0)';
    });
}

/**
 * 화면에 보이는 항목만 고품질로 렌더링하는 최적화 함수
 * @param {Event} event - 스크롤 이벤트 객체
 * 
 * 가상화(Virtualization) 개념을 적용한 최적화 함수로,
 * 현재 화면에 보이는 항목만 풀 렌더링하고 보이지 않는 항목은 렌더링을 최적화합니다.
 */
function updateVisibleItems(event) {
    const container = event.target;
    const items = container.querySelectorAll('.playlist-item');

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    items.forEach(item => {
        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.offsetHeight;

        // 화면에 보이는 항목만 고품질로 렌더링
        if (itemBottom >= containerTop && itemTop <= containerBottom) {
            if (item.style.opacity !== '1') {
                item.style.opacity = '1';
                item.style.transform = 'translateZ(0)';
            }
        } else {
            // 화면 밖 항목은 최적화
            if (item.style.opacity !== '0.8') {
                item.style.opacity = '0.8';
                item.style.transform = 'none';
            }
        }
    });
}