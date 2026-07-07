// ============================================================
//  VBAds — AdMob 래퍼 (리워드형 중심 + 가벼운 전면)
//  index.html · explore.html 공용. 지금은 Google 공식 "테스트 광고" ID.
//  ▶ 실제 배포 시: USE_TEST=false 로 바꾸고 REAL 에 발급받은 광고단위 ID 입력.
// ============================================================
window.VBAds = (function () {
  var USE_TEST = true; // TODO(배포): false + REAL ID 채우기

  // Google 공식 테스트 광고단위 (계정 없이 동작)
  var TEST = {
    ios:     { rewarded: 'ca-app-pub-3940256099942544/1712485313', interstitial: 'ca-app-pub-3940256099942544/4411468910' },
    android: { rewarded: 'ca-app-pub-3940256099942544/5224354917', interstitial: 'ca-app-pub-3940256099942544/1033173712' },
  };
  var REAL = {
    ios:     { rewarded: '', interstitial: '' },
    android: { rewarded: '', interstitial: '' },
  };

  function admob() { return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) || null; }
  function isNative() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  function platform() { return (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'android') ? 'android' : 'ios'; }
  function unit(kind) { var t = USE_TEST ? TEST : REAL; return (t[platform()] || {})[kind]; }

  var _inited = false;
  function init() {
    var A = admob();
    if (!A || !isNative() || _inited) return Promise.resolve();
    _inited = true;
    return Promise.resolve()
      .then(function () { return A.requestTrackingAuthorization && A.requestTrackingAuthorization().catch(function () {}); })
      .then(function () { return A.initialize({ initializeForTesting: USE_TEST }); })
      .catch(function (e) { console.warn('[VBAds] init 실패', e); _inited = false; });
  }

  // 리워드 광고: 끝까지 시청 시 true. 웹/미지원/실패 시 폴백 or false.
  function rewarded() {
    var A = admob();
    if (!A || !isNative()) return _webFallback();
    var earned = false, handle = null;
    return init()
      .then(function () { return A.addListener('onRewardedVideoAdReward', function () { earned = true; }); })
      .then(function (h) { handle = h; return A.prepareRewardVideoAd({ adId: unit('rewarded'), isTesting: USE_TEST }); })
      .then(function () { return A.showRewardVideoAd(); })
      .then(function () { try { handle && handle.remove && handle.remove(); } catch (e) {} return earned; })
      .catch(function (e) { console.warn('[VBAds] rewarded 실패', e); try { handle && handle.remove && handle.remove(); } catch (e2) {} return false; });
  }

  // 전면 광고: best-effort. 반환값 무시 가능.
  function interstitial() {
    var A = admob();
    if (!A || !isNative()) return Promise.resolve(false);
    return init()
      .then(function () { return A.prepareInterstitial({ adId: unit('interstitial'), isTesting: USE_TEST }); })
      .then(function () { return A.showInterstitial(); })
      .then(function () { return true; })
      .catch(function (e) { console.warn('[VBAds] interstitial 실패', e); return false; });
  }

  // N회마다 1번 전면(로컬 카운터). 예: interstitialEvery('dayclear', 3)
  function interstitialEvery(key, n) {
    try {
      var k = 'vb_adcnt_' + key, c = (+(localStorage.getItem(k) || 0)) + 1;
      localStorage.setItem(k, String(c));
      if (c % n === 0) { interstitial(); return true; }
    } catch (e) {}
    return false;
  }

  // 웹(프리뷰)에서는 실제 광고 불가 → 개발용 확인창으로 보상 흐름 테스트
  function _webFallback() {
    return Promise.resolve(window.confirm('[웹 테스트] 광고를 끝까지 봤다고 가정하고 보상을 받을까요?\n(실기기에서는 실제 리워드 광고가 재생됩니다)'));
  }

  return { init: init, rewarded: rewarded, interstitial: interstitial, interstitialEvery: interstitialEvery, isNative: isNative };
})();
