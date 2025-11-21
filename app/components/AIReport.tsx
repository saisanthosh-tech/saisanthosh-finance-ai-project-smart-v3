"use client"
import { useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Bot, Sparkles, Loader2 } from 'lucide-react'

export default function AIReport({ transactions }: { transactions: any[] }) {
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(false)

  async function generateInsight() {
    setLoading(true)
    setInsight('')

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
      //const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
     // const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
     // The safest, fastest option right now:
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

     //  const model = genAI.getGenerativeModel({ model: "" })
      // Prepare data for AI (Keep it anonymous and simple)
      const summary = transactions.map(t => `${t.type}: $${t.amount} on ${t.category}`).join('\n')
      const prompt = `
        Act as a financial advisor. Analyze these transactions strictly in 2-3 sentences. 
        Give one specific compliment and one specific warning about spending habits.
        Do not use markdown formatting like bolding.
        Data:
        ${summary}
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      setInsight(response.text())
    } catch (error) {
      console.error(error)
      setInsight("My brain is tired. Try again later!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-slate-900 to-purple-900/20 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-purple-400 flex items-center gap-2">
          <Bot /> AI Financial Advisor
        </h2>
        <button 
          onClick={generateInsight}
          disabled={loading || transactions.length === 0}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition"
        >
          {loading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
          {loading ? "Analyzing..." : "Analyze My Finances"}
        </button>
      </div>

      {insight && (
        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-purple-500/20 bg-slate-950/50 p-4 text-slate-200 leading-relaxed">
          "{insight}"
        </div>
      )}
      
      {!insight && !loading && (
        <p className="text-sm text-slate-500 italic">
          Click the button to let AI find patterns in your spending...
        </p>
      )}
    </div>
  )
}