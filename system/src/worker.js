// Cloudflare Workers代理服务器
// 用于保护DeepSeek API密钥

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return handleCORS()
  }

  const url = new URL(request.url)
  
  // 只处理/api/deepseek路径
  if (url.pathname !== '/api/deepseek') {
    return new Response('Not Found', { status: 404 })
  }

  // 只允许POST请求
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    // 获取请求体
    const requestBody = await request.json()
    
    // 从环境变量获取API密钥
    const apiKey = DEEPSEEK_API_KEY
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'API key not configured' }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders()
          }
        }
      )
    }

    // 调用DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    const responseData = await deepseekResponse.json()
    
    return new Response(JSON.stringify(responseData), {
      status: deepseekResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        }
      }
    )
  }
}

// 处理CORS预检请求
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: getCORSHeaders()
  })
}

// 获取CORS头部
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }
}