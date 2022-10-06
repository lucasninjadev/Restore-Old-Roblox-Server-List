browser.tabs.onUpdated.addListener((tabId, changeInfo, { url }) => {
  if (changeInfo.status !== 'complete' || !/https:\/\/.+roblox.com\/games/g.test(url)) return;

  const target = { tabId };

  // Checks if the panel is already injected into the DOM, and if not execute our scripts. (not perfect)
  browser.scripting.executeScript({ target, func: () => Boolean(document.getElementById('rsbx-panel')) }, async ([{ result }]) => {
    if (result) return;

    await browser.scripting.insertCSS({ target, files: ['styles.css'] });

    await browser.scripting.executeScript({ target, files: ['load.js'] });
    browser.scripting.executeScript({ target, files: ['content.js'] });
  });
});

const func = (place, id) => window.Roblox.GameLauncher.joinGameInstance(place, id);
browser.runtime.onMessage.addListener(({ message }, { tab }) => browser.scripting.executeScript(
  {
    target: { tabId: tab.id }, func, args: [message.place, message.id], world: 'MAIN',
  },
));
