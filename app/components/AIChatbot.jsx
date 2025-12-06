// app/components/AIChatbot.jsx
"use client";
import React, { useState } from 'react';
import { FaRobot, FaPaperPlane } from 'react-icons/fa';
import "../style/chatbot.css";

function AIChatbot() {
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Halo! Saya Finansialin AI. Ada yang bisa saya bantu terkait budget atau keuangan Anda?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai', { // Panggil Route Handler di Next.js
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: input })
            });

            const data = await res.json();

            if (res.ok) {
                const aiResponse = { role: 'ai', text: data.response };
                setMessages(prev => [...prev, aiResponse]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: `Error: ${data.message || 'Gagal terhubung ke AI.'}` }]);
            }

        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Error koneksi. Cek server Anda.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-chatbot-container">
            <h3><FaRobot /> Finansialin AI Advisor</h3>
            
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <div className="message-content">{msg.text}</div>
                    </div>
                ))}
                {loading && (
                    <div className="message ai loading">
                        <div className="message-content">AI sedang berpikir...</div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tanya tentang budgeting..."
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    <FaPaperPlane />
                </button>
            </form>
        </div>
    );
}

export default AIChatbot;