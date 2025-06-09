import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Save, MessageCircle, Loader2 } from 'lucide-react';
import { generateIdeaResponse, generateIdeaSummary } from '../../lib/openai';
import { db } from '../../lib/supabase';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface IdeaBouncerProps {
  projectId: string;
  onIdeaSelected: (ideaSummary: string) => void;
}

export const IdeaBouncer: React.FC<IdeaBouncerProps> = ({ projectId, onIdeaSelected }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you refine your project idea. What are you thinking of building? Don't worry about having all the details figured out - let's explore it together! 🚀",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const chatHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const aiResponse = await generateIdeaResponse(chatHistory);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError(error instanceof Error ? error.message : 'Failed to get AI response');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Could you try rephrasing your message? In the meantime, feel free to continue describing your idea!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveIdea = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Generate a summary of the conversation
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const ideaSummary = await generateIdeaSummary(chatHistory);

      // Save the full conversation to scratchpad
      const conversationText = messages
        .map(msg => `**${msg.role === 'user' ? 'You' : 'AI Assistant'}** (${msg.timestamp.toLocaleTimeString()}):\n${msg.content}`)
        .join('\n\n---\n\n');

      const noteContent = `# Project Idea Discussion\n\n## Summary\n${ideaSummary}\n\n## Full Conversation\n\n${conversationText}`;

      await db.createScratchpadNote({
        project_id: projectId,
        content: noteContent,
        tags: ['Project Notes', 'Idea Seed', 'AI Discussion'],
        color: '#fef3c7', // Yellow color for idea notes
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
      });

      // Call the callback with the summary
      onIdeaSelected(ideaSummary);
    } catch (error) {
      console.error('Error saving idea:', error);
      setError(error instanceof Error ? error.message : 'Failed to save idea');
    } finally {
      setIsSaving(false);
    }
  };

  const canSaveIdea = messages.length > 2; // At least one user message and one AI response

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <MessageCircle className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Idea Bouncer</h3>
          <p className="text-sm text-gray-600">Let's explore and refine your project concept together</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto max-h-96">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="space-y-4">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your idea, ask questions, or share your thoughts..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {canSaveIdea ? (
              <span className="flex items-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span>Ready to save your idea and continue?</span>
              </span>
            ) : (
              <span>Chat a bit more to develop your idea, then save and continue</span>
            )}
          </div>
          
          <button
            onClick={handleSaveIdea}
            disabled={!canSaveIdea || isSaving}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Idea & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};