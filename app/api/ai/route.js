// app/api/ai/route.js
import { GoogleGenerativeAI } from "@google/genai";
import { NextResponse } from 'next/server';

// Pastikan Anda telah menginstal @google/genai: npm install @google/genai
// Pastikan GEMINI_API_KEY Anda disimpan di file .env.local

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const { prompt } = await req.json();

        // [1] Define the Role and Context for the AI
        const systemInstruction = `You are Finansialin AI Assistant, an expert in personal finance management and budgeting. 
        Your goal is to provide concise, practical, and non-judgmental advice on managing income, tracking expenses, and setting budget goals. 
        Answer the user's questions strictly about personal finance and budgeting in Indonesian.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Model yang cepat dan efisien
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5, // Kurangi kreativitas untuk jawaban yang lebih fokus dan informatif
            },
        });

        // [2] Kembalikan hasil respons dari AI
        return NextResponse.json({ 
            response: response.text 
        }, { status: 200 });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ 
            message: "Failed to process AI request.",
            error: error.message 
        }, { status: 500 });
    }
}