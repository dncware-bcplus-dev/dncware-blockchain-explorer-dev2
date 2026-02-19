// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

'use strict';

function show_recent_users(now, cnt, { callee, domain }) {
    cnt.find('[name=recent_users]').removeClass('d-none');
    cnt.find('[name=recent_users] .card-header a').click(function() {
        var href = '?view=users&activesort=1';
        if (callee) href += '&callee=' + callee;
        if (domain) href += '&domain=' + domain;
        navigation(href);
    });
    return call_query({
            type: 'users',
            activesort: 1,
            limit: the_recent_pagesize,
            callee,
            domain,
        })
        .then(function({ list }) {
            var body = cnt.find('[name=recent_users] .mCSB_container');
            list.forEach(function(e, idx) {
                var ago = make_ago_elem(now, e.last_active, 'ago-rcn');
                var user = make_id_elem(e.id, 'id-rcn');
                var e = $(`<div class="panel-line${idx%2}">`);
                e.append(user).append(ago);
                body.append(e);
            });
        });
}

function show_recent_contracts(now, cnt, { caller, domain }) {
    cnt.find('[name=recent_contracts]').removeClass('d-none');
    cnt.find('[name=recent_contracts] .card-header a').click(function() {
        var href = '?view=contracts&activesort=1';
        if (caller) href += '&caller=' + caller;
        if (domain) href += '&domain=' + domain;
        navigation(href);
    });
    return call_query({
            type: 'contracts',
            activesort: 1,
            limit: the_recent_pagesize,
            caller,
            domain,
        })
        .then(function({ list }) {
            var body = cnt.find('[name=recent_contracts] .mCSB_container');
            list.forEach(function(e, idx) {
                var ago = make_ago_elem(now, e.last_active, 'ago-rcn');
                var contract = make_id_elem(e.id, 'id-rcn');
                var e = $(`<div class="panel-line${idx%2}">`);
                e.append(contract).append(ago);
                body.append(e);
            });
        });
}

function show_recent_transactions(now, cnt, { user, contract }) {
    cnt.find('[name=recent_transactions]').removeClass('d-none');
    cnt.find('[name=recent_transactions] .card-header a').click(function() {
        var href = '?view=transactions';
        if (user) href += '&user=' + user;
        if (contract) href += '&contract=' + contract;
        navigation(href);
    });
    return call_query({
            type: 'transactions',
            limit: the_recent_pagesize,
            user,
            contract,
            details: ['txid'],
        })
        .then(function({ list }) {
            var body = cnt.find('[name=recent_transactions] .mCSB_container');
            list.forEach(function(e, idx) {
                var ago = make_ago_elem(now, e.time, 'ago-rcn');
                var tx = make_txid_elem(e.txno, e.txid, 'id-rcn');
                var from = make_id_elem(e.caller, 'id-rcn-2');
                var to = make_id_elem(e.callee, 'id-rcn-2');
                var arrow = $('<span style="float:left;">\u2192</span>');
                var e = $(`<div class="panel-line${idx%2}">`);
                e.append($('<div>').append(tx).append(ago));
                e.append($('<div>').append(from).append(arrow).append(to));
                body.append(e);
            });
        });
}

/*===================== SHOW DASHBOARD =====================*/

function show_dashboard() {
    var cnt = $('#dashboard');
    cnt.removeClass('d-none');

    var tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(e => new bootstrap.Tooltip(e));

    var now = Date.now();
    Promise.all([
            call_query({
                type: 'dashboard',
            })
            .then(res => {
                cnt.find('[name=N]').text(res.N);
                cnt.find('[name=B]').text(res.B);
                cnt.find('[name=F]').text(res.F);
                cnt.find('[name=num_blocks]').text(res.num_blocks);
                cnt.find('[name=num_users]').text(res.num_users);
                cnt.find('[name=num_groups]').text(res.num_groups);
                cnt.find('[name=num_contracts]').text(res.num_contracts);
                cnt.find('[name=num_transactions]').text(res.num_transactions);
                cnt.find('[name=num_domains]').text(res.num_domains);
            }),
            show_recent_contracts(now, cnt, {}),
            show_recent_users(now, cnt, {}),
            show_recent_transactions(now, cnt, {}),
        ])
        .catch(show_fatal_error);
}

/*===================== SHOW A USER =====================*/

function show_a_user(id) {
    var cnt = $('#a_user');
    cnt.find('[name=id]').text(id);
    cnt.removeClass('d-none');
    var now = Date.now();
    Promise.all([
            call_query({ type: 'a_user', id })
            .then(res => {
                if (res.frozen) {
                    var badge = $('<div class="badge badge-frozen" style="margin-left: 5px;">frozen</div>');
                    badge.insertAfter(cnt.find('.header-title'));
                }
                if (res.terminated) {
                    var badge = $('<div class="badge" style="margin-left: 5px;">terminated</div>');
                    badge.insertAfter(cnt.find('.header-title'));
                }
                cnt.find('[name=name] [name=value]').append(make_text_elem(res.name));
                cnt.find('[name=description] [name=value]').append(make_description_elem(res.description));
                cnt.find('[name=wallets] [name=value]').append(make_ids_elem(res.wallets));
                cnt.find('[name=callable_to] [name=value]').append(make_ids_elem(res.callable_to));
                cnt.find('[name=disclosed_to] [name=value]').append(make_ids_elem(res.disclosed_to));
                cnt.find('[name=multisig] [name=value]').text(res.multisig);
                cnt.find('[name=domain] [name=value]').append(make_id_elem(res.domain));
                cnt.find('[name=groups] [name=value]').append(make_ids_elem(res.groups));
                cnt.find('[name=last_active] [name=value]').append(make_txid_time_elem(res.a_txno, res.last_active));
                cnt.find('[name=created_at] [name=value]').append(make_txid_time_elem(res.c_txno, res.created_at));
                cnt.find('[name=num_transactions] [name=value]').text(res.num_transactions);
            }),
            show_recent_contracts(now, cnt, { caller: id }),
            show_recent_transactions(now, cnt, { user: id }),
            call_query({ type: 'super_aclgroups', id, limit: the_list_members })
            .catch(err => {
                if (err === 'Denied: permission') return { list: [] };
                if (err === 'Denied: invalid type') return { list: [] }; // for compatibility
                throw err;
            })
            .then(res => {
                var { list } = res;
                list = list.map(e => e.id);
                var td = cnt.find('[name=aclgroups] [name=value]');
                td.append(make_ids_elem(list));
                if (list.length < the_list_members) return;
                var a = $(`<a class="btn btn-outline-dark btn-xs">more</a>`);
                a.click(() => (navigation('?view=super_aclgroups&id=' + id)));
                td.append(a);
            }),
        ])
        .catch(show_fatal_error);

}

/*===================== SHOW A CONTRACT =====================*/

function show_a_contract(id) {
    var cnt = $('#a_contract');
    cnt.find('[name=id]').text(id);
    cnt.removeClass('d-none');
    var now = Date.now();

    var sp = ['c1update', 'c1create', 'c1terminate', 'c1freeze'].includes(id);
    var s = id.startsWith('c1');
    var k = id.startsWith('c2');
    var t = id.startsWith('c3');
    var b = !(s || k || t);
    if (b) cnt.find('[name=type] [name=value]').text('basic');
    if (s) cnt.find('[name=type] [name=value]').text('system');
    if (k) cnt.find('[name=type] [name=value]').text('key-value');
    if (t) cnt.find('[name=type] [name=value]').text('storage');
    if (k || t) cnt.find('[name=argtypes]').addClass('d-none');
    if (!b) cnt.find('[name=code]').addClass('d-none');
    if (!b) cnt.find('[name=maxsteps]').addClass('d-none');
    if (!b) cnt.find('[name=callable_to]').addClass('d-none');

    Promise.all([
            call_query({ type: 'a_contract', id })
            .then(res => {
                if (res.frozen) {
                    var badge = $('<div class="badge badge-frozen" style="margin-left: 5px;">frozen</div>');
                    badge.insertAfter(cnt.find('.header-title'));
                }
                if (res.terminated) {
                    var badge = $('<div class="badge" style="margin-left: 5px;">terminated</div>');
                    badge.insertAfter(cnt.find('.header-title'));
                }
                cnt.find('[name=name] [name=value]').append(make_text_elem(res.name));
                cnt.find('[name=description] [name=value]').append(make_description_elem(res.description));
                if (b || s) cnt.find('[name=argtypes] [name=value]').append(make_argtypes_elem(res.argtypes));
                if (b) cnt.find('[name=code] [name=value]').append(make_code_dom(res.code, res.argtypes));
                cnt.find('[name=mask] [name=value]').append(make_mask_elem(res.mask));
                if (b) cnt.find('[name=maxsteps] [name=value]').text(res.maxsteps || 'default');
                cnt.find('[name=accessible_to] [name=value]').append(make_ids_elem(res.accessible_to));
                if (b) cnt.find('[name=callable_to] [name=value]').append(make_ids_elem(res.callable_to));
                cnt.find('[name=disclosed_to] [name=value]').append(make_ids_elem(res.disclosed_to));
                cnt.find('[name=domain] [name=value]').append(make_id_elem(res.domain));
                cnt.find('[name=groups] [name=value]').append(make_ids_elem(res.groups));
                cnt.find('[name=last_active] [name=value]').append(make_txid_time_elem(res.a_txno, res.last_active));
                cnt.find('[name=created_at] [name=value]').append(make_txid_time_elem(res.c_txno, res.created_at));
                cnt.find('[name=num_transactions] [name=value]').text(res.num_transactions);
                if (res.accessible) {
                    cnt.find('[name=tx]').removeClass('d-none');
                    cnt.find('[name=tx]').click(function() {
                        $(this).blur();
                        if (id === 'c1peer') return edit_new_transaction_c1peer(res);
                        if (id === 'c1authorities') return edit_new_transaction_c1authorities(res);
                        if (k) return edit_new_transaction_keyvalue(res);
                        if (t) return edit_new_transaction_storage(res);
                        return edit_new_transaction_default(res);
                    });
                }
            }),
            show_recent_users(now, cnt, { callee: id }),
            show_recent_transactions(now, cnt, { contract: id }),
            call_query({ type: 'super_aclgroups', id, limit: the_list_members })
            .catch(err => {
                if (err === 'Denied: permission') return { list: [] };
                if (err === 'Denied: invalid type') return { list: [] }; // for compatibility
                throw err;
            })
            .then(res => {
                var { list } = res;
                list = list.map(e => e.id);
                var td = cnt.find('[name=aclgroups] [name=value]');
                td.append(make_ids_elem(list));
                if (list.length < the_list_members) return;
                var a = $(`<a class="btn btn-outline-dark btn-xs">more</a>`);
                a.click(() => (navigation('?view=super_aclgroups&id=' + id)));
                td.append(a);
            }),
        ])
        .catch(show_fatal_error);

}


/*===================== SHOW A GROUP =====================*/

function get_id(data) {
    var id = data.id;
    if (typeof id === 'string') return id;
    assert(Array.isArray(id));
    return id[0];
}

function show_a_group(id) {
    var cnt = $('#a_group');
    cnt.find('[name=id]').text(id);
    cnt.removeClass('d-none');
    var now = Date.now();

    Promise.all([
            call_query({ type: 'a_group', id })
            .then(res => {
                if (res.frozen) {
                    var badge = $('<div class="badge badge-frozen" style="margin-left: 5px;">frozen</div>');
                    badge.insertAfter(cnt.find('.header-title'));
                }
                var aclg = api.isAclGroupId(get_id(res));
                cnt.find('[name=name] [name=value]').append(make_text_elem(res.name));
                cnt.find('[name=description] [name=value]').append(make_description_elem(res.description));
                cnt.find('[name=aclgroup] [name=value]').append(String(aclg));
                cnt.find('[name=domain] [name=value]').append(make_id_elem(res.domain));
                if (!aclg) cnt.find('[name=groups] [name=value]').append(make_ids_elem(res.groups));
                cnt.find('[name=created_at] [name=value]').append(make_txid_time_elem(res.c_txno, res.created_at));
                if (aclg) {
                    call_query({ type: 'super_aclgroups', id, limit: the_list_members })
                        .then(res => {
                            var { list } = res;
                            list = list.map(e => e.id);
                            var td = cnt.find('[name=groups] [name=value]');
                            td.append(make_ids_elem(list));
                            if (list.length < the_list_members) return;
                            var a = $(`<a class="btn btn-outline-dark btn-xs">more</a>`);
                            a.click(() => (navigation('?view=super_aclgroups&id=' + id)));
                            td.append(a);
                        });
                }
                return res;
            }),
            call_query({ type: 'group_members', id, limit: the_list_members })
            .catch(err => {
                if (err === 'Denied: permission') return { list: [] };
                throw err;
            })
            .then(res => {
                var { list } = res;
                var td = cnt.find('[name=members] [name=value]');
                var members = list.map(e => e.id);
                td.append(make_ids_elem(members));
                if (list.length >= the_list_members) {
                    var a = $(`<a class="btn btn-outline-dark btn-xs">more</a>`);
                    a.click(() => (navigation('?view=group_members&id=' + id)));
                    td.append(a);
                    return {};
                }
                return { members };
            }),
        ])
        .then(([res, { members }]) => {
            res.members = members;
        })
        .catch(show_fatal_error);
}

/*===================== SHOW A DOMAIN =====================*/

function show_a_domain(id) {
    var cnt = $('#a_domain');
    cnt.find('[name=id]').text(id);
    cnt.removeClass('d-none');
    var now = Date.now();

    Promise.all([
            call_query({ type: 'a_domain', id: id })
            .then(res => {
                if (res.frozen) {
                    var badge = $('<div class="badge badge-frozen" style="margin-left: 5px;">frozen</div>');
                    badge.insertAfter(cnt.find('.header-title'));
                }
                cnt.find('[name=name] [name=value]').append(make_text_elem(res.name));
                cnt.find('[name=description] [name=value]').append(make_description_elem(res.description));
                cnt.find('[name=code] [name=value]').append(make_code_dom(res.code));
                cnt.find('[name=visible_to] [name=value]').append(make_ids_elem(res.visible_to));
                cnt.find('[name=managed_by] [name=value]').append(make_ids_elem(res.managed_by));
                cnt.find('[name=terminated_by] [name=value]').append(make_ids_elem(res.terminated_by));
                cnt.find('[name=created_at] [name=value]').append(make_txid_time_elem(res.c_txno, res.created_at));
            }),
            show_recent_users(now, cnt, { domain: id }),
            show_recent_contracts(now, cnt, { domain: id }),
            call_query({ type: 'users', domain: id, limit: the_list_members })
            .then(res => {
                var { list } = res;
                list = list.map(e => {
                    var { id } = e;
                    if (Array.isArray(id)) id[1] = id[1].split('@')[0];
                    return id;
                });
                var td = cnt.find('[name=users] [name=value]');
                td.append(make_ids_elem(list));
                if (list.length < the_list_members) return;
                var a = $(`<a class="btn btn-outline-dark btn-xs">more</a>`);
                a.click(() => (navigation('?view=users&domain=' + id)));
                td.append(a);
            }),
            call_query({ type: 'groups', domain: id, limit: the_list_members })
            .then(res => {
                var { list } = res;
                list = list.map(e => {
                    var { id } = e;
                    if (Array.isArray(id)) id[1] = id[1].split('@')[0];
                    return id;
                });
                var td = cnt.find('[name=groups] [name=value]');
                td.append(make_ids_elem(list));
                if (list.length < the_list_members) return;
                var a = $(`<a class="btn btn-outline-dark btn-xs">more</a>`);
                a.click(() => (navigation('?view=groups&domain=' + id)));
                td.append(a);
            }),
            call_query({ type: 'contracts', domain: id, limit: the_list_members })
            .then(res => {
                var { list } = res;
                list = list.map(e => {
                    var { id } = e;
                    if (Array.isArray(id)) id[1] = id[1].split('@')[0];
                    return id;
                });
                var td = cnt.find('[name=contracts] [name=value]');
                td.append(make_ids_elem(list));
                if (list.length < the_list_members) return;
                var a = $(`<a class="btn btn-outline-dark btn-xs">more</a>`);
                a.click(() => (navigation('?view=contracts&domain=' + id)));
                td.append(a);
            }),
        ])
        .catch(show_fatal_error);
}

/*===================== SHOW A TRANSACTION =====================*/

function show_a_transaction(id) {
    if (Number.isInteger(+id)) id = +id;

    var cnt = $('#a_transaction');
    cnt.removeClass('d-none');
    var now = Date.now();

    call_query({ type: 'a_transaction', id })
        .then(async res => {
            var args = JSON.parse(res.argstr);
            var value = JSON.parse(res.valuestr);
            if (res.pack64) {
                var { reqbin, signatures } = api.unpackRequest(api.decodeBase64(res.pack64));
                var { addr, blockref } = api.parseRequest(reqbin);
                var hash = await api.makeHASH(the_chainID, reqbin);
                var txid = await api.makeTXID(hash);
                if (addr[0] !== res.addr) throw new Error(`wallet address mismatch: ${addr[0]} !== ${res.addr}`);
                if (txid !== res.txid) throw new Error(`transaction id mismatch: ${txid} !== ${res.txid}`);
                var addrs = addr.reduce((a, e) => a.append($(`<span class="id-tag id-ids">${e}</span>`)), $('<div class="inline">'));
                var hash2 = hash;
                if (blockref) {
                    hash2 = api.concatUint8Arrays([hash, api.decodeBase64(blockref.hash)]);
                }
                var signed_by = [];
                for (var [config, publicData, signature] of signatures) {
                    var wallet = await api.importVerifyingWallet(config, publicData, the_chainID);
                    if (await wallet.verify(hash2, signature)) {
                        signed_by.push($(`<span class="id-tag id-ids"><font color="green">${wallet.address}(${config})</font></span>`));
                    } else {
                        signed_by.push($(`<span class="id-tag id-ids"><font color="red">${wallet.address}(${config})</font></span>`));
                    }
                }
                var signs = signed_by.reduce((a, e) => a.append(e), $('<div class="inline">'));
                if (blockref) {
                    var hash64 = await get_blockhash(blockref.no);
                    if (blockref.hash === hash64) {
                        var blockrefvr = $(`<span>${blockref.no} <font color="green">verified</font></span>`);
                    } else {
                        var blockrefvr = $(`<span>${blockref.no} <font color="red">broken</font></span>`);
                    }
                }
            }
            cnt.find('[name=time] [name=value]').append(make_date_elem(res.time));
            cnt.find('[name=blkno] [name=value]').append(make_blkno_elem(res.blkno));
            cnt.find('[name=txno] [name=value]').text(res.txno);
            cnt.find('[name=txid] [name=value]').text(res.txid);
            cnt.find('[name=addr] [name=value]').append(addrs);
            cnt.find('[name=caller_txno] [name=value]').append(make_txid_elem(res.caller_txno));
            cnt.find('[name=caller] [name=value]').append(make_id_elem(res.caller));
            cnt.find('[name=callee] [name=value]').append(make_id_elem(res.callee));
            cnt.find('[name=args] [name=value]').append(make_args_elem(args));
            cnt.find('[name=status] [name=value]').append(make_status_elem(res.status));
            cnt.find('[name=value] [name=value]').append(make_value_elem(value));
            cnt.find('[name=steps] [name=value]').text(res.steps);
            cnt.find('[name=subtxs] [name=value]').append(res.subtxs);
            cnt.find('[name=related_to] [name=value]').append(make_ids_elem(res.related_to));
            cnt.find('[name=disclosed_to] [name=value]').append(make_ids_elem(res.disclosed_to));
            cnt.find('[name=cur_disclosed_to] [name=value]').append(make_ids_elem(res.cur_disclosed_to));
            cnt.find('[name=signed_by] [name=value]').append(signs);
            cnt.find('[name=blockref] [name=value]').append(blockrefvr);
            cnt.find('[name=pack] [name=value]').text(res.pack64);
            cnt.find('[name=nearby]').click(function() {
                navigation('?view=transactions&txno=' + res.txno);
            });
            cnt.find('[name=proof]').click(async function() {
                create_proof(res).catch(show_fatal_error);
            });
        })
        .catch(show_fatal_error);
}

/*===================== SHOW A BLOCK =====================*/

function show_a_block(id) {
    if (Number.isInteger(+id)) id = +id;

    var cnt = $('#a_block');
    cnt.find('[name=id]').text(id);
    cnt.removeClass('d-none');
    var now = Date.now();

    call_query({ type: 'a_block', id })
        .then(res => {
            cnt.find('[name=time] [name=value]').append(make_date_elem(res.time));
            cnt.find('[name=blkno] [name=value]').text(res.blkno);
            cnt.find('[name=blkseq] [name=value]').text(res.blkseq);
            cnt.find('[name=txnos] [name=value]').append(make_txno_range_elem(res.start_txno, res.end_txno));
            cnt.find('[name=records] [name=value]').append(res.records);
            cnt.find('[name=status] [name=value]').append(make_status_elem(res.status));
            cnt.find('[name=seed] [name=value]').append(res.seed);
            cnt.find('[name=hash] [name=value]').append(res.hash64);

            var anchors = api.getHashAnchors(res.blkno);
            for (var blkno of anchors) {
                let tr = $('<tr>');
                tr.append($('<td>').append(`Anchor Hash <a href="?view=a_block&id=${blkno}" class="id-tag">${blkno}</a>`));
                cnt.find('tbody').append(tr);
                call_query({ type: 'a_block', id: blkno })
                    .then(res => {
                        tr.append($('<td>').append(res.hash64));
                    });
            }

            cnt.find('[name=verify]').click(async function() {
                var { start_txno, end_txno } = res;
                try {
                    var a = await get_txhashes(start_txno, end_txno);
                    var tx_hashes = a.filter(e => e.status === 'ok').map(e => api.decodeBase64(e.hash64));

                    var hash = await api.calculateBlockHash(res, tx_hashes, async j => {
                        var hash64 = await get_blockhash(j);
                        return api.decodeBase64(hash64);
                    });
                } catch (err) {
                    console.error(err);
                    return show_information('unverified');
                }
                var hash64 = api.encodeBase64(hash, true);
                if (hash64 === res.hash64) {
                    return show_information('verified', true);
                } else {
                    return show_information('expected block hash is ' + hash64);
                }
            });
        })
        .catch(show_fatal_error);

    cnt.find('[name=nearby]').click(function() {
        navigation('?view=blocks&blkno=' + id);
    });
    cnt.find('[name=previous]').click(function() {
        navigation('?view=a_block&id=' + (id - 1));
    });
    cnt.find('[name=next]').click(function() {
        navigation('?view=a_block&id=' + (id + 1));
    });
}

/*===================== SHOW A PEER =====================*/

function show_a_peer(id) {
    var cnt = $('#a_peer');
    cnt.find('[name=id]').text(id);
    cnt.removeClass('d-none');
    call_transaction('c1query', { type: 'a_peer', id }, { BFT: 0 })
        .then(res => {
            if (res.frozen) {
                var badge = $('<div class="badge badge-frozen" style="margin-left: 5px;">frozen</div>');
                badge.insertAfter(cnt.find('.header-title'));
            }
            if (res.terminated) {
                var badge = $('<div class="badge" style="margin-left: 5px;">terminated</div>');
                badge.insertAfter(cnt.find('.header-title'));
            }
            cnt.find('[name=name] [name=value]').append(make_text_elem(res.name));
            cnt.find('[name=description] [name=value]').append(make_description_elem(res.description));
            cnt.find('[name=authority] [name=value]').append(make_boolean_elem(res.authority));
            cnt.find('[name=host] [name=value]').text(res.host);
            cnt.find('[name=port] [name=value]').text(res.port);
            cnt.find('[name=pubkey] [name=value]').append($('<pre>').text(res.pubkey));
            cnt.find('[name=pubkey2] [name=value]').append($('<pre>').text(res.pubkey2));
            cnt.find('[name=url] [name=value]').append(make_text_elem(res.url));
            cnt.find('[name=domain] [name=value]').append(make_id_elem(res.domain));
            cnt.find('[name=version] [name=value]').text(res.version);
            cnt.find('[name=blkseq] [name=value]').text(res.blkseq);
            cnt.find('[name=count_votes] [name=value]').text(res.count_votes);
        })
        .catch(show_fatal_error);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        show_recent_users,
        show_recent_contracts,
        show_recent_transactions,
        show_dashboard,
        show_a_user,
        show_a_contract,
        get_id,
        show_a_group,
        show_a_domain,
        show_a_transaction,
        show_a_block,
        show_a_peer
    };
}
