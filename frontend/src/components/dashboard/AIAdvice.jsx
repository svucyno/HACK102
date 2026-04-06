import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { askAIChat } from '../../services/api';

export default function AIAdvice({ data }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Namaste! 👋 I'm your SmartSpend AI advisor. I can help you:\n\n- 🎯 **Create savings plans** for goals like a car or home\n- 📊 **Analyse your spending** and find where you can cut\n- 💰 **Build a monthly budget** suited to your income\n- 📈 **Guide you on SIPs and investments**\n\nJust ask me anything about your finances!"
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

  // Rich text renderer: handles ## headers, **bold**, bullets, and ₹ highlighting
  const renderMessage = (text) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();

      // ## Heading
      if (trimmed.startsWith('## ')) {
        return (
          <p key={i} className="font-bold text-white text-sm mt-3 mb-1">
            {renderInline(trimmed.slice(3))}
          </p>
        );
      }
      // ### Sub-heading
      if (trimmed.startsWith('### ')) {
        return (
          <p key={i} className="font-semibold text-primary/90 text-sm mt-2 mb-0.5">
            {renderInline(trimmed.slice(4))}
          </p>
        );
      }
      // Bullet points
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <div key={i} className="flex items-start gap-2 my-0.5">
            <span className="text-primary mt-0.5 shrink-0">•</span>
            <span className="text-sm leading-relaxed">{renderInline(trimmed.slice(2))}</span>
          </div>
        );
      }
      // Empty line = spacer
      if (trimmed === '') return <div key={i} className="h-1" />;

      return <p key={i} className="text-sm leading-relaxed">{renderInline(trimmed)}</p>;
    });
  };

  // Inline renderer: handles **bold** and ₹ number highlighting
  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|₹[\d,]+(?:\.[\d]{2})?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('₹')) {
        return <span key={i} className="font-semibold text-green-400">{part}</span>;
      }
      return part;
    });
  };

  const suggestions = [
    'How can I save more?',
    'Analyse my spending',
    'Help me plan a budget',
    'I want to invest in SIP',
  ];

  const handleSuggestion = (text) => {
    setInput(text);
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
            <p className="text-xs text-muted-foreground">Personalised financial advice for Indian users</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={`max-w-[82%] rounded-2xl px-5 py-3 ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-none'
                }`}>
                <div className="text-sm leading-relaxed">
                  {msg.sender === 'ai' ? renderMessage(msg.text) : <p>{msg.text}</p>}
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

        {/* Suggestion chips (only when no conversation yet) */}
        {messages.length === 1 && !isLoading && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-black/20">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. I want to buy a bike for ₹80,000" 
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
