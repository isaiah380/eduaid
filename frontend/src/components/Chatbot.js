import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Cpu, ChevronDown, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { t } from '@/lib/i18n';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const lang = localStorage.getItem('language') || 'en';

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ text: "Welcome to the EduAid Assistant! ✨ I can help you find scholarships, understand the application process, or answer general questions. How can I assist you today?", isUser: false }]);
        }
    }, [isOpen, messages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;
        const currentMsgs = [...messages, { text, isUser: true }];
        setMessages(currentMsgs);
        setInput('');
        setIsLoading(true);

        try {
            const res = await axios.post(`${API}/chatbot/ask`, { query: text, lang });
            if (res.data.success) {
                setMessages([...currentMsgs, { text: res.data.response, isUser: false }]);
            }
        } catch (err) {
            setMessages([...currentMsgs, { text: "I'm having trouble connecting right now. Please try again later.", isUser: false, isError: true }]);
        }
        setIsLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    const formatMessageText = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split('\n').map((line, i) => {
            const parts = line.split(urlRegex);
            return (
                <p key={i} className="mb-2 last:mb-0">
                    {parts.map((part, j) => {
                        if (part.match(urlRegex)) return <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold hover:text-blue-800 break-all">{part}</a>;
                        if (part.startsWith('- ')) return <span className="flex items-start gap-2 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><span>{part.substring(2)}</span></span>;
                        return part;
                    })}
                </p>
            );
        });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Toggle Button */}
            {!isOpen && (
                <button onClick={() => setIsOpen(true)}
                    className="group bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-all hover:scale-105 relative flex items-center justify-center border-4 border-white">
                    <MessageSquare className="h-7 w-7" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                    </span>
                    <div className="absolute right-full mr-4 bg-white text-slate-800 px-4 py-2 rounded-xl text-sm font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-200 flex items-center gap-2">
                        Get AI Support <Cpu className="h-4 w-4 text-blue-500"/>
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-2xl w-[380px] h-[550px] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-blue-600 p-4 border-b border-blue-700 text-white relative">
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-1.5 rounded-xl shadow-inner">
                                    <Cpu className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base tracking-tight leading-tight">EduAid Assistant</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                        <span className="text-[10px] uppercase tracking-widest font-black text-blue-200">Always Online</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white hover:bg-blue-700 p-1.5 rounded-lg transition-colors">
                                <ChevronDown className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 fade-in duration-200`}>
                                {!msg.isUser && (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0 border border-blue-200 mt-auto mb-1">
                                        <Cpu className="h-4 w-4 text-blue-600" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-2xl p-4 text-[13px] leading-relaxed font-medium shadow-sm border
                                    ${msg.isUser ? 'bg-blue-600 text-white border-blue-700 rounded-br-[4px]' :
                                        msg.isError ? 'bg-red-50 text-red-800 border-red-200 rounded-bl-[4px]' :
                                            'bg-white text-slate-700 border-slate-200 rounded-bl-[4px]'}`}>
                                    {formatMessageText(msg.text)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 border border-blue-200">
                                    <Cpu className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-[4px] p-4 shadow-sm flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts */}
                    {messages.length < 3 && !isLoading && (
                        <div className="px-3 pb-2 bg-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
                            {["How do I register?", "Find me engineering scholarships", "What documents are needed?"].map(q => (
                                <button key={q} onClick={() => handleSend(q)} className="shrink-0 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-colors whitespace-nowrap">
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 relative">
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
                            placeholder="Ask anything..."
                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" />
                        <button onClick={() => handleSend()} disabled={!input.trim() || isLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-2.5 rounded-xl transition-colors absolute right-4 disabled:shadow-none shadow-md">
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default Chatbot;
