// API 키 기본 설정 - 보안 강화 버전
(function () {
    // 클로저를 사용하여 API 키 변수를 비공개로 유지
    let secureApiKey = '';

    // API 키를 안전하게 사용하기 위한 함수
    function initializeApiKey() {
        // 1. 디버그 API 키 확인 (개발 환경용)
        if (typeof window.DEBUG_API_KEY !== 'undefined' && window.DEBUG_API_KEY !== '') {
            secureApiKey = window.DEBUG_API_KEY.replace(/["']/g, '');
            console.log('[DEBUG] Debug API key is set');
        }
        // 2. Actions에서 생성한 api_config.js에서 가져온 API 키 확인
        else if (typeof window.YOUTUBE_API_KEY !== 'undefined' && window.YOUTUBE_API_KEY !== '') {
            secureApiKey = window.YOUTUBE_API_KEY.replace(/["']/g, '');
            console.log('[INFO] Production API key is set');
        }
        // 3. 로컬 스토리지에서 가져오기
        else {
            const savedApiKey = localStorage.getItem('youtubeApiKey');
            if (savedApiKey && savedApiKey.trim() !== '') {
                secureApiKey = savedApiKey;
                console.log('[INFO] API key loaded from localStorage');
            }
        }

        // 4. URL 파라미터에서 API 키 확인 (임시 테스트 목적)
        const urlParams = new URLSearchParams(window.location.search);
        const apiKeyParam = urlParams.get('apiKey');
        if (apiKeyParam) {
            secureApiKey = apiKeyParam;
            localStorage.setItem('youtubeApiKey', apiKeyParam);
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('[INFO] API key set from URL parameter');
        }

        // API 키 존재 여부 로그 출력 (디버깅 목적)
        if (!secureApiKey || secureApiKey === '') {
            console.warn('[WARNING] No API key found');
        }
    }

    // API 키 초기화
    initializeApiKey();

    // API 키가 콘솔에 노출되지 않도록 보호된 getter 함수 생성
    function getSecureApiKey() {
        return secureApiKey;
    }

    // window.getapi를 보호된 속성으로 정의
    Object.defineProperty(window, 'getapi', {
        get: function () {
            return getSecureApiKey();
        },
        // setter는 정의하지 않아 읽기 전용으로 만듦
        configurable: false,
        enumerable: false // 열거 불가능하게 설정
    });

    // 보안 강화: 콘솔 출력 방지
    // API 키가 포함된 객체가 콘솔에 표시될 때 API 키를 숨김
    if (window.getapi) {
        const originalToString = Function.prototype.toString;
        Function.prototype.toString = function () {
            if (this === getSecureApiKey || this === Object.getOwnPropertyDescriptor(window, 'getapi').get) {
                return 'function() { [API Key Protected] }';
            }
            return originalToString.apply(this, arguments);
        };
    }

    // API 키가 포함된 값을 콘솔에서 출력하지 못하도록 콘솔 로깅 방지
    const originalConsoleLog = console.log;
    console.log = function (...args) {
        const sanitizedArgs = args.map(arg => {
            if (typeof arg === 'string' && secureApiKey && arg.includes(secureApiKey)) {
                return arg.replace(secureApiKey, '[API KEY REDACTED]');
            }
            return arg;
        });
        originalConsoleLog.apply(console, sanitizedArgs);
    };
})();