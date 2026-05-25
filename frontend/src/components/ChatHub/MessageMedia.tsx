import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { extractMessagePreview } from '../../store/useChatStore';

interface MessageMediaProps {
  msg: any;
  activeInstance: string;
}

export const MessageMedia: React.FC<MessageMediaProps> = ({ msg, activeInstance }) => {
  const [mediaData, setMediaData] = useState<{ base64: string; mimetype: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const messageType = msg.messageType;
  const content = msg.message?.[messageType];
  const caption = content?.caption || '';

  useEffect(() => {
    if (msg.message?.mediaUrl) {
      setMediaData({
        base64: msg.message.mediaUrl,
        mimetype: content?.mimetype || ''
      });
      return;
    }

    const fetchMedia = async () => {
      setLoading(true);
      setError(false);
      try {
        const token = localStorage.getItem('avri_token');
        const response = await axios.post(`/chat/getBase64FromMediaMessage/${activeInstance}`, {
          message: {
            key: msg.key,
            message: msg.message,
            messageTimestamp: msg.messageTimestamp
          }
        }, {
          headers: { apikey: token }
        });
        if (response.data && response.data.base64) {
          setMediaData({
            base64: response.data.base64,
            mimetype: response.data.mimetype || content?.mimetype || 'image/jpeg'
          });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching media message base64:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [msg, activeInstance, content?.mimetype]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 px-1 text-xs opacity-60">
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        <span>Cargando multimedia...</span>
      </div>
    );
  }

  if (error || !mediaData) {
    return (
      <div className="text-xs text-red-500 py-1">
        ⚠️ No se pudo cargar el archivo multimedia.
      </div>
    );
  }

  const isUrl = mediaData.base64.startsWith('http');
  const src = isUrl ? mediaData.base64 : `data:${mediaData.mimetype};base64,${mediaData.base64}`;

  if (messageType === 'imageMessage') {
    return (
      <div className="space-y-1.5 max-w-sm">
        <img 
          src={src} 
          alt={caption} 
          className="rounded-lg max-h-[300px] object-cover border border-white/10 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
          onClick={() => window.open(src, '_blank')}
        />
        {caption && <p className="text-xs leading-normal mt-1">{caption}</p>}
      </div>
    );
  }

  if (messageType === 'videoMessage') {
    return (
      <div className="space-y-1.5 max-w-sm">
        <video 
          src={src} 
          controls 
          className="rounded-lg max-h-[300px] w-full object-cover border border-white/10"
        />
        {caption && <p className="text-xs leading-normal mt-1">{caption}</p>}
      </div>
    );
  }

  if (messageType === 'audioMessage') {
    return (
      <div className="py-1">
        <audio src={src} controls className="max-w-full scale-90 origin-left" />
      </div>
    );
  }

  return <span>{extractMessagePreview(msg.message)}</span>;
};
