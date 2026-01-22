# Network Deployment Guide

This guide will help you deploy the Acero CMS backend and admin panel on your local network so you can access them from other devices.

## Prerequisites

- Both backend and admin-panel should be installed with dependencies (`npm install`)
- Your devices should be on the same network (WiFi or LAN)
- Firewall should allow connections on the ports you're using

## Step 1: Find Your IP Address

### Windows:
1. Open Command Prompt or PowerShell
2. Run: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter (usually WiFi or Ethernet)
4. Example: `192.168.1.100`

### Mac/Linux:
1. Open Terminal
2. Run: `ifconfig` or `ip addr`
3. Look for your network interface (usually `en0` for WiFi or `eth0` for Ethernet)
4. Find the `inet` address (IPv4)

## Step 2: Configure Backend

### Option A: Using Environment Variables (Recommended)

1. Create a `.env` file in the `backend` folder (if it doesn't exist)
2. Add or update these variables (replace `YOUR_IP_ADDRESS` with your actual IP from Step 1):
   ```env
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development
   
   # URLs for notifications and email links (important for network access)
   ADMIN_PANEL_URL=http://YOUR_IP_ADDRESS:5173
   PUBLIC_SITE_URL=http://YOUR_IP_ADDRESS:5174
   ```
   
   Example:
   ```env
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development
   ADMIN_PANEL_URL=http://192.168.1.100:5173
   PUBLIC_SITE_URL=http://192.168.1.100:5174
   ```
   
   (Add your other environment variables like database connection, JWT secret, etc.)

### Option B: Default Configuration

The backend is already configured to listen on `0.0.0.0` by default, which means it will accept connections from any network interface. However, **it's recommended to set `ADMIN_PANEL_URL` and `PUBLIC_SITE_URL`** to ensure that email notifications and links use the correct network IP address instead of localhost.

## Step 3: Configure Admin Panel

1. Create a `.env` file in the `admin-panel` folder
2. Add the following (replace `YOUR_IP_ADDRESS` with your actual IP from Step 1):
   ```env
   VITE_API_URL=http://YOUR_IP_ADDRESS:3000/api
   ```
   
   Example:
   ```env
   VITE_API_URL=http://192.168.1.100:3000/api
   ```

## Step 4: Start the Servers

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
# or
npm start
```

You should see output like:
```
=================================
🚀 Server is running on port 3000
📍 Environment: development
🔗 Local URL: http://localhost:3000
🌐 Network URL: http://192.168.1.100:3000
=================================
```

### Terminal 2 - Admin Panel:
```bash
cd admin-panel
npm run dev
```

You should see output like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

## Step 5: Access from Other Devices

### On the Same Network:

1. **Backend API**: Open a browser on another device and go to:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```
   You should see the API status message.

2. **Admin Panel**: Open a browser on another device and go to:
   ```
   http://YOUR_IP_ADDRESS:5173
   ```
   (Or whatever port Vite shows in the Network URL)

### Important Notes:

- **Firewall**: Make sure Windows Firewall (or your firewall) allows connections on ports 3000 and 5173
- **IP Address Changes**: If your IP address changes (common with DHCP), you'll need to update the `VITE_API_URL` in the admin-panel `.env` file
- **HTTPS**: For production, consider using HTTPS with a reverse proxy (nginx, Caddy, etc.)

## Troubleshooting

### Can't access from other devices:

1. **Check Firewall**: 
   - Windows: Go to Windows Defender Firewall → Allow an app through firewall
   - Add Node.js or allow ports 3000 and 5173

2. **Check IP Address**: 
   - Make sure you're using the correct IP address
   - Run `ipconfig` again to verify

3. **Check Network**: 
   - Ensure all devices are on the same network
   - Try pinging the server IP from another device

4. **Check Backend is Running**: 
   - Verify the backend shows the Network URL in console
   - Test the backend API from the server itself: `http://localhost:3000`

5. **Check Admin Panel Config**: 
   - Verify `.env` file has the correct IP address
   - Restart the admin panel after changing `.env`

6. **Check Backend Environment Variables**:
   - If email notifications or links are redirecting to localhost, make sure `ADMIN_PANEL_URL` and `PUBLIC_SITE_URL` are set in the backend `.env` file
   - These should use your network IP address, not localhost

### Port Already in Use:

If port 3000 or 5173 is already in use:
- Backend: Change `PORT` in `.env` file
- Admin Panel: Vite will automatically try the next available port, or you can specify: `npm run dev -- --port 5174`

## Production Deployment

For production deployment on a server:

1. **Backend**: 
   - Set `NODE_ENV=production`
   - Use a process manager like PM2: `pm2 start server.js`
   - Consider using a reverse proxy (nginx) for HTTPS

2. **Admin Panel**: 
   - Build for production: `npm run build`
   - Serve the `dist` folder with a web server (nginx, Apache, etc.)
   - Update `VITE_API_URL` to point to your production backend URL

## Security Considerations

- **Development**: The current CORS setup allows all origins (`origin: "*"`). For production, restrict this to your actual domain.
- **Authentication**: Ensure JWT tokens and secrets are properly secured
- **HTTPS**: Use HTTPS in production to encrypt traffic
- **Firewall**: Only open necessary ports

