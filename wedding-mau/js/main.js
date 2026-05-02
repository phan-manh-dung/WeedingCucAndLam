(function () {
  try {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  } catch (e) {}

  var nav = document.getElementById("nav");
  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Lễ vu quy tại tư gia — đếm ngược tới giờ này */
  var WEDDING_ISO = "2026-06-07T09:00:00+07:00";

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function navOffset() {
    return nav ? nav.offsetHeight + 10 : 10;
  }

  function scrollTopForElement(el) {
    var rect = el.getBoundingClientRect();
    return window.scrollY + rect.top - navOffset();
  }

  function animatedScrollTo(targetY, duration, onDone) {
    var start = window.scrollY;
    var maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    targetY = Math.max(0, Math.min(targetY, maxScroll));
    var change = targetY - start;
    if (Math.abs(change) < 1) {
      if (onDone) onDone();
      return;
    }
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var elapsed = ts - t0;
      var t = Math.min(1, elapsed / duration);
      window.scrollTo(0, start + change * easeInOutCubic(t));
      if (t < 1) {
        requestAnimationFrame(step);
      } else if (onDone) {
        onDone();
      }
    }
    requestAnimationFrame(step);
  }

  var introRaf = 0;
  var introActive = false;

  function stopIntro() {
    introActive = false;
    if (introRaf) {
      cancelAnimationFrame(introRaf);
      introRaf = 0;
    }
  }

  function startIntroScroll() {
    if (prefersReduced) return;
    if (window.location.hash && window.location.hash.length > 1) return;
    var to = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    if (to < 80) return;
    var from = 0;
    /* Tốc độ đều: quãng đường tỷ lệ thuận thời gian (không ease) */
    var dur = Math.min(95000, Math.max(38000, (to - from) * 20));
    var tStart = null;
    function frame(now) {
      if (!introActive) return;
      if (tStart === null) tStart = now;
      var p = Math.min(1, (now - tStart) / dur);
      var y = from + (to - from) * p;
      window.scrollTo(0, y);
      if (p < 1 && introActive) {
        introRaf = requestAnimationFrame(frame);
      } else {
        stopIntro();
      }
    }
    setTimeout(function () {
      if (prefersReduced) return;
      if (window.location.hash && window.location.hash.length > 1) return;
      window.scrollTo(0, 0);
      introActive = true;
      introRaf = requestAnimationFrame(frame);
    }, 2600);
  }

  function bindIntroCancel() {
    function cancel() {
      if (!introActive && !introRaf) return;
      stopIntro();
    }
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", function (e) {
      if (
        ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].indexOf(
          e.key
        ) >= 0
      ) {
        cancel();
      }
    });
  }

  function bindSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href === "#") return;
      var id = href.slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      stopIntro();
      if (prefersReduced) {
        target.scrollIntoView({ block: "start", behavior: "auto" });
        window.scrollBy(0, -navOffset() + 10);
        try {
          history.replaceState(null, "", href);
        } catch (err) {}
        return;
      }
      var dest = scrollTopForElement(target);
      var dist = Math.abs(dest - window.scrollY);
      var duration = Math.min(4200, Math.max(1700, dist * 1.05));
      animatedScrollTo(dest, duration, function () {
        try {
          history.replaceState(null, "", href);
        } catch (err2) {}
      });
    });
  }

  function updateNavSolid() {
    if (!nav) return;
    if (window.scrollY > 72) nav.classList.add("nav--solid");
    else nav.classList.remove("nav--solid");
  }

  var sectionOrder = [
    "dau-trang",
    "gioi-thieu",
    "ngay-cuoi",
    "co-dau",
    "chu-re",
    "gia-dinh",
    "su-kien",
    "album",
  ];

  function updateActiveNavLink() {
    var links = document.querySelectorAll("[data-section]");
    if (!links.length) return;
    var y = window.scrollY + navOffset() + 24;
    var current = sectionOrder[0];
    for (var i = 0; i < sectionOrder.length; i++) {
      var el = document.getElementById(sectionOrder[i]);
      if (el && el.offsetTop <= y) {
        current = sectionOrder[i];
      }
    }
    links.forEach(function (link) {
      var sec = link.getAttribute("data-section");
      link.classList.toggle("is-active", sec === current);
    });
  }

  var scrollTicking = false;
  function onScroll() {
    updateNavSolid();
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(function () {
        updateActiveNavLink();
        scrollTicking = false;
      });
    }
  }

  function buildCalendar() {
    var root = document.getElementById("wedding-cal");
    if (!root) return;
    var uid = "c" + ((Math.random() * 1e8) | 0);
    var year = 2026;
    var monthIndex = 5;
    var first = new Date(year, monthIndex, 1);
    var startPad = first.getDay();
    var dim = new Date(year, monthIndex + 1, 0).getDate();
    var wd = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    var h = '<div class="wedding-cal-card">';
    h +=
      '<div class="wedding-cal-card__watermark" aria-hidden="true"><span class="wm-a">07</span><span class="wm-dot">·</span><span class="wm-b">06</span><span class="wm-y">2026</span></div>';
    h += '<div class="wedding-cal-card__arch"><div class="wedding-cal-card__arch-inner">';
    h += '<p class="wedding-cal-card__save-en">Save the date</p>';
    h +=
      '<div class="wedding-cal__head">Tháng sáu<span class="wedding-cal__year">Năm 2026</span></div>';
    h += "</div></div>";
    h += '<div class="wedding-cal__weekdays">';
    for (var w = 0; w < wd.length; w++) {
      h += "<div>" + wd[w] + "</div>";
    }
    h += "</div>";
    h += '<div class="wedding-cal__grid">';
    var i;
    for (i = 0; i < startPad; i++) {
      h += '<div class="wedding-cal__cell wedding-cal__cell--muted" aria-hidden="true"></div>';
    }
    for (var d = 1; d <= dim; d++) {
      var cls = "wedding-cal__cell";
      if (d === 7) cls += " wedding-cal__cell--wed";
      if (d === 7) {
        h +=
          '<div class="' +
          cls +
          '" role="gridcell">' +
          '<span class="wed-sparkle" aria-hidden="true">\u2665 \u2665 \u2665</span>' +
          '<svg class="wed-stamp" viewBox="0 0 100 100" aria-hidden="true">' +
          "<defs>" +
          '<radialGradient id="wedGrad' +
          uid +
          '" cx="38%" cy="32%" r="68%">' +
          '<stop offset="0%" stop-color="#fda4af"/>' +
          '<stop offset="45%" stop-color="#f43f5e"/>' +
          '<stop offset="100%" stop-color="#9f1239"/>' +
          "</radialGradient>" +
          '<pattern id="wedFpat' +
          uid +
          '" width="7" height="7" patternUnits="userSpaceOnUse">' +
          '<circle cx="1.8" cy="2" r="0.55" fill="rgba(255,255,255,0.16)"/>' +
          '<circle cx="5.2" cy="4.5" r="0.45" fill="rgba(255,255,255,0.1)"/>' +
          "</pattern>" +
          "</defs>" +
          '<path fill="url(#wedGrad' +
          uid +
          ')" d="M50,86 C18,56 10,38 22,24 C32,14 44,20 50,28 C56,20 68,14 78,24 C90,38 82,56 50,86z"/>' +
          '<path fill="url(#wedFpat' +
          uid +
          ')" opacity="0.55" d="M50,86 C18,56 10,38 22,24 C32,14 44,20 50,28 C56,20 68,14 78,24 C90,38 82,56 50,86z"/>' +
          "</svg>" +
          '<span class="wedding-cal__num">' +
          d +
          "</span></div>";
      } else {
        h +=
          '<div class="' +
          cls +
          '" role="gridcell"><span class="wedding-cal__num">' +
          d +
          "</span></div>";
      }
    }
    var used = startPad + dim;
    var endPad = (7 - (used % 7)) % 7;
    for (i = 0; i < endPad; i++) {
      h += '<div class="wedding-cal__cell wedding-cal__cell--muted" aria-hidden="true"></div>';
    }
    h += "</div></div>";
    root.innerHTML = h;
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function tickCountdown() {
    var elDays = document.getElementById("cd-days");
    var elHours = document.getElementById("cd-hours");
    var elMins = document.getElementById("cd-mins");
    var elSecs = document.getElementById("cd-secs");
    var elMsg = document.getElementById("countdown-msg");
    var wrap = document.getElementById("countdown");
    if (!elDays || !wrap) return;

    var target = new Date(WEDDING_ISO);
    var now = new Date();
    var ms = target - now;

    if (ms <= 0) {
      elDays.textContent = "0";
      elHours.textContent = "0";
      elMins.textContent = "0";
      elSecs.textContent = "0";
      wrap.classList.add("countdown--done");
      if (elMsg) {
        elMsg.innerHTML =
          "Trọn vẹn yêu thương — cảm ơn quý khách đã hiện diện, chung vui và chúc phúc cho đôi uyên ương trong ngày trọng đại.";
        elMsg.classList.add("countdown-msg--celebrate");
      }
      return;
    }

    var sec = Math.floor(ms / 1000);
    var days = Math.floor(sec / 86400);
    sec -= days * 86400;
    var hours = Math.floor(sec / 3600);
    sec -= hours * 3600;
    var mins = Math.floor(sec / 60);
    sec -= mins * 60;

    elDays.textContent = String(days);
    elHours.textContent = pad2(hours);
    elMins.textContent = pad2(mins);
    elSecs.textContent = pad2(sec);
  }

  buildCalendar();
  tickCountdown();
  setInterval(tickCountdown, 1000);

  bindSmoothAnchors();
  bindIntroCancel();
  window.addEventListener("scroll", onScroll, { passive: true });
  updateNavSolid();
  updateActiveNavLink();

  function bootIntro() {
    if (!prefersReduced && (!window.location.hash || window.location.hash.length <= 1)) {
      window.scrollTo(0, 0);
    }
    startIntroScroll();
  }
  if (document.readyState === "complete") {
    bootIntro();
  } else {
    window.addEventListener("load", bootIntro);
  }

  var revealEls = document.querySelectorAll(".reveal, .reveal-children");
  if (!revealEls.length) return;

  if (prefersReduced) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.1 }
  );

  revealEls.forEach(function (el) {
    observer.observe(el);
  });
})();
