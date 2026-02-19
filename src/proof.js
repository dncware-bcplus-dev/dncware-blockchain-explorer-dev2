// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

'use strict';

async function create_proof(tx) {
    if (tx.status !== 'ok') throw 'transaction status !== ok';
    var { blkno, hash64 } = await get_lastblockref();
    var blkno_tgt = blkno;
    var s_blk = [];
    while (tx.blkno <= blkno) {
        var { blkno, time, seed, records, status, start_txno, end_txno } = await get_block(blkno);
        var a = await get_txhashes(start_txno, end_txno);
        var tx_oks = a.filter(e => e.status === 'ok');
        var tx_hashes = tx_oks.map(e => decodeBase64(e.hash64));
        var a = [blkno, time, seed, records, status, start_txno, end_txno];
        var h = await api.sha256(api.encodeUTF8(JSON.stringify(a) + ';'));
        var tx_hashesA = [];
        for (var i = 0; i < tx_hashes.length; i++) {
            var txno = tx_oks[i].txno;
            var p = [tx_hashes[i]];
            var anchors = api.getHashAnchors(i + 1);
            for (var j of anchors) {
                p.push(tx_hashesA[j - 1]);
            }
            var hash = await api.sha256.apply(null, p);
            tx_hashesA[i] = hash;
        }
        var p = [h];
        if (hash) p.push(hash);
        var anchors = api.getHashAnchors(blkno);
        for (var j of anchors) {
            p.push(decodeBase64(await get_blockhash(j)));
        }
        var hash = encodeBase64(await api.sha256.apply(null, p));
        if (hash !== await get_blockhash(blkno)) throw `broken block hash at ${blkno}`;

        for (var a = 0; a < anchors.length; a++) {
            var j = anchors[a];
            if (tx.blkno <= j) {
                break;
            }
        }
        if (a === anchors.length) a = -1;
        s_blk.push({ blkno, txno, hash, anchors, p, a });
        if (tx.blkno === blkno) break;
        blkno = j;
    }
    if (tx.blkno !== blkno) throw `cannot locate the block`;

    var s_tx = [];
    var i = tx_oks.length - 1;
    while (0 <= i) {
        var txno = tx_oks[i].txno;
        var p = [tx_hashes[i]];
        var anchors = api.getHashAnchors(i + 1);
        for (var j of anchors) {
            p.push(tx_hashesA[j - 1]);
        }

        for (var a = 0; a < anchors.length; a++) {
            var j = anchors[a];
            if (tx.txno <= tx_oks[j - 1].txno) {
                break;
            }
        }
        var hash = encodeBase64(await api.sha256.apply(null, p));
        assert(hash === encodeBase64(tx_hashesA[i]));
        if (a === anchors.length) a = -1;
        anchors = anchors.map(j => tx_oks[j - 1].txno);
        s_tx.push({ txno, hash, anchors, p, a });
        if (tx.txno >= txno) break;
        i = j - 1;
    }

    var li = 0;
    var text = [];
    var obj = {};
    if (tx.txid) obj.txid = tx.txid;
    if (tx.pack64) obj.pack64 = tx.pack64;
    if (tx.addr) obj.addr = tx.addr;
    obj.txno = tx.txno;
    obj.caller_txno = tx.caller_txno || 0;
    obj.caller = unref_id(tx.caller);
    obj.callee = unref_id(tx.callee);
    obj.argstr = tx.argstr;
    obj.subtxs = tx.subtxs;
    obj.steps = tx.steps;
    obj.status = tx.status;
    obj.valuestr = tx.valuestr;
    obj.disclosed_to = tx.disclosed_to.map(unref_id);
    obj.related_to = tx.related_to.map(unref_id);
    for (var n of Object.keys(obj)) {
        text.push(`var ${n} = ${JSON.stringify(obj[n])}`);
    }

    text.push(`var a = [txno, caller_txno, caller, callee, subtxs, steps, status, disclosed_to, related_to]`);
    text.push(`var h0 = await sha256(base64(JSON.stringify(a)), base64(argstr), base64(valuestr))`);
    if (tx.txid) { // main transaction
        text.push(`var h0 = await sha256(pack64, h0)`);
        text.push(`var h0 = await sha256(base64(addr), h0)`);
        text.push(`var h0 = await sha256(base64(txid), h0)`);
    }
    for (var i = s_tx.length - 1; i >= 0; i--) {
        var { txno, p, a } = s_tx[i];
        var ps = p.map((e, j) => j === a + 1 ? `h${li}` : `"${encodeBase64(e)}"`).join();
        var hash = await api.sha256.apply(null, p);
        text.push(`var h${++li} = await sha256(${ps})`);
    }
    for (var i = s_blk.length - 1; i >= 0; i--) {
        var { blkno, p, a } = s_blk[i];
        var ps = p.map((e, j) => j === a + 2 ? `h${li}` : `"${encodeBase64(e)}"`).join();
        var hash = await api.sha256.apply(null, p);
        text.push(`var h${++li} = await sha256(${ps})`);
    }

    text.push(`return h${li}`);
    var func_text = `async function f(){\n    ${text.join(';\n    ')};\n}`;
    console.log(func_text);
    if (await eval('(' + func_text + ')')() !== hash64) throw "proof failed";
    console.log("proof ok");

    var txs = [];
    for (var i = s_tx.length - 1; i >= 0; i--) {
        var { txno, hash, anchors, p, a } = s_tx[i];
        var ps = p.map((e, j) => ({ txno: anchors[j - 1], hash: encodeBase64(e) }));
        if (a >= 0) {
            txs.push(`<tr><td></td><td><div class="arrowv"></div></td></tr>`);
            txs.push(`<tr>`);
            txs.push(`<td></td>`);
            for (var j = 0; j < a * 2 + 4; j++) {
                txs.push(`<td><div class="arrowh"></div></td>`);
            }
            txs.push(`<td><div class="arrowd"></div></td>`);
            txs.push(`<td></td>`);
            txs.push(`</tr>`);
        }
        txs.push(`<tr>`);
        txs.push(`<td colspan="2" rowspan="2"><div class="waku">txno: ${txno}<br><nobr>${hash}</nobr></div></td>`);
        txs.push(`<td><div></div></td>`);
        txs.push(`<td colspan="2" rowspan="2"><div class="waku"><nobr>${ps[0].hash}</nobr></div></td>`);
        for (var j = 1; j < p.length; j++) {
            txs.push(`<td colspan="2" rowspan="2"><div class="waku">txno: ${ps[j].txno}<br><nobr>${ps[j].hash}</nobr></div></td>`);
        }
        txs.push(`</tr>`);
        txs.push(`<tr><td><div class="arrowr">hash</div></td></tr>`);
    }
    for (var i = s_blk.length - 1; i >= 0; i--) {
        var { blkno, txno, hash, anchors, p, a } = s_blk[i];
        var ps = p.map((e, j) => ({ blkno: anchors[j - 2], hash: encodeBase64(e) }));
        txs.push(`<tr><td></td><td><div class="arrowv"></div></td></tr>`);
        txs.push(`<tr>`);
        txs.push(`<td></td>`);
        for (var j = 0; j < a * 2 + 6; j++) {
            txs.push(`<td><div class="arrowh"></div></td>`);
        }
        txs.push(`<td><div class="arrowd"></div></td>`);
        txs.push(`<td></td>`);
        txs.push(`</tr>`);
        txs.push(`<tr>`);
        txs.push(`<td colspan="2" rowspan="2"><div class="waku">blkno: ${blkno}<br><nobr>${hash}</nobr></div></td>`);
        txs.push(`<td><div></div></td>`);
        txs.push(`<td colspan="2" rowspan="2"><div class="waku"><nobr>${ps[0].hash}</nobr></div></td>`);
        txs.push(`<td colspan="2" rowspan="2"><div class="waku">txno: ${txno}<br><nobr>${ps[1].hash}</nobr></div></td>`);
        for (var j = 2; j < p.length; j++) {
            txs.push(`<td colspan="2" rowspan="2"><div class="waku">blkno: ${ps[j].blkno}<br><nobr>${ps[j].hash}</nobr></div></td>`);
        }
        txs.push(`</tr>`);
        txs.push(`<tr><td><div class="arrowr">hash</div></td></tr>`);
    }

    txs.push(`<tr>`);
    for (var j = 0; j < 5 * 2 + 6; j++) {
        txs.push(`<td>.</td>`);
    }
    txs.push(`</tr>`);

    var blob = new Blob([`
<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>Proof of the transaction #${tx.txno} to the block #${blkno_tgt}</title>
<style>
table{ border-spacing:0px; }
td{ padding:0px; }
.waku{ padding:10px; border:1px dotted #333333; margin-left:10px; margin-right:10px; }
.arrowv{ position:relative; height:10px; border-left:8px solid lightgray; }
.arrowh{ position:relative; height:20px; border-top:8px solid lightgray; }
.arrowd{ position:relative; height:20px; border-top:8px solid lightgray; border-right:8px solid lightgray; }
.arrowd::after{ content:""; position:absolute; bottom:-8px; right:-18px; border-top:14px solid lightgray; border-left:14px solid transparent; border-right:14px solid transparent; }
.arrowr{ position:relative; text-align:right; width:50px; height:20px; border-top:8px solid green; }
.arrowr::after{ content:""; position:absolute; top:-18px; left:-14px; border-right:14px solid green; border-top:14px solid transparent; border-bottom:14px solid transparent; }
</style>
</head>
<body>
<table border="0">
${txs.join('\n')}
</table>

<script type="module">
var alphabetBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var lookupBase64 = {};
for (var i = 0; i < 64; i++) {
    lookupBase64[alphabetBase64[i]] = i;
}
${encodeBase64}
${decodeBase64}
${base64}
${sha256}
${func_text}
f().then(hash => {
    console.log(hash);
    if(hash !== ${JSON.stringify(hash64)}) throw "proof failed";
    console.log("proof ok");
}).catch(alert);
</script>
</body>
</html>
    `], { type: 'text/html' });
    var a = document.getElementById('download_proof');
    a.download = `dbcproof-tx${tx.txno}-to-blk${blkno_tgt}.html`;
    a.href = (window.URL || window.webkitURL).createObjectURL(blob);
    a.click();
}

var alphabetBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var lookupBase64 = {};
for (var i = 0; i < 64; i++) {
    lookupBase64[alphabetBase64[i]] = i;
}

function encodeBase64(bytes) {
    var list2 = [];
    var list = [];
    var x = 0;
    var bits = 0;
    var mask = (1 << 6) - 1;
    for (var i = 0; i < bytes.length; i++) {
        x = (x << 8) | bytes[i];
        bits += 8;
        while (bits >= 6) {
            var y = (x >> (bits - 6)) & mask;
            list.push(alphabetBase64[y]);
            bits -= 6;
        }
        x &= mask;
        if (list.length >= 128) {
            list2.push(list.join(''));
            list = [];
        }
    }
    if (bits > 0) {
        x = (x << 8);
        bits += 8;
        var y = (x >> (bits - 6)) & mask;
        list.push(alphabetBase64[y]);
        bits -= 6;
    }
    while (bits > 0) {
        if (bits >= 6) {
            list.push('=');
            bits -= 6;
        } else {
            bits += 8;
        }
    }
    list2.push(list.join(''));
    return list2.join('');
}

function decodeBase64(str) {
    var bytes = new Uint8Array(str.length);
    var j = 0;
    var x = 0;
    var bits = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str[i];
        if (c === '=') {
            while (str[++i] === '=');
            if (i === str.length) break;
            throw new Error(`unexpected char at ${i}`);
        }
        var z = lookupBase64[c];
        if (z == null) throw new Error(`unexpected char at ${i}`);
        x = (x << 6) | z;
        bits += 6;
        if (bits >= 8) {
            var y = (x >> (bits - 8)) & 255;
            bytes[j++] = y;
            bits -= 8;
        }
        x &= 255;
    }
    return bytes.slice(0, j);
}

function base64(str) { // intentionally ignores surrogate pair
    var bytes = new Uint8Array(str.length * 3);
    var j = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c <= 0x007F) {
            bytes[j++] = c;
        } else if (c <= 0x07FF) {
            bytes[j++] = (0xC0 + ((c >> 6) & 0x1F));
            bytes[j++] = (0x80 + (c & 0x3F));
        } else {
            bytes[j++] = (0xE0 + ((c >> 12) & 0x0F));
            bytes[j++] = (0x80 + ((c >> 6) & 0x3F));
            bytes[j++] = (0x80 + (c & 0x3F));
        }
    }
    return encodeBase64(bytes.slice(0, j));
}

async function sha256() {
    var p = [];
    var len = 0;
    for (var i = 0; i < arguments.length; i++) {
        p[i] = decodeBase64(arguments[i]);
        len += p[i].length;
    }
    var data = new Uint8Array(len);
    var offset = 0;
    for (var i = 0; i < p.length; i++) {
        data.set(p[i], offset);
        offset += p[i].length;
    }
    var ab = await crypto.subtle.digest({ name: "SHA-256" }, data);
    return encodeBase64(new Uint8Array(ab));
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        create_proof,
        encodeBase64,
        decodeBase64,
        base64,
        sha256
    };
}
