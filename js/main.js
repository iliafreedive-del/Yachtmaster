/* Галс · запуск */
/* новичок начинает с Пролога, дальше первым открывается экран «Сегодня» (js/today.js) */
renderTabs();openChapter(typeof todayHas==='function'&&todayHas()?'today':'prolog');scrollTo(0,0);renderGfx();
