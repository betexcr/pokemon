import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'user' | 'system';
}

class ChatService {
  private messagesCollection = 'chat_messages';

  // Send a message to a room
  async sendMessage(roomId: string, userId: string, userName: string, message: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const messageData = {
      roomId,
      userId,
      userName,
      message: message.trim(),
      type: 'user' as const,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, this.messagesCollection), messageData);
  }

  // Send a system message
  async sendSystemMessage(roomId: string, message: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const messageData = {
      roomId,
      userId: 'system',
      userName: 'System',
      message: message.trim(),
      type: 'system' as const,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, this.messagesCollection), messageData);
  }

  // Listen to messages in a room
  onMessagesChange(roomId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe {
    if (!db) {
      callback([]);
      return () => {};
    }
    
    const messagesQuery = query(
      collection(db, this.messagesCollection),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          message: data.message,
          timestamp: data.timestamp?.toDate() || new Date(),
          type: data.type
        } as ChatMessage);
      });
      callback(messages);
    });
  }
}

export const chatService = new ChatService();


