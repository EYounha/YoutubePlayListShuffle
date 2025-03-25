(async function () {
    try {
        const response = await fetch('.env');
        const envText = await response.text();
        const line = envText.split('\n').find(l => l.startsWith('API_KEY='));
        window.getapi = line ? line.split('=')[1].trim() : '';
    } catch (e) {
        console.error('Failed to load .env:', e);
        window.getapi = '';
    }
})();