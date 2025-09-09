import { roomService } from './roomService';

/**
 * Cleanup function to delete all existing rooms
 * This can be called from the browser console for testing
 */
export async function cleanupAllRooms(): Promise<void> {
  try {
    console.log('Starting room cleanup...');
    
    // Get all rooms by listening to the rooms change
    return new Promise((resolve, reject) => {
      const unsubscribe = roomService.onRoomsChange(async (rooms) => {
        unsubscribe(); // Stop listening
        
        console.log(`Found ${rooms.length} rooms to delete`);
        
        if (rooms.length === 0) {
          console.log('No rooms found. Database is already clean.');
          resolve();
          return;
        }
        
        // Delete all rooms
        const deletePromises = rooms.map(async (room) => {
          try {
            console.log(`Deleting room: ${room.id} (${room.hostName})`);
            // Use the leaveRoom method which properly handles deletion
            await roomService.leaveRoom(room.id, room.hostId);
          } catch (error) {
            console.error(`Failed to delete room ${room.id}:`, error);
          }
        });
        
        await Promise.all(deletePromises);
        
        console.log(`Successfully processed ${rooms.length} rooms. Database should be clean now.`);
        resolve();
      });
      
      // Set a timeout in case no rooms are found
      setTimeout(() => {
        unsubscribe();
        console.log('Cleanup completed (timeout reached)');
        resolve();
      }, 5000);
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).cleanupAllRooms = cleanupAllRooms;
}
