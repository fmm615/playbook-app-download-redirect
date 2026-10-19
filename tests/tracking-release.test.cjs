const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function openRelease(userAgent) {
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const requests = [], timers = [], navigations = [];
  const links = ['apple', 'google', 'web'].map(destination => ({
    dataset: { destination }, addEventListener() {},
  }));
  const win = {
    location: {
      hostname: 'download.get-playbook.com',
      href: 'https://download.get-playbook.com/?utm_source=instagram&utm_medium=social&utm_content=pb_1f4666a404b6',
      replace: value => navigations.push(value),
    },
    navigator: { userAgent, maxTouchPoints: 0 },
    document: { referrer: '', querySelectorAll: () => links, getElementById: () => ({ textContent: '' }) },
    sessionStorage: { getItem: () => null, setItem() {} },
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
    fetch: (url, options) => { requests.push({ url, options, event: JSON.parse(options.body) }); return Promise.resolve(); },
  };
  const context = vm.createContext({ window: win, URL, URLSearchParams, Blob });
  for (const [, source] of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)) {
    vm.runInContext(fs.readFileSync(path.join(root, source), 'utf8'), context, { filename: source });
  }
  return { requests, timers, navigations, links };
}

test('opening the published Instagram URL sends its visit to the hosted collector', () => {
  const browser = openRelease('Mozilla/5.0 Macintosh Chrome/130.0');
  assert.equal(browser.requests.length, 1);
  const request = browser.requests[0];
  assert.equal(request.url, 'https://playbook-download-insights.vercel.app/api/events');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.keepalive, true);
  assert.equal(request.event.kind, 'page_view');
  assert.equal(request.event.source, 'instagram');
  assert.equal(request.event.medium, 'social');
  assert.equal(request.event.content, 'pb_1f4666a404b6');
  assert.equal(browser.timers.length, 0);
});

test('iPhone visits record the store handoff and keep Apple campaign attribution', () => {
  const browser = openRelease('Mozilla/5.0 iPhone Safari/604.1');
  assert.equal(browser.requests.length, 1);
  assert.equal(browser.timers[0].delay, 900);
  browser.timers[0].callback();
  assert.equal(browser.requests[1].event.destination, 'apple');
  assert.equal(browser.requests[1].event.action, 'automatic');
  const store = new URL(browser.navigations[0]);
  assert.equal(store.hostname, 'apps.apple.com');
  assert.equal(store.searchParams.get('pt'), '124917520');
  assert.equal(store.searchParams.get('ct'), 'instagram_pb_1f4666a404b6');
});

test('Android visits record the store handoff and preserve the Google install referrer', () => {
  const browser = openRelease('Mozilla/5.0 Android Chrome/130.0');
  assert.equal(browser.requests.length, 1);
  assert.equal(browser.timers[0].delay, 900);
  browser.timers[0].callback();
  assert.equal(browser.requests[1].event.destination, 'google');
  const store = new URL(browser.navigations[0]);
  assert.equal(store.searchParams.get('id'), 'com.mightybell.playbook');
  const referrer = new URLSearchParams(store.searchParams.get('referrer'));
  assert.equal(referrer.get('utm_source'), 'instagram');
  assert.equal(referrer.get('utm_content'), 'pb_1f4666a404b6');
});
