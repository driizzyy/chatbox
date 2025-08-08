# Simple Chat Platform

A real-time chat application with a JavaScript frontend (hosted on GitHub Pages) and a Node.js + Socket.io backend.

## 🚀 Features

- Real-time messaging using WebSockets
- User presence indicators
- Online users list
- Responsive design for mobile and desktop
- Username validation
- Message sanitization
- Connection status indicators

## 📁 Project Structure

```
chat/
├── github-pages/          # Frontend (GitHub Pages)
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── chatbox/              # Backend (Node.js + Socket.io)
    ├── package.json
    ├── server.js
    └── README.md
```

## 🔧 Setup Instructions

### Backend Setup (Node.js Server)

1. **Navigate to the backend directory:**
   ```bash
   cd chatbox
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run locally for testing:**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3000`

### Frontend Setup (GitHub Pages)

1. **Update the server URL in `script.js`:**
   - Open `github-pages/script.js`
   - Change `SERVER_URL` from `http://localhost:3000` to your deployed backend URL

2. **Deploy to GitHub Pages:**
   - Push the `github-pages` folder contents to a GitHub repository
   - Enable GitHub Pages in repository settings
   - Your chat frontend will be available at `https://yourusername.github.io/repository-name`

## 🌐 Deployment Options

### Option 1: Render (Recommended)

1. **Create account at [render.com](https://render.com)**

2. **Connect your GitHub repository**

3. **Create a new Web Service:**
   - Build Command: `cd chatbox && npm install`
   - Start Command: `cd chatbox && npm start`
   - Auto-deploy: Enable

4. **Environment Variables:** None required for basic setup

5. **Update frontend:** Change `SERVER_URL` in `script.js` to your Render URL

### Option 2: Heroku

1. **Install Heroku CLI**

2. **Navigate to chatbox directory:**
   ```bash
   cd chatbox
   ```

3. **Initialize Heroku app:**
   ```bash
   heroku create your-chat-app-name
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

5. **Update frontend:** Change `SERVER_URL` in `script.js` to your Heroku URL

## 🔒 Security Features

- Message length validation (500 characters max)
- Username length validation (20 characters max)
- HTML escaping to prevent XSS attacks
- CORS configuration for allowed origins
- Input sanitization

## 🎨 Customization

### Styling
Edit `styles.css` to customize the appearance:
- Colors and gradients
- Fonts and typography
- Layout and spacing
- Mobile responsiveness

### Features
Extend functionality by modifying:
- `script.js` for frontend features
- `server.js` for backend features

## 🛠️ Development

### Local Development

1. **Start backend:**
   ```bash
   cd chatbox
   npm run dev
   ```

2. **Serve frontend:**
   Open `index.html` in your browser or use a local server:
   ```bash
   cd github-pages
   python -m http.server 8000  # Python 3
   # or
   npx serve .  # Node.js
   ```

### Testing

- Test with multiple browser tabs/windows
- Test on different devices and screen sizes
- Test connection stability
- Test with long messages and usernames

## 📋 TODO / Future Enhancements

- [ ] Message persistence (database integration)
- [ ] Private messaging
- [ ] File/image sharing
- [ ] Emoji support
- [ ] Message reactions
- [ ] Chat rooms/channels
- [ ] User authentication
- [ ] Message encryption
- [ ] Push notifications

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed:**
   - Check if backend server is running
   - Verify CORS settings
   - Check firewall settings

2. **Messages not appearing:**
   - Check browser console for errors
   - Verify WebSocket connection
   - Check server logs

3. **Username issues:**
   - Ensure username is unique
   - Check character limits
   - Verify special characters

## 📄 License

MIT License - feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy chatting! 💬**
