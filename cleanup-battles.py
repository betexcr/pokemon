#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv('.env.local')

def cleanup_battles():
    try:
        print('🔥 Initializing Firebase...')
        
        # Initialize Firebase Admin SDK
        if not firebase_admin._apps:
            # Use default credentials (service account key or default credentials)
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {
                'projectId': os.getenv('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
            })
        
        db = firestore.client()
        
        print('🧹 Starting cleanup of battle data...')
        
        # Clean up battle rooms
        print('📦 Cleaning up battle rooms...')
        rooms_ref = db.collection('battle_rooms')
        rooms = rooms_ref.stream()
        room_count = 0
        
        for room in rooms:
            print(f'🗑️  Deleting room: {room.id}')
            room.reference.delete()
            room_count += 1
        
        print(f'✅ Deleted {room_count} battle rooms')
        
        # Clean up battles
        print('⚔️  Cleaning up battles...')
        battles_ref = db.collection('battles')
        battles = battles_ref.stream()
        battle_count = 0
        
        for battle in battles:
            print(f'🗑️  Deleting battle: {battle.id}')
            battle.reference.delete()
            battle_count += 1
        
        print(f'✅ Deleted {battle_count} battles')
        
        # Clean up chat messages
        print('💬 Cleaning up chat messages...')
        chat_ref = db.collection('chat_messages')
        chat_messages = chat_ref.stream()
        chat_count = 0
        
        for message in chat_messages:
            print(f'🗑️  Deleting chat message: {message.id}')
            message.reference.delete()
            chat_count += 1
        
        print(f'✅ Deleted {chat_count} chat messages')
        
        print('🎉 Cleanup completed successfully!')
        print('📊 Summary:')
        print(f'   - Battle rooms: {room_count} deleted')
        print(f'   - Battles: {battle_count} deleted')
        print(f'   - Chat messages: {chat_count} deleted')
        
    except Exception as error:
        print(f'❌ Error during cleanup: {error}')
        sys.exit(1)

if __name__ == '__main__':
    cleanup_battles()
