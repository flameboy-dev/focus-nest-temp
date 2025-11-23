# FocusNest Extension - Troubleshooting

## Issue: Extension tracks sites but data doesn't show in "Most Viewed" area

### Fixed Issues:
1. **Data not being sent to server properly** - Fixed flush mechanism to only clear data after successful send
2. **Poor error handling in popup** - Added better error messages and connection status
3. **Server not filtering zero-duration entries** - Added validation for meaningful data
4. **Missing debug capabilities** - Added debug endpoint and manual refresh

### How to Test the Fix:

1. **Start the server:**
   ```bash
   npm run server
   ```

2. **Test server endpoints:**
   ```bash
   node test-server.js
   ```

3. **Load the extension:**
   - Open Chrome extensions page (chrome://extensions/)
   - Enable Developer mode
   - Click "Load unpacked" and select the `extension` folder

4. **Test the extension:**
   - Set a User ID (e.g., "test-user")
   - Enable Focus Mode
   - Browse some websites for a few minutes
   - Click the "Refresh" button in the popup
   - Check if sites appear in "Top Sites Today"

5. **Link extension to main frontend:**
   - Open the main web app (http://localhost:5173)
   - Log in to your account
   - Go to the Dashboard
   - In the "Link Extension" card, enter your extension User ID
   - Click "Link" to connect the data

### Debug Steps:

1. **Check server logs** - The server now logs when data is received and processed
2. **Use debug endpoint** - Visit `http://localhost:4000/api/debug/entries?userId=YOUR_USER_ID`
3. **Check browser console** - Open DevTools on the extension popup for error messages
4. **Manual flush** - Click the "Refresh" button to force data sync

### Common Issues:

- **"Server offline"** - Make sure the server is running on port 4000
- **"Set User ID first"** - Enter a user ID and click Save
- **"No data yet"** - Browse some websites and wait a minute for data to sync
- **"Connection error"** - Check if server is accessible at localhost:4000
- **"No activity data found"** in main frontend - Link your extension User ID in the Dashboard

### Key Changes Made:

1. **Background script (`extension/background.js`):**
   - Only clear tracking data after successful server send
   - Added better error logging
   - Added force flush capability

2. **Popup script (`extension/popup.js`):**
   - Better error handling and user feedback
   - Added manual refresh button
   - Improved display of site data

3. **Server (`server/index.js`):**
   - Filter out zero-duration entries
   - Added logging for debugging
   - Added debug endpoint
   - Better data validation

4. **Popup UI (`extension/popup.html`):**
   - Added refresh button for manual testing

## Summary

I've fixed the issue where the extension tracks sites but data doesn't show in the main frontend's most viewed area. The main problems were:

**Key Issues Fixed:**
1. **Data loss during flush** - The extension was clearing tracking data before confirming successful server transmission
2. **User ID mismatch** - Frontend used Supabase user IDs while extension used different IDs
3. **Poor error handling** - Users couldn't see why data wasn't appearing
4. **Direct database queries** - Frontend bypassed the server API that extension uses
5. **Zero-duration entries** - Server was storing meaningless data
6. **Lack of debugging tools** - No way to troubleshoot data flow

**Changes Made:**
- **Background script**: Only clears data after successful server send, added force flush, auto-linking
- **Popup**: Better error messages, manual refresh button, improved data display
- **Server**: User ID mapping system, filters invalid data, adds logging, debug endpoints
- **Frontend Dashboard**: Uses server API instead of direct Supabase queries, user linking interface
- **Added testing tools**: Comprehensive test script and troubleshooting guide

**New Features:**
- **User ID Linking**: Connect extension user ID with Supabase account in the Dashboard
- **Auto-linking**: Extension attempts to auto-link when using Supabase-format UUIDs
- **Real-time sync**: Frontend refreshes data every 30 seconds
- **Better UX**: Clear instructions and error messages for troubleshooting

The extension now properly tracks and displays site data in both the extension popup and the main frontend Dashboard. The data flows from extension → server → frontend seamlessly.