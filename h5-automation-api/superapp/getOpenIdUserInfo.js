// # JoyPay Backend Helper (Node.js)

// This Node.js helper allows you to:

// 1. Retrieve **OpenId** using a `token`.
// 2. Fetch **User Info** using an externally provided `authToken`.
// 3. Sign API requests using **AES-GCM** encryption according to JoyPay requirements.


import crypto from 'crypto';
import fetch from 'node-fetch';

// ================= Configuration - Bill Payments App =================
const APP_ID = "AE35182511050000001000105000"; // Bill Payments App ID
const APP_SECRET_BASE64 = "MoTtljN1P66E2rZ/sDwj3g=="; // Bill Payments Secret Key
const SERIAL_NO = "p6TTL7DWcA"; // Bill Payments Serial No

// ================= Helper Functions =================
function generateNonce(length = 16) {
    return crypto.randomBytes(length).toString('hex');
}

function buildCanonicalString(method, urlPath, timestamp, nonce, body) {
    return `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
}

function encryptAESGCM(plainText, base64Key) {
    const key = Buffer.from(base64Key, 'base64');
    if (![16, 24, 32].includes(key.length)) throw new Error(`Invalid AES key length: ${key.length}`);
    const iv = crypto.randomBytes(12); // GCM standard
    const cipher = crypto.createCipheriv(`aes-${key.length * 8}-gcm`, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, encrypted, authTag]).toString('base64');
}

function getAuthorizationHeader(method, urlPath, body) {
    const nonce = generateNonce();
    const timestamp = Math.floor(Date.now() / 1000);
    const canonical = buildCanonicalString(method, urlPath, timestamp, nonce, body);
    const signature = encryptAESGCM(canonical, APP_SECRET_BASE64);

    return `AES appid="${APP_ID}",serial_no="${SERIAL_NO}",nonce_str="${nonce}",timestamp="${timestamp}",signature="${signature}"`;
}

// Generic API call helper
async function callJoyPayAPI(method, url, payloadObj) {
    const body = JSON.stringify(payloadObj || {});
    const urlPath = new URL(url).pathname;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': getAuthorizationHeader(method, urlPath, body),
    };

    const response = await fetch(url, { method, headers, body });
    const text = await response.text();

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text}`);
    }

    try {
        return JSON.parse(text);
    } catch (err) {
        throw new Error(`Failed to parse JSON response: ${text}`);
    }
}

// ================= Backend Flow =================
async function getUserInfoBackend(token, authToken) {
    // 1️⃣ Fetch OpenId from token
    const openIdData = await callJoyPayAPI(
        'POST',
        'https://appleseed-uat-portal.joypaydev.com/v1/pay/credential/openid',
        { token }
    );
    console.log('Full OpenId Response:', openIdData);

    const openId = openIdData.openId || openIdData.data?.openId;
    if (!openId) throw new Error(`OpenId not returned by API. Response: ${JSON.stringify(openIdData)}`);

    // 2️⃣ Fetch user info using externally provided authToken
    const userInfo = await callJoyPayAPI(
        'POST',
        'https://appleseed-uat-portal.joypaydev.com/v1/pay/credential/user/info',
        { openId, authToken }
    );

    return userInfo;
}

// ================= Usage =================
(async () => {
    try {
        const token = '4a567cd84adb7ee4ed52e27957ee36a7b6842ba3e4f22baaacb2bc338df8f758'; // token to get OpenId
        const authToken = '785e627154dd5fbeea840cc8f72ff65b5c53a2d90af81d9f066768becdb04bc4'; // externally provided
        const userInfo = await getUserInfoBackend(token, authToken);
        console.log('User Info Response:', userInfo);
    } catch (err) {
        console.error('Backend flow error:', err);
    }
})();

