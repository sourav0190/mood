from flask import Flask, render_template, Response, request, jsonify
from fer.fer import FER
import cv2
import numpy as np
import base64

app = Flask(__name__)

# Initialize emotion detector
detector = FER(mtcnn=True) # Use MTCNN for better face detection accuracy if possible, otherwise default is fine. standard FER is ok.
# Let's stick to standard FER for speed if no GPU, but usually MTCNN is robust. 
# actually let's re-init standard FER as previous to avoid heavy deps if not needed, 
# but user asked for "perfect", so let's stick to what works well. 
# The previous code used default FER().

detector = FER()

# Define a dictionary for emotion suggestions
emotion_suggestions = {
    "angry": "Take a deep breath. Inhale... Exhale. Count to ten slowly.",
    "disgust": "Shift your focus to something pleasant. Drink some water.",
    "fear": "Ground yourself. Name 5 things you can see, 4 you can touch.",
    "happy": "Enjoy this moment! Spread your positivity to someone else.",
    "sad": "It's okay to feel this way. Be kind to yourself today.",
    "surprise": "Embrace the unexpected! Stay curious.",
    "neutral": "A calm mind is a powerful mind. Stay balanced."
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze_emotion', methods=['POST'])
def analyze_emotion():
    try:
        data = request.json
        image_data = data.get('image')

        if not image_data:
            return jsonify({'error': 'No image provided'}), 400

        # Decode base64 image
        header, encoded = image_data.split(",", 1)
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Detect emotion
        emotion, score = detector.top_emotion(frame)
        
        # Fallback if no face detected
        if emotion is None:
             return jsonify({
                'emotion': 'No face detected',
                'suggestion': 'Please align your face with the camera.'
            })

        suggestion = emotion_suggestions.get(emotion, "Stay mindful and present.")

        return jsonify({
            'emotion': emotion,
            'suggestion': suggestion
        })

    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
