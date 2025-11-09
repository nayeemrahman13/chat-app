import os
import base64
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

load_dotenv()

# --- Gemini Setup ---
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

# Model for text chat
text_model = genai.GenerativeModel('gemini-1.5-flash')
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
    
    try:
        if user_message.lower().startswith('generate image '):
            prompt = user_message[len('generate image '):]

            # --- This is the section for you to complete ---
            # TODO:
            # 1. Call the `image_model` to generate content using the `prompt`.
            #    Hint: `response = image_model.generate_content(prompt)`
            # 2. The raw image data is in the first part of the response.
            #    Hint: `image_data = response.parts[0].inline_data.data`
            # 3. Encode the `image_data` into a Base64 string.
            #    Hint: `base64_string = base64.b64encode(image_data).decode('utf-8')`
            # 4. Return a JSON object with the key 'image_base64' and the encoded string as the value.
            #    Hint: `return jsonify({'image_base64': base64_string})`
            response = image_model.generate_content(prompt)
            image_data = response.parts[0].inline_data.data
            base64_string = base64.b64encode(image_data).decode('utf-8')
            return jsonify({'image_base64': base64_string})
            # --- End of section for you to complete ---

        else:
            # Existing logic for text chat
            response = chat_session.send_message(user_message)
            return jsonify({'response': response.text})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'response': f'Sorry, I encountered an error: {e}'}), 500


if __name__ == '__main__':
    app.run(debug=True)
