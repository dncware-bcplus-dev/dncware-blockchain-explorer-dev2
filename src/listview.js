// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

'use strict';

$(document).ready(function() {
    $(document).bind('mousewheel', e => {
        if (e.originalEvent.wheelDelta > 0 || e.originalEvent.deltaY < 0) {
            scroll_too_up_event();
        } else {
            scroll_too_down_event();
        }
    });

    var touchstart_y;
    $(document).on('touchstart', e => {
        touchstart_y = e.touches[0].pageY;
    });
    $(document).on('touchmove', e => {
        var y = e.touches[0].pageY;
        if (touchstart_y < y) {
            scroll_too_up_event();
        } else {
            scroll_too_down_event();
        }
    });
});

function scroll_too_up_event() {
    var h = window.scrollY;
    if (h > 0) return;
    scroll_too_up_trigger();
}

function scroll_too_down_event() {
    var h = document.body.offsetHeight - window.innerHeight - window.scrollY;
    if (h > 0.5) return;
    scroll_too_down_trigger();
}

var scroll_too_up_trigger = () => 0;
var scroll_too_down_trigger = () => 0;

async function show_list_loop(cnt, dir, func, res) {
    var { more, more_date } = res;
    var view_more = cnt.find(`[name=view_more_${dir}]`);
    while (more) {
        if (more_date) {
            view_more.text(`View ${dir} `).append(make_date_elem(more_date));
        } else {
            view_more.text('View More');
        }
        view_more.removeClass('d-none');
        await new Promise(function(resolve, reject) {
            view_more.on('click', resolve);
            if (dir === 'after') {
                scroll_too_up_trigger = resolve;
            } else {
                scroll_too_down_trigger = resolve;
            }
        });
        view_more.off('click');
        view_more.empty();
        view_more.append($('<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>'));
        var scrollTop = $(window).scrollTop();
        var { more, more_date, height } = await func(more);
        if (dir === 'after') {
            $(window).scrollTop(scrollTop + height);
        }
    }
    view_more.addClass('d-none');
}

async function show_list_newer(cnt, func, end_func, prev_end) {
    var view_more = cnt.find(`[name=view_more_after]`);
    var slp = false;
    while (true) {
        if ($(window).scrollTop() >= $('#the_navbar').height()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }
        try {
            var end = await end_func();
        } catch (err) {
            console.log(err);
            var end = prev_end;
        }
        if (end === prev_end) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            slp = true;
            continue;
        }
        view_more.removeClass('d-none');
        view_more.empty();
        view_more.append($('<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>'));
        if (slp) await new Promise(resolve => setTimeout(resolve, 500));
        slp = false;
        try {
            var res = await func(prev_end);
        } catch (err) {
            console.log(err);
            var res = {};
        }
        view_more.addClass('d-none');
        var { more } = res;
        var prev_end = more || end;
    }
}

function show_constraints(type, cnt) {
    var val = getURLParameterByName(type);
    if (!val) return;
    cnt.find(`[name=${type}]`).text(val);
    cnt.find(`[name=${type}]`).removeClass('d-none');
    switch (type) {
        case 'date':
            if (+val > 0) return +val;
            var date = new Date(val).getTime();
            if (!date) throw 'invalid date format';
            return date;
        case 'txno':
            if (+val > 0) return +val;
            throw 'invalid txno format';
    }
    return val;
}

async function show_transactions(details) {
    if (details) details = ['caller_txno', 'argstr', 'valuestr', 'subtxs', 'blkno'];
    if (details) {
        var cnt = $('#transactions_list_detail');
        cnt.find('button').on('click', () => {
            navigation(location.href.replace("view=transactions_details", "view=transactions"));
        });
    } else {
        var cnt = $('#transactions_list');
        cnt.find('button').on('click', () => {
            navigation(location.href.replace("view=transactions", "view=transactions_details"));
        });
    }
    cnt.removeClass('d-none');
    var tbody = cnt.find('tbody');
    var thead_last = cnt.find('thead:last');
    var tfoot_first = cnt.find('tfoot:first');
    var user = show_constraints('user', cnt);
    var contract = show_constraints('contract', cnt);
    var caller = show_constraints('caller', cnt);
    var callee = show_constraints('callee', cnt);
    var related_to = show_constraints('related_to', cnt);
    var status = show_constraints('status', cnt);
    var date0 = new Date(show_constraints('date', cnt)).getTime() || undefined;
    var txno0 = Number(show_constraints('txno', cnt)) || undefined;
    var appeared = new Set();

    function make_tr(e) {
        if (appeared.has(e.txno)) return;
        appeared.add(e.txno);
        var tr = $('<tr>');
        tr.append($('<td>').append(make_txid_elem(e.txno)));
        tr.append($('<td>').append(make_id_elem(e.caller, 'id-lst-long2')));
        tr.append($('<td>').append(make_id_elem(e.callee, 'id-lst-long2')));
        tr.append($('<td>').append(make_status_elem(e.status)));
        tr.append($('<td>').append(make_date_elem(e.time)));
        tr.on('click', () => navigation(`?view=a_transaction&id=${e.txno}`));
        return tr;
    }

    function make_tr_details(e) {
        var tr = $(`<tr style="border-bottom: 2px solid;">`);
        var args = JSON.parse(e.argstr);
        var value = JSON.parse(e.valuestr);
        tr.append($('<td>'));
        tr.append($('<td>').append(make_args_elem(args, 'id-lst-long2 overflow-wrap-break-word')));
        tr.append($('<td>').append(make_value_elem(value, 'id-lst-long2 overflow-wrap-break-word')));
        tr.append($('<td>').append(make_txid_elem(e.caller_txno)));
        tr.append($('<td>').append(e.blkno));
        tr.on('click', () => navigation(`?view=a_transaction&id=${e.txno}`));
        return tr;
    }

    async function show_list_after(txno, date, limit = the_list_pagesize) {
        var res = await call_query({ type: 'transactions', user, contract, caller, callee, related_to, status, after_date: date, after_txno: txno, details, limit, reverse: 1 });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        var trs = [];
        list.forEach(e => {
            var tr = make_tr(e);
            if (!tr) return;
            if (!details) {
                tbody.prepend(tr);
                trs.push(tr);
            } else {
                var trd = make_tr_details(e);
                var tr2 = $('<tbody>');
                tr2.append(tr);
                tr2.append(trd);
                thead_last.after(tr2);
                trs.push(tr2);
            }
            if (e.txno === txno0 || e.time === date0) {
                tr.find('td').css('cssText', 'background-color: #fed8b1 !important');
                if (trd) trd.find('td').css('cssText', 'background-color: #fed8b1 !important');
                center_tr = tr;
            }
            if (!center_tr) center_tr = tr;
        });
        res.height = trs.reduce((acc, tr) => acc + tr.outerHeight(), 0);
        return res;
    }

    async function show_list_before(txno, date, limit = the_list_pagesize) {
        var res = await call_query({ type: 'transactions', user, contract, caller, callee, related_to, status, before_date: date, before_txno: txno, details, limit });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        list.forEach(e => {
            var tr = make_tr(e);
            if (!tr) return;
            if (!details) {
                tbody.append(tr);
            } else {
                var trd = make_tr_details(e);
                var tr2 = $('<tbody>');
                tr2.append(tr);
                tr2.append(trd);
                tfoot_first.before(tr2);
            }
            if (e.txno === txno0 || e.time === date0) {
                tr.find('td').css('cssText', 'background-color: #fed8b1 !important');
                if (trd) trd.find('td').css('cssText', 'background-color: #fed8b1 !important');
                center_tr = tr;
            }
            if (!center_tr) center_tr = tr;
        });
        return res;
    }

    async function get_end_txno() {
        return (await the_rpc.fetchTxHash(0)).txno + 1;
    }

    if (!txno0 && !date0) {
        var b = await get_end_txno();
        var p = show_list_newer(cnt, show_list_after, get_end_txno, b);
        var res = await show_list_before(b);
        return Promise.all([
            show_list_loop(cnt, 'before', show_list_before, res), p
        ]);
    } else {
        var limit = Math.floor((the_list_pagesize + 1) / 2);
        var center_tr;
        var resa = await Promise.all([
            show_list_after(txno0, date0, limit),
            show_list_before(txno0, date0, limit),
        ]);
        if (center_tr) {
            $('html,body').animate({
                scrollTop: center_tr.offset().top - 300
            });
        }
        return Promise.all([
            show_list_loop(cnt, 'after', show_list_after, resa[0]),
            show_list_loop(cnt, 'before', show_list_before, resa[1]),
        ]);
    }
}

async function show_users() {
    var cnt = $('#users_list');
    cnt.removeClass('d-none');
    var tbody = cnt.find('tbody');
    var callee = show_constraints('callee', cnt);
    var domain = show_constraints('domain', cnt);
    var activesort = getURLParameterByName('activesort') ? 1 : undefined;
    var appeared = new Set();

    function make_tr(e) {
        var id = unref_id(e.id);
        if (appeared.has(id)) return;
        appeared.add(id);
        var tr = $('<tr>');
        tr.append($('<td>').append(make_id_elem(e.id, 'id-lst-long')));
        tr.append($('<td>').append(id));
        tr.append($('<td>').append(e.domain));
        tr.append($('<td>').append(make_date_elem(e.last_active)));
        tr.append($('<td>').append(make_date_elem(e.created_at)));
        tbody.append(tr);
        tr.on('click', () => navigation(`?view=a_user&id=${id}`));
        return tr;
    }

    async function show_list(txno) {
        var res = await call_query({ type: 'users', callee, domain, activesort, before_txno: txno, limit: the_list_pagesize });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        list.forEach(e => {
            var tr = make_tr(e);
            if (tr) {
                tbody.append(tr);
            }
        });
        return res;
    }

    var res = await show_list();
    return show_list_loop(cnt, 'before', show_list, res);
}

async function show_contracts() {
    var cnt = $('#contracts_list');
    cnt.removeClass('d-none');
    var tbody = cnt.find('tbody');
    var caller = show_constraints('caller', cnt);
    var domain = show_constraints('domain', cnt);
    var activesort = getURLParameterByName('activesort') ? 1 : undefined;
    var appeared = new Set();

    function make_tr(e) {
        var id = unref_id(e.id);
        if (appeared.has(id)) return;
        appeared.add(id);
        var tr = $('<tr>');
        tr.append($('<td>').append(make_id_elem(e.id, 'id-lst-long')));
        tr.append($('<td>').append(id));
        tr.append($('<td>').append(e.domain));
        tr.append($('<td>').append(make_date_elem(e.last_active)));
        tr.append($('<td>').append(make_date_elem(e.created_at)));
        tbody.append(tr);
        tr.on('click', () => navigation(`?view=a_contract&id=${id}`));
        return tr;
    }

    async function show_list(txno) {
        var res = await call_query({ type: 'contracts', caller, domain, activesort, before_txno: txno, limit: the_list_pagesize });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        list.forEach(e => {
            var tr = make_tr(e);
            if (tr) {
                tbody.append(tr);
            }
        });
        return res;
    }

    var res = await show_list();
    return show_list_loop(cnt, 'before', show_list, res);
}

async function show_groups() {
    var cnt = $('#groups_list');
    cnt.removeClass('d-none');
    var tbody = cnt.find('tbody');
    var domain = show_constraints('domain', cnt);
    var appeared = new Set();

    function make_tr(e) {
        var id = unref_id(e.id);
        if (appeared.has(id)) return;
        appeared.add(id);
        var tr = $('<tr>');
        tr.append($('<td>').append(make_id_elem(e.id, 'id-lst-long')));
        tr.append($('<td>').append(id));
        tr.append($('<td>').append(e.domain));
        tr.append($('<td>').append(make_date_elem(e.created_at)));
        tbody.append(tr);
        tr.on('click', () => navigation(`?view=a_group&id=${id}`));
        return tr;
    }

    async function show_list(txno) {
        var res = await call_query({ type: 'groups', domain, before_txno: txno, limit: the_list_pagesize });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        list.forEach(e => {
            var tr = make_tr(e);
            if (tr) {
                tbody.append(tr);
            }
        });
        return res;
    }

    var res = await show_list();
    return show_list_loop(cnt, 'before', show_list, res);
}

async function show_group_members() {
    var cnt = $('#group_members_list');
    cnt.removeClass('d-none');
    var tbody = cnt.find('tbody');
    var id = show_constraints('id', cnt);
    var appeared = new Set();

    function make_tr(e) {
        var id = unref_id(e.id);
        if (appeared.has(id)) return;
        appeared.add(id);
        var tr = $('<tr>');
        tr.append($('<td>').append(make_id_elem(e.id, 'id-lst-long')));
        tr.append($('<td>').append(id));
        tr.append($('<td>').append(make_date_elem(e.created_at)));
        tbody.append(tr);
        var objtype = api.getTypeofId(id);
        if (objtype) {
            tr.on('click', () => navigation(`?view=a_${objtype}&id=${id}`));
        }
        return tr;
    }

    async function show_list(txno) {
        var res = await call_query({ type: 'group_members', id, before_txno: txno, limit: the_list_pagesize });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        list.forEach(e => {
            var tr = make_tr(e);
            if (tr) {
                tbody.append(tr);
            }
        });
        return res;
    }

    var res = await show_list();
    return show_list_loop(cnt, 'before', show_list, res);
}

async function show_super_aclgroups() {
    var cnt = $('#super_aclgroups_list');
    cnt.removeClass('d-none');
    var tbody = cnt.find('tbody');
    var id = show_constraints('id', cnt);
    var appeared = new Set();

    function make_tr(e) {
        var id = unref_id(e.id);
        if (appeared.has(id)) return;
        appeared.add(id);
        var tr = $('<tr>');
        tr.append($('<td>').append(make_id_elem(e.id, 'id-lst-long')));
        tr.append($('<td>').append(id));
        tr.append($('<td>').append(make_date_elem(e.created_at)));
        tbody.append(tr);
        var objtype = api.getTypeofId(id);
        tr.on('click', () => navigation(`?view=a_${objtype}&id=${id}`));
        return tr;
    }

    async function show_list(txno) {
        var res = await call_query({ type: 'super_aclgroups', id, before_txno: txno, limit: the_list_pagesize });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        list.forEach(e => {
            var tr = make_tr(e);
            if (tr) {
                tbody.append(tr);
            }
        });
        return res;
    }

    var res = await show_list();
    return show_list_loop(cnt, 'before', show_list, res);
}

async function show_domains() {
    var cnt = $('#domains_list');
    cnt.removeClass('d-none');
    var tbody = cnt.find('tbody');
    var domain = show_constraints('domain', cnt);
    var appeared = new Set();

    function make_tr(e) {
        var id = unref_id(e.id);
        if (appeared.has(id)) return;
        appeared.add(id);
        var tr = $('<tr>');
        tr.append($('<td>').append(make_id_elem(e.id, 'id-lst-long2')));
        tr.append($('<td>').append(id));
        tr.append($('<td>').append(make_text_elem(e.description, 'id-lst-long2 overflow-wrap-break-word')));
        tr.append($('<td>').append(make_date_elem(e.created_at)));
        tbody.append(tr);
        tr.on('click', () => navigation(`?view=a_domain&id=${id}`));
        return tr;
    }

    async function show_list(txno) {
        var res = await call_query({ type: 'domains', before_txno: txno, limit: the_list_pagesize, details: ['description'] });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        list.forEach(e => {
            var tr = make_tr(e);
            if (tr) {
                tbody.append(tr);
            }
        });
        return res;
    }

    var res = await show_list();
    return show_list_loop(cnt, 'before', show_list, res);
}

async function show_peers() {
    var cnt = $('#peers_list');
    cnt.removeClass('d-none');
    var tbody = cnt.find('tbody');
    var appeared = new Set();

    function make_tr(e) {
        var id = unref_id(e.id);
        if (appeared.has(id)) return;
        appeared.add(id);
        var tr = $('<tr>');
        tr.append($('<td>').append(make_id_elem(e.id, 'id-lst-long')));
        tr.append($('<td>').append(id));
        tr.append($('<td>').append(e.domain));
        tr.append($('<td>').append(make_boolean_elem(e.authority)));
        tr.append($('<td>').append(e.version || ''));
        tr.append($('<td>').append(e.blkseq || ''));
        tr.append($('<td>').append(make_date_elem(e.time)));
        tbody.append(tr);
        tr.on('click', () => navigation(`?view=a_peer&id=${id}`));
        return tr;
    }

    async function show_list(txno) {
        var res = await call_transaction('c1query', { type: 'peers', before_txno: txno, limit: the_list_pagesize, details: ['authority', 'version'] }, { BFT: 0 });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        list.forEach(e => {
            var tr = make_tr(e);
            if (tr) {
                tbody.append(tr);
            }
        });
        return res;
    }

    var res = await show_list();
    return show_list_loop(cnt, 'before', show_list, res);
}

async function show_blocks() {
    var cnt = $('#blocks_list');
    cnt.removeClass('d-none');
    var tbody = cnt.find('tbody');
    var date = new Date(show_constraints('date', cnt)).getTime() || undefined;
    var blkno = Number(show_constraints('blkno', cnt)) || undefined;
    var txno = Number(show_constraints('txno', cnt)) || undefined;
    var appeared = new Set();
    var details = ['hash64'];

    function make_tr(e) {
        if (appeared.has(e.blkno)) return;
        appeared.add(e.blkno);
        var tr = $('<tr>');
        tr.append($('<td>').append(make_blkno_elem(e.blkno)));
        tr.append($('<td>').append(make_txno_range_elem(e.start_txno, e.end_txno)));
        tr.append($('<td>').append(make_text_elem(e.hash64, 'id-tag id-lst-long')));
        tr.append($('<td>').append(make_date_elem(e.time)));
        if (e.blkno === blkno || e.time === date || e.start_txno <= txno && txno <= e.end_txno) {
            tr.find('td').css('cssText', 'background-color: #fed8b1 !important');
            center_tr = tr;
        }
        if (!center_tr) center_tr = tr;
        tr.on('click', () => navigation(`?view=a_block&id=${e.blkno}`));
        return tr;
    }

    async function show_list_after(blkno, txno, date, limit = the_list_pagesize) {
        var res = await call_query({ type: 'blocks', after_blkno: blkno, after_date: date, after_txno: txno, details, limit, reverse: 1 });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        var trs = [];
        list.forEach(e => {
            var tr = make_tr(e);
            if (tr) {
                tbody.prepend(tr);
                trs.push(tr);
            }
        });
        res.height = trs.reduce((acc, tr) => acc + tr.outerHeight(), 0);
        return res;
    }

    async function show_list_before(blkno, txno, date, limit = the_list_pagesize) {
        var res = await call_query({ type: 'blocks', before_blkno: blkno, before_date: date, before_txno: txno, details, limit });
        cnt.find('table').removeClass('d-none');
        var { list } = res;
        list.forEach(e => {
            var tr = make_tr(e);
            if (tr) {
                tbody.append(tr);
            }
        });
        return res;
    }

    async function get_end_blkno() {
        return (await get_lastblockref()).blkno + 1;
    }

    if (!blkno && !txno && !date) {
        var b = await get_end_blkno();
        var p = show_list_newer(cnt, show_list_after, get_end_blkno, b);
        var res = await show_list_before(b);
        return Promise.all([
            show_list_loop(cnt, 'before', show_list_before, res), p
        ]);
    } else {
        var limit = Math.floor((the_list_pagesize + 1) / 2);
        var center_tr;
        var resa = await Promise.all([
            show_list_after(blkno, txno, date, limit),
            show_list_before(blkno, txno, date, limit),
        ]);
        if (center_tr) {
            $('html,body').animate({
                scrollTop: center_tr.offset().top - 300
            });
        }
        return Promise.all([
            show_list_loop(cnt, 'after', show_list_after, resa[0]),
            show_list_loop(cnt, 'before', show_list_before, resa[1]),
        ]);
    }
}

async function show_search_results(key) {
    var cnt = $('#search_results');
    cnt.find('[name=for] span').text(key);
    cnt.removeClass('d-none');
    var tbody = cnt.find('tbody');

    var list = await call_query({ type: 'search', key, limit: the_list_pagesize });
    if (!list.length) {
        cnt.find('[name=not_found]').removeClass('d-none');
        return;
    }
    cnt.find('table').removeClass('d-none');
    list.forEach(e => {
        switch (e.type) {
            case 'transaction':
                var id = make_txid_elem(e.id);
                break;
            case 'block':
                var id = make_blkno_elem(e.id);
                break;
            default:
                var id = e.id;
                var name = make_id_elem([e.id, e.name]);
                break;
        }
        var tr = $('<tr>');
        tr.append($('<td>').append(id));
        tr.append($('<td>').append(e.type));
        tr.append($('<td>').append(name));
        tbody.append(tr);
    });
}

// Export functions for testing
if (typeof global !== 'undefined') {
    global.scroll_too_up_event = scroll_too_up_event;
    global.scroll_too_down_event = scroll_too_down_event;
    global.scroll_too_up_trigger = scroll_too_up_trigger;
    global.scroll_too_down_trigger = scroll_too_down_trigger;
    global.show_list_loop = show_list_loop;
    global.show_constraints = show_constraints;
    global.show_transactions = show_transactions;
    global.show_users = show_users;
    global.show_contracts = show_contracts;
    global.show_groups = show_groups;
    global.show_group_members = show_group_members;
    global.show_super_aclgroups = show_super_aclgroups;
    global.show_domains = show_domains;
    global.show_peers = show_peers;
    global.show_blocks = show_blocks;
    global.show_search_results = show_search_results;
    global.show_list_newer = show_list_newer;
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        scroll_too_up_event,
        scroll_too_down_event,
        show_list_loop,
        show_list_newer,
        show_constraints,
        show_transactions,
        show_users,
        show_contracts,
        show_groups,
        show_group_members,
        show_super_aclgroups,
        show_domains,
        show_peers,
        show_blocks,
        show_search_results
    };
}
