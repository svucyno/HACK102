import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { askAIChat } from '../../services/api';

export default function AIAdvice({ data }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your SmartSpend AI assistant. Ask me anything about your current budget, spending habits, or savings goals!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context from data
      const context = {
        income: data.income,
        totalSpending: data.totalSpending,
        categoryBreakdown: data.categoryData,
        trends: data.trendData
      };

      const res = await askAIChat({ context, prompt: userMessage.text });
      
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.reply || "I couldn't process that. Try again."
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: "AI is currently unavailable"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] max-w-4xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Chat Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">SmartSpend AI</h3>
            <p className="text-xs text-muted-foreground">Always active to analyze your money</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-none'
                }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                  {/* Basic markdown fix for simple AI responses */}
                  {msg.text.split('\n').map((line, i) => {
                    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                    if (isBullet) {
                      return <ul key={i} className="list-disc ml-4 my-1"><li>{line.substring(2)}</li></ul>;
                    }
                    return <p key={i}>{line}</p>;
                  })}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
              )}

            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none px-5 py-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-black/20">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask AI about saving money..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
}
