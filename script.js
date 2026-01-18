const N8N_WEBHOOK_URL = 'https://gomezzbryan1.app.n8n.cloud/webhook/8f427031-1110-4ea3-aef7-5d06ba7d5bce/chat';

async function sendMessage() {
  const inputField = document.getElementById('user-input');
  const chatBody = document.getElementById('chat-body');
  const message = (inputField.value || '').trim();
  if (!message) return;

  addMessageToUI(message, 'user-message');
  inputField.value = '';

  const loadingId = addMessageToUI('Escribiendo...', 'bot-message', true);

  try {
    // ⛔️ Evita preflight: NO mandes application/json
    // Envia como x-www-form-urlencoded
    const body = new URLSearchParams({ chatInput: message });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const t = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status} ${response.statusText} :: ${t}`);
    }

    // Puede venir JSON o texto (según Respond to Webhook / Webhook response settings)
    const contentType = response.headers.get('content-type') || '';
    let payload;

    if (contentType.includes('application/json')) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    removeMessageFromUI(loadingId);

    const botResponse = extractBotText(payload);
    addMessageToUI(botResponse, 'bot-message');

  } catch (error) {
    console.error('Error:', error);
    removeMessageFromUI(loadingId);

    const msg =
      error.name === 'AbortError'
        ? 'Se agotó el tiempo de espera. Intenta de nuevo.'
        : 'Lo siento, hubo un error de conexión con el servidor.';

    addMessageToUI(msg, 'bot-message');
  }
}

// Extrae texto tanto si n8n devuelve array, objeto o texto plano
function extractBotText(payload) {
  // Si es texto plano, úsalo directo
  if (typeof payload === 'string') return payload.trim() || 'Listo ✅';

  // Si viene como array, toma el primer item
  const data = Array.isArray(payload) ? (payload[0] || {}) : (payload || {});

  // Ajusta aquí según lo que devuelva tu último nodo
  return (
    data.output ||
    data.text ||
    data.message ||
    data.response ||
    (data.data && (data.data.output || data.data.text)) ||
    'Lo siento, no pude procesar tu solicitud.'
  );
}
