$(function () {
  browser.storage.local.get('settingsSync').then((value) => {
    if (!value.settingsSync) {
      browser.storage.local.set({ settingsSync: true });
      $('#settingsSync').prop('checked', true);
    } else {
      $('#settingsSync').prop('checked', value.settingsSync);
    }
  });

  browser.storage.local.get('searchPasses').then((value) => {
    if (!value.searchPasses || value.searchPasses < 1) {
      browser.storage.local.set({ searchPasses: 1 });
      $('#searchPasses').val(1);
    } else {
      $('#searchPasses').val(value.searchPasses);
    }
  });

	$('#settingsSync').change(function () {
    browser.storage.local.set({ settingsSync: this.checked });
  });

  $('#searchPasses').on('input', function () {
    var size = $('#searchPasses').val();
    size = size.replace(/[e\+\-]/gi, '');
    $('#searchPasses').val(size);
    if (size && size > 0 && size < 11) {
      browser.storage.local.set({ searchPasses: size });
    } else if (size > 10) {
      browser.storage.local.set({ searchPasses: 10 });
      $('#searchPasses').val(10);
    } else if (size < 1) {
      browser.storage.local.set({ searchPasses: 1 });
      $('#searchPasses').val(1);
    }
  });
});

document.querySelector("#searchPasses").addEventListener("keypress", function (evt) {
  if (evt.which != 8 && evt.which != 0 && evt.which < 48 || evt.which > 57)
  {
      evt.preventDefault();
  }
});