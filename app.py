import os
import base64
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory, Response
from dotenv import load_dotenv

load_dotenv()

# --- Gemini Setup ---
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

# Model for text chat
text_model = genai.GenerativeModel('gemini-2.5-flash-lite')
chat_session = text_model.start_chat(history=[])

# Model for image generation
image_model = genai.GenerativeModel('gemini-2.5-flash-image')
# --- End of Setup ---

app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    history = request.json.get('history', [])
    
    try:
        if user_message.lower().startswith('generate image '):
            prompt = user_message[len('generate image '):]

            response = image_model.generate_content(prompt)
            image_data = response.parts[0].inline_data.data
            base64_string = base64.b64encode(image_data).decode('utf-8')
            return jsonify({'image_base64': base64_string})

        else:
            chat_session = text_model.start_chat(history=history)
            def generate():
                response = chat_session.send_message(user_message, stream=True)
                for chunk in response:
                    yield chunk.text
            
            return Response(generate(), mimetype='text/event-stream')

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'response': f'Sorry, I encountered an error: {e}'}), 500    

if __name__ == '__main__':
    app.run(debug=True)
