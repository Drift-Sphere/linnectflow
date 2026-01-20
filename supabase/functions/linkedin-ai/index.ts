// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, payload } = await req.json()
        // @ts-ignore
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            console.error('Missing API Key')
            throw new Error('Server configuration error: GEMINI_API_KEY not set')
        }

        let prompt = ''

        // 1. GENERATE MESSAGE
        if (action === 'generate') {
            const { profileData, type, tone, length } = payload
            const maxChars = length === 'short' ? 200 : length === 'medium' ? 300 : 400

            prompt = `You are a professional LinkedIn assistant. Write a personalized ${type} message.\n`
            prompt += `- To: ${profileData.name || 'Professional'}\n`
            if (profileData.headline) prompt += `- Role: ${profileData.headline}\n`
            if (profileData.company) prompt += `- Company: ${profileData.company}\n`
            prompt += `\nTone: ${tone || 'professional'}\n`
            prompt += `Max length: ${maxChars} chars\n`
            prompt += `Provide ONLY the message text. No quotes.`
        }
        // 2. OPTIMIZE MESSAGE
        else if (action === 'optimize') {
            const { message, instruction, tone } = payload

            if (instruction === 'fix_grammar') {
                prompt = `Fix grammar/spelling in this LinkedIn message:\n"${message}"`
            } else if (instruction === 'change_tone') {
                prompt = `Rewrite this LinkedIn message to be ${tone}:\n"${message}"`
            } else {
                prompt = `Improve this LinkedIn message to be more engaging:\n"${message}"`
            }
            prompt += `\nProvide ONLY the optimal message text.`
        }
        else {
            throw new Error(`Unknown action: ${action}`)
        }

        // Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        })

        const data = await response.json()

        // Error handling for AI response
        if (!data.candidates || data.candidates.length === 0) {
            console.error('Gemini Error:', JSON.stringify(data))

            if (data.promptFeedback && data.promptFeedback.blockReason) {
                throw new Error(`AI Blocked: ${data.promptFeedback.blockReason}`)
            }

            if (data.error) {
                throw new Error(`Gemini API Error: ${data.error.message} (${data.error.code})`)
            }

            throw new Error(`AI Service Error: No candidates returned. Raw: ${JSON.stringify(data)}`)
        }

        const resultText = data.candidates[0].content.parts[0].text.trim().replace(/^["']|["']$/g, '');

        return new Response(
            JSON.stringify({ success: true, message: resultText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
    }
})
