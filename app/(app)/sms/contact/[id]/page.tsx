'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Send } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import {
  getContactConversation,
  sendContactReply
} from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';
import { SmsContact } from '@/app/types/sms';

interface Message {
  id: number;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  isReplied?: boolean;
}

export default function ContactPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [contact, setContact] = useState<SmsContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const contactId = parseInt(params.id as string, 10);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchConversation();
    
    // Set up auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      fetchConversation(false);
    }, 10000);
    
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, router, contactId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getContactConversation(contactId);
      setContact(data.contact);
      setMessages(data.messages);
      
      // Scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load conversation. Please refresh the page.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Validate message length
    if (replyText.length > 1600) {
      toast.error('Message is too long. Maximum length is 1600 characters.');
      return;
    }
    
    setIsSending(true);
    try {
      const data = await sendContactReply(contactId, replyText);
      // Add the new message to the list
      setMessages(prev => [...prev, data.sentMessage]);
      setReplyText('');
      toast.success('Reply sent successfully');
      
      // Scroll to bottom after a short delay to ensure the new message is rendered
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
      ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Add message status indicator
  const getMessageStatus = (status: string) => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓ Read';
      case 'failed':
        return '✕';
      default:
        return '';
    }
  };

  // Add message status color
  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-blue-100';
      case 'delivered':
        return 'text-blue-100';
      case 'read':
        return 'text-green-100';
      case 'failed':
        return 'text-red-100';
      default:
        return 'text-blue-100';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6 h-full flex flex-col">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {contact?.name || 'Contact'} 
            </h1>
            <p className="text-sm text-gray-500">{contact?.phone}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-grow flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : (
          <>
            <div className="flex-grow bg-white shadow overflow-hidden sm:rounded-lg p-4 mb-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No messages in this conversation yet
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-xs sm:max-w-sm md:max-w-md rounded-lg px-4 py-2 
                          ${message.direction === 'outbound' 
                            ? 'bg-brand text-white rounded-br-none' 
                            : 'bg-gray-200 text-gray-900 rounded-bl-none'}`}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div className={`text-xs mt-1 flex items-center justify-between ${message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'}`}>
                          <span>{formatMessageDate(message.sentAt)}</span>
                          {message.direction === 'outbound' && (
                            <span className={`ml-2 ${getMessageStatusColor(message.status)}`}>
                              {getMessageStatus(message.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg p-4">
              <form onSubmit={handleSendReply} className="flex space-x-2">
                <div className="flex-grow">
                  <Input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    disabled={isSending}
                    className="w-full"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  variant="brand"
                  isLoading={isSending}
                  disabled={isSending || !replyText.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 