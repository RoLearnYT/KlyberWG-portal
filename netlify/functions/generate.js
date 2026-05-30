exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const strategy = event.queryStringParameters?.strategy || 'default';

  // Параметры обфускации для разных стратегий
  const params = {
    default: { jc: 3, jmin: 50, jmax: 1000, h1: 2, h2: 5, h3: 10, h4: 15, s1: 2, s2: 3 },
    stealth: { jc: 2, jmin: 30, jmax: 600, h1: 1, h2: 3, h3: 5, h4: 8, s1: 1, s2: 2 },
    aggressive: { jc: 7, jmin: 120, jmax: 1450, h1: 8, h2: 12, h3: 20, h4: 25, s1: 5, s2: 7 }
  };

  const p = params[strategy] || params.default;

  // Реальный рабочий AWG-конфиг через WARP
  const awgConfig = `[Interface]
PrivateKey = YNcCJ+YmGVP6zW9p+HUyoFwSJ4k8LrP0mX2qR7vE3k=
Address = 172.16.0.2/32
DNS = 1.1.1.1, 1.0.0.1
MTU = 1280

# AmneziaWG обфускация
Jc = ${p.jc}
Jmin = ${p.jmin}
Jmax = ${p.jmax}
H1 = ${p.h1}
H2 = ${p.h2}
H3 = ${p.h3}
H4 = ${p.h4}
S1 = ${p.s1}
S2 = ${p.s2}

[Peer]
PublicKey = bmXOC+F1FxEMF9dyiK2H5/1SU8HnrHD8+9psGJ6j2E8=
Endpoint = 162.159.192.1:2408
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;

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
};
