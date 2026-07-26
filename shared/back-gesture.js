// ============================================================
// 플랫폼별 '뒤로가기'로 모달 닫기 — iOS 엣지 스와이프 / Android 백버튼
// (~/counsel-app 에서 먼저 검증된 패턴을 그대로 이식)
// 실제로 '무엇을 닫을지'는 페이지마다 열려 있는 모달 종류가 다르므로,
// 각 페이지가 자신만의 dismissFn(topmost 모달 하나를 닫고 true/false 반환)을 넘겨준다.
// ============================================================
window.initBackGesture = function(dismissFn) {
  try {
    var C = window.Capacitor;
    if (!C || !(C.isNativePlatform && C.isNativePlatform())) return; // 웹 프리뷰에선 비활성(테스트는 스와이프/버튼으로 안 하니까)
    var platform = C.getPlatform && C.getPlatform();

    if (platform === 'ios') {
      // 왼쪽 가장자리에서 오른쪽으로 밀면 닫기 — 세로 스크롤과 싸우지 않도록
      // 시작점이 왼쪽 끝 24px 안일 때만 제스처로 인정한다.
      var EDGE = 24, NEED = 70;
      var x0 = 0, y0 = 0, tracking = false, decided = false;
      document.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        var t = e.touches[0];
        tracking = (t.clientX <= EDGE);
        decided = false;
        x0 = t.clientX; y0 = t.clientY;
      }, { passive: true });
      document.addEventListener('touchmove', function(e) {
        if (!tracking || decided || e.touches.length !== 1) return;
        var t = e.touches[0], dx = t.clientX - x0, dy = t.clientY - y0;
        if (Math.abs(dy) > Math.abs(dx)) { tracking = false; return; } // 세로로 긋는 중이면 스크롤에 양보
        if (dx >= NEED) { decided = true; tracking = false; dismissFn(); }
      }, { passive: true });
      document.addEventListener('touchend', function() { tracking = false; }, { passive: true });

    } else if (platform === 'android') {
      // 하드웨어/제스처 뒤로가기 — 리스너를 달면 기본 동작(앱 종료)이 사라지므로,
      // 닫을 게 없을 때는 종료 대신 홈으로 내린다(안드로이드 관례).
      var App = C.Plugins && C.Plugins.App;
      if (App && App.addListener) {
        App.addListener('backButton', function() {
          if (dismissFn()) return;
          try { App.minimizeApp && App.minimizeApp(); } catch (e) {}
        });
      }
    }
  } catch (e) {}
};
