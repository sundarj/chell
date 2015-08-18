chrome.contextMenus.create({
	title: "Open chell in new tab",
	contexts: ["browser_action"],
	onclick: function () {
		chrome.tabs.create({
			url: chrome.extension.getURL('body.html')
		})
	}
});