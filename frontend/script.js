const API_KEY = "YOUR_GEMINI_API_KEY";
const MODEL = "gemini-2.5-flash";

const API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const msg = document.getElementById("msg");
const send = document.getElementById("send");
const chat = document.getElementById("chat");
const micBtn = document.getElementById("mic-btn");
const camBtn = document.getElementById("cam-btn");
const imgInput = document.getElementById("img-input");
const clearBtn = document.getElementById("clear-btn");
const systemStatus = document.getElementById("system-status");

let selectedImage = null;
let conversation = [];

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = type === "user"
    ? "user-message"
    : "bot-message";

  div.textContent =
    (type === "user" ? "YOU: " : "J.A.R.V.I.S: ") + text;

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function executeCommand() {
  const question = msg.value.trim();

  if (!question && !selectedImage) return;

  if (API_KEY === "YOUR_GEMINI_API_KEY") {
    addMessage("Please configure your Gemini API key first.", "bot");
    return;
  }

  addMessage(question || "Analyze this image.", "user");

  const image = selectedImage;
  msg.value = "";
  selectedImage = null;
  imgInput.value = "";

  send.disabled = true;
  systemStatus.textContent = "PROCESSING COMMAND...";

  const parts = [{
    text: question || "Describe and analyze this image."
  }];

  if (image) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data
      }
    });
  }

  const contents = [
    ...conversation,
    {
      role: "user",
      parts
    }
  ];

  try {
    const response = await fetch(
      `${API_URL}?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are J.A.R.V.I.S., a helpful, intelligent and polite personal AI assistant. Address the user as Sir when appropriate. Give clear and useful answers."
            }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || `API error ${response.status}`
      );
    }

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      throw new Error("Gemini returned an empty response.");
    }

    addMessage(answer, "bot");

    conversation.push(
      { role: "user", parts },
      {
        role: "model",
        parts: [{ text: answer }]
      }
    );

    speak(answer);

  } catch (error) {
    addMessage("SYSTEM ERROR: " + error.message, "bot");
    console.error(error);
  } finally {
    send.disabled = false;
    systemStatus.textContent = "SYSTEM READY";
    msg.focus();
  }
}

// Send command
send.addEventListener("click", executeCommand);

msg.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    executeCommand();
  }
});

// Text to speech
function speak(text) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  speech.rate = 1;
  speech.pitch = 1;

  speechSynthesis.speak(speech);
}

// Voice recognition
const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener("click", () => {
    try {
      recognition.start();
      systemStatus.textContent = "LISTENING...";
    } catch (error) {
      addMessage("Microphone is already active.", "bot");
    }
  });

  recognition.onresult = event => {
    msg.value = event.results[0][0].transcript;
    executeCommand();
  };

  recognition.onerror = event => {
    addMessage("VOICE ERROR: " + event.error, "bot");
    systemStatus.textContent = "SYSTEM READY";
  };

  recognition.onend = () => {
    systemStatus.textContent = "SYSTEM READY";
  };
} else {
  micBtn.addEventListener("click", () => {
    addMessage(
      "Voice recognition is not supported in this browser.",
      "bot"
    );
  });
}

// Image upload
camBtn.addEventListener("click", () => {
  imgInput.click();
});

imgInput.addEventListener("change", event => {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    addMessage("Please select an image file.", "bot");
    return;
  }

  if (file.size > 4 * 1024 * 1024) {
    addMessage("Image must be smaller than 4 MB.", "bot");
    imgInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const base64 = reader.result.split(",")[1];

    selectedImage = {
      mimeType: file.type,
      data: base64
    };

    addMessage("Image selected: " + file.name, "bot");
  };

  reader.onerror = () => {
    addMessage("Unable to read this image.", "bot");
  };

  reader.readAsDataURL(file);
});

// Clear chat and conversation
clearBtn.addEventListener("click", () => {
  conversation = [];
  chat.replaceChildren();

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  selectedImage = null;
  imgInput.value = "";

  addMessage("Chat history cleared. System ready.", "bot");
});
