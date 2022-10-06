$(function(){
    browser.storage.sync.get('autoAttach').then(value => {
        if (!value.autoAttach) {
            browser.storage.sync.set({'autoAttach': false});
            $('#autoAttach').prop('checked', false)
        } else {
        $('#autoAttach').prop('checked', value.autoAttach);
        }
    })

    browser.storage.sync.get('listSize').then(value => {
        if (!value.listSize) {
            browser.storage.sync.set({'listSize': 10});
            $('#listSize').val(10);
        } else {
        $('#listSize').val(value.listSize);
        }
    })

    browser.storage.sync.get('descending').then(value => {
        if (!value.descending) {
            browser.storage.sync.set({'descending': false});
            $('#descending').prop('checked', false)
        } else {
        $('#descending').prop('checked', value.descending);
        }
    })

    browser.storage.sync.get('userID').then(value => {
        if (!value.userID) {
            browser.storage.sync.set({'userID': 1});
            $('#userID').val(1);
        } else {
        $('#userID').val(value.userID);
        }
    })

    $('#autoAttach').change(function() {
        if (this.checked) {
            browser.storage.sync.set({'autoAttach': true});
        } else {
            browser.storage.sync.set({'autoAttach': false});
        }
    });

    $('#listSize').on('input', function() {
        var size = $('#listSize').val();
        size = size.replace(/[e\+\-]/gi, "")
        $('#listSize').val(size);
        if (size){
            browser.storage.sync.set({'listSize': size});
        }
    });

    $('#descending').change(function() {
        if (this.checked) {
            browser.storage.sync.set({'descending': true});
        } else {
            browser.storage.sync.set({'descending': false});
        }
    });

    $('#userID').on('input', function() {
        var id = $('#userID').val();
        id = id.replace(/[e\+\-]/gi, "")
        $('#userID').val(id);
        if (id){
            browser.storage.sync.set({'userID': id});
        }
    });
});