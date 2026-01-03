const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('startBtn');
const emotionLabel = document.getElementById('emotionLabel');
const emotionIcon = document.getElementById('emotionIcon');
const suggestionText = document.getElementById('suggestionText');

// Load models from CDN
// Using a reliable CDN for models. 
// We need 'tiny_face_detector' (faster) or 'ssd_mobilenetv1' (more accurate) and 'face_expression_model'.
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

const emotionSuggestions = {
    "angry": "Take a deep breath. Inhale... Exhale. Count to ten slowly.",
    "disgusted": "Shift your focus to something pleasant. Drink some water.",
    "fearful": "Ground yourself. Name 5 things you can see, 4 you can touch.",
    "happy": "Enjoy this moment! Spread your positivity to someone else.",
    "neutral": "A calm mind is a powerful mind. Stay balanced.",
    "sad": "It's okay to feel this way. Be kind to yourself today.",
    "surprised": "Embrace the unexpected! Stay curious."
};

const emotionEmojis = {
    "angry": "😠",
    "disgusted": "🤢",
    "fearful": "😨",
    "happy": "😄",
    "neutral": "😐",
    "sad": "😢",
    "surprised": "😲"
};

startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    startBtn.innerText = "Loading AI Models...";
    
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ]).then(startVideo).catch(err => {
        console.error(err);
        startBtn.innerText = "Error Loading Models";
        alert("Failed to load AI models. Check console.");
    });
});

function startVideo() {
    startBtn.innerText = "Starting Camera...";
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error(err);
            startBtn.innerText = "Camera Error";
            alert("Please enable camera access.");
        });
}

video.addEventListener('play', () => {
    // Create canvas matching video
    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 }; 
    // Wait for video metadata to load dimensions if they are 0
    if (displaySize.width === 0) {
        // Retry shortly
        setTimeout(() => video.dispatchEvent(new Event('play')), 100);
        return;
    }

    faceapi.matchDimensions(canvas, displaySize);

    startBtn.style.display = 'none'; // Hide button once started

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Clear previous drawings
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw detections
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        if (detections.length > 0) {
            // Get the dominant emotion
            const expressions = detections[0].expressions;
            const emotions = Object.keys(expressions);
            let maxEmotion = emotions[0];
            let maxScore = expressions[maxEmotion];

            for (const emotion of emotions) {
                if (expressions[emotion] > maxScore) {
                    maxScore = expressions[emotion];
                    maxEmotion = emotion;
                }
            }

            // Update UI
            updateUI(maxEmotion);
        } else {
            emotionLabel.innerText = "Looking for face...";
            emotionIcon.innerText = "🧐";
        }
    }, 100);
});

function updateUI(emotion) {
    emotionLabel.innerText = emotion;
    
    // Suggestion
    if (emotionSuggestions[emotion]) {
        suggestionText.innerText = emotionSuggestions[emotion];
    }

    // Emoji
    if (emotionEmojis[emotion]) {
        emotionIcon.innerText = emotionEmojis[emotion];
    }
}
