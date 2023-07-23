async function sendSettingsRefresh() {
	chrome.runtime.sendMessage('rorsl background refresh settings');
}

function loadSettings() {
  chrome.storage.local.get("autoAttach").then((value) => {
    if (!value.autoAttach) {
      chrome.storage.local.set({ autoAttach: false });
      $("#autoAttach").prop("checked", false);
    } else {
      $("#autoAttach").prop("checked", value.autoAttach);
    }
  });

  chrome.storage.local.get("listSize").then((value) => {
    if (!value.listSize || value.listSize < 1 || value.listSize > 250) {
      chrome.storage.local.set({ listSize: 10 });
      $("#listSize").val(10);
    } else {
      $("#listSize").val(value.listSize);
    }
  });

  chrome.storage.local.get("descending").then((value) => {
    if (!value.descending) {
      chrome.storage.local.set({ descending: false });
      $("#descending").prop("checked", false);
    } else {
      $("#descending").prop("checked", value.descending);
    }
  });

  chrome.storage.local.get("username").then((value) => {
    if (value.username == undefined) {
      chrome.storage.local.set({ username: "Roblox" });
      $("#username").val("Roblox");
    } else {
      $("#username").val(value.username);
    }
  });
}

$(function () {
  loadSettings();
	$("#autoAttach").change(function () {
    chrome.storage.local.set({ autoAttach: this.checked });
    sendSettingsRefresh();
  });

  $("#listSize").on("input", function () {
    var size = $("#listSize").val();
    size = size.replace(/[e\+\-]/gi, "");
    $("#listSize").val(size);
    if (size && size > 0 && size < 251) {
      chrome.storage.local.set({ listSize: size });
    } else if (size < 1) {
      chrome.storage.local.set({ listSize: 1 });
      $('#listSize').val(1);
    } else if (size > 250) {
      chrome.storage.local.set({ listSize: 250 });
      $('#listSize').val(250);
    }
    sendSettingsRefresh();
  });

  $("#descending").change(function () {
    chrome.storage.local.set({ descending: this.checked });
    sendSettingsRefresh();
  });

  $("#username").on("input", function () {
    var username = $("#username").val();
    username = username.replace(/[\W ]+/g, "");
    $("#username").val(username);
    if (username != undefined) {
      chrome.storage.local.set({ username: username });
    }
    sendSettingsRefresh();
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request == "rorsl refresh settings") loadSettings();
});

chrome.runtime.connect({ name: "popup" });