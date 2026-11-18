// Apply before the stylesheet loads so a saved dark theme never flashes white.
(() => {
  const key = 'slitherlink:v1:theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference;
  try { preference = localStorage.getItem(key); } catch { /* System theme still works. */ }
  if (!['light', 'dark'].includes(preference)) preference = null;

  function apply() {
    const dark = preference ? preference === 'dark' : system.matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#171e1b' : '#f6f5ef';
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
      button.title = dark ? '라이트 모드로 전환' : '다크 모드로 전환';
      button.firstElementChild.textContent = dark ? '☀' : '☾';
    }
  }

  apply();
  system.addEventListener('change', () => { if (!preference) apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = ['light', 'dark'].includes(event.newValue) ? event.newValue : null;
    apply();
  });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.getElementById('theme-toggle').addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch { /* Keep the current session usable. */ }
      apply();
    });
  });
})();
