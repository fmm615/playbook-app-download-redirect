(function () {
  'use strict';

  var destinations = {
    apple: 'https://apps.apple.com/bh/app/playbook-network/id1622077073',
    google: 'https://play.google.com/store/apps/details?id=com.mightybell.playbook',
    web: 'https://app.get-playbook.com/app'
  };

  function getDevice(userAgent, touchPoints) {
    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && touchPoints > 1)) return 'ios';
    return 'desktop';
  }

  function getBrowser(userAgent) {
    if (/Edg\//i.test(userAgent)) return 'Edge';
    if (/Firefox|FxiOS/i.test(userAgent)) return 'Firefox';
    if (/Chrome|CriOS/i.test(userAgent)) return 'Chrome';
    if (/Safari/i.test(userAgent)) return 'Safari';
    return 'Other';
  }

  function clean(value) {
    return Array.from((value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 100).join('');
  }

  function getAttribution(href, referrer) {
    var parameters = new URL(href).searchParams;
    var source = clean(parameters.get('utm_source')).toLowerCase();
    var medium = clean(parameters.get('utm_medium')).toLowerCase();
    if (!source && referrer) {
      try {
        var previous = new URL(referrer);
        var current = new URL(href);
        if (/^https?:$/.test(previous.protocol) && previous.origin !== current.origin) {
          source = clean(previous.hostname.replace(/^www\./i, '')).toLowerCase();
          medium = medium || 'referral';
        }
      } catch (_) { /* No usable referrer. */ }
    }
    return { source: source || 'direct', medium: medium,
      campaign: clean(parameters.get('utm_campaign')), content: clean(parameters.get('utm_content')) };
  }

  function campaignToken(context) {
    var value = [context.source, context.campaign, context.content].filter(Boolean).join('_')
      .toLowerCase().replace(/[^a-z0-9._-]/gu, '_');
    if (value.length <= 30) return value;
    var hash = 2166136261;
    for (var n = 0; n < value.length; n++) hash = Math.imul(hash ^ value.charCodeAt(n), 16777619);
    return value.slice(0, 21) + '_' + (hash >>> 0).toString(16).padStart(8, '0');
  }

  function buildDestination(destination, context, providerToken) {
    if (!destinations[destination]) throw new Error('Unknown destination');
    var target = new URL(destinations[destination]);
    var tagged = context.source !== 'direct' || context.campaign || context.medium || context.content;
    if (!tagged) return target.href;
    if (destination === 'apple') {
      if (/^\d{1,20}$/.test(providerToken || '')) {
        target.searchParams.set('pt', providerToken);
        target.searchParams.set('ct', campaignToken(context));
        target.searchParams.set('mt', '8');
      }
    } else {
      var referrer = new URLSearchParams();
      ['source', 'medium', 'campaign', 'content'].forEach(function (key) {
        if (context[key]) {
          target.searchParams.set('utm_' + key, context[key]);
          referrer.set('utm_' + key, context[key]);
        }
      });
      if (destination === 'google') target.searchParams.set('referrer', referrer.toString());
    }
    return target.href;
  }

  function identifier(win) {
    try { if (win.crypto && win.crypto.randomUUID) return win.crypto.randomUUID(); } catch (_) {}
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
  }

  function endpoint(win) {
    if (typeof win.PLAYBOOK_ANALYTICS_ENDPOINT === 'string' && win.PLAYBOOK_ANALYTICS_ENDPOINT) {
      var candidate = win.PLAYBOOK_ANALYTICS_ENDPOINT;
      if (/^\/(?!\/)/.test(candidate) || /^https:\/\//.test(candidate)) return candidate;
    }
    return /^(localhost|127\.0\.0\.1|\[?::1\]?)$/.test(win.location.hostname) ? '/api/events' : '';
  }

  function start(win) {
    var device = getDevice(win.navigator.userAgent || '', win.navigator.maxTouchPoints || 0);
    var context = getAttribution(win.location.href, win.document.referrer);
    var session = identifier(win);
    try {
      session = win.sessionStorage.getItem('playbook-analytics-session') || session;
      win.sessionStorage.setItem('playbook-analytics-session', session);
    } catch (_) { /* Private or restricted storage should not block navigation. */ }
    var collector = endpoint(win);
    var sameOrigin = true;
    try { sameOrigin = !collector || new URL(collector, win.location.href).origin === new URL(win.location.href).origin; }
    catch (_) { collector = ''; }
    function record(kind, destination, action) {
      if (!collector) return;
      var payload = Object.assign({}, context, { event_id: identifier(win), session_id: session,
        kind: kind, device: device, browser: getBrowser(win.navigator.userAgent || '') });
      if (destination) { payload.destination = destination; payload.action = action; }
      try {
        var body = JSON.stringify(payload);
        try {
          // Cross-origin Beacon uses credentials and cannot use this anonymous
          // collector's CORS response. Keep Beacon for the local/same-origin site.
          if (sameOrigin && win.navigator.sendBeacon && win.navigator.sendBeacon(collector, new Blob([body], { type: 'application/json' }))) return;
        } catch (_) { /* Try keepalive fetch if the beacon is rejected. */ }
        win.fetch(collector, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: body, keepalive: true, credentials: 'omit' }).catch(function () {});
      } catch (_) { /* Navigation still works when tracking is unavailable. */ }
    }
    record('page_view');
    var provider = win.PLAYBOOK_APPLE_PROVIDER_TOKEN || '';
    win.document.querySelectorAll('[data-destination]').forEach(function (link) {
      var destination = link.dataset.destination;
      link.href = buildDestination(destination, context, provider);
      link.addEventListener('click', function () { record('destination', destination, 'click'); });
      link.addEventListener('auxclick', function (event) {
        if (event.button === 1) record('destination', destination, 'click');
      });
    });
    var automatic = device === 'ios' ? 'apple' : device === 'android' ? 'google' : '';
    if (automatic) {
      var note = win.document.getElementById('redirect-note');
      if (note) note.textContent = 'Taking you to ' + (automatic === 'apple' ? 'the App Store' : 'Google Play') +
        '… If you are not redirected automatically, choose your store below.';
      win.setTimeout(function () {
        record('destination', automatic, 'automatic');
        win.location.replace(buildDestination(automatic, context, provider));
      }, 900);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getDevice: getDevice, getAttribution: getAttribution,
      buildDestination: buildDestination, campaignToken: campaignToken, start: start };
  } else if (typeof window !== 'undefined') {
    start(window);
  }
})();
