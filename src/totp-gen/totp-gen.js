let key = "";
let t_0 = 0.0;
let html5QrcodeScanner = null;
var Crypto = {};

Crypto.sha1_hmac = function (msg, key) {
    "use strict";
    var oKeyPad, iKeyPad, iPadRes, bytes, i, len;
    if (key.length > 64) {
        // keys longer than blocksize are shortened
        key = Crypto.sha1(key, true);
    }

    bytes = [];
    len = key.length;
    for (i = 0; i < 64; ++i) {
        bytes[i] = len > i ? key.charCodeAt(i) : 0x00;
    }

    oKeyPad = "";
    iKeyPad = "";

    for (i = 0; i < 64; ++i) {
        oKeyPad += String.fromCharCode(bytes[i] ^ 0x5C);
        iKeyPad += String.fromCharCode(bytes[i] ^ 0x36);
    }

    iPadRes = Crypto.sha1(iKeyPad + msg, true);

    return Crypto.sha1(oKeyPad + iPadRes);
};

Crypto.sha1 = function (msg, raw) {
    function rotate_left(n,s) {
        var t4 = ( n<<s ) | (n>>>(32-s));
        return t4;
    }

    function lsb_hex(val) {
        var str="";
        var i;
        var vh;
        var vl;

        for( i=0; i<=6; i+=2 ) {
            vh = (val>>>(i*4+4))&0x0f;
            vl = (val>>>(i*4))&0x0f;
            str += vh.toString(16) + vl.toString(16);
        }
        return str;
    }

    function cvt_hex(val, raw) {
        var str="";
        var i;
        var v;

        for( i=7; i>=0; i-- ) {
            v = (val>>>(i*4))&0x0f;
            str += raw ? String.fromCharCode(v) : v.toString(16);
        }
        return str;
    }

    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var result, rawResult;

    var msg_len = msg.length;

    var word_array = [];
    for( i=0; i<msg_len-3; i+=4 ) {
        j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
        msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
        word_array.push( j );
    }

    switch( msg_len % 4 ) {
        case 0:
            i = 0x080000000;
        break;
        case 1:
            i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
        break;

        case 2:
            i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
        break;

        case 3:
            i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8    | 0x80;
        break;
    }

    word_array.push( i );

    while( (word_array.length % 16) != 14 ) word_array.push( 0 );

    word_array.push( msg_len>>>29 );
    word_array.push( (msg_len<<3)&0x0ffffffff );

    for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
        for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
        for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);

        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;

        for( i= 0; i<=19; i++ ) {
            temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }

        for( i=20; i<=39; i++ ) {
            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }

        for( i=40; i<=59; i++ ) {
            temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }

        for( i=60; i<=79; i++ ) {
            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
    }

    result = (cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4)).toLowerCase();

    if (!raw) {
        return result;
    }

    rawResult = "";
    while (result.length) {
        rawResult += String.fromCharCode(parseInt(result.substr(0, 2), 16));
        result = result.substr(2);
    }
    return rawResult;
};

function hotp(k,t) {
    let retval = Crypto.sha1_hmac(t,k);
    let OffsetBits = retval[19] & 0b00001111;
    let offset = Number(OffsetBits);
    let hotpVal = retval[offset] + retval[offset+1] + retval[offset+2] + retval[offset+3];
    let numHOTP = 0;
    for (let i = 0; i < 4; i++) {
        numHOTP += (hotpVal.charCodeAt(i) >= 48 && hotpVal.charCodeAt(i) <= 57 ? hotpVal.charCodeAt(i) - 48 : hotpVal.charCodeAt(i) - 87) * 16**(3-i);
    }
    return numHOTP;
}

function startGen() {
    if (key === "") {
        document.getElementById("totp-code").innerHTML = "Missing secret data. Did you scan the QR code properly?";
        return;
    }
    let t = Math.floor(((Date.now() / 1000) - (t_0/1000)) / 30);
    let numHOTP = hotp(key, t);
    let code = numHOTP % 10**6 >= 100000 ? numHOTP % 10**6 : (numHOTP % 10**6) * 10;
    document.getElementById("totp-code").innerHTML = "The code is <b>" + code + "</b>";
}

function onScanSuccess(decodedText, decodedResult) {
    let codes = decodedText.split(",");
    try {
        key = codes[0];
        t_0 = Number(codes[1]);
        html5QrcodeScanner.clear();
        document.getElementById("qr-result").innerHTML = "Successfully read the QR code! Please proceed to Step 2.";
    } catch (err) {
        console.warn("Code read error = " + err);
        document.getElementById("qr-result").innerHTML = "Error reading code. Did you scan the right code?";
    }
}

function onScanFailure(error) {
    console.warn("Code scan error = " + error);
}

function readQR() {
    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        {fps: 10, qrbox: {width: 250, height: 250}},
        /* verbose= */ false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}