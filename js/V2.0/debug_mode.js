/**
 * debug_mode.js - 디버그 모드 관련 기능
 * 
 * 이 파일은 URL의 debug=true 파라미터를 감지하여 디버그 모드를 활성화하고,
 * 디버그 모드에서만 콘솔 로그와 디버그 기능을 사용할 수 있게 합니다.
 */

// 디버그 모드 상태
let isDebugMode = false;

/**
 * URL에서 debug 파라미터를 확인하여 디버그 모드 설정
 * @returns {boolean} 디버그 모드 활성화 여부
 */
function checkDebugMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    isDebugMode = debugParam === 'true';
    return isDebugMode;
}

/**
 * 콘솔 로그 기능 설정
 * 디버그 모드가 아닐 때는 콘솔 출력을 억제합니다.
 */
function setupConsoleMode() {
    if (!isDebugMode) {
        // 디버그 모드가 아닌 경우 콘솔 출력 억제
        window.console = {
            log: function () { },
            warn: function () { },
            error: function () { },
            info: function () { },
            debug: function () { }
        };
    } else {
        // 디버그 모드인 경우 원래 console 객체 복원 (이미 덮어썼을 경우를 대비)
        if (!window.originalConsole) {
            console.log('디버그 모드 활성화: 콘솔 출력이 표시됩니다.');
        } else {
            window.console = window.originalConsole;
            console.log('디버그 모드 활성화: 콘솔 출력이 복원되었습니다.');
        }
    }
}

// 페이지 로드 시 디버그 모드 확인 및 설정
document.addEventListener('DOMContentLoaded', () => {
    // 원래 console 객체 백업 (필요시 복원을 위해)
    if (!window.originalConsole) {
        window.originalConsole = { ...console };
    }

    // 디버그 모드 체크 및 설정
    checkDebugMode();
    setupConsoleMode();

    // 디버그 정보 출력 (디버그 모드일 때만 표시됨)
    console.log('디버그 모드:', isDebugMode);
});

// 다른 파일에서 사용할 수 있도록 전역으로 노출
window.isDebugMode = isDebugMode;
window.checkDebugMode = checkDebugMode;