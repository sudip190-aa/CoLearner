// Runs before the app and styles load, preventing a light flash on dark pages.
;(function () {
  let preference
  try {
    preference = localStorage.getItem('colearn:theme')
  } catch {
    /* Private browsing. */
  }
  const dark =
    preference === 'dark' ||
    (preference !== 'light' &&
      matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
})()
