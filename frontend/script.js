
// =================================
// JARVIS MOBILE AI ASSISTANT
// =================================

const commandInput = document.getElementById("command");
const response = document.getElementById("response");
const status = document.getElementById("status");

// JARVIS VOICE RESPONSE
function speak(text) {
    if (!("speechSynthesis" in window)) {
        response.innerText = text;
        return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
}

// DISPLAY RESPONSE
function showResponse(text) {
    response.innerText = text;
    speak(text);
}

// PROCESS COMMANDS
function runCommand() {

    const cmd = commandInput.value.toLowerCase().trim();

    if (!cmd) {
        showResponse("Please enter a command, Sir.");
        return;
    }

    let answer = "";

    if (cmd.includes("hello") || cmd.includes("hi")) {
        answer = "Hello Sir! I am Jarvis. How can I help you?";
    }

    else if (cmd.includes("your name")) {
        answer = "My name is Jarvis, your personal AI assistant.";
    }

    else if (cmd.includes("how are you")) {
        answer = "I am doing great, Sir. Always ready to help you.";
    }

    else if (cmd.includes("time")) {
        answer = "The current time is " +
            new Date().toLocaleTimeString();
    }

    else if (cmd.includes("date")) {
        answer = "Today's date is " +
            new Date().toLocaleDateString();
    }

    else if (cmd.includes("open google")) {
        answer = "Opening Google, Sir.";
        showResponse(answer);
        window.open("https://www.google.com", "_blank");
        return;
    }

    else if (cmd.includes("open youtube")) {
        answer = "Opening YouTube, Sir.";
        showResponse(answer);
        window.open("https://www.youtube.com", "_blank");
        return;
    }

    else if (cmd.startsWith("search ")) {
        const query = cmd.replace("search ", "");
        answer = "Searching Google for " + query;
        showResponse(answer);

        window.open(
            "https://www.google.com/search?q=" +
            encodeURIComponent(query),
            "_blank"
        );
        return;
    }

    else if (cmd.includes("stop speaking")) {
        window.speechSynthesis.cancel();
        response.innerText = "Voice stopped, Sir.";
        return;
    }

    else if (cmd.includes("thank you")) {
        answer = "You are welcome, Sir.";
    }

    else {
        answer = "Sorry Sir, I don't understand that command.";
    }

    showResponse(answer);
}

// MOBILE VOICE RECOGNITION
function startListening() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        showResponse(
            "Voice recognition is not supported. Please use Chrome on Android."
        );
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    status.innerText = "● LISTENING...";

    recognition.onresult = function(event) {

        const voiceText =
            event.results[0][0].transcript;

        commandInput.value = voiceText;

        runCommand();
    };

    recognition.onerror = function(event) {
        response.innerText =
            "Microphone error: " + event.error;
    };

    recognition.onend = function() {
        status.innerText = "● SYSTEM ONLINE";
    };

    try {
        recognition.start();
    } catch (error) {
        response.innerText = "Please try again.";
    }
}

// ENTER BUTTON SUPPORT
commandInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        runCommand();
    }
});

console.log("JARVIS MOBILE SYSTEM INITIALIZED");
