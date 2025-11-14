const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const newChatButton = document.getElementById('new-chat-button');

// It should be an array of objects, where each object has a "role" and "parts" key.
// For example: let history = [];
let history = [];

newChatButton.addEventListener('click', newChat);
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

async function newChat() {
    history = [];
    chatBox.innerHTML = '';
    userInput.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (message !== '') {
        const userMessageElement = document.createElement('div');
        userMessageElement.textContent = `You: ${message}`;
        chatBox.appendChild(userMessageElement);
        userInput.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;

        history.push ( { role: 'user', parts: [message] } );
        const loadingElement = document.createElement('div');
        loadingElement.textContent = 'Bot is thinking...';
        chatBox.appendChild(loadingElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message, history: history })
            });
            // Check the content type to decide how to handle the response
            const contentType = response.headers.get('content-type');
            chatBox.removeChild(loadingElement);

            if (contentType && contentType.includes('application/json')) {
                // It's an image response
                const data = await response.json();
                const botImageElement = document.createElement('img');
                botImageElement.src = `data:image/png;base64,${data.image_base64}`;
                botImageElement.style.maxWidth = '100%';
                botImageElement.style.borderRadius = '8px';
                chatBox.appendChild(botImageElement);
            } else {
                // It's a text stream
                const botResponseContainer = document.createElement('div');
                botResponseContainer.textContent = 'Bot: ';
                chatBox.appendChild(botResponseContainer);

                const textDecoder = new TextDecoder();
                const reader = response.body.getReader();
                let botResponse = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    const decodedChunk = textDecoder.decode(value, { stream: true });
                    botResponse += decodedChunk;
                    // We will handle the rendering after the full response is received.
                    // For now, we can just show the raw text streaming in.
                    botResponseContainer.textContent = 'Bot: ' + botResponse;
                    chatBox.scrollTop = chatBox.scrollHeight;
                }

                botResponseContainer.textContent = 'Bot: ';
                const parts = botResponse.split('```');
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (i % 2 === 0) {
                        botResponseContainer.appendChild(document.createTextNode(part));
                    } else {
                        const preElement = document.createElement('pre');
                        const codeElement = document.createElement('code');
                        codeElement.textContent = part;
                        preElement.appendChild(codeElement);
                        botResponseContainer.appendChild(preElement);
                    }
                }
                hljs.highlightAll();
                history.push ({ role: 'model', parts: [botResponse] });
            }

            chatBox.scrollTop = chatBox.scrollHeight;
        } catch (error) {
            console.error('Error:', error);
            const errorElement = document.createElement('div');
            errorElement.textContent = 'Error: Could not connect to the server.';
            chatBox.removeChild(loadingElement);
            chatBox.appendChild(errorElement);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }
}

