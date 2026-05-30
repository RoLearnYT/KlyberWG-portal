exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const strategy = event.queryStringParameters?.strategy || 'default';

  // Параметры обфускации (I1 вы вставите сами)
  const params = {
    default: { jc: 120, jmin: 23, jmax: 911, s1: 2, s2: 3, h1: 1, h2: 2, h3: 3, h4: 4 },
    stealth: { jc: 100, jmin: 20, jmax: 800, s1: 2, s2: 3, h1: 1, h2: 2, h3: 3, h4: 4 },
    aggressive: { jc: 140, jmin: 30, jmax: 1000, s1: 3, s2: 4, h1: 2, h2: 4, h3: 6, h4: 8 }
  };

  const p = params[strategy] || params.default;

  // I1 вы вставите сюда
  const I1_VALUE = `<b 0xc2000000011419fa4bb3599f336777de79f81ca9a8d80d91eeec000044c635cef024a885dcb66d1420a91a8c427e87d6cf8e08b563932f449412cddf77d3e2594ea1c7a183c238a89e9adb7ffa57c133e55c59bec101634db90afb83f75b19fe703179e26a31902324c73f82d9354e1ed8da39af610afcb27e6590a44341a0828e5a3d2f0e0f7b0945d7bf3402feea0ee6332e19bdf48ffc387a97227aa97b205a485d282cd66d1c384bafd63dc42f822c4df2109db5b5646c458236ddcc01ae1c493482128bc0830c9e1233f0027a0d262f92b49d9d8abd9a9e0341f6e1214761043c021d7aa8c464b9d865f5fbe234e49626e00712031703a3e23ef82975f014ee1e1dc428521dc23ce7c6c13663b19906240b3efe403cf30559d798871557e4e60e86c29ea4504ed4d9bb8b549d0e8acd6c334c39bb8fb42ede68fb2aadf00cfc8bcc12df03602bbd4fe701d64a39f7ced112951a83b1dbbe6cd696dd3f15985c1b9fef72fa8d0319708b633cc4681910843ce753fac596ed9945d8b839aeff8d3bf0449197bd0bb22ab8efd5d63eb4a95db8d3ffc796ed5bcf2f4a136a8a36c7a0c65270d511aebac733e61d414050088a1c3d868fb52bc7e57d3d9fd132d78b740a6ecdc6c24936e92c28672dbe00928d89b891865f885aeb4c4996d50c2bbbb7a99ab5de02ac89b3308e57bcecf13f2da0333d1420e18b66b4c23d625d836b538fc0c221d6bd7f566a31fa292b85be96041d8e0bfe655d5dc1afed23eb8f2b3446561bbee7644325cc98d31cea38b865bdcc507e48c6ebdc7553be7bd6ab963d5a14615c4b81da7081c127c791224853e2d19bafdc0d9f3f3a6de898d14abb0e2bc849917e0a599ed4a541268ad0e60ea4d147dc33d17fa82f22aa505ccb53803a31d10a7ca2fea0b290a52ee92c7bf4aab7cea4e3c07b1989364eed87a3c6ba65188cd349d37ce4eefde9ec43bab4b4dc79e03469c2ad6b902e28e0bbbbf696781ad4edf424ffb35ce0236d373629008f142d04b5e08a124237e03e3149f4cdde92d7fae581a1ac332e26b2c9c1a6bdec5b3a9c7a2a870f7a0c25fc6ce245e029b686e346c6d862ad8df6d9b62474fbc31dbb914711f78074d4441f4e6e9edca3c52315a5c0653856e23f681558d669f4a4e6915bcf42b56ce36cb7dd3983b0b1d6fdf0f8efddb68e7ca0ae9dd4570fe6978fbb524109f6ec957ca61f1767ef74eb803b0f16abd0087cf2d01bc1db1c01d97ac81b3196c934586963fe7cf2d310e0739621e8bd00dc23fded18576d8c8f285d7bb5f43b547af3c76235de8b6f757f817683b2151600b11721219212bf27558edd439e73fce951f61d582320e5f4d6c315c71129b719277fc144bbe8ded25ab6d29b6e189c9bd9b16538faf60cc2aab3c3bb81fc2213657f2dd0ceb9b3b871e1423d8d3e8cc008721ef03b28e0ee7bb66b8f2a2ac01ef88df1f21ed49bf1ce435df31ac34485936172567488812429c269b49ee9e3d99652b51a7a614b7c460bf0d2d64d8349ded7345bedab1ea0a766a8470b1242f38d09f7855a32db39516c2bd4bcc538c52fa3a90c8714d4b006a15d9c7a7d04919a1cab48da7cce0d5de1f9e5f8936cffe469132991c6eb84c5191d1bcf69f70c58d9a7b66846440a9f0eef25ee6ab62715b50ca7bef0bc3013d4b62e1639b5028bdf757454356e9326a4c76dabfb497d451a3a1d2dbd46ec283d255799f72dfe878ae25892e25a2542d3ca9018394d8ca35b53ccd94947a8>`;

  try {
    // 1. Регистрируем устройство в Cloudflare WARP
    const installId = generateInstallId();
    
    const registerRes = await fetch('https://api.cloudflareclient.com/v0a2158/reg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        install_id: installId,
        tos: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
        type: 'Android',
        key: generateKey()
      })
    });

    if (!registerRes.ok) {
      throw new Error(`Cloudflare API error: ${registerRes.status}`);
    }

    const device = await registerRes.json();
    
    // 2. Получаем конфиг от Cloudflare
    const configRes = await fetch('https://api.cloudflareclient.com/v0a2158/config', {
      headers: { 'Authorization': `Bearer ${device.token}` }
    });
    
    const warpConfig = await configRes.json();

    // 3. ✅ Берем эндпоинт и публичный ключ из ответа Cloudflare API
    const endpoint = warpConfig.peers[0].endpoint.host + ":" + warpConfig.peers[0].endpoint.ports[0];
    const peerPublicKey = warpConfig.peers[0].public_key;
    
    // 4. Берем приватный ключ и адреса из ответа Cloudflare API
    const privateKey = warpConfig.private_key;
    const addresses = warpConfig.addresses.join(', ');
    
    // 5. Собираем финальный конфиг в формате AmneziaWG 1.5
    const finalConfig = `[Interface]
PrivateKey = ${privateKey}
Address = ${addresses}
DNS = 1.1.1.1, 2606:4700:4700::1111, 1.0.0.1, 2606:4700:4700::1001
MTU = 1280

Jc = ${p.jc}
Jmin = ${p.jmin}
Jmax = ${p.jmax}
S1 = ${p.s1}
S2 = ${p.s2}
H1 = ${p.h1}
H2 = ${p.h2}
H3 = ${p.h3}
H4 = ${p.h4}
I1 = ${I1_VALUE}

[Peer]
PublicKey = ${peerPublicKey}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${endpoint}
PersistentKeepalive = 25`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        config: finalConfig,
        strategy: strategy,
        version: "1.5",
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

function generateInstallId() {
  return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function generateKey() {
  const key = new Uint8Array(32);
  crypto.getRandomValues(key);
  key[0] &= 248;
  key[31] &= 127;
  key[31] |= 64;
  return Buffer.from(key).toString('base64');
}
