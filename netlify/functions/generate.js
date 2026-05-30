exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Обработка preflight OPTIONS запроса
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const strategy = event.queryStringParameters?.strategy || 'default';

  try {
    // 1. Регистрируем устройство в Cloudflare WARP
    const registerRes = await fetch('https://api.cloudflareclient.com/v0a2158/reg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        install_id: generateInstallId(),
        tos: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
        type: 'Android'
      })
    });

    const device = await registerRes.json();

    // 2. Получаем конфиг
    const configRes = await fetch('https://api.cloudflareclient.com/v0a2158/config', {
      headers: { 'Authorization': `Bearer ${device.token}` }
    });

    const warpConfig = await configRes.json();

    // 3. Преобразуем в AWG формат
    const awgConfig = convertToAWG(warpConfig, strategy);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        config: awgConfig,
        strategy: strategy,
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

function convertToAWG(warpConfig, strategy) {
  const strategies = {
    default: { jc: 3, jmin: 50, jmax: 1000, h1: 2, h2: 5, h3: 10, h4: 15 },
    aggressive: { jc: 7, jmin: 120, jmax: 1450, h1: 8, h2: 12, h3: 20, h4: 25 },
    stealth: { jc: 2, jmin: 30, jmax: 600, h1: 1, h2: 3, h3: 5, h4: 8 }
  };

  const params = strategies[strategy] || strategies.default;

  return `[Interface]
PrivateKey = ${warpConfig.private_key}
Address = ${warpConfig.addresses[0]}
DNS = 1.1.1.1, 1.0.0.1
MTU = 1280

Jc = ${params.jc}
Jmin = ${params.jmin}
Jmax = ${params.jmax}
H1 = ${params.h1}
H2 = ${params.h2}
H3 = ${params.h3}
H4 = ${params.h4}

[Peer]
PublicKey = ${warpConfig.peers[0].public_key}
Endpoint = ${warpConfig.peers[0].endpoint.host}:${warpConfig.peers[0].endpoint.ports[0]}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`;
}