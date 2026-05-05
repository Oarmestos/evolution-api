import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useInstanceStore } from '../store/useInstanceStore';

import { ChatList } from '../components/ChatHub/ChatList';
import { ChatArea } from '../components/ChatHub/ChatArea';
import { ChatSidebar } from '../components/ChatHub/ChatSidebar';

export const ChatHub: React.FC = () => {
  const { activeInstance: activeInstanceObj, instances, fetchInstances } = useInstanceStore();
  const activeInstance = activeInstanceObj?.instanceName;
  const { 
    fetchChats, 
    fetchMessages, 
    fetchNotes,
    selectedChat,
  } = useChatStore();

  const [editInfo, setEditInfo] = useState<{ pushName: string; phoneNumber: string; email: string }>({
    pushName: '',
    phoneNumber: '',
    email: ''
  });
  const [showContactInfo, setShowContactInfo] = useState(false);

  const activeChatJid = useRef<string | null>(null);



  useEffect(() => {
    if (instances.length === 0) {
      fetchInstances();
    }
  }, [instances.length, fetchInstances]);

  useEffect(() => {
    if (!activeInstance) return;
    fetchChats(activeInstance);
    const interval = setInterval(() => fetchChats(activeInstance), 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInstance]);

  useEffect(() => {
    if (!activeInstance || !selectedChat) return;
    if (activeChatJid.current !== selectedChat.remoteJid) {
      activeChatJid.current = selectedChat.remoteJid;
      fetchMessages(activeInstance, selectedChat.remoteJid);
      fetchNotes(activeInstance, selectedChat.remoteJid);
      
      setEditInfo(prev => {
        const isLid = (val: string) => val.includes('@lid') || /^\d{15}$/.test(val) || val === 'Contacto sin nombre';
        
        return {
          pushName: (!prev.pushName || isLid(prev.pushName)) ? (selectedChat.pushName || '') : prev.pushName,
          phoneNumber: (!prev.phoneNumber || isLid(prev.phoneNumber)) ? (selectedChat.phoneNumber || '') : prev.phoneNumber,
          email: prev.email || selectedChat.email || ''
        };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInstance, selectedChat?.remoteJid, selectedChat?.pushName, selectedChat?.phoneNumber]);

  useEffect(() => {
    if (!activeInstance || !selectedChat) return;
    const remoteJid = selectedChat.remoteJid;
    const interval = setInterval(() => {
      fetchMessages(activeInstance, remoteJid);
    }, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInstance, selectedChat?.remoteJid]);

  useEffect(() => {
    // any initialization
  }, [activeInstance]);

  return (
    <>
      <div className="theme-surface h-[calc(100vh-140px)] flex gap-0.5 overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
        <ChatList />
        <ChatArea activeInstance={activeInstance} setShowContactInfo={setShowContactInfo} />
        <ChatSidebar 
          activeInstance={activeInstance}
          editInfo={editInfo}
          setEditInfo={setEditInfo}
          showContactInfo={showContactInfo}
          setShowContactInfo={setShowContactInfo}
        />
      </div>
    </>
  );
};

export default ChatHub;
