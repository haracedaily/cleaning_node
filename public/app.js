if ('serviceWorker' in navigator) {// safari에선 지원안함
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(reg => console.log('Service Worker 등록 성공:', reg.scope))
        .catch(err => console.error('Service Worker 등록 실패:', err));
    });
  }
  