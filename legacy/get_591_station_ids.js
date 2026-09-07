// 在 591 租屋網 (rent.591.com.tw) 打開 DevTools Console，貼上這段並執行
// 會印出所有捷運站的 mrt_line 和 mrt_station 編號

(async () => {
  // 找頁面裡的捷運資料（591 把它存在 window 或 Vuex store）
  const tryVuex = () => {
    try {
      const app = document.querySelector('#app')?.__vue_app__;
      if (!app) return null;
      const store = app.config.globalProperties.$store;
      return store?.state?.search?.mrtData || store?.state?.mrtData || null;
    } catch { return null; }
  };

  // 直接打 API 取得捷運資料
  const tryAPI = async () => {
    try {
      const r = await fetch('/home/search/mrtList?region=1', {
        headers: { 'X-CSRF-TOKEN': document.cookie.match(/591_new_session=([^;]+)/)?.[1] || '' }
      });
      if (r.ok) return await r.json();
    } catch {}
    try {
      const r = await fetch('/home/search/getMrtInfo?region=1&type=1');
      if (r.ok) return await r.json();
    } catch {}
    return null;
  };

  // 從 Network 快取找（如果你剛搜尋過捷運站）
  const tryPerformance = () => {
    const entries = performance.getEntriesByType('resource');
    return entries
      .filter(e => e.name.includes('mrt') || e.name.includes('station'))
      .map(e => e.name);
  };

  console.log('=== 嘗試從 Vuex store 取得捷運資料 ===');
  const vuexData = tryVuex();
  if (vuexData) {
    console.log(JSON.stringify(vuexData, null, 2));
    return;
  }

  console.log('=== 嘗試呼叫 API ===');
  const apiData = await tryAPI();
  if (apiData) {
    console.log(JSON.stringify(apiData, null, 2));
    return;
  }

  console.log('=== 找到的相關 Network 資源 ===');
  console.log(tryPerformance());

  console.log('\n=== 手動方法 ===');
  console.log('1. 在 591 搜尋頁面選擇一個捷運站（例如：南京復興）');
  console.log('2. 打開 DevTools → Network → 搜尋 "rsList"');
  console.log('3. 點開那個 request → 複製 Request URL');
  console.log('4. URL 裡會有 mrt=X&station=Y，那就是 ID');
  console.log('5. 把完整 URL 和 Cookie header 複製給 Claude');
})();
