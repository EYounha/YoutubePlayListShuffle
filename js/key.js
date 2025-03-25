// API 키 설정
(function () {
    // 기본값으로 빈 API 키 설정
    window.getapi = '';

    // 1. Actions에서 생성한 api_config.js에서 가져온 API 키 확인
    if (typeof window.YOUTUBE_API_KEY !== 'undefined' && window.YOUTUBE_API_KEY !== '') {
        window.getapi = window.YOUTUBE_API_KEY.replace(/["']/g, '');
    }

    // 2. 사용자 입력 API 키 (로컬 스토리지에서 가져오기)
    const savedApiKey = localStorage.getItem('youtubeApiKey');
    if (savedApiKey && (!window.getapi || window.getapi === '')) {
        window.getapi = savedApiKey;
    }

    // 3. URL 파라미터에서 API 키 확인
    const urlParams = new URLSearchParams(window.location.search);
    const apiKeyParam = urlParams.get('apiKey');
    if (apiKeyParam) {
        window.getapi = apiKeyParam;
        localStorage.setItem('youtubeApiKey', apiKeyParam);

        // URL에서 API 키 파라미터 제거 (보안)
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // API 키가 있으면 API 키 설정 버튼 숨기기, 없으면 표시
    document.addEventListener('DOMContentLoaded', function () {
        const container = document.getElementById('container');
        if (container) {
            // 이미 API 키가 설정되어 있는지 확인
            if (!window.getapi || window.getapi === '') {
                const apiKeyBtn = document.createElement('button');
                apiKeyBtn.textContent = "API 키 설정";
                apiKeyBtn.className = "api-key-btn";
                apiKeyBtn.style.marginTop = "10px";
                apiKeyBtn.onclick = promptForApiKey;
                container.appendChild(apiKeyBtn);
            }
        }
    });
})();

// API 키 입력 프롬프트
function promptForApiKey() {
    const currentKey = window.getapi || '';
    const userInput = prompt(
        "YouTube API 키를 입력하세요.\n" +
        "API 키가 없으면 Google Cloud Console에서 생성할 수 있습니다.",
        currentKey
    );

    if (userInput !== null) {
        window.getapi = userInput.trim();
        localStorage.setItem('youtubeApiKey', window.getapi);

        // API 키 설정 버튼 제거 (이미 키가 설정됨)
        const apiKeyBtn = document.querySelector('.api-key-btn');
        if (apiKeyBtn) {
            apiKeyBtn.remove();
        }

        showToast("API 키가 설정되었습니다.");
    }
}