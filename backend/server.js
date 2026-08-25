const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Load .env from backend folder
dotenv.config({
    path: path.join(__dirname, ".env")
});

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// =====================================================
// CATBOT AI CHAT API
// =====================================================

app.post("/api/chat", async (req, res) => {

    try {

        // -------------------------------------------------
        // Get user message
        // -------------------------------------------------

        const userMessage = req.body.message;

        if (!userMessage || !userMessage.trim()) {

            return res.status(400).json({
                error: "Message is required"
            });

        }

        // -------------------------------------------------
        // Check Gemini API Key
        // -------------------------------------------------

        if (!process.env.GEMINI_API_KEY) {

            console.error("GEMINI_API_KEY is missing.");

            return res.status(500).json({
                error: "GEMINI_API_KEY is missing in .env"
            });

        }

        // -------------------------------------------------
        // Send request to Gemini
        // -------------------------------------------------

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" +
            process.env.GEMINI_API_KEY,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    // =================================================
                    // CATBOT IDENTITY / SYSTEM INSTRUCTION
                    // =================================================

                    systemInstruction: {
                        parts: [
                            {
                                text: `
You are CATBOT, an AI assistant.

Your name is CATBOT.

IMPORTANT IDENTITY RULES:

1. If the user asks "What is your name?", answer that your name is CATBOT.

2. If the user asks "Who are you?", answer that you are CATBOT, an AI assistant.

3. Never introduce yourself as Gemini.

4. Never say "I am Gemini".

5. Never say "I am a large language model built by Google" when asked about your identity.

6. If the user asks about the technology/model behind CATBOT, you may explain that CATBOT uses Google's Gemini API as its AI engine.

7. Always refer to yourself as CATBOT when talking about your assistant identity.

8. Be helpful, friendly and clear.

9. Help users with coding, programming, education, general questions, explanations, writing and other useful tasks.

10. If you do not know something, honestly say that you are not sure instead of inventing information.

You are CATBOT.
`
                            }
                        ]
                    },

                    // =================================================
                    // USER MESSAGE
                    // =================================================

                    contents: [
                        {
                            role: "user",

                            parts: [
                                {
                                    text: userMessage
                                }
                            ]
                        }
                    ]

                })
            }
        );

        // -------------------------------------------------
        // Convert Gemini response to JSON
        // -------------------------------------------------

        const data = await response.json();

        // -------------------------------------------------
        // Check Gemini API error
        // -------------------------------------------------

        if (!response.ok) {

            console.error("Gemini API Error:");
            console.error(data);

            return res.status(response.status).json({
                error: data?.error?.message ||
                    "Gemini API request failed"
            });

        }

        // -------------------------------------------------
        // Get AI reply
        // -------------------------------------------------

        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        // -------------------------------------------------
        // Check empty response
        // -------------------------------------------------

        if (!reply) {

            console.error(
                "Gemini returned no text response:",
                data
            );

            return res.status(500).json({
                error: "No response received from Gemini"
            });

        }

        // -------------------------------------------------
        // Send reply to frontend
        // -------------------------------------------------

        res.json({
            reply: reply
        });

    }

    catch (error) {

        console.error("CATBOT Server Error:");
        console.error(error);

        res.status(500).json({
            error: "Something went wrong while processing your request"
        });

    }

});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `CATBOT backend running at http://localhost:${PORT}`
    );

});