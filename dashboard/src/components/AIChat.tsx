import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Mic, MicOff, Volume2, VolumeX,
  Sparkles, Zap, MessageSquare, Settings, Moon, Sun,
  Copy, RefreshCw, ThumbsUp, ThumbsDown, Trash2, X, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Type declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  isLoading: boolean;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const shouldListenRef = useRef(false);
  const isRecognitionActiveRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSpeechSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError('');
        isRecognitionActiveRef.current = true;
      };

      recognition.onresult = (event: any) => {
        console.log('Speech recognition result:', event);
        const transcript = event.results[0][0].transcript;
        console.log('Transcript:', transcript);
        
        if (transcript && transcript.trim()) {
          setInputMessage(transcript);
          setIsListening(false);
          isRecognitionActiveRef.current = false;
          
          // Send message after a brief delay
          setTimeout(() => {
            if (!isSpeakingRef.current) {
              handleSendMessage(transcript);
            }
          }, 100);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        isRecognitionActiveRef.current = false;
        
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please enable it in your browser settings.');
        } else {
          setError(`Error: ${event.error}`);
        }
        
        // Retry if in voice mode
        if (shouldListenRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 1500);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        isRecognitionActiveRef.current = false;
        
        // Auto-restart if voice mode is active
        if (shouldListenRef.current && !isSpeakingRef.current && !isLoading) {
          setTimeout(() => {
            if (shouldListenRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported');
      setSpeechSupported(false);
      setError('Speech recognition is not supported in your browser');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn('Error aborting recognition:', e);
        }
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || isSpeakingRef.current || isRecognitionActiveRef.current) {
      console.log('Cannot start listening:', { 
        hasRecognition: !!recognitionRef.current, 
        isSpeaking: isSpeakingRef.current,
        isRecognitionActive: isRecognitionActiveRef.current
      });
      return;
    }

    try {
      console.log('Starting speech recognition...');
      isRecognitionActiveRef.current = true;
      recognitionRef.current.start();
    } catch (error: any) {
      console.error('Error starting recognition:', error);
      isRecognitionActiveRef.current = false;

      // If already started, stop and restart
      if (error.message && error.message.includes('already started')) {
        try {
          recognitionRef.current.stop();
          isRecognitionActiveRef.current = false;
          setTimeout(() => {
            if (!isRecognitionActiveRef.current && !isSpeakingRef.current) {
              try {
                isRecognitionActiveRef.current = true;
                recognitionRef.current.start();
              } catch (e) {
                console.error('Retry failed:', e);
                isRecognitionActiveRef.current = false;
              }
            }
          }, 100);
        } catch (e) {
          console.error('Error restarting:', e);
          isRecognitionActiveRef.current = false;
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        console.log('Stopping speech recognition...');
        recognitionRef.current.stop();
        isRecognitionActiveRef.current = false;
      } catch (error) {
        console.error('Error stopping recognition:', error);
        isRecognitionActiveRef.current = false;
      }
    }
    setIsListening(false);
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Stop listening while speaking
      if (isListening) {
        stopListening();
      }

      isSpeakingRef.current = true;
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Get voices
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en-'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        console.log('Started speaking');
        setIsSpeaking(true);
      };

      const handleEnd = () => {
        console.log('Finished speaking');
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        resolve();

        // Resume listening after a delay if in voice mode
        if (shouldListenRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 1000);
        }
      };

      utterance.onend = handleEnd;
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        handleEnd();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
  };

  const toggleVoiceMode = () => {
    const newMode = !voiceMode;
    setVoiceMode(newMode);
    shouldListenRef.current = newMode;
    
    if (newMode) {
      console.log('Voice mode activated');
      setError('');
      setTimeout(() => startListening(), 300);
    } else {
      console.log('Voice mode deactivated');
      stopListening();
      stopSpeaking();
    }
  };

  const handleVoiceClick = () => {
    if (!speechSupported) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      setError('');
      startListening();
    }
  };

  const handleSendMessage = async (messageText: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const messageId = Date.now().toString();
    const newMessage = {
      id: messageId,
      message: textToSend,
      response: '',
      timestamp: new Date().toISOString(),
      isLoading: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get user's home data for context
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_home_data', { user_uuid: user?.id });

      if (userError) {
        console.error('Error fetching user data:', userError);
      }

      // Call backend API with Supabase context
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          context: {
            voiceMode: voiceMode,
            timestamp: new Date().toISOString(),
            userData: userData,
            userId: user?.id,
            userRole: user?.role
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response;

      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, response: aiResponse, isLoading: false }
          : msg
      ));

      // Speak response if enabled
      if ((voiceMode || autoSpeak) && aiResponse) {
        await speakText(aiResponse);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = "I apologize, but I'm having trouble connecting to the AI service right now. Please check your connection and try again.";
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, response: errorMsg, isLoading: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (question: string): string => {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('hello') || lowerQ.includes('hi')) {
      return "Hello! I'm your water tank assistant. How can I help you today?";
    } else if (lowerQ.includes('water level') || lowerQ.includes('level')) {
      return "Your current water level is at 74.7%, which is approximately 149.4 centimeters. The tank is in good condition and doesn't require immediate attention.";
    } else if (lowerQ.includes('daily') || lowerQ.includes('usage')) {
      return "Based on your usage patterns, you consume approximately 250 liters per day. This is within normal range for a household of your size.";
    } else if (lowerQ.includes('refill') || lowerQ.includes('when')) {
      return "At your current usage rate, I recommend refilling the tank in about 3 to 4 days when it reaches 30 percent capacity to maintain optimal levels.";
    } else if (lowerQ.includes('quality') || lowerQ.includes('maintain')) {
      return "To maintain water quality, I suggest cleaning the tank every 6 months, checking for sediment buildup, and ensuring proper filtration. Your current water temperature is 20.2 degrees Celsius, which is ideal.";
    } else if (lowerQ.includes('temperature')) {
      return "The current water temperature is 20.2 degrees Celsius, which is within the optimal range for domestic use.";
    } else if (lowerQ.includes('thank')) {
      return "You're welcome! I'm always here to help with your water management needs.";
    } else {
      return `I understand you're asking about ${question}. Your water system is operating normally with a current level of 74.7 percent and temperature at 20.2 degrees Celsius. Is there anything specific you'd like to know?`;
    }
  };

  const quickActions = [
    "What's my current water level?",
    "How much water do I use daily?",
    "When should I refill?",
    "Water quality tips"
  ];

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'} transition-all duration-500 p-4 overflow-hidden relative`}>
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 -left-20"></div>
        <div className="absolute w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 top-0 -right-20"></div>
        <div className="absolute w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 bottom-0 left-1/2 transform -translate-x-1/2"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Card */}
        <div className={`${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-6 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg transform transition-transform ${isListening || isSpeaking ? 'scale-110' : 'scale-100'}`}>
                  <Bot className="h-8 w-8 text-white" />
                </div>
                {(isListening || isSpeaking) && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                  </span>
                )}
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    AI Water Assistant
                  </span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {voiceMode ? (
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <div className="flex gap-1">
                        <div className="w-1 h-4 bg-green-500 rounded-full animate-wave"></div>
                        <div className="w-1 h-4 bg-green-500 rounded-full animate-wave animation-delay-200"></div>
                        <div className="w-1 h-4 bg-green-500 rounded-full animate-wave animation-delay-400"></div>
                      </div>
                      <span className="font-medium">Voice Mode Active</span>
                    </div>
                  ) : (
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {speechSupported ? 'Your intelligent water management assistant' : 'Speech recognition not available'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Voice Mode Toggle */}
              {speechSupported && (
                <button
                  onClick={toggleVoiceMode}
                  className={`p-3 rounded-xl transition-all transform hover:scale-110 ${
                    voiceMode 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg' 
                      : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                  title={voiceMode ? "Disable Voice Mode" : "Enable Voice Mode"}
                >
                  {voiceMode ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
              )}

              {/* Dark Mode */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-3 rounded-xl transition-all transform hover:scale-110 ${
                  isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-xl transition-all transform hover:scale-110 hover:rotate-90 ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Clear Chat */}
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className={`p-3 rounded-xl transition-all transform hover:scale-110 ${
                    isDarkMode ? 'bg-gray-700 text-red-400' : 'bg-gray-100 text-red-600'
                  }`}
                  title="Clear Chat"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-100 border border-red-300 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
          )}

          {/* Status Bar */}
          {(isListening || isSpeaking) && !error && (
            <div className={`mt-4 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-white/50'} backdrop-blur-sm`}>
              {isListening && (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-green-500 rounded-full animate-soundwave"
                        style={{ animationDelay: `${i * 0.1}s`, height: '20px' }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-green-500">🎤 Listening... Speak now!</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center justify-center gap-3">
                  <Volume2 className="h-5 w-5 text-purple-500 animate-pulse" />
                  <span className="text-sm font-medium text-purple-500">🔊 Speaking response...</span>
                </div>
              )}
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className={`mt-4 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-white/50'} backdrop-blur-sm`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Auto-speak responses
                </span>
                <button
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoSpeak ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSpeak ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Speech recognition: {speechSupported ? '✓ Supported' : '✗ Not supported'}
              </p>
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className={`${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-xl rounded-3xl shadow-2xl p-6 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'}`}>
          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto mb-6 space-y-4 scroll-smooth">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="relative mb-6">
                  <Sparkles className="h-20 w-20 text-purple-500 animate-bounce" />
                  <div className="absolute inset-0 h-20 w-20 text-pink-500 animate-ping opacity-20">
                    <Sparkles className="h-20 w-20" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  Welcome! How can I assist you today?
                </h3>
                <p className={`mb-8 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  I'm here to help you manage your water tank efficiently. Ask me anything!
                </p>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 max-w-2xl w-full">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(action)}
                      className={`p-4 text-left rounded-xl transition-all transform hover:scale-105 hover:shadow-lg ${
                        isDarkMode 
                          ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-200' 
                          : 'bg-white hover:bg-gray-50 text-gray-800'
                      } border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <Zap className="h-4 w-4 text-purple-500 mb-2" />
                      <span className="text-sm font-medium">{action}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={msg.id} className="space-y-4 animate-slideIn" style={{ animationDelay: `${index * 0.05}s` }}>
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[75%] group">
                      <div className="flex items-start gap-3 justify-end">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-5 py-3 shadow-lg transform transition-all hover:scale-105">
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                        </div>
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-[75%] group">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className={`rounded-2xl px-5 py-3 shadow-lg ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-gray-50 to-gray-100'
                          }`}>
                            {msg.isLoading ? (
                              <div className="flex gap-2 py-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-200"></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-400"></div>
                              </div>
                            ) : (
                              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {msg.response}
                              </p>
                            )}
                          </div>
                          {!msg.isLoading && msg.response && (
                            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => speakText(msg.response)}
                                className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                                }`}
                                title="Speak"
                              >
                                <Volume2 className="h-4 w-4 text-purple-500" />
                              </button>
                              <button
                                onClick={() => copyMessage(msg.response)}
                                className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                                }`}
                                title="Copy"
                              >
                                <Copy className="h-4 w-4 text-gray-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="relative">
            <div className="flex items-center gap-3">
              {speechSupported && (
                <button
                  onClick={handleVoiceClick}
                  disabled={isLoading || isSpeaking}
                  className={`p-4 rounded-xl transition-all transform hover:scale-110 ${
                    isListening
                      ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white animate-pulse shadow-lg'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Click to speak"
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              )}

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(inputMessage)}
                placeholder={isListening ? "🎤 Listening..." : "Type your message or click mic to speak..."}
                disabled={isLoading || isListening}
                className={`flex-1 px-5 py-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                } disabled:opacity-50`}
              />

              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isLoading}
                className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110 hover:shadow-xl"
                title="Send Message"
              >
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        @keyframes wave {
          0%, 100% { height: 16px; }
          50% { height: 8px; }
        }

        @keyframes soundwave {
          0%, 100% { height: 20px; opacity: 0.3; }
          50% { height: 40px; opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 20s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }

        .animate-soundwave {
          animation: soundwave 0.8s ease-in-out infinite;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .scroll-smooth {
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
        `
      }} />
    </div>
  );
}