#!/usr/bin/env python3

import os
import sys
import json

def load_env_file():
    """Load environment variables from .env.local file"""
    env_vars = {}
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print("❌ .env.local file not found!")
        sys.exit(1)
    return env_vars

def cleanup_battles():
    try:
        print('🔥 Loading environment variables...')
        env_vars = load_env_file()
        
        project_id = env_vars.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
        if not project_id:
            print("❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID not found in .env.local")
            sys.exit(1)
        
        print(f'📋 Project ID: {project_id}')
        print('🧹 Starting cleanup of battle data...')
        
        # Import Firebase Admin SDK
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
        except ImportError:
            print("❌ Firebase Admin SDK not installed. Installing...")
            os.system("pip3 install firebase-admin")
            import firebase_admin
            from firebase_admin import credentials, firestore
        
        # Initialize Firebase Admin SDK
        if not firebase_admin._apps:
            # Use default credentials
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {
                'projectId': project_id
            })
        
        db = firestore.client()
        
        # Clean up battle rooms
        print('📦 Cleaning up battle rooms...')
        rooms_ref = db.collection('battle_rooms')
        rooms = list(rooms_ref.stream())
        room_count = 0
        
        for room in rooms:
            print(f'🗑️  Deleting room: {room.id}')
            room.reference.delete()
            room_count += 1
        
        print(f'✅ Deleted {room_count} battle rooms')
        
        # Clean up battles
        print('⚔️  Cleaning up battles...')
        battles_ref = db.collection('battles')
        battles = list(battles_ref.stream())
        battle_count = 0
        
        for battle in battles:
            print(f'🗑️  Deleting battle: {battle.id}')
            battle.reference.delete()
            battle_count += 1
        
        print(f'✅ Deleted {battle_count} battles')
        
        # Clean up chat messages
        print('💬 Cleaning up chat messages...')
        chat_ref = db.collection('chat_messages')
        chat_messages = list(chat_ref.stream())
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
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    cleanup_battles()
