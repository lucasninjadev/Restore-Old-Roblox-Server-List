// Chrome storage 'descending' actually is "ascending," but is called descending because I am really stupid and mixed the two up a while ago.

async function sendSettingsRefresh() {
	browser.runtime.sendMessage('rorsl background refresh settings');
}

function loadSettings() {
  browser.storage.local.get("autoAttach").then((value) => {
    if (!value.autoAttach) {
      browser.storage.local.set({ autoAttach: false });
      $("#autoAttach").prop("checked", false);
    } else {
      $("#autoAttach").prop("checked", value.autoAttach);
    }
  });
  
  browser.storage.local.get("fastSearch").then((value) => {
    if (!value.fastSearch) {
      browser.storage.local.set({ fastSearch: false });
      $("#fastSearch").prop("checked", false);
    } else {
      $("#fastSearch").prop("checked", value.fastSearch);
    }
  });

  browser.storage.local.get("listSize").then((value) => {
    if (!value.listSize || value.listSize < 1 || value.listSize > 250) {
      browser.storage.local.set({ listSize: 10 });
      $("#listSize").val(10);
    } else {
      $("#listSize").val(value.listSize);
    }
  });

  browser.storage.local.get("descending").then((value) => {
    if (!value.descending) {
      browser.storage.local.set({ descending: false });
      $("#descending").prop("checked", false);
    } else {
      $("#descending").prop("checked", value.descending);
    }
  });

  browser.storage.local.get("username").then((value) => {
    if (value.username == undefined) {
      browser.storage.local.set({ username: "Roblox" });
      $("#username").val("Roblox");
    } else {
      $("#username").val(value.username);
    }
  });
}

$(function () {
  loadSettings();
	$("#autoAttach").change(function () {
    browser.storage.local.set({ autoAttach: this.checked });
    sendSettingsRefresh();
  });
  
	$("#fastSearch").change(function () {
    browser.storage.local.set({ fastSearch: this.checked });
    sendSettingsRefresh();
  });

  $("#listSize").on("input", function () {
    var size = $("#listSize").val();
    size = size.replace(/[e\+\-]/gi, "");
    $("#listSize").val(size);
    if (size && size > 0 && size < 251) {
      browser.storage.local.set({ listSize: size });
    } else if (size < 1) {
      browser.storage.local.set({ listSize: 1 });
      $('#listSize').val(1);
    } else if (size > 250) {
      browser.storage.local.set({ listSize: 250 });
      $('#listSize').val(250);
    }
    sendSettingsRefresh();
  });

  $("#descending").change(function () {
    browser.storage.local.set({ descending: this.checked });
    sendSettingsRefresh();
  });

  $("#username").on("input", function () {
    var username = $("#username").val();
    username = username.replace(/[\W ]+/g, "");
    $("#username").val(username);
    if (username != undefined) {
      browser.storage.local.set({ username: username });
    }
    sendSettingsRefresh();
  });
});

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request == "rorsl refresh settings") loadSettings();
});

browser.runtime.connect({ name: "popup" });