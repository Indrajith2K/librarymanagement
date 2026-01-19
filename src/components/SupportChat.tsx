'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, X, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Define message structure
interface Message {
    text: string;
    sender: 'user' | 'assistant';
}

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! How can I help you today?", sender: 'assistant' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  const handleSendMessage = () => {
    if (currentMessage.trim() === '') return;

    // Add user message
    setMessages(prev => [...prev, { text: currentMessage, sender: 'user' }]);
    setCurrentMessage('');

    // Simulate assistant reply
    setTimeout(() => {
        setMessages(prev => [...prev, { text: "Thanks for your message. An agent will be with you shortly.", sender: 'assistant' }]);
    }, 1000);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        handleSendMessage();
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="icon"
                className="w-16 h-16 rounded-full shadow-lg"
                onClick={() => setIsOpen(true)}
              >
                <MessageSquare className="h-8 w-8" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className="w-80 h-96 shadow-2xl flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <CardTitle className="text-lg">Support Chat</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        <div className={`p-3 rounded-lg max-w-[80%] ${
                            msg.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
              </CardContent>
              <div className="p-4 border-t">
                <div className="relative">
                  <Input 
                    placeholder="Type a message..." 
                    className="pr-10"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
