'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, Send, ArrowLeft, AlertCircle, Smile, CheckCircle, MessageCircle } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import {
  getCampaignLeads,
  getContactConversation,
  sendReplyToContact,
  getUnrespondedMessages,
  markMessagesAsResolved,
  sendBulkReplies
} from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';

interface Message {
  id: number;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  isReplied?: boolean;
}

interface Contact {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  status: string;
  customFields?: Record<string, any>;
  unreadCount?: number;
  lastMessage?: Message;
  isUnresponded?: boolean;
}

export default async function ConversationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const campaignId = parseInt(id);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [unrespondedContacts, setUnrespondedContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [bulkReplyMessage, setBulkReplyMessage] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMarkingResolved, setIsMarkingResolved] = useState(false);
  const [isSendingBulkReply, setIsSendingBulkReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreplied, setShowUnreplied] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showBulkReplyModal, setShowBulkReplyModal] = useState(false);
  const [selectedContactsForBulkReply, setSelectedContactsForBulkReply] = useState<number[]>([]);

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchInitialContacts();
  }, [isAuthenticated, router, campaignId]);

  useEffect(() => {
    if (showUnreplied) {
      fetchUnresponded();
    } else {
      fetchInitialContacts();
    }
  }, [showUnreplied, campaignId]);

  useEffect(() => {
    if (selectedContact) {
      fetchConversation(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchInitialContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const data = await getCampaignLeads(campaignId, { limit: 200 });
      setContacts(data.contacts?.map(c => ({...c, isUnresponded: false})) || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchUnresponded = async () => {
    setIsLoadingContacts(true);
    try {
      const data = await getUnrespondedMessages({ campaignId });
      const formattedUnresponded = data.unrespondedContacts?.map((uc: any) => ({ 
        ...uc,
        id: uc.id || uc.contactId,
        isUnresponded: true,
        lastMessage: uc.lastMessage || { content: 'Unresponded inbound message', direction: 'inbound' } 
      })) || [];
      setUnrespondedContacts(formattedUnresponded);
    } catch (error) {
      console.error('Error fetching unresponded messages:', error);
      toast.error('Failed to load unresponded messages');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchConversation = async (contactId: number) => {
    setIsLoadingConversation(true);
    try {
      const data = await getContactConversation(contactId);
      setMessages(data.messages || []);
      const currentContactList = showUnreplied ? unrespondedContacts : contacts;
      const updatedList = currentContactList.map(c => 
        c.id === contactId ? { ...c, unreadCount: 0, isUnresponded: false } : c
      );
      if(showUnreplied) setUnrespondedContacts(updatedList);
      else setContacts(updatedList);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !newMessage.trim()) return;
    setIsSending(true);
    try {
      const response = await sendReplyToContact(selectedContact.id, newMessage);
      setMessages(prev => [...prev, response.sentMessage]);
      setNewMessage('');
      toast.success('Message sent successfully');
      if(selectedContact.isUnresponded) fetchUnresponded();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };
  
  const handleMarkAsResolved = async (contactId: number) => {
    if (!contactId) return;
    setIsMarkingResolved(true);
    try {
      await markMessagesAsResolved([contactId]);
      toast.success('Conversation marked as resolved.');
      fetchUnresponded();
      if (selectedContact?.id === contactId) {
        setSelectedContact(prev => prev ? {...prev, isUnresponded: false} : null);
      }
    } catch (error) {
      console.error('Error marking as resolved:', error);
      toast.error('Failed to mark as resolved.');
    } finally {
      setIsMarkingResolved(false);
    }
  };

  const handleBulkReplyToggleContact = (contactId: number) => {
    setSelectedContactsForBulkReply(prev => 
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const handleSendBulkReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContactsForBulkReply.length === 0 || !bulkReplyMessage.trim()) {
      toast.error('Please select contacts and enter a message for bulk reply.');
      return;
    }
    setIsSendingBulkReply(true);
    try {
      await sendBulkReplies({ contactIds: selectedContactsForBulkReply, message: bulkReplyMessage });
      toast.success(`Bulk reply sent to ${selectedContactsForBulkReply.length} contacts.`);
      setBulkReplyMessage('');
      setSelectedContactsForBulkReply([]);
      setShowBulkReplyModal(false);
      fetchUnresponded();
    } catch (error) {
      console.error('Error sending bulk reply:', error);
      toast.error('Failed to send bulk reply.');
    } finally {
      setIsSendingBulkReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    if(!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const currentContactList = showUnreplied ? unrespondedContacts : contacts;
  const filteredContactsToDisplay = currentContactList.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.phone.toLowerCase().includes(searchLower) ||
      (contact.name?.toLowerCase().includes(searchLower) ?? false) ||
      (contact.email?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const onEmojiClick = (emojiData: EmojiClickData, target: 'newMessage' | 'bulkReplyMessage') => {
    if (target === 'newMessage') {
      setNewMessage(prev => prev + emojiData.emoji);
    } else {
      setBulkReplyMessage(prev => prev + emojiData.emoji);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">SMS Conversations</h1>
          </div>
          <div className="flex items-center space-x-3">
            {showUnreplied && selectedContactsForBulkReply.length > 0 && (
                <Button onClick={() => setShowBulkReplyModal(true)} variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Bulk Reply ({selectedContactsForBulkReply.length})
                </Button>
            )}
            <Button
                variant={showUnreplied ? "primary" : "secondary"}
                onClick={() => setShowUnreplied(!showUnreplied)}
                className="flex items-center"
            >
                <AlertCircle className="w-4 h-4 mr-2" />
                {showUnreplied ? `Show All (${contacts.length})` : `Show Unreplied (${unrespondedContacts.length})`}
            </Button>
          </div>
        </div>

        {showBulkReplyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                    <h2 className="text-xl font-semibold mb-4">Send Bulk Reply</h2>
                    <p className="text-sm text-gray-600 mb-4">To: {selectedContactsForBulkReply.length} selected contacts.</p>
                    <form onSubmit={handleSendBulkReply}>
                        <div className="relative mb-4">
                            <textarea
                                value={bulkReplyMessage}
                                onChange={(e) => setBulkReplyMessage(e.target.value)}
                                placeholder="Type your bulk reply message..."
                                rows={4}
                                className="w-full p-2 border rounded-md pr-10 focus:ring-brand focus:border-brand"
                            />
                             <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-2" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(sp => !sp);}}>
                                <Smile className="w-5 h-5 text-gray-500" />
                            </Button>
                            {showEmojiPicker && (
                                <div ref={emojiPickerRef} className="absolute mt-1 z-20">
                                    <EmojiPicker onEmojiClick={(emojiData) => onEmojiClick(emojiData, 'bulkReplyMessage')} width={300} height={350} />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <Button type="button" variant="secondary" onClick={() => {setShowBulkReplyModal(false); setShowEmojiPicker(false);}}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" isLoading={isSendingBulkReply} disabled={!bulkReplyMessage.trim() || isSendingBulkReply}>
                                Send Bulk Reply
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4 bg-white shadow rounded-lg">
            <div className="p-4 border-b">
              <Input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="divide-y divide-gray-200 max-h-[calc(100vh-260px)] overflow-y-auto">
              {isLoadingContacts ? (<p className="p-4 text-center text-gray-500">Loading contacts...</p>) : 
              filteredContactsToDisplay.map((contact) => (
                <div key={contact.id} className={`flex items-center p-4 hover:bg-gray-50 ${
                    selectedContact?.id === contact.id ? 'bg-gray-100' : ''
                  }`}>
                  {showUnreplied && (
                    <input 
                      type="checkbox"
                      checked={selectedContactsForBulkReply.includes(contact.id)}
                      onChange={() => handleBulkReplyToggleContact(contact.id)}
                      className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded mr-3 flex-shrink-0"
                    />
                  )}
                  <button onClick={() => setSelectedContact(contact)} className="w-full text-left flex items-center">
                    <div className="flex-shrink-0">
                      <MessageSquare className={`h-6 w-6 ${contact.isUnresponded ? 'text-red-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{contact.name || contact.phone || 'Unknown'}</p>
                        {contact.unreadCount > 0 && !selectedContact && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{contact.phone}</p>
                      {contact.lastMessage && (
                        <p className={`text-xs mt-1 truncate ${contact.isUnresponded ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {contact.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              ))}
              {!isLoadingContacts && filteredContactsToDisplay.length === 0 && (
                <p className="p-4 text-center text-gray-500">No contacts found.</p>
              )}
            </div>
          </div>

          <div className="col-span-8 bg-white shadow rounded-lg flex flex-col">
            {selectedContact ? (
              <>
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{selectedContact.name || 'Unknown'}</h2>
                    <p className="text-sm text-gray-500">{selectedContact.phone}</p>
                  </div>
                  {selectedContact.isUnresponded && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsResolved(selectedContact.id)}
                      isLoading={isMarkingResolved}
                      disabled={isMarkingResolved}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  )}
                </div>
                {isLoadingConversation ? (<p className="p-4 text-center text-gray-500">Loading conversation...</p>) : 
                (<div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-400px)] space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${ message.direction === 'outbound' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-900'}`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs opacity-75">{formatDate(message.sentAt)}</p>
                          {message.direction === 'outbound' && (
                            <span className={`text-xs ml-2 ${message.status === 'failed' ? 'text-red-300' : 'opacity-75'}`}>
                              {message.status === 'sent' && '✓'}
                              {message.status === 'delivered' && '✓✓'}
                              {message.status === 'read' && <CheckCircle className="inline w-3 h-3 text-blue-300" />}
                              {message.status === 'failed' && '✕'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (<p className="text-center text-gray-500">No messages yet.</p>)}
                </div>)}

                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex space-x-3 items-center">
                    <div className="relative flex-1">
                      <Input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className="w-full pr-10 py-2" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(sp => !sp);}}>
                        <Smile className="w-5 h-5 text-gray-500" />
                      </Button>
                      {showEmojiPicker && !showBulkReplyModal && (
                        <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-10">
                          <EmojiPicker onEmojiClick={(emojiData) => onEmojiClick(emojiData, 'newMessage')} width={300} height={350}/>
                        </div>
                      )}
                    </div>
                    <Button type="submit" variant="primary" disabled={!newMessage.trim() || isSending} isLoading={isSending} size="icon" className="p-2">
                      <Send className="w-5 h-5" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Select a contact to view conversation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 