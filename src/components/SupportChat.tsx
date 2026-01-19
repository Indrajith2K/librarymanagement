'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { answerAdminQuestion } from '@/ai/flows/admin-support-flow';

// Define message structure
interface Message {
    text: string;
    sender: 'user' | 'assistant';
}

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! How can I help you with the admin panel today?", sender: 'assistant' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (currentMessage.trim() === '' || isThinking) return;

    const newUserMessage: Message = { text: currentMessage, sender: 'user' };
    setMessages(prev => [...prev, newUserMessage]);
    setCurrentMessage('');
    setIsThinking(true);

    try {
        const response = await answerAdminQuestion({ question: currentMessage });
        const assistantMessage: Message = { text: response.answer, sender: 'assistant' };
        setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
        console.error("AI support chat error:", error);
        toast({
            variant: "destructive",
            title: "AI Error",
            description: "Sorry, I couldn't get a response. Please try again.",
        });
    } finally {
        setIsThinking(false);
    }
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
            <Card className="w-96 h-[32rem] shadow-2xl flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <CardTitle className="text-lg">Admin Support</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className="flex gap-3 items-start">
                        {msg.sender === 'assistant' && <div className="bg-primary/10 p-2 rounded-full"><Bot className="h-5 w-5 text-primary" /></div>}
                        <div className={`p-3 rounded-lg max-w-[85%] ${
                            msg.sender === 'user' 
                            ? 'bg-primary text-primary-foreground ml-auto' 
                            : 'bg-muted'
                        }`}>
                           {msg.sender === 'user' ? (
                                <p className="text-sm">{msg.text}</p>
                            ) : (
                                <div className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text }} />
                            )}
                        </div>
                         {msg.sender === 'user' && <div className="bg-muted p-2 rounded-full"><User className="h-5 w-5 text-foreground" /></div>}
                    </div>
                ))}
                {isThinking && (
                    <div className="flex gap-3 items-start">
                         <div className="bg-primary/10 p-2 rounded-full"><Bot className="h-5 w-5 text-primary" /></div>
                          <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                            <span className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                            <span className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                            <span className="h-2 w-2 bg-primary rounded-full animate-pulse"></span>
                         </div>
                    </div>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <div className="relative">
                  <Input 
                    placeholder="Ask about the admin panel..." 
                    className="pr-10"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isThinking}
                  />
                  <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleSendMessage} disabled={isThinking}>
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
