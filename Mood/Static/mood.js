const video = document.getElementById('videoElement');
const canvas = document.getElementById('canvasElement');
const context = canvas.getContext('2d');
const emotionIcon = document.getElementById('emotionIcon');
const emotionLabel = document.getElementById('emotionLabel');
const suggestionText = document.getElementById('suggestionText');
const startBtn = document.getElementById('startBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

let isStreaming = false;
let intervalId = null;

// Emotion to Emoji Map
const emotionEmojis = {
    "angry": "😠",
    "disgust": "🤢",
    "fear": "😨",
    "happy": "😄",
    "sad": "😢",
    "surprise": "😲",
    "neutral": "😐",
    "No face detected": "👤"
};

// Start Camera
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.play();
        isStreaming = true;
        loadingOverlay.classList.add('hidden');
        startBtn.textContent = 'Analyzing...';
        startBtn.disabled = true;

        // Start sending frames
        startAnalysis();
    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert("Could not access camera. Please allow camera permissions.");
        loadingOverlay.innerHTML = "<p>Camera Access Denied</p>";
    }
}

// Capture and Send Frame
function startAnalysis() {
    intervalId = setInterval(async () => {
        if (!isStreaming) return;

        // Draw video frame to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const dataURL = canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality

        // Send to backend
        try {
            const response = await fetch('/analyze_emotion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: dataURL })
            });

            const data = await response.json();
            
            if (data.error) {
                console.error(data.error);
                return;
            }

            updateUI(data.emotion, data.suggestion);

        } catch (error) {
            console.error("Error communicating with server:", error);
        }

    }, 2000); // Analyze every 2 seconds to reduce load
}

function updateUI(emotion, suggestion) {
    if (!emotion) return;
    
    emotionLabel.textContent = emotion;
    suggestionText.textContent = suggestion;
    
    if (emotionEmojis[emotion]) {
        emotionIcon.textContent = emotionEmojis[emotion];
    } else {
        emotionIcon.textContent = "🤔";
    }
}

// Event Listeners
startBtn.addEventListener('click', () => {
    if (!isStreaming) {
        startCamera();
    }
});
