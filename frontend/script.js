// =====================================================
// CATBOT AI - Frontend JavaScript
// Connected to Node.js + Gemini Backend
// =====================================================


// =====================================================
// State & Initialization
// =====================================================

const state = {
    messages: [],
    isListening: false,
    isSpeaking: false
};


// =====================================================
// DOM Elements
// =====================================================

const DOM = {
    body: document.body,
    chatContainer: document.getElementById('chat-container'),
    messagesWrapper: document.getElementById('messages-wrapper'),
    welcomeScreen: document.getElementById('welcome-screen'),
    messageInput: document.getElementById('message-input'),
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('sidebar-overlay'),
    listeningIndicator: document.getElementById('listening-indicator'),
    micBtn: document.getElementById('mic-btn')
};


// =====================================================
// Initialize App
// =====================================================

function init() {
    loadTheme();
    loadChat();
    setupEventListeners();
    initSpeechRecognition();
}


// =====================================================
// Theme Management
// =====================================================

function toggleTheme() {
    const currentTheme = DOM.body.getAttribute('data-theme');

    const newTheme =
        currentTheme === 'dark'
            ? 'light'
            : 'dark';

    DOM.body.setAttribute('data-theme', newTheme);

    localStorage.setItem(
        'catbot_theme',
        newTheme
    );
}


function loadTheme() {
    const savedTheme =
        localStorage.getItem('catbot_theme') || 'dark';

    DOM.body.setAttribute(
        'data-theme',
        savedTheme
    );
}


// =====================================================
// Mobile Sidebar
// =====================================================

function toggleSidebar() {

    if (!DOM.sidebar || !DOM.overlay) {
        return;
    }

    DOM.sidebar.classList.toggle('active');

    DOM.overlay.classList.toggle('active');
}


// =====================================================
// Input Handling
// =====================================================

function setupEventListeners() {

    if (!DOM.messageInput) {
        console.error('Message input not found.');
        return;
    }


    // Auto-grow textarea
    DOM.messageInput.addEventListener(
        'input',
        function () {

            this.style.height = 'auto';

            this.style.height =
                this.scrollHeight + 'px';

            if (this.value === '') {
                this.style.height = 'auto';
            }
        }
    );


    // Press Enter to send
    DOM.messageInput.addEventListener(
        'keydown',
        function (e) {

            if (
                e.key === 'Enter' &&
                !e.shiftKey
            ) {

                e.preventDefault();

                handleSend();
            }
        }
    );
}


// =====================================================
// Suggestion Buttons
// =====================================================

function useSuggestion(text) {

    if (!DOM.messageInput) {
        return;
    }

    DOM.messageInput.value = text;

    handleSend();
}


// =====================================================
// CHAT LOGIC
// =====================================================

async function handleSend() {

    const text =
        DOM.messageInput.value.trim();


    // Don't send empty message
    if (!text) {
        return;
    }


    // Reset input
    DOM.messageInput.value = '';

    DOM.messageInput.style.height = 'auto';


    // Hide welcome screen
    if (DOM.welcomeScreen) {
        DOM.welcomeScreen.classList.add('hidden');
    }


    // Show user message
    addUserMessage(text);

    saveMessage(
        'user',
        text
    );


    // Show typing indicator
    showTypingIndicator();


    try {

        // =================================================
        // SEND MESSAGE TO BACKEND
        // =================================================

        const response = await fetch(
            'https://catbot-ai.onrender.com/api/chat',
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({
                    message: text
                })
            }
        );


        // Convert response to JSON
        const data =
            await response.json();


        // Remove typing animation
        removeTypingIndicator();


        // Backend error
        if (!response.ok) {

            throw new Error(
                data.error ||
                'Server returned an error.'
            );
        }


        // =================================================
        // GEMINI RESPONSE
        // =================================================

        const botReply =
            data.reply ||
            'Sorry, I did not receive a response from Gemini.';


        // Show AI response
        addBotMessage(botReply);


        // Save AI response
        saveMessage(
            'bot',
            botReply
        );


    } catch (error) {

        console.error(
            'CATBOT Error:',
            error
        );


        // Remove typing indicator
        removeTypingIndicator();


        // Error message
        const errorMessage =
            'Sorry, I could not connect to the CATBOT AI server.\n\n' +
            'Please make sure the backend server is running on port 3000.';


        addBotMessage(
            errorMessage
        );


        saveMessage(
            'bot',
            errorMessage
        );
    }
}


// =====================================================
// USER MESSAGE
// =====================================================

function addUserMessage(text) {

    const html = `

        <div class="message-row user">

            <div class="avatar">
                👤
            </div>

            <div class="message-content">

                <div class="message-sender">
                    You
                </div>

                <div class="message-text">
                    ${escapeHTML(text)}
                </div>

            </div>

        </div>

    `;


    DOM.messagesWrapper.insertAdjacentHTML(
        'beforeend',
        html
    );


    scrollToBottom();
}


// =====================================================
// BOT MESSAGE
// =====================================================

function addBotMessage(text) {

    const html = `

        <div class="message-row bot">

            <div class="avatar">
                🤖
            </div>


            <div class="message-content">

                <div class="message-sender">
                    CATBOT
                </div>


                <div class="message-text">
                    ${escapeHTML(text)}
                </div>


                <div class="message-actions">


                    <!-- SPEAK -->

                    <button
                        class="action-btn"
                        aria-label="Read aloud"
                        onclick="speakMessage(this.parentElement.previousElementSibling.innerText)"
                    >

                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >

                            <polygon
                                points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                            />

                            <path
                                d="M15.54 8.46a5 5 0 0 1 0 7.07"
                            />

                            <path
                                d="M19.07 4.93a10 10 0 0 1 0 14.14"
                            />

                        </svg>

                    </button>


                    <!-- COPY -->

                    <button
                        class="action-btn"
                        aria-label="Copy message"
                        onclick="copyText(this)"
                    >

                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >

                            <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                            />

                            <path
                                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                            />

                        </svg>

                    </button>


                    <!-- LIKE -->

                    <button
                        class="action-btn"
                        aria-label="Good response"
                    >

                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >

                            <path
                                d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"
                            />

                            <path
                                d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                            />

                        </svg>

                    </button>


                    <!-- DISLIKE -->

                    <button
                        class="action-btn"
                        aria-label="Bad response"
                    >

                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >

                            <path
                                d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"
                            />

                        </svg>

                    </button>


                    <!-- REGENERATE -->

                    <button
                        class="action-btn"
                        aria-label="Regenerate"
                    >

                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >

                            <path
                                d="M21 2v6h-6"
                            />

                            <path
                                d="M3 12a9 9 0 1 0 2.2-6.1L2 9"
                            />

                        </svg>

                    </button>


                </div>

            </div>

        </div>

    `;


    DOM.messagesWrapper.insertAdjacentHTML(
        'beforeend',
        html
    );


    scrollToBottom();
}


// =====================================================
// TYPING INDICATOR
// =====================================================

function showTypingIndicator() {

    const html = `

        <div
            class="message-row bot"
            id="typing-indicator"
        >

            <div class="avatar">
                🤖
            </div>


            <div class="message-content">

                <div class="message-sender">
                    CATBOT is thinking...
                </div>


                <div class="typing-dots">

                    <span></span>
                    <span></span>
                    <span></span>

                </div>

            </div>

        </div>

    `;


    DOM.messagesWrapper.insertAdjacentHTML(
        'beforeend',
        html
    );


    scrollToBottom();
}


// =====================================================
// REMOVE TYPING INDICATOR
// =====================================================

function removeTypingIndicator() {

    const element =
        document.getElementById(
            'typing-indicator'
        );


    if (element) {
        element.remove();
    }
}


// =====================================================
// SCROLL CHAT
// =====================================================

function scrollToBottom() {

    if (!DOM.chatContainer) {
        return;
    }


    DOM.chatContainer.scrollTo({

        top:
            DOM.chatContainer.scrollHeight,

        behavior:
            'smooth'

    });
}


// =====================================================
// SPEECH RECOGNITION
// Voice → Text
// =====================================================

let recognition = null;


function initSpeechRecognition() {

    window.SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (window.SpeechRecognition) {

        recognition =
            new window.SpeechRecognition();


        recognition.continuous = false;

        recognition.interimResults = false;


        // Speech started
        recognition.onstart = () => {

            state.isListening = true;


            if (DOM.listeningIndicator) {

                DOM.listeningIndicator
                    .classList
                    .remove('hidden');

            }


            if (DOM.micBtn) {

                DOM.micBtn.style.color =
                    '#ef4444';

            }

        };


        // Speech result
        recognition.onresult = (event) => {

            const transcript =
                event.results[0][0]
                    .transcript;


            if (!DOM.messageInput) {
                return;
            }


            DOM.messageInput.value +=
                (
                    DOM.messageInput.value
                        ? ' '
                        : ''
                ) + transcript;


            // Trigger resize
            DOM.messageInput.dispatchEvent(
                new Event('input')
            );

        };


        // Speech error
        recognition.onerror = (event) => {

            console.error(
                'Speech recognition error:',
                event.error
            );


            stopVoiceRecognition();


            alert(
                'Microphone error: ' +
                event.error
            );

        };


        // Speech ended
        recognition.onend = () => {

            stopVoiceRecognition();

        };

    }
}


// =====================================================
// VOICE RECOGNITION TOGGLE
// =====================================================

function toggleVoiceRecognition() {

    if (!recognition) {

        initSpeechRecognition();

    }


    if (!recognition) {

        alert(
            'Your browser does not support Speech Recognition.'
        );

        return;

    }


    if (state.isListening) {

        recognition.stop();

    } else {

        try {

            recognition.start();

        } catch (error) {

            console.error(
                'Voice start error:',
                error
            );

        }

    }
}


// =====================================================
// STOP VOICE RECOGNITION
// =====================================================

function stopVoiceRecognition() {

    state.isListening = false;


    if (DOM.listeningIndicator) {

        DOM.listeningIndicator
            .classList
            .add('hidden');

    }


    if (DOM.micBtn) {

        DOM.micBtn.style.color = '';

    }
}


// =====================================================
// TEXT TO SPEECH
// Text → Voice
// =====================================================

function speakMessage(text) {

    if (!window.speechSynthesis) {

        alert(
            'Text-to-speech is not supported in this browser.'
        );

        return;

    }


    // Stop current speech
    if (
        window.speechSynthesis.speaking
    ) {

        window.speechSynthesis.cancel();

        state.isSpeaking = false;

        return;

    }


    const utterance =
        new SpeechSynthesisUtterance(text);


    // Find English voice
    const voices =
        window.speechSynthesis.getVoices();


    const voice =
        voices.find(
            v => v.lang.includes('en-')
        ) || voices[0];


    if (voice) {

        utterance.voice = voice;

    }


    utterance.onstart = () => {

        state.isSpeaking = true;

    };


    utterance.onend = () => {

        state.isSpeaking = false;

    };


    utterance.onerror = () => {

        state.isSpeaking = false;

    };


    window.speechSynthesis.speak(
        utterance
    );
}


// =====================================================
// LOCAL STORAGE
// =====================================================

function saveMessage(role, text) {

    state.messages.push({

        role: role,

        text: text

    });


    localStorage.setItem(
        'catbot_messages',
        JSON.stringify(
            state.messages
        )
    );
}


// =====================================================
// LOAD CHAT HISTORY
// =====================================================

function loadChat() {

    const saved =
        localStorage.getItem(
            'catbot_messages'
        );


    if (!saved) {
        return;
    }


    try {

        state.messages =
            JSON.parse(saved);


        if (
            state.messages.length > 0
        ) {

            DOM.welcomeScreen
                .classList
                .add('hidden');


            state.messages.forEach(
                msg => {

                    if (
                        msg.role === 'user'
                    ) {

                        addUserMessage(
                            msg.text
                        );

                    } else {

                        addBotMessage(
                            msg.text
                        );

                    }

                }
            );

        }

    } catch (error) {

        console.error(
            'Failed to load chat history:',
            error
        );


        localStorage.removeItem(
            'catbot_messages'
        );

        state.messages = [];

    }
}


// =====================================================
// CLEAR CHAT
// =====================================================

function clearChat() {

    if (
        confirm(
            'Are you sure you want to start a new chat? This will clear current messages.'
        )
    ) {

        localStorage.removeItem(
            'catbot_messages'
        );


        state.messages = [];


        DOM.messagesWrapper.innerHTML =
            '';


        DOM.welcomeScreen
            .classList
            .remove('hidden');


        if (
            window.innerWidth <= 768
        ) {

            toggleSidebar();

        }

    }
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(str) {

    const div =
        document.createElement('div');


    div.innerText = str;


    return div.innerHTML;
}


// =====================================================
// COPY MESSAGE
// =====================================================

function copyText(button) {

    const textElement =
        button
            .parentElement
            .previousElementSibling;


    if (!textElement) {
        return;
    }


    navigator.clipboard
        .writeText(
            textElement.innerText
        )
        .then(() => {

            const originalHTML =
                button.innerHTML;


            button.innerHTML = `

                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >

                    <polyline
                        points="20 6 9 17 4 12"
                    />

                </svg>

            `;


            setTimeout(
                () => {

                    button.innerHTML =
                        originalHTML;

                },
                2000
            );

        })
        .catch(error => {

            console.error(
                'Copy failed:',
                error
            );

        });
}


// =====================================================
// START APP
// =====================================================

window.addEventListener(
    'load',
    init
);