# 🌐 Browser Battle Flow Test Guide

## 🎯 **Test Users Created Successfully**

✅ **Test Battle 1**: `testbattle1@pokemon.test` / `testbattle123`
- UID: `axEUHeNI2icyOL62HqZynoH4SWk1`
- Team: "Test Battle 1 Team" (Pikachu + Bulbasaur)

✅ **Test Battle 2**: `testbattle2@pokemon.test` / `testbattle123`
- UID: `ruIS3D8VQtXeOKjho3KWf50keq92`
- Team: "Test Battle 2 Team" (Pikachu + Bulbasaur)

## 🚀 **Step-by-Step Browser Test Instructions**

### **Step 1: Open Two Browsers**
- **Browser 1**: Chrome, Firefox, Safari, or Edge
- **Browser 2**: Different browser or incognito/private window
- **Important**: Use different browsers or incognito mode to ensure separate sessions

### **Step 2: Navigate to Your App**
- Both browsers: Go to your Pokemon battle app URL
- Example: `http://localhost:3000` (if running locally)
- Or your deployed URL

### **Step 3: Sign In Users**

#### **Browser 1 (Host)**
1. Click "Sign In" or "Login"
2. Enter credentials:
   - **Email**: `testbattle1@pokemon.test`
   - **Password**: `testbattle123`
3. Verify you're signed in as "Test Battle 1"

#### **Browser 2 (Guest)**
1. Click "Sign In" or "Login"
2. Enter credentials:
   - **Email**: `testbattle2@pokemon.test`
   - **Password**: `testbattle123`
3. Verify you're signed in as "Test Battle 2"

### **Step 4: Test Room Creation (Host)**
**In Browser 1 (testbattle1):**
1. Navigate to the Lobby or "Create Room" section
2. Click "Create Room" or "Host Battle"
3. Verify room is created successfully
4. Note the Room ID (you'll need this for the guest)

### **Step 5: Test Room Joining (Guest)**
**In Browser 2 (testbattle2):**
1. Navigate to the Lobby or "Join Room" section
2. Enter the Room ID from Browser 1
3. Click "Join Room"
4. Verify guest successfully joins the room

### **Step 6: Test Team Selection**
**In Both Browsers:**
1. **Browser 1**: Select "Test Battle 1 Team" (should be pre-loaded)
2. **Browser 2**: Select "Test Battle 2 Team" (should be pre-loaded)
3. Verify both users show as "Ready"

### **Step 7: Test Battle Creation**
**In Browser 1 (Host):**
1. Click "Start Battle" or "Begin Battle"
2. Verify battle is created successfully
3. Check that both users are in the battle

### **Step 8: Test Battle Flow**
**In Both Browsers:**
1. Verify battle interface loads
2. Test move selection (both users)
3. Test turn-based gameplay
4. Verify real-time updates between browsers
5. Test team switching if available
6. Complete the battle

## 🔍 **What to Look For**

### ✅ **Success Indicators**
- Both users can sign in without errors
- Room creation works without permission errors
- Guest can join room without "Room is full" errors
- Team selection works for both users
- Battle creation succeeds
- Real-time updates work between browsers
- No Firebase permission errors in console

### ❌ **Error Indicators to Watch For**
- "Missing or insufficient permissions" errors
- "Room is full" errors when joining
- Battle creation failures
- Team selection failures
- Real-time sync issues

## 🛠️ **Troubleshooting**

### **If You See Permission Errors:**
1. Check browser console for detailed error messages
2. Verify Firestore rules are deployed
3. Check if users are properly authenticated

### **If Room Joining Fails:**
1. Verify room ID is correct
2. Check if room still exists
3. Try refreshing both browsers

### **If Battle Creation Fails:**
1. Check Cloud Functions logs
2. Verify both users have teams selected
3. Check network connectivity

## 📊 **Test Results Tracking**

Use this checklist to track your test results:

- [ ] **User Authentication**: Both users can sign in
- [ ] **Room Creation**: Host can create room
- [ ] **Room Joining**: Guest can join room
- [ ] **Team Selection**: Both users can select teams
- [ ] **Battle Creation**: Battle starts successfully
- [ ] **Real-time Updates**: Changes sync between browsers
- [ ] **Move Handling**: Moves work correctly
- [ ] **Team Switching**: Team changes work (if available)
- [ ] **Battle Completion**: Battle ends properly

## 🎯 **Expected Results**

If everything is working correctly, you should see:
- ✅ No permission errors
- ✅ Smooth room creation and joining
- ✅ Successful battle initialization
- ✅ Real-time synchronization between browsers
- ✅ Complete battle flow from start to finish

## 🚨 **If Tests Fail**

If you encounter any issues:
1. Check the browser console for error messages
2. Verify Firebase connection
3. Check Cloud Functions status
4. Review Firestore rules
5. Test with the monitoring script (see below)

---

**🎉 Ready to test! Follow the steps above to validate your battle flow with two real users.**
