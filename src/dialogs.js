// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

'use strict';

function show_diag_alert(diag, value, noerr) {
    if (!noerr) debug(value);
    var div = diag.find('[name=alert]');
    div.empty();
    div.append($(`<label>${noerr?'Value':'Error'}</label>`));
    div.append($(`<div class="alert ${noerr?'alert-success':'alert-danger'}">`));
    div.find('.alert').append(make_value_elem(value));
    div.append($(`<div class="text-end"><button class="btn btn-outline-dark" data-bs-dismiss="modal">OK</button></div>`));
    div.find('button').first().focus();
}

async function show_fatal_error(value) {
    return new Promise(function(resolve, reject) {
        var diag = $('#fatal_error');
        show_diag_alert(diag, value, false);
        var modal = new bootstrap.Modal('#fatal_error');
        modal.show();
        diag.on('hidden.bs.modal', resolve);
    });
}

async function show_information(value, noerr) {
    return new Promise(function(resolve, reject) {
        var diag = $('#information_diag');
        show_diag_alert(diag, value, noerr);
        var modal = new bootstrap.Modal('#information_diag');
        modal.show();
        diag.on('hidden.bs.modal', resolve);
    });
}

async function show_warning(value) {
    return new Promise(function(resolve, reject) {
        var diag = $('#warning_diag');
        show_diag_alert(diag, value, true);
        var modal = new bootstrap.Modal('#warning_diag');
        modal.show();
        diag.on('hidden.bs.modal', resolve);
    });
}

function make_code_dom(code, argtypes) {
    if (code == null) return '';
    var a = $(`<a class="btn btn-outline-dark btn-xs">View</a>`);
    a.click(function() {
        var diag = $('#view_code');
        if (argtypes && Object.keys(argtypes).length > 0) {
            diag.find('[name=argtypes]').removeClass('d-none');
            diag.find('[name=argtypes] .form-control').empty();
            diag.find('[name=argtypes] .form-control').append(make_argtypes_elem(argtypes));
        }
        var editor_div = $('<div class="text-editor" id="editor">');
        diag.find('[name=editor]').empty();
        diag.find('[name=editor]').append(editor_div);
        var editor;
        diag.on('shown.bs.modal', function() {
            editor = ace.edit('editor');
            editor.setTheme('ace/theme/chrome');
            editor.setReadOnly(true);
            editor.getSession().setMode('ace/mode/javascript');
            editor.getSession().setValue(String(code));
            setTimeout(function() {
                editor.getSession().$worker.call("setOptions", [{ esversion: 5 }]);
            }, 300);
        });
        var modal = new bootstrap.Modal('#view_code');
        modal.show();
        diag.on('hidden.bs.modal', function() {
            editor.destroy();
        });
    });
    return a;
}

async function show_login_diag() {
    var diag = document.querySelector('#login_diag');
    var modal = new bootstrap.Modal(diag);
    modal.show();
    var closed = false;
    diag.addEventListener('hidden.bs.modal', () => { closed = true }, { once: true });
    var key = await api.generateWalletKey('es');
    var stringified = JSON.stringify({ version: '3.0', config: 'es', key });
    var uw = await api.parseUnlockedWalletFile(stringified);
    var code = JSON.stringify({
        ver: '1.0',
        chainID: the_chainID,
        trustee: uw.address,
        expiry: Date.now() + 24 * 3600000,
        access: { query: 'unlimited' }
    });
    var { default: QRcode } = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');
    await QRcode.toCanvas(diag.querySelector('canvas'), code);
    diag.querySelector('[name=proxy-address]').innerText = uw.address;
    diag.querySelector('canvas').onclick = e => {
        navigator.clipboard.writeText(code);
        var tooltip = bootstrap.Tooltip.getInstance(e.target) || new bootstrap.Tooltip(e.target)
        tooltip.show();
        setTimeout(() => tooltip.hide(), 1000);
    };
    while (true) {
        if (closed) return;
        await new Promise(resolve => setTimeout(resolve, 1000));
        var resp = await the_rpc.call(uw, 'c1query', { type: 'a_proxy' });
        if (resp.status === 'ok') break;
    }
    //TODO check sanity of resp.value.access
    sessionStorage.setItem('bcplus-unlocked-wallet', stringified);
    location.reload();
}

async function show_logout_diag() {
    var diag = document.querySelector('#logout_diag');
    var modal = new bootstrap.Modal(diag);
    modal.show();
    diag.querySelector('[name=ok]').onclick = () => {
        sessionStorage.removeItem('bcplus-unlocked-wallet');
        location.reload();
    };
}

// Test exports (for coverage)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        show_diag_alert,
        show_fatal_error,
        show_information,
        show_warning,
        make_code_dom,
        show_login_diag,
        show_logout_diag
    };
}
