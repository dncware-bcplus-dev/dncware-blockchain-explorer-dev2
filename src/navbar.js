// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

'use strict';

var the_recent_pagesize = 20;
var the_list_pagesize = 100;
var the_list_members = 10;

var the_chainID = cfg_chainID;
var the_unlocked_wallet;
var the_rpc;

$(window).ready(async function() {

    var view = getURLParameterByName('view');
    var id = getURLParameterByName('id');

    the_recent_pagesize = +getURLParameterByName('pagesize') || the_recent_pagesize;
    the_list_pagesize = +getURLParameterByName('pagesize') || the_list_pagesize;
    the_list_members = +getURLParameterByName('listsize') || the_list_members;
    document.querySelector('#the_navbar [name=chain_id] strong').innerText = the_chainID;

    the_unlocked_wallet = await api.importSigningWallet('es', await api.generateWalletKey('es'));
    var rpc = new api.RPC(cfg_chainID);
    for (var url of cfg_serverURLs) {
        rpc.connect(url);
    }
    rpc.setBFT(cfg_BFT);
    the_rpc = rpc;

    $(window).scroll(function(event) {
        var scroll = $(window).scrollTop();
        if (scroll >= $('#the_navbar').height()) {
            $('#mini_navbar').removeClass('d-none');
        } else {
            $('#mini_navbar').addClass('d-none');
        }
    });

    $('.mCSB').mCustomScrollbar({
        theme: 'minimal-dark',
        autoExpandScrollbar: true,
    });

    $('#the_navbar [name=search] button').click(function(e) {
        e.preventDefault();
        var key = $('#the_navbar [name=search] input').val();
        do_search(key).catch(console.error);
    });

    $('#mini_navbar [name=search] button').click(function(e) {
        e.preventDefault();
        var key = $('#mini_navbar [name=search] input').val();
        do_search(key).catch(console.error);
    });

    async function do_search(key) {
        key = key.trim();
        if (key === '') return;
        var res = await call_query({ type: 'search', key, limit: 2 });
        if (res.length === 1) {
            var m = res[0];
            if (m && m.type && m.id) {
                navigation(`?view=a_${m.type}&id=${m.id}`);
                return;
            }
        }
        navigation('?view=search&id=' + key);
    }

    var a = document.querySelector('#the_navbar [name=user_id]');
    if (a) {
        var ai = a.querySelector('i');
        var user = await get_user_id();
        if (user) {
            ai.innerText = user[1];
            ai.onclick = () => { navigation(`?view=a_user&id=${user[0]}`); };
            var logout = document.createElement('span');
            logout.innerHTML = `<i class="bi bi-box-arrow-right ms-1"></i>`;
            a.append(logout);
            logout.onclick = show_logout_diag;
        } else {
            ai.innerText = 'login';
            a.onclick = show_login_diag;
        }
    }

    try {
        switch (view) {
            case 'transactions':
                return await show_transactions();
            case 'transactions_details':
                return await show_transactions(1);
            case 'a_transaction':
                return await show_a_transaction(id);
            case 'domains':
                return await show_domains();
            case 'a_domain':
                return await show_a_domain(id);
            case 'contracts':
                return await show_contracts();
            case 'a_contract':
                return await show_a_contract(id);
            case 'users':
                return await show_users();
            case 'a_user':
                return await show_a_user(id);
            case 'groups':
                return await show_groups();
            case 'group_members':
                return await show_group_members();
            case 'super_aclgroups':
                return await show_super_aclgroups();
            case 'a_group':
                return await show_a_group(id);
            case 'search':
                return await show_search_results(id);
            case 'peers':
                return await show_peers();
            case 'a_block':
                return await show_a_block(id);
            case 'a_peer':
                return await show_a_peer(id);
            case 'blocks':
                return await show_blocks();
            case 'dashboard':
            default:
                return await show_dashboard();
        }
    } catch (err) {
        await show_fatal_error(err);
        navigation('?');
        return;
    }
});

async function call_transaction(contract, args, options = {}) {
    var uw = the_unlocked_wallet;
    var resp = await the_rpc.call(uw, contract, args, options);
    if (resp.status === 'ok') {
        return resp.value;
    } else if (resp.status === 'denied') {
        debug(resp);
        throw 'Denied: ' + resp.value;
    } else {
        debug(resp);
        throw { status: resp.status, value: resp.value };
    }
}

var insufficient_responses_warning;

async function show_insufficient_responses_warning() {
    if (insufficient_responses_warning) return insufficient_responses_warning;
    var resolve;
    insufficient_responses_warning = new Promise(r => resolve = r);
    await show_warning('insufficient responses');
    insufficient_responses_warning = null;
    resolve();
}

async function call_query(args) {
    if (!/^a_/.test(args.type)) {
        return await call_transaction('c1query', args, { BFT: 0 });
    }
    try {
        return await call_transaction('c1query', args);
    } catch (err) {
        if (err.message === 'insufficient responses') {
            await show_insufficient_responses_warning();
            return await call_transaction('c1query', args, { BFT: 0 });
        }
        throw err;
    }
}

var get_block_cache = new Map();

async function get_block(blkno) {
    var block = get_block_cache.get(blkno);
    if (block) return block;
    var block = await the_rpc.fetchBlock(blkno);
    if (!block) return null;
    get_block_cache.set(block.blkno, block);
    return block;
}

async function get_lastblockref() {
    return get_block(0);
}

async function get_blockhash(blkno) {
    var b = await get_block(blkno);
    return b.hash64;
}

async function get_txhash(txno) {
    var b = await the_rpc.fetchTxHash(txno);
    if (b.status !== 'ok') return null;
    return b.hash64;
}

async function get_txhashes(a, b) {
    return the_rpc.fetchTxHashes(a, b);
}

async function get_user_id() {
    try {
        var str = sessionStorage.getItem('bcplus-unlocked-wallet');
        if (typeof str !== 'string') return;
        var uw = await api.parseUnlockedWalletFile(str);
        var resp = await the_rpc.call(uw, 'c1query', { type: 'a_wallet' });
        if (resp.status !== 'ok') {
            console.log('c1query a_wallet', resp);
            return;
        }
        if (resp.value.user[0] === 'anonymous') throw 'anonymous wallet';
        the_unlocked_wallet = uw;
        return resp.value.user;
    } catch (err) {
        console.log(err);
        sessionStorage.removeItem('bcplus-unlocked-wallet');
    }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        call_transaction,
        show_insufficient_responses_warning,
        call_query,
        get_block,
        get_lastblockref,
        get_blockhash,
        get_txhash,
        get_txhashes,
        get_user_id
    };
}
