// ========================================
// J.A.R.V.I.S MOBILE EDITION
// Gemini AI + Voice Assistant
// ========================================

// 1. GEMINI API CONFIGURATION

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {
    API_KEY = prompt("Enter your Gemini API Key:");

    if (API_KEY) {
        localStorage.setItem("jarvis_key", API_KEY.trim());
        API_KEY = API_KEY.trim();
    }
}

// Use currently supported model IDs
const MODELS = [
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite"
];

// 2. HTML ELEMENTS

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const voiceBtn = document.getElementById("voiceBtn");

let isLoading = false;

// 3. CHAT MESSAGE FUNCTION

function add(message, type) {
    const div = document.createElement("div");

    div.className = "msg " + type;
    div.innerText = message;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;

    return div;
}

// 4. GEMINI AI CONNECTION

async function callGemini(promptText) {

    if (!API_KEY) {
        throw new Error("API KEY NOT FOUND");
    }

    let lastError;

    for (const model of MODELS) {

        try {

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        systemInstruction: {
                            parts: [{
                                text: "You are J.A.R.V.I.S, a friendly and intelligent mobile AI assistant. Respond clearly, helpfully and naturally. Call the user sir when appropriate."
                            }]
                        },

                        contents: [{
                            role: "user",
                            parts: [{
                                text: promptText
                            }]
                        }],

                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2048
                        }
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                const message =
                    data.error?.message || "Gemini API error";

                lastError = new Error(message);

                // Try another model for model availability errors
                if (
                    response.status === 404 ||
                    response.status === 429 ||
                    response.status >= 500
                ) {
                    continue;
                }

                throw lastError;
            }

            const answer =
                data.candidates?.[0]?.content?.parts
                    ?.map(part => part.text || "")
                    .join("")
                    .trim();

            if (!answer) {
                throw new Error("Empty AI response");
            }

            return answer;

        } catch (error) {

            lastError = error;

            if (
                error.message === "Failed to fetch" ||
                error.name === "TypeError"
            ) {
                throw error;
            }
        }
    }

    throw lastError || new Error("All models failed");
}

// 5. ASK JARVIS

async function askGemini(message) {

    if (isLoading) return;

    isLoading = true;
    sendBtn.disabled = true;

    const thinking = add(
        "J.A.R.V.I.S: Processing your request...",
        "ai"
    );

    try {

        const reply = await callGemini(message);

        thinking.innerText = "J.A.R.V.I.S: " + reply;

        // Speak AI response
        speak(reply);

    } catch (error) {

        thinking.innerText =
            "J.A.R.V.I.S ERROR: " + error.message;

        console.error(error);

    } finally {

        isLoading = false;
        sendBtn.disabled = false;

        chat.scrollTop = chat.scrollHeight;
    }
}

// 6. TEXT MESSAGE SEND

function sendMessage() {

    const message = input.value.trim();

    if (!message || isLoading) return;

    add("YOU: " + message, "user");

    input.value = "";

    askGemini(message);
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        sendMessage();
    }

});

// 7. VOICE RECOGNITION

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() {

        voiceBtn.innerText = "🔴 LISTENING...";
        voiceBtn.disabled = true;

    };

    recognition.onresult = function(event) {

        const spokenText =
            event.results[0][0].transcript;

        input.value = spokenText;

        add("YOU: " + spokenText, "user");

        input.value = "";

        askGemini(spokenText);

    };

    recognition.onerror = function(event) {

        add(
            "VOICE ERROR: " + event.error,
            "ai"
        );

    };

    recognition.onend = function() {

        voiceBtn.innerText = "🎤 ACTIVATE VOICE";
        voiceBtn.disabled = false;

    };

    voiceBtn.addEventListener("click", function() {

        try {
            recognition.start();
        } catch (error) {
            console.error(error);
        }

    });

} else {

    voiceBtn.disabled = true;
    voiceBtn.innerText = "VOICE NOT SUPPORTED";

}

// 8. TEXT TO SPEECH

let voices = [];

function loadVoices() {

    voices = window.speechSynthesis.getVoices();

}

if ("speechSynthesis" in window) {

    loadVoices();

    speechSynthesis.onvoiceschanged = loadVoices;

}

function speak(text) {

    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.rate = 1.0;
    speech.pitch = 0.85;
    speech.volume = 1;

    const voice = voices.find(v =>
        v.lang === "en-IN"
    ) || voices.find(v =>
        v.lang.startsWith("en")
    );

    if (voice) {
        speech.voice = voice;
    }

    speechSynthesis.speak(speech);

}

// 9. STARTUP MESSAGE

console.log("J.A.R.V.I.S MOBILE SYSTEM READY");
