/**
 * reload_scripts.js - 스크립트 및 스타일 재로드 기능
 * 
 * 이 파일은 재생 중인 플레이리스트와 영상 정보를 유지한 채로
 * 자바스크립트와 CSS 파일들을 다시 로드하는 기능을 제공합니다.
 * 디버그 모드(debug=true)에서만 재로드 버튼이 표시됩니다.
 */

// 재로드 버튼 초기화 및 이벤트 설정
document.addEventListener('DOMContentLoaded', () => {
    // 디버그 모드일 때만 재로드 버튼 생성
    if (window.checkDebugMode && window.checkDebugMode()) {
        createReloadButton();
        console.log('디버그 모드: 재로드 버튼이 활성화되었습니다.');
    }
});

/**
 * 재로드 버튼 UI 요소를 동적으로 생성하는 함수
 */
function createReloadButton() {
    // 이미 존재하는 버튼 확인
    if (document.querySelector('.reload-scripts-trigger-area')) {
        return;
    }

    // 트리거 영역 생성
    const triggerArea = document.createElement('div');
    triggerArea.className = 'reload-scripts-trigger-area';

    // 버튼 생성
    const reloadBtn = document.createElement('button');
    reloadBtn.id = 'reloadScriptsBtn';
    reloadBtn.className = 'reload-scripts-button';
    reloadBtn.title = 'JS/CSS 재로드';
    reloadBtn.onclick = reloadScriptsAndStyles;

    // 버튼 아이콘 SVG 생성
    reloadBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
    `;

    // DOM에 추가
    triggerArea.appendChild(reloadBtn);
    document.body.appendChild(triggerArea);
}

/**
 * JS와 CSS 파일을 다시 로드하는 함수
 * 현재 재생 중인 영상과 재생목록 정보는 유지합니다.
 */
function reloadScriptsAndStyles() {
    // 재로드 상태 표시
    const button = document.getElementById('reloadScriptsBtn');
    button.classList.add('reloading');

    // 현재 상태 저장
    const currentState = {
        currentVideoIndex: window.currentVideoIndex || 0,
        playlistInfo: window.playlistInfo || [],
        playlistTitle: document.getElementById('playlistTitle')?.textContent || '',
        isDebugMode: window.isDebugMode || false
    };

    console.log('현재 상태 저장:', currentState);

    // localStorage에 임시 저장
    localStorage.setItem('tempPlayerState', JSON.stringify(currentState));

    // 토스트 메시지 표시
    if (typeof showToast === 'function') {
        showToast("스크립트와 스타일을 다시 로드합니다...");
    }

    // CSS 다시 로드
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    cssLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('/V2.0/')) {
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = href + '?v=' + new Date().getTime();
            link.parentNode.replaceChild(newLink, link);
        }
    });

    // JS 다시 로드 (중요 스크립트는 순차적으로 로드)
    const scripts = document.querySelectorAll('script[src*="js/V2.0"]');
    let loadedCount = 0;
    const totalScripts = scripts.length;

    // 스크립트 로드 함수
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src + '?v=' + new Date().getTime();
        script.onload = callback;
        document.head.appendChild(script);
    }

    // 스크립트를 순차적으로 로드
    function loadScriptSequentially(index) {
        if (index >= totalScripts) {
            // 모든 스크립트 로드 완료
            setTimeout(() => {
                // 로딩 상태 해제
                button.classList.remove('reloading');

                // 상태 복원
                const savedState = JSON.parse(localStorage.getItem('tempPlayerState'));
                if (savedState && savedState.playlistInfo && savedState.playlistInfo.length > 0) {
                    window.currentVideoIndex = savedState.currentVideoIndex;
                    window.playlistInfo = savedState.playlistInfo;

                    // 필요시 UI 업데이트
                    if (typeof updateCurrentVideoInfo === 'function' && window.playlistInfo[window.currentVideoIndex]) {
                        updateCurrentVideoInfo(window.playlistInfo[window.currentVideoIndex]);
                    }

                    if (typeof showToast === 'function') {
                        showToast("스크립트와 스타일이 다시 로드되었습니다.");
                    }
                }
            }, 1000);
            return;
        }

        const script = scripts[index];
        const src = script.getAttribute('src');
        loadScript(src, () => {
            loadedCount++;
            const progress = Math.round((loadedCount / totalScripts) * 100);
            console.log(`스크립트 로드 중: ${progress}% (${loadedCount}/${totalScripts})`);

            // 다음 스크립트 로드
            loadScriptSequentially(index + 1);
        });
    }

    // 첫 번째 스크립트부터 로드 시작
    loadScriptSequentially(0);
}

// 전역 함수로 노출
window.reloadScriptsAndStyles = reloadScriptsAndStyles;