popupsOpen = 0

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	switch(message) {
		case 'rorsl background refresh settings':
			chrome.storage.local.get('settingsSync').then(value => {
				if (value.settingsSync != false) {
					if (popupsOpen > 0) {
						// Send update to popups
						chrome.runtime.sendMessage('rorsl refresh settings');
					}
					// Send update to all tabs
					chrome.tabs.query({}, function(tabs) {
						tabs.forEach(function(tab) {
							if (tab.url != undefined && tab.url.includes('.roblox.com/') && tab.url.includes('/games/')) {
								chrome.tabs.sendMessage(tab.id, 'rorsl refresh settings');
							}
						});
					});
				}
			});
			break;
		case 'rorsl open advanced settings':
			chrome.tabs.query({ active: true, currentWindow: true}, tabs => {
				let index = tabs[0].index;
				chrome.tabs.create({url: chrome.runtime.getURL('html/advanced-settings.html'), index: index + 1});
			  }
			);
			break;
	}
});

chrome.runtime.onConnect.addListener(function(port) {
	if (port.name === 'rorsl-popup') {
		popupsOpen += 1
		port.onDisconnect.addListener(function() {
			popupsOpen -= 1
		});
	}
});