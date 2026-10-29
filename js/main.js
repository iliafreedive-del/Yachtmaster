/* Галс · запуск */
/* новичок начинает с Пролога, дальше первым открывается экран «Сегодня» (js/today.js).
   Ссылка с вкладкой после # открывает её сразу: …/#onboard — «На борту», …/#course — «Курс» */
const startTab=decodeURIComponent(location.hash.slice(1));
renderTabs();openChapter(TABS.some(t=>t.id===startTab)?startTab:typeof todayHas==='function'&&todayHas()?'today':'prolog');scrollTo(0,0);renderGfx();
