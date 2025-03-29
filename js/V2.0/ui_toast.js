// --- UI 업데이트 및 토스트 메시지 관련 함수 ---

/**
 * 토스트 메시지를 표시하는 함수
 * 중복 방지를 위해 기존 토스트를 제거하고 새 토스트를 표시합니다.
 * 여러 파일에서 사용되는 공통 UI 함수입니다.
 */
function showToast(message) {
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className = "toast";
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("fade-out");
        toast.addEventListener("transitionend", () => {
            toast.remove();
        });
    }, 1500);
}

/**
 * 현재 비디오 정보를 포함한 확장된 토스트를 표시하는 함수
 * 영상이 변경될 때 영상 썸네일과 제목을 포함한 알림을 표시합니다.
 */
function showCurrentVideoToast(video) {
    // 기존 토스트 제거 (중복 방지)
    document.querySelectorAll('.toast.fixed').forEach(t => t.remove());

    const toast = document.createElement("div");
    toast.className = "toast fixed";
    toast.style.position = 'fixed';
    toast.style.bottom = "10px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.pointerEvents = 'none';
    toast.innerHTML = `
        <div style="display: flex; align-items: center;">
            <img src="${video.thumbnail}" alt="Thumbnail" style="width: 50px; height: 40px; border-radius: 4px; object-fit: cover; margin-right: 10px;">
            <span style="font-family: 'Noto Sans KR', sans-serif; font-size: 16px; color: #fff;">
                ${escapeHtml(video.title)}
            </span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("fade-out");
        toast.addEventListener("transitionend", () => {
            toast.remove();
        });
    }, 3000);
}

/**
 * HTML 특수문자를 이스케이프하는 함수
 * XSS 방지를 위해 사용자 제공 콘텐츠(영상 제목, 채널명 등)를 표시할 때 필요합니다.
 */
function escapeHtml(unsafe) {
    if (!unsafe || typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 전역으로 함수 노출 (다른 스크립트에서 접근할 수 있도록)
window.showToast = showToast;
window.showCurrentVideoToast = showCurrentVideoToast;
window.escapeHtml = escapeHtml;