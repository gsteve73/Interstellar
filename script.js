// Configuración
// REEMPLAZA ESTO CON TU URL DE N8N (Producción)
const N8N_WEBHOOK_URL = 'https://tu-instancia-n8n.com/webhook/mi-clinica-chat';

function toggleChat() {
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget.style.display === 'none' || chatWidget.style.display === '') {
        chatWidget.style.display = 'flex';
    } else {
        chatWidget.style.display = 'none';
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const message = inputField.value.trim();
    const chatBody = document.getElementById('chat-body');

    if (message === "") return;

    // 1. Agregar mensaje del usuario a la UI
    addMessageToUI(message, 'user-message');
    inputField.value = '';

    // 2. Mostrar indicador de "Escribiendo..." (opcional, simplificado aquí)
    const loadingId = addMessageToUI('Escribiendo...', 'bot-message', true);

    try {
        // 3. Enviar a n8n
        // Supuesto: Tu n8n Webhook espera un método POST y un JSON { "chatInput": "mensaje" }
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chatInput: message })
        });

        if (!response.ok) throw new Error('Error en la red');

        const data = await response.json();
        
        // 4. Eliminar mensaje de carga
        removeMessageFromUI(loadingId);

        // 5. Mostrar respuesta de n8n
        // Supuesto: Tu n8n responde con un JSON { "output": "respuesta del agente" }
        // Ajusta 'output' según la clave que devuelva tu nodo final en n8n
        const botResponse = data.output || data.text || "Lo siento, no pude procesar tu respuesta.";
        addMessageToUI(botResponse, 'bot-message');

    } catch (error) {
        console.error('Error:', error);
        removeMessageFromUI(loadingId);
        addMessageToUI("Lo siento, hubo un error de conexión con el servidor.", 'bot-message');
    }
}

function addMessageToUI(text, className, isLoading = false) {
    const chatBody = document.getElementById('chat-body');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', className);
    messageDiv.innerText = text;
    
    // Generar ID único si es mensaje de carga
    const id = isLoading ? 'loading-' + Date.now() : null;
    if (id) messageDiv.id = id;

    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight; // Auto-scroll al final
    return id;
}

function removeMessageFromUI(id) {
    if (!id) return;
    const element = document.getElementById(id);
    if (element) element.remove();
}
