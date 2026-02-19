// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

'use strict';

var debug = console.error;

function assert(expr) {
    if (!expr) {
        debugger;
        throw new Error('ASSERT').stack;
    }
}

function getURLParameterByName(name, url = location.href) {
    var rex = new RegExp("[?&]" + name + "(?:=([^&#]*)|&|#|$)");
    var m = rex.exec(url);
    if (!m) return;
    if (!m[1]) return '';
    return decodeURIComponent(m[1].replace(/\+/g, " "));
}

function make_value_elem(value, depth = 0) {
    if (typeof depth === 'string') {
        var e = make_value_elem(value);
        var div = $(`<div class="${depth}">`);
        div.append(e);
        return div;
    }
    if (value == null) {
        var e = $('<font color="orange">');
        e.text(String(value));
        return e;
    }
    if (typeof value === 'boolean') {
        return make_boolean_elem(value);
    }
    if (typeof value === 'string') {
        return make_string_elem(value, 'brown');
    }
    if (typeof value === 'number') {
        var e = $('<font color="blue">');
        e.text(String(value));
        return e;
    }
    if (value instanceof Error) {
        return make_string_elem(value.toString(), 'red');
    }
    if (depth > 10) {
        var e = $('<span>');
        e.text(JSON.stringify(value));
        return e;
    }
    if (Array.isArray(value)) {
        return make_array_elem(value, depth);
    }
    return make_object_elem(value, depth);
}

function make_boolean_elem(value) {
    if (value) {
        var e = $('<font color="green">');
        e.text('true');
    } else {
        var e = $('<font color="gray">');
        e.text('false');
    }
    return e;
}

function make_string_elem(value, color) {
    assert(typeof value === 'string');
    var json = JSON.stringify(value);
    if (json.length > 80) {
        json = json.substring(0, 80) + ' ...';
    }
    if (json === `"${value}"` && !/\s\s/.test(value)) {
        var e = $(`<font color="${color}"></font>`);
        e.text(json);
        return e;
    }
    return s0create();

    function s0create(s1, event) {
        if (event) event.stopPropagation();
        var s0 = $(`<div class="val_header">&#x25BA; <font color="${color}"></font></div>`);
        s0.find('font').text(json);
        s0.click(s1create.bind(null, s0));
        if (s1) s1.replaceWith(s0);
        return s0;
    }

    function s1create(s0, event) {
        if (event) event.stopPropagation();
        var s1 = $(`<div class="val_header"><span>&#x25BC;</span><pre><font color="${color}"></font></pre></div>`);
        s1.find('font').text(value);
        s1.find('span').click(s0create.bind(null, s1));
        if (s0) s0.replaceWith(s1);
        return s1;
    }
}

function make_array_elem(value, depth = 0) {
    assert(Array.isArray(value));
    var res = $('<span>');
    res.append('[ ');
    for (var i = 0; i < value.length; i++) {
        if (i > 0) res.append(', ');
        var e = make_value_elem(value[i], depth + 1);
        if (e.prop('tagName') === 'DIV') break;
        if (res.text().length + e.text().length > 80) break;
        res.append(e);
    }
    if (i < value.length) {
        res.append(' ... ');
    }
    res.append(' ]');
    if (i === value.length) {
        return res;
    }
    return s0create(0, value.length, true);

    function s0create(start, end, main) {
        var s0 = $(`<div class="val_header">&#x25BA; </div>`);
        if (main) {
            s0.append(res);
        } else {
            s0.append(`( ${start} ... ${end-1} )`);
        }
        s0.click(event => {
            event.stopPropagation();
            s0.replaceWith(s1create(start, end, main));
        });
        return s0;
    }

    function s1create(start, end, main) {
        var s1 = $('<div class="val_header">');
        var h = $(`<div class="val_header">&#x25BC; </div>`);
        s1.append(h);
        if (main) {
            h.append('[ ... ]');
        } else {
            h.append(`( ${start} ... ${end-1} )`);
        }
        for (var step = 10;; step *= 10) {
            if (end - start <= step) break;
        }
        if (step > 10) {
            var ministep = step / 10;
            for (var i = start; i < end; i += ministep) {
                var lin = $(`<div style="margin-left:10px;">`);
                lin.append(s0create(i, Math.min(i + ministep, end)));
                s1.append(lin);
            }
        } else {
            for (var i = start; i < end; i++) {
                var lin = $(`<div style="margin-left:10px;">`);
                lin.append(`${i}: `).append(make_value_elem(value[i], depth + 1));
                s1.append(lin);
            }
        }
        h.click(event => {
            event.stopPropagation();
            s1.replaceWith(s0create(start, end, main));
        });
        return s1;
    }
}

function make_prop_elem(value) {
    assert(typeof value === 'string');
    var json = JSON.stringify(value);
    if (json === `"${value}"`) {
        var e = $(`<font color="black"></font>`);
        e.text(value);
        return e;
    }
    return make_string_elem(value, 'black');
}

function make_object_elem(value, depth = 0) {
    assert(typeof value === 'object');
    var keys = Object.keys(value);
    var res = $('<span>');
    res.append('{ ');
    for (var i = 0; i < keys.length; i++) {
        if (i > 0) res.append(', ');
        var k = keys[i];
        var p = make_prop_elem(k);
        var e = make_value_elem(value[k], depth + 1);
        if (e.prop('tagName') === 'DIV') break;
        if (res.text().length + p.text().length + e.text().length > 80) break;
        res.append(p);
        res.append(': ');
        res.append(e);
    }
    if (i < keys.length) {
        res.append(' ... ');
    }
    res.append(' }');
    if (i === keys.length) {
        return res;
    }
    return s0create(0, keys.length, true);

    function s0create(start, end, main) {
        var s0 = $(`<div class="val_header">&#x25BA; </div>`);
        if (main) {
            s0.append(res);
        } else {
            s0.append(`( ${start} ... ${end-1} )`);
        }
        s0.click(event => {
            event.stopPropagation();
            s0.replaceWith(s1create(start, end, main));
        });
        return s0;
    }

    function s1create(start, end, main) {
        var s1 = $('<div class="val_header">');
        var h = $(`<div class="val_header">&#x25BC; </div>`);
        s1.append(h);
        if (main) {
            h.append('{ ... }');
        } else {
            h.append(`( ${start} ... ${end-1} )`);
        }
        for (var step = 10;; step *= 10) {
            if (end - start <= step) break;
        }
        if (step > 10) {
            var ministep = step / 10;
            for (var i = start; i < end; i += ministep) {
                var lin = $(`<div style="margin-left:10px;">`);
                lin.append(s0create(i, Math.min(i + ministep, end)));
                s1.append(lin);
            }
        } else {
            for (var i = start; i < end; i++) {
                var lin = $(`<div style="margin-left:10px;">`);
                var k = keys[i];
                lin.append(make_prop_elem(k)).append(': ').append(make_value_elem(value[k], depth + 1));
                s1.append(lin);
            }
        }
        h.click(event => {
            event.stopPropagation();
            s1.replaceWith(s0create(start, end, main));
        });
        return s1;
    }
}

function unref_id(a) {
    if (typeof a === 'string') {
        return a;
    } else if (Array.isArray(a)) {
        return String(a[0]);
    } else {
        return '';
    }
}

function make_id_elem(a, width = '') {
    if (typeof a === 'string') {
        var id = a;
    } else if (Array.isArray(a)) {
        var [id, name] = a;
    } else {
        return '';
    }
    if (id === 'self') return $(`<span class="id-tag ${width}"><font color="green">${id}</font> </span>`);
    if (typeof name === 'string' && name && name !== id) {
        if (name.split('@').includes(id)) {
            var ttl = name;
        } else {
            var ttl = `${id}(${name})`;
        }
    } else {
        var ttl = id;
    }
    if (id === 'anonymous') name = null;
    var type = api.getTypeofId(id);
    if (type && Array.isArray(a)) {
        var e = $(`<a href="?view=a_${type}&id=${id}" class="id-tag ${width}" data-bs-toggle="tooltip" data-bs-title="${ttl}">`);
    } else {
        var e = $(`<span class="id-tag ${width}" data-bs-toggle="tooltip" data-bs-title="${ttl}">`);
    }
    e.text(name || id);
    new bootstrap.Tooltip(e.get(0));
    return e;
}

function make_ids_elem(list) {
    if (!Array.isArray(list)) return '';
    if (list.includes('all') && list.length === 1) return $('<font color="green">all</font>');
    var e = $('<div class="inline">');
    var a = list.map(m => make_id_elem(m, 'id-ids'));
    a.sort((x, y) => String(x.text()).localeCompare(String(y.text())));
    a.forEach(m => e.append(m));
    return e;
}

function make_txid_elem(id, txid, width = '') {
    if (!id) return '';
    var title = id;
    if (txid) {
        var title = id + ' ' + txid;
    }
    var e = $(`<a href="?view=a_transaction&id=${id}" class="id-tag ${width}" data-bs-toggle="tooltip" data-bs-title="${title}">`);
    e.css('color', '#b51');
    e.text(title);
    new bootstrap.Tooltip(e.get(0));
    return e;
}

function make_txid_time_elem(id, time, width = '') {
    if (!id) return '';
    var e = $(`<div class="${width}">`);
    e.append('Txno.');
    e.append(make_txid_elem(id, null, 'id-ids'));
    e.append(make_date_elem(time));
    return e;
}

function make_blkno_elem(blkno, width = '') {
    if (!blkno) return '';
    var e = $(`<a href="?view=a_block&id=${blkno}" class="id-tag ${width}">`);
    e.css('color', '#b51');
    e.text(blkno);
    return e;
}

function convertTime2AgoString(ms) {
    var suffix = ' ago';
    if (ms < 0) {
        ms = -ms;
        var suffix = ' later';
    }
    if (!isFinite(ms)) return '';
    if (ms < 1000) return 'now';
    var s = Math.floor(ms / 1000);
    if (s === 1) return `1 sec ${suffix}`;
    if (s < 60) return `${s} secs ${suffix}`;
    if (s === 60) return `1 min ${suffix}`;
    if (s < 120) return `1 min ${s-60} secs ${suffix}`;
    var m = Math.floor(s / 60);
    if (m < 60) return `${m} mins ${suffix}`;
    if (m === 60) return `1 hour ${suffix}`;
    if (m < 120) return `1 hour ${m-60} mins ${suffix}`;
    var h = Math.floor(m / 60);
    if (h < 24) return `${h} hours ${suffix}`;
    if (h === 24) return `1 day ${suffix}`;
    if (h < 48) return `1 day ${h-24} hours ${suffix}`;
    var d = Math.floor(h / 24);
    return `${d} days ${suffix}`;
}

function make_ago_elem(now, then, width = '') {
    var text = 'inactive';
    if (then) {
        var text = convertTime2AgoString(now - then);
        if (!text) return '';
    }
    var e = $(`<div class="text-end ${width}" style="font-size:small;">`);
    e.text(text);
    return e;
}

function make_date_elem(time) {
    if (!(time > 0)) return '';
    var e = $('<span>');
    e.text(new Date(time).toLocaleString());
    return e;
}

function make_txno_range_elem(start, end) {
    var e = $(`<span>`);
    e.append(make_txid_elem(start));
    if (start < end) {
        e.append('-');
        e.append(make_txid_elem(end));
    }
    return e;
}

function make_text_elem(text, width = '') {
    if (!text) return '';
    var e = $(`<div class="id-tag ${width}">`);
    e.text(text);
    return e;
}

function make_status_elem(status) {
    switch (status) {
        case 'canceled':
        case 'aborted':
        case 'denied':
        case 'thrown':
        case 'error':
        case 'discord':
            var color = 'red';
            break;
        case 'ok':
            var color = 'green';
            break;
        default:
            var color = 'gray';
            break;
    }
    var e = $(`<font color="${color}">`);
    e.text(status);
    return e;
}

function make_args_elem(value, width = '') {
    assert(typeof value === 'object');
    var keys = Object.keys(value);
    var res = $(`<div class="${width}">`);
    for (var i = 0; i < keys.length; i++) {
        var lin = $(`<div>`);
        var k = keys[i];
        lin.append(make_prop_elem(k)).append(': ').append(make_value_elem(value[k], 0));
        res.append(lin);
    }
    return res;
}

function make_description_elem(description) {
    var e = $('<pre class="pre-desc">');
    e.text(description);
    return e;
}

function make_mask_elem(mask) {
    var e = '';
    if (mask) {
        if (mask.act) {
            add('disabled');
        } else {
            if (mask.sub) {
                add('inaccessible as subcontract');
            } else {
                if (mask.dlg) {
                    add('inaccessible by delegation');
                }
                if (mask.rec) {
                    add('nonrecording');
                }
            }
        }
    }
    return $(e);

    function add(m) {
        if (e) e += `<font color="black" style="margin-right:10px">,</font>`;
        e += `<font color="red">${m}</font>`;
    }
}

function make_argtypes_elem(argtypes) {
    if (!argtypes || typeof argtypes !== 'object') return '';

    function color(name) {
        var type = argtypes[name];
        if (typeof type === 'string' && type.endsWith('-array')) {
            var type = type.slice(0, type.lastIndexOf('-array'));
        }
        switch (type) {
            case 'number':
            case 'integer':
                return 'blue';
            case 'string':
                return 'brown';
            case 'boolean':
                return 'orange';
            case 'address':
            case 'id':
                return 'violet';
            case 'json':
            case 'any':
                return 'darkcyan';
            default:
                return 'gray';
        }
    }
    var e = $('<div class="inline">');
    Object.keys(argtypes).forEach(name => {
        var f = $(`<span class="id-tag id-ids"><font color="${color(name)}" data-bs-toggle="tooltip" data-bs-title="${argtypes[name]}"></font></span>`);
        f.find('font').text(name);
        e.append(f);
        new bootstrap.Tooltip(f.find('font').get(0));
    });
    return e;
}

function navigation(url) {
    if (typeof location !== 'undefined' && location.href !== undefined) {
        location.href = url;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        assert,
        getURLParameterByName,
        make_value_elem,
        make_boolean_elem,
        make_string_elem,
        make_array_elem,
        make_prop_elem,
        make_object_elem,
        unref_id,
        make_id_elem,
        make_ids_elem,
        make_txid_elem,
        make_txid_time_elem,
        make_blkno_elem,
        convertTime2AgoString,
        make_ago_elem,
        make_date_elem,
        make_txno_range_elem,
        make_text_elem,
        make_status_elem,
        make_args_elem,
        make_description_elem,
        make_mask_elem,
        make_argtypes_elem,
        navigation
    };
}
