// --- 재생목록 표시 및 UI 업데이트 함수 ---

/**
 * 재생목록 정보를 표시하는 함수
 * @param {Array} playlistInfo - 재생목록 항목 배열
 * @param {string} playlistTitle - 재생목록 제목
 * 
 * 재생목록 항목을 UI에 표시하고 개선된 UX를 제공하기 위해
 * IntersectionObserver를 사용하여 성능을 최적화합니다.
 */
function displayPlaylistInfo(playlistInfo, playlistTitle) {
    const container = document.getElementById('playlistInfo');
    container.innerHTML = '';  // 기존 내용 제거

    // 재생목록 제목이 너무 길면 25자 이후 ...으로 표시
    let displayTitle = playlistTitle;
    if (displayTitle.length > 25) {
        displayTitle = displayTitle.slice(0, 25) + '...';
    }
    document.getElementById('playlistTitle').textContent = displayTitle;

    // IntersectionObserver를 사용해 항목이 화면에 나타날 때 렌더링
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = entry.target.getAttribute('data-index');
                const video = playlistInfo[index];
                if (video) {
                    // 썸네일 처리 변경 - Private Video/Deleted Video는 클릭해도 YouTube로 연결되지 않음
                    const shouldOpenUrl = !video.isError && !video.eventError;
                    const thumbnailContent = video.thumbnail ?
                        `<img src="${video.thumbnail}" alt="Thumbnail" 
                            ${shouldOpenUrl ? `onclick="window.open('${video.url}', '_blank')"` : ''} 
                            style="${shouldOpenUrl ? 'cursor: pointer;' : 'cursor: not-allowed;'}"
                        >` : '';

                    entry.target.innerHTML = `
                        <div class="video-item">
                            ${thumbnailContent}
                            <div class="video-details">
                                <span class="video-title">${escapeHtml(video.title)}</span>
                                <span class="video-channel">${escapeHtml(video.channel)}</span>
                            </div>
                        </div>
                    `;

                    entry.target.onclick = () => {
                        if (video.isError || video.eventError) {
                            // Private/Deleted Video인 경우 메시지만 표시하고 링크 열지 않음
                            let errorMsg = "이 영상은 재생할 수 없습니다.";
                            if (video.errorType === "private") {
                                errorMsg = "비공개 영상입니다.";
                            } else if (video.errorType === "deleted") {
                                errorMsg = "삭제된 영상입니다.";
                            }
                            showToast(errorMsg);
                            // 에러 영상은 YouTube로 연결하지 않음
                        } else {
                            currentVideoIndex = index;
                            playVideo(video.url);
                            updateCurrentVideoInfo(video);
                        }
                    };
                    obs.unobserve(entry.target); // 한 번 렌더링되면 관찰 해제
                }
            }
        });
    }, { root: container, rootMargin: '0px', threshold: 0.1 });

    // 각 비디오 아이템 생성 및 IntersectionObserver 등록
    playlistInfo.forEach((video, index) => {
        const videoItemContainer = document.createElement('div');
        videoItemContainer.className = 'video-item-container';
        videoItemContainer.setAttribute('data-index', index);
        if (video.isError) {
            videoItemContainer.classList.add('video-item-container-error');
            // 에러 영상이어도 클릭은 가능하게 하되, URL은 열리지 않음
            videoItemContainer.style.pointerEvents = "auto";
        } else if (video.eventError) {
            videoItemContainer.classList.add('video-item-container-event-error');
            videoItemContainer.style.pointerEvents = "auto";
        }
        // 초기 렌더링 시 내역은 비워둠 (placeholder 효과는 CSS에서 처리 가능)
        container.appendChild(videoItemContainer);
        observer.observe(videoItemContainer);
    });

    // 영상 갯수는 실제 추가된 자식 요소의 갯수로 표시
    document.getElementById('playlistCount').textContent = `${container.childElementCount}개의 영상을 불러왔습니다.`;
}

/**
 * 현재 비디오 정보를 토스트로 표시하고 UI 하이라이트를 업데이트하는 함수
 * 영상이 변경될 때마다 호출되어 현재 재생 중인 영상을 표시합니다.
 */
function updateCurrentVideoInfo(video) {
    if (video) {
        showCurrentVideoToast(video);
        // 하이라이트 업데이트: 현재 재생중인 비디오에 클래스 추가
        const container = document.getElementById('playlistInfo');
        container.querySelectorAll('.video-item-container').forEach(item => {
            if (item.getAttribute('data-index') === currentVideoIndex.toString()) {
                item.classList.add('current-video');
            } else {
                item.classList.remove('current-video');
            }
        });
    }
}

// 전역으로 함수 노출 (다른 스크립트에서 접근할 수 있도록)
window.displayPlaylistInfo = displayPlaylistInfo;
window.updateCurrentVideoInfo = updateCurrentVideoInfo;