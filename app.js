const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const message = userInput.value.trim();
    if (message !== '') {
        const userMessageElement = document.createElement('div');
        userMessageElement.textContent = `You: ${message}`;
        chatBox.appendChild(userMessageElement);
        userInput.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;

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
                body: JSON.stringify({ message: message })
            });
            const data = await response.json();

            chatBox.removeChild(loadingElement);

            if (data.image_base64) {
                // If we received image data, create an image element
                const botImageElement = document.createElement('img');
                // The 'src' is a special "data URI" for embedding images
                botImageElement.src = `data:image/png;base64,${data.image_base64}`;
                botImageElement.style.maxWidth = '100%';
                botImageElement.style.borderRadius = '8px';
                chatBox.appendChild(botImageElement);
            } else {
                // Otherwise, display the text response
                const botResponseElement = document.createElement('div');
                botResponseElement.textContent = `Bot: ${data.response}`;
                chatBox.appendChild(botResponseElement);
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

