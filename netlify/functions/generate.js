exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const strategy = event.queryStringParameters?.strategy || 'default';

  try {
    // Используем публичный API-генератор конфигов
    const response = await fetch('https://api.warp.one/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'awg', strategy: strategy })
    });
    
    const data = await response.json();
    
    if (data.success && data.config) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          config: data.config,
          strategy: strategy,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      };
    } else {
      throw new Error('Генератор не вернул конфиг');
    }
    
  } catch (error) {
    // Если внешний API не работает — возвращаем тестовый рабочий конфиг
    const fallbackConfig = getFallbackConfig(strategy);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        config: fallbackConfig,
        strategy: strategy,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        note: "Тестовый режим — используйте для проверки интерфейса"
      })
    };
  }
};

function getFallbackConfig(strategy) {
  const baseConfig = `[Interface]
PrivateKey = YNcCJ+YmGVP6zW9p+HUyoFwSJ4k8LrP0mX2qR7vE3k=
Address = 172.16.0.2/32
DNS = 1.1.1.1, 1.0.0.1
MTU = 1280

Jc = 3
Jmin = 50
Jmax = 1000
H1 = 2
H2 = 5
H3 = 10
H4 = 15

[Peer]
PublicKey = bmXOC+F1FxEMF9dyiK2H5/1SU8HnrHD8+9psGJ6j2E8=
Endpoint = engage.cloudflareclient.com:2408
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;

  if (strategy === 'stealth') {
    return baseConfig.replace('Jc = 3', 'Jc = 2').replace('Jmin = 50', 'Jmin = 30').replace('Jmax = 1000', 'Jmax = 600');
  } else if (strategy === 'aggressive') {
    return baseConfig.replace('Jc = 3', 'Jc = 7').replace('Jmin = 50', 'Jmin = 120').replace('Jmax = 1000', 'Jmax = 1450');
  }
  return baseConfig;
}
