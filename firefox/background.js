popupsOpen = 0

browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	switch(message) {
		case 'rorsl background refresh settings':
			browser.storage.local.get('settingsSync').then(value => {
				if (value.settingsSync != false) {
					if (popupsOpen > 0) {
						// Send update to popups
						browser.runtime.sendMessage('rorsl refresh settings');
					}
					// Send update to all tabs
					browser.tabs.query({}, function(tabs) {
						tabs.forEach(function(tab) {
							if (tab.url != undefined && tab.url.includes('.roblox.com/') && tab.url.includes('/games/')) {
								browser.tabs.sendMessage(tab.id, 'rorsl refresh settings');
							}
						});
					});
				}
			});
			break;
		case 'rorsl open advanced settings':
			browser.tabs.query({ active: true, currentWindow: true}, tabs => {
				let index = tabs[0].index;
				browser.tabs.create({url: browser.runtime.getURL('html/advanced-settings.html'), index: index + 1});
			  }
			);
			break;
	}
});

browser.runtime.onConnect.addListener(function(port) {
	if (port.name === 'rorsl-popup') {
		popupsOpen += 1
		port.onDisconnect.addListener(function() {
			popupsOpen -= 1
		});
	}
});