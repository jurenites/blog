(function (browser_window, page_document) {
  const counter_id = METRIKA_COUNTER_ID;
  const tracker_url = `https://mc.yandex.ru/metrika/tag.js?id=${counter_id}`;

  browser_window.ym = browser_window.ym || function () {
    (browser_window.ym.a = browser_window.ym.a || []).push(arguments);
  };
  browser_window.ym.l = browser_window.ym.l || Date.now();

  if (!Array.from(page_document.scripts).some((script_element) => script_element.src === tracker_url)) {
    const tracker_script = page_document.createElement('script');
    tracker_script.async = true;
    tracker_script.src = tracker_url;
    page_document.head.appendChild(tracker_script);
  }

  browser_window.ym(counter_id, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: page_document.referrer,
    url: browser_window.location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });
})(window, document);
