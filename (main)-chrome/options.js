$(function(){
    chrome.storage.sync.get('autoAttach').then(value => {
        if (!value.autoAttach) {
            chrome.storage.sync.set({'autoAttach': false});
            $('#autoAttach').prop('checked', false)
        } else {
        $('#autoAttach').prop('checked', value.autoAttach);
        }
    })

    chrome.storage.sync.get('listSize').then(value => {
        if (!value.listSize) {
            chrome.storage.sync.set({'listSize': 10});
            $('#listSize').val(10);
        } else {
        $('#listSize').val(value.listSize);
        }
    })

    chrome.storage.sync.get('descending').then(value => {
        if (!value.descending) {
            chrome.storage.sync.set({'descending': false});
            $('#descending').prop('checked', false)
        } else {
        $('#descending').prop('checked', value.descending);
        }
    })

    chrome.storage.sync.get('userID').then(value => {
        if (!value.userID) {
            chrome.storage.sync.set({'userID': 1});
            $('#userID').val(1);
        } else {
        $('#userID').val(value.userID);
        }
    })

    $('#autoAttach').change(function() {
        if (this.checked) {
            chrome.storage.sync.set({'autoAttach': true});
        } else {
            chrome.storage.sync.set({'autoAttach': false});
        }
    });

    $('#listSize').on('input', function() {
        var size = $('#listSize').val();
        size = size.replace(/[e\+\-]/gi, "")
        $('#listSize').val(size);
        if (size){
            chrome.storage.sync.set({'listSize': size});
        }
    });

    $('#descending').change(function() {
        if (this.checked) {
            chrome.storage.sync.set({'descending': true});
        } else {
            chrome.storage.sync.set({'descending': false});
        }
    });

    $('#userID').on('input', function() {
        var id = $('#userID').val();
        id = id.replace(/[e\+\-]/gi, "")
        $('#userID').val(id);
        if (id){
            chrome.storage.sync.set({'userID': id});
        }
    });
});