from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import re
import re
import numpy as np
import cv2
from deepface import DeepFace

app = Flask(__name__)
CORS(app)

@app.route('/api/process_webcam', methods=['POST'])
def process_webcam():
    data = request.get_json()
    image_data = data.get('image')
    if not image_data:
        return jsonify({'error': 'No image data provided'}), 400

    # Remove the header of the data URL
    match = re.match(r'data:image/(png|jpeg);base64,(.*)', image_data)
    if not match:
        return jsonify({'error': 'Invalid image data'}), 400

    image_b64 = match.group(2)
    try:
        image_bytes = base64.b64decode(image_b64)
        # Process image_bytes as needed
        result = f"Received image of size: {len(image_bytes)} bytes"
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/process-image', methods=['POST'])
def process_image():
    data = request.get_json()
    image_data = data.get('image')
    if not image_data:
        return jsonify({'error': 'No image data provided'}), 400

    # Remove the header of the data URL
    match = re.match(r'data:image/(png|jpeg);base64,(.*)', image_data)
    if not match:
        return jsonify({'error': 'Invalid image data'}), 400

    image_b64 = match.group(2)
    try:
        image_bytes = base64.b64decode(image_b64)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Use DeepFace to analyze emotion
        result = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
        if isinstance(result, list):
            result = result[0]
        emotion = result['dominant_emotion']

        return jsonify({'result': f'Detected emotion: {emotion}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/process-audio', methods=['POST'])
def process_audio():
    data = request.get_json()
    transcript = data.get('transcript')
    if not transcript:
        return jsonify({'error': 'No transcript provided'}), 400
    # Here you can process the transcript, e.g., analyze sentiment, save, etc.
    return jsonify({'result': f'Received transcript: {transcript}'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)