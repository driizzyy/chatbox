// ChatBox by DriizzyyB - Advanced Real-Time Chat Platform
const SERVER_URL = 'https://simple-chat-backend-ook3.onrender.com';

class ChatApp {
    constructor() {
        this.socket = null;
        this.username = '';
        this.isConnected = false;
        this.soundEnabled = true;
        this.darkMode = false;
        this.currentRoom = 'gaming';
        this.privateRooms = new Map();
        this.isAdmin = false;
        this.currentRoomCode = null;
        this.selectedUser = null;
        this.roomData = {
            gaming: {
                title: 'Gaming',
                icon: 'fas fa-gamepad',
                description: 'Gaming discussions and LFG • Let\'s play together!'
            },
            coding: {
                title: 'Coding',
                icon: 'fas fa-code', 
                description: 'Programming help and code sharing • Debug together!'
            },
            chilling: {
                title: 'Chilling',
                icon: 'fas fa-coffee',
                description: 'Casual conversations and relaxation • Take it easy!'
            },
            general: {
                title: 'General',
                icon: 'fas fa-comments',
                description: 'General discussions • Talk about anything!'
            }
        };
        
        this.initElements();
        this.bindEvents();
        this.loadSettings();
        this.connectToServer();
        
        // Fallback to hide loading screen after 10 seconds
        setTimeout(() => {
            if (!this.isConnected) {
                this.hideLoadingScreen();
                this.showNotification('Connection timeout. Please refresh and try again.');
            }
        }, 10000);
    }
    
    initElements() {
        // Get all the DOM elements
        this.loadingScreen = document.getElementById('loadingScreen');
        this.appContainer = document.getElementById('appContainer');
        this.usernameSection = document.getElementById('usernameSection');
        this.chatSection = document.getElementById('chatSection');
        this.usernameInput = document.getElementById('usernameInput');
        this.joinBtn = document.getElementById('joinBtn');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusDot = document.getElementById('statusDot');
        this.userCount = document.getElementById('userCount');
        this.usersList = document.getElementById('usersList');
        this.charCounter = document.getElementById('charCounter');
        
        // Room elements
        this.roomTabs = document.getElementById('roomTabs');
        this.currentRoomTitle = document.getElementById('currentRoomTitle');
        this.currentRoomDescription = document.getElementById('currentRoomDescription');
        this.currentRoomName = document.getElementById('currentRoomName');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.joinPrivateBtn = document.getElementById('joinPrivateBtn');
        this.privateRoomsList = document.getElementById('privateRoomsList');
        this.refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
        
        // Settings and modal elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.soundToggle = document.getElementById('soundToggle');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.desktopNotifications = document.getElementById('desktopNotifications');
        
        // Create room modal
        this.createRoomModal = document.getElementById('createRoomModal');
        this.closeCreateRoom = document.getElementById('closeCreateRoom');
        this.cancelCreateRoom = document.getElementById('cancelCreateRoom');
        this.confirmCreateRoom = document.getElementById('confirmCreateRoom');
        this.roomNameInput = document.getElementById('roomNameInput');
        this.roomPasswordInput = document.getElementById('roomPasswordInput');
        this.maxUsersInput = document.getElementById('maxUsersInput');
        
        // Join room modal
        this.joinRoomModal = document.getElementById('joinRoomModal');
        this.closeJoinRoom = document.getElementById('closeJoinRoom');
        this.cancelJoinRoom = document.getElementById('cancelJoinRoom');
        this.confirmJoinRoom = document.getElementById('confirmJoinRoom');
        this.joinRoomCodeInput = document.getElementById('joinRoomCodeInput');
        this.joinRoomPasswordInput = document.getElementById('joinRoomPasswordInput');
        
        // Admin elements
        this.userContextMenu = document.getElementById('userContextMenu');
        this.kickUser = document.getElementById('kickUser');
        this.banUser = document.getElementById('banUser');
        this.makeAdmin = document.getElementById('makeAdmin');
        
        this.roomInfoModal = document.getElementById('roomInfoModal');
        this.closeRoomInfo = document.getElementById('closeRoomInfo');
        this.adminRoomCode = document.getElementById('adminRoomCode');
        this.adminUserCount = document.getElementById('adminUserCount');
        this.adminCreatedTime = document.getElementById('adminCreatedTime');
        this.copyRoomCode = document.getElementById('copyRoomCode');
        this.bannedUsersList = document.getElementById('bannedUsersList');
        this.deleteRoom = document.getElementById('deleteRoom');
        
        // Optional elements (may not exist in simplified version)
        this.leaveBtn = document.getElementById('leaveBtn');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.toggleSounds = document.getElementById('toggleSounds');
        this.toggleUsers = document.getElementById('toggleUsers');
    }
    
    bindEvents() {
        // Username section events
        if (this.joinBtn) {
            this.joinBtn.addEventListener('click', () => this.joinChat());
        }
        if (this.usernameInput) {
            this.usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.joinChat();
            });
        }
        
        // Chat section events
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            this.messageInput.addEventListener('input', () => this.updateCharCounter());
        }
        
        // Room tab events
        if (this.roomTabs) {
            this.roomTabs.addEventListener('click', (e) => {
                const roomTab = e.target.closest('.room-tab');
                if (roomTab) {
                    const room = roomTab.dataset.room;
                    this.switchRoom(room);
                }
            });
        }
        
        // Room action events
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', () => this.openCreateRoomModal());
        }
        if (this.joinPrivateBtn) {
            this.joinPrivateBtn.addEventListener('click', () => this.openJoinRoomModal());
        }
        if (this.refreshRoomsBtn) {
            this.refreshRoomsBtn.addEventListener('click', () => this.refreshPrivateRooms());
        }
        
        // Settings events
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openSettings());
        }
        if (this.closeSettings) {
            this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        }
        if (this.soundToggle) {
            this.soundToggle.addEventListener('change', (e) => this.toggleSound(e.target.checked));
        }
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('change', (e) => this.toggleDarkMode(e.target.checked));
        }
        if (this.desktopNotifications) {
            this.desktopNotifications.addEventListener('change', (e) => this.toggleDesktopNotifications(e.target.checked));
        }
        
        // Create room modal events
        if (this.closeCreateRoom) {
            this.closeCreateRoom.addEventListener('click', () => this.closeCreateRoomModal());
        }
        if (this.cancelCreateRoom) {
            this.cancelCreateRoom.addEventListener('click', () => this.closeCreateRoomModal());
        }
        if (this.confirmCreateRoom) {
            this.confirmCreateRoom.addEventListener('click', () => this.createPrivateRoom());
        }
        
        // Join room modal events
        if (this.closeJoinRoom) {
            this.closeJoinRoom.addEventListener('click', () => this.closeJoinRoomModal());
        }
        if (this.cancelJoinRoom) {
            this.cancelJoinRoom.addEventListener('click', () => this.closeJoinRoomModal());
        }
        if (this.confirmJoinRoom) {
            this.confirmJoinRoom.addEventListener('click', () => this.joinPrivateRoom());
        }
        
        // Room code input formatting
        if (this.joinRoomCodeInput) {
            this.joinRoomCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
        
        // Admin events
        if (this.kickUser) {
            this.kickUser.addEventListener('click', () => this.kickSelectedUser());
        }
        if (this.banUser) {
            this.banUser.addEventListener('click', () => this.banSelectedUser());
        }
        if (this.makeAdmin) {
            this.makeAdmin.addEventListener('click', () => this.makeSelectedUserAdmin());
        }
        if (this.closeRoomInfo) {
            this.closeRoomInfo.addEventListener('click', () => this.closeRoomInfoModal());
        }
        if (this.copyRoomCode) {
            this.copyRoomCode.addEventListener('click', () => this.copyRoomCodeToClipboard());
        }
        if (this.deleteRoom) {
            this.deleteRoom.addEventListener('click', () => this.deleteCurrentRoom());
        }
        
        // Close context menu on click outside
        document.addEventListener('click', (e) => {
            if (this.userContextMenu && !this.userContextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
        
        // Optional button events
        if (this.leaveBtn) {
            this.leaveBtn.addEventListener('click', () => this.leaveChat());
        }
        if (this.emojiBtn) {
            this.emojiBtn.addEventListener('click', () => this.addEmoji());
        }
        if (this.toggleSounds) {
            this.toggleSounds.addEventListener('click', () => this.toggleSoundFromButton());
        }
        if (this.toggleUsers) {
            this.toggleUsers.addEventListener('click', () => this.toggleUsersPanel());
        }
        
        // Modal backdrop click to close
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) this.closeSettingsModal();
            });
        }
        if (this.createRoomModal) {
            this.createRoomModal.addEventListener('click', (e) => {
                if (e.target === this.createRoomModal) this.closeCreateRoomModal();
            });
        }
        if (this.joinRoomModal) {
            this.joinRoomModal.addEventListener('click', (e) => {
                if (e.target === this.joinRoomModal) this.closeJoinRoomModal();
            });
        }
    }
    
    connectToServer() {
        try {
            this.socket = io(SERVER_URL, {
                transports: ['websocket', 'polling']
            });
            
            this.socket.on('connect', () => {
                console.log('Connected to ChatBox server');
                this.isConnected = true;
                this.updateConnectionStatus('Connected', 'connected');
                this.hideLoadingScreen();
            });
            
            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.isConnected = false;
                this.updateConnectionStatus('Disconnected', 'disconnected');
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.updateConnectionStatus('Connection Failed', 'disconnected');
                this.hideLoadingScreen();
                this.showNotification('Failed to connect to server. Please refresh and try again.');
            });
            
            // Chat events
            this.socket.on('message', (data) => this.displayMessage(data));
            this.socket.on('user_joined', (data) => this.handleUserJoined(data));
            this.socket.on('user_left', (data) => this.handleUserLeft(data));
            this.socket.on('users_update', (users) => this.updateUsersList(users));
            this.socket.on('username_taken', () => this.handleUsernameTaken());
            
            // Room events
            this.socket.on('room_created', (data) => this.handleRoomCreated(data));
            this.socket.on('room_joined', (data) => this.handleRoomJoined(data));
            this.socket.on('room_error', (error) => this.handleRoomError(error));
            this.socket.on('private_rooms_update', (rooms) => this.updatePrivateRoomsList(rooms));
            
            // Admin events
            this.socket.on('kicked_from_room', (data) => this.handleKickedFromRoom(data));
            this.socket.on('banned_from_room', (data) => this.handleBannedFromRoom(data));
            this.socket.on('promoted_to_admin', (data) => this.handlePromotedToAdmin(data));
            this.socket.on('room_deleted', (data) => this.handleRoomDeleted(data));
            this.socket.on('room_info_update', (data) => this.handleRoomInfoUpdate(data));
            this.socket.on('admin_error', (error) => this.handleAdminError(error));
            
        } catch (error) {
            console.error('Failed to connect to server:', error);
            this.updateConnectionStatus('Connection Failed', 'disconnected');
        }
    }
    
    updateConnectionStatus(text, status) {
        if (this.connectionStatus) {
            this.connectionStatus.textContent = text;
        }
        if (this.statusDot) {
            this.statusDot.className = `status-dot ${status}`;
        }
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }
        if (this.appContainer) {
            this.appContainer.classList.add('loaded');
        }
    }
    
    joinChat() {
        if (!this.usernameInput) return;
        
        const username = this.usernameInput.value.trim();
        
        if (!username) {
            this.showNotification('Please enter a username');
            return;
        }
        
        if (username.length > 20) {
            this.showNotification('Username must be 20 characters or less');
            return;
        }
        
        if (!this.isConnected) {
            this.showNotification('Not connected to server. Please try again.');
            return;
        }
        
        this.username = username;
        this.socket.emit('join', { 
            username, 
            room: this.currentRoom 
        });
        
        // Switch to chat view
        if (this.usernameSection) this.usernameSection.style.display = 'none';
        if (this.chatSection) this.chatSection.style.display = 'flex';
        
        // Initialize room info
        this.updateRoomInfo(this.currentRoom);
        
        // Add welcome message
        this.addWelcomeMessage();
        
        // Focus message input
        setTimeout(() => {
            if (this.messageInput) this.messageInput.focus();
        }, 100);
    }
    
    addWelcomeMessage() {
        if (!this.chatMessages) return;
        
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'message system';
        welcomeMsg.innerHTML = `
            <div class="message-content">
                Welcome to ChatBox, ${this.username}! 🎉<br>
                Start chatting with people around the world!
            </div>
        `;
        this.chatMessages.appendChild(welcomeMsg);
        this.scrollToBottom();
    }
    
    updateCharCounter() {
        if (!this.messageInput || !this.charCounter || !this.sendBtn) return;
        
        const length = this.messageInput.value.length;
        this.charCounter.textContent = `${length}/500`;
        this.sendBtn.disabled = length === 0 || length > 500;
    }
    
    sendMessage() {
        if (!this.messageInput) return;
        
        const message = this.messageInput.value.trim();
        
        if (!message || message.length > 500) return;
        
        if (!this.isConnected) {
            this.showNotification('Not connected to server. Please try again.');
            return;
        }
        
        this.socket.emit('message', {
            username: this.username,
            message: message,
            room: this.currentRoom,
            timestamp: new Date().toISOString()
        });
        
        this.messageInput.value = '';
        this.updateCharCounter();
    }
    
    displayMessage(data) {
        if (!this.chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        if (data.type === 'system') {
            messageElement.className += ' system';
            messageElement.innerHTML = `
                <div class="message-content">${data.message}</div>
            `;
        } else {
            const isOwnMessage = data.username === this.username;
            messageElement.className += isOwnMessage ? ' own' : ' other';
            
            const time = new Date(data.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            messageElement.innerHTML = `
                <div class="message-header">
                    <strong>${isOwnMessage ? 'You' : data.username}</strong> • ${time}
                </div>
                <div class="message-content">${this.escapeHtml(data.message)}</div>
            `;
            
            // Play sound for incoming messages
            if (!isOwnMessage && this.soundEnabled) {
                this.playSound();
            }
        }
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    handleUserJoined(data) {
        this.displayMessage({
            type: 'system',
            message: `${data.username} joined the chat`
        });
        this.playSound();
    }
    
    handleUserLeft(data) {
        this.displayMessage({
            type: 'system',
            message: `${data.username} left the chat`
        });
    }
    
    updateUsersList(users) {
        if (!this.userCount || !this.usersList) return;
        
        console.log('Updating users list:', users); // Debug log
        
        this.userCount.textContent = users.length;
        this.usersList.innerHTML = '';
        
        users.forEach(user => {
            console.log('Processing user:', user, typeof user); // Debug log
            
            const userElement = document.createElement('div');
            userElement.className = 'user-tag';
            
            // Ensure user is a string
            const username = typeof user === 'string' ? user : (user.username || user.toString());
            
            if (username === this.username) {
                userElement.className += ' own';
            }
            
            // Check if user is admin (this would need to be sent from server)
            if (this.isAdmin && username !== this.username && this.currentRoom.startsWith('private_')) {
                userElement.className += ' clickable';
                userElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showContextMenu(e, username);
                });
            }
            
            userElement.textContent = username;
            this.usersList.appendChild(userElement);
        });
    }
    
    handleUsernameTaken() {
        this.showNotification('Username is already taken. Please choose another one.');
        if (this.usernameSection) this.usernameSection.style.display = 'flex';
        if (this.chatSection) this.chatSection.style.display = 'none';
        if (this.usernameInput) {
            this.usernameInput.focus();
            this.usernameInput.select();
        }
    }
    
    // UI Actions
    openSettings() {
        if (this.settingsModal) {
            this.settingsModal.style.display = 'flex';
        }
    }
    
    closeSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.style.display = 'none';
        }
    }
    
    leaveChat() {
        if (confirm('Are you sure you want to leave the chat?')) {
            if (this.socket) this.socket.disconnect();
            if (this.usernameSection) this.usernameSection.style.display = 'flex';
            if (this.chatSection) this.chatSection.style.display = 'none';
            this.username = '';
            if (this.chatMessages) this.chatMessages.innerHTML = '';
            if (this.usersList) this.usersList.innerHTML = '';
            if (this.userCount) this.userCount.textContent = '0';
            this.updateConnectionStatus('Disconnected', 'disconnected');
        }
    }
    
    addEmoji() {
        if (!this.messageInput) return;
        
        const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        this.messageInput.value += emoji;
        this.updateCharCounter();
        this.messageInput.focus();
    }
    
    // Room Management Methods
    switchRoom(room) {
        if (room === this.currentRoom) return;
        
        // Update UI
        document.querySelectorAll('.room-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-room="${room}"]`).classList.add('active');
        
        // Update room info
        this.currentRoom = room;
        this.updateRoomInfo(room);
        
        // Clear messages and switch room on server
        if (this.chatMessages) this.chatMessages.innerHTML = '';
        if (this.socket && this.username) {
            this.socket.emit('switch_room', { room, username: this.username });
        }
        
        this.addRoomWelcomeMessage(room);
    }
    
    updateRoomInfo(room) {
        const roomInfo = this.roomData[room];
        if (!roomInfo) return;
        
        if (this.currentRoomTitle) {
            this.currentRoomTitle.innerHTML = `<i class="${roomInfo.icon}"></i> ${roomInfo.title}`;
        }
        if (this.currentRoomDescription) {
            this.currentRoomDescription.textContent = roomInfo.description;
        }
        if (this.currentRoomName) {
            this.currentRoomName.textContent = roomInfo.title;
        }
    }
    
    addRoomWelcomeMessage(room) {
        if (!this.chatMessages) return;
        
        const roomInfo = this.roomData[room];
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'message system';
        welcomeMsg.innerHTML = `
            <div class="message-content">
                Welcome to the ${roomInfo.title} room! 🎉<br>
                ${roomInfo.description}
            </div>
        `;
        this.chatMessages.appendChild(welcomeMsg);
        this.scrollToBottom();
    }
    
    // Private Room Methods
    openCreateRoomModal() {
        if (this.createRoomModal) {
            this.createRoomModal.style.display = 'flex';
            if (this.roomNameInput) this.roomNameInput.focus();
        }
    }
    
    closeCreateRoomModal() {
        if (this.createRoomModal) {
            this.createRoomModal.style.display = 'none';
            if (this.roomNameInput) this.roomNameInput.value = '';
            if (this.roomPasswordInput) this.roomPasswordInput.value = '';
            if (this.maxUsersInput) this.maxUsersInput.value = '5';
        }
    }
    
    createPrivateRoom() {
        const name = this.roomNameInput?.value.trim();
        const password = this.roomPasswordInput?.value.trim();
        const maxUsers = parseInt(this.maxUsersInput?.value) || 5;
        
        if (!name) {
            this.showNotification('Please enter a room name');
            return;
        }
        
        if (name.length > 30) {
            this.showNotification('Room name must be 30 characters or less');
            return;
        }
        
        if (this.socket) {
            this.socket.emit('create_room', {
                name,
                password: password || null,
                maxUsers,
                creator: this.username
            });
        }
        
        this.closeCreateRoomModal();
    }
    
    openJoinRoomModal() {
        if (this.joinRoomModal) {
            this.joinRoomModal.style.display = 'flex';
            if (this.joinRoomCodeInput) this.joinRoomCodeInput.focus();
        }
    }
    
    closeJoinRoomModal() {
        if (this.joinRoomModal) {
            this.joinRoomModal.style.display = 'none';
            if (this.joinRoomCodeInput) this.joinRoomCodeInput.value = '';
            if (this.joinRoomPasswordInput) this.joinRoomPasswordInput.value = '';
        }
    }
    
    joinPrivateRoom() {
        const code = this.joinRoomCodeInput?.value.trim().toUpperCase();
        const password = this.joinRoomPasswordInput?.value.trim();
        
        if (!code) {
            this.showNotification('Please enter a room code');
            return;
        }
        
        if (this.socket) {
            this.socket.emit('join_room', {
                code,
                password: password || null,
                username: this.username
            });
        }
        
        this.closeJoinRoomModal();
    }
    
    refreshPrivateRooms() {
        if (this.socket && this.username) {
            this.socket.emit('get_private_rooms', this.username);
        }
    }
    
    updatePrivateRoomsList(rooms) {
        if (!this.privateRoomsList) return;
        
        this.privateRoomsList.innerHTML = '';
        
        if (rooms.length === 0) {
            this.privateRoomsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-door-closed"></i>
                    <span>No private rooms</span>
                </div>
            `;
            return;
        }
        
        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'private-room-item';
            roomElement.innerHTML = `
                <div class="private-room-info">
                    <div class="private-room-name">${room.name}</div>
                    <div class="private-room-code">Code: ${room.code}</div>
                </div>
                <div class="private-room-users">${room.users}/${room.maxUsers}</div>
            `;
            roomElement.addEventListener('click', () => {
                this.switchToPrivateRoom(room.code);
            });
            this.privateRoomsList.appendChild(roomElement);
        });
    }
    
    switchToPrivateRoom(code) {
        if (this.socket) {
            this.socket.emit('join_room', {
                code,
                password: null,
                username: this.username
            });
        }
    }
    
    // Room Event Handlers
    handleRoomCreated(data) {
        this.showNotification(`Private room "${data.name}" created! Code: ${data.code}`);
        this.refreshPrivateRooms();
    }
    
    handleRoomJoined(data) {
        this.showNotification(`Joined private room: ${data.name}`);
        this.currentRoom = `private_${data.code}`;
        this.updateRoomInfo('general'); // Default styling for private rooms
        if (this.currentRoomTitle) {
            this.currentRoomTitle.innerHTML = `<i class="fas fa-lock"></i> ${data.name}`;
        }
        if (this.currentRoomDescription) {
            this.currentRoomDescription.textContent = `Private room • Code: ${data.code}`;
        }
        if (this.chatMessages) this.chatMessages.innerHTML = '';
        this.refreshPrivateRooms();
    }
    
    handleRoomError(error) {
        this.showNotification(`Room error: ${error.message}`);
    }
    
    // Settings Methods
    loadSettings() {
        // Load dark mode setting
        const darkMode = localStorage.getItem('chatbox_darkMode') === 'true';
        this.toggleDarkMode(darkMode);
        if (this.darkModeToggle) this.darkModeToggle.checked = darkMode;
        
        // Load sound setting
        const soundEnabled = localStorage.getItem('chatbox_soundEnabled') !== 'false';
        this.soundEnabled = soundEnabled;
        if (this.soundToggle) this.soundToggle.checked = soundEnabled;
        
        // Load notification setting
        const desktopNotifications = localStorage.getItem('chatbox_desktopNotifications') === 'true';
        if (this.desktopNotifications) this.desktopNotifications.checked = desktopNotifications;
    }
    
    toggleDarkMode(enabled) {
        this.darkMode = enabled;
        document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
        localStorage.setItem('chatbox_darkMode', enabled);
        
        // Update sound button icon if it exists
        if (this.toggleSounds) {
            const icon = this.toggleSounds.querySelector('i');
            if (icon) {
                icon.className = enabled ? 'fas fa-moon' : 'fas fa-volume-up';
            }
        }
    }
    
    toggleSound(enabled) {
        this.soundEnabled = enabled;
        localStorage.setItem('chatbox_soundEnabled', enabled);
        
        if (this.toggleSounds) {
            const icon = this.toggleSounds.querySelector('i');
            if (icon) {
                icon.className = enabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
        }
    }
    
    toggleDesktopNotifications(enabled) {
        localStorage.setItem('chatbox_desktopNotifications', enabled);
        
        if (enabled && 'Notification' in window) {
            Notification.requestPermission();
        }
    }
    
    toggleSoundFromButton() {
        this.soundEnabled = !this.soundEnabled;
        this.toggleSound(this.soundEnabled);
        if (this.soundToggle) this.soundToggle.checked = this.soundEnabled;
    }
    
    toggleUsersPanel() {
        if (this.usersSidebar) {
            const isHidden = this.usersSidebar.style.display === 'none';
            this.usersSidebar.style.display = isHidden ? 'flex' : 'none';
        }
    }
    
    // Utility functions
    playSound() {
        if (this.soundEnabled && typeof AudioContext !== 'undefined') {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (e) {
                console.log('Audio not supported');
            }
        }
    }
    
    showNotification(message) {
        // Simple alert for now - could be enhanced with toast notifications
        alert(message);
    }
    
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ===== NEW ENHANCED METHODS =====
    
    // Settings Management
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('chatbox_settings') || '{}');
            this.soundEnabled = settings.soundEnabled !== false;
            this.darkMode = settings.darkMode === true;
            this.desktopNotificationsEnabled = settings.desktopNotifications === true;
            
            // Apply dark mode
            if (this.darkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
                if (this.darkModeToggle) this.darkModeToggle.checked = true;
            }
            
            // Update toggles
            if (this.soundToggle) this.soundToggle.checked = this.soundEnabled;
            if (this.desktopNotifications) this.desktopNotifications.checked = this.desktopNotificationsEnabled;
        } catch (error) {
            console.log('Error loading settings:', error);
        }
    }
    
    saveSettings() {
        const settings = {
            soundEnabled: this.soundEnabled,
            darkMode: this.darkMode,
            desktopNotifications: this.desktopNotificationsEnabled
        };
        localStorage.setItem('chatbox_settings', JSON.stringify(settings));
    }
    
    toggleSound(enabled) {
        this.soundEnabled = enabled;
        this.saveSettings();
        
        // Update button icon
        if (this.toggleSounds) {
            const icon = this.toggleSounds.querySelector('i');
            if (icon) {
                icon.className = enabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
        }
    }
    
    toggleDarkMode(enabled) {
        this.darkMode = enabled;
        if (enabled) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        this.saveSettings();
    }
    
    toggleDesktopNotifications(enabled) {
        this.desktopNotificationsEnabled = enabled;
        if (enabled && 'Notification' in window) {
            Notification.requestPermission();
        }
        this.saveSettings();
    }
    
    toggleSoundFromButton() {
        this.toggleSound(!this.soundEnabled);
        if (this.soundToggle) this.soundToggle.checked = this.soundEnabled;
    }
    
    toggleUsersPanel() {
        if (this.usersSidebar) {
            const isHidden = this.usersSidebar.style.display === 'none';
            this.usersSidebar.style.display = isHidden ? 'block' : 'none';
        }
    }
    
    // Room Management
    updateRoomInfo(room) {
        const roomInfo = this.roomData[room];
        if (!roomInfo) return;
        
        if (this.currentRoomTitle) {
            this.currentRoomTitle.innerHTML = `<i class="${roomInfo.icon}"></i> ${roomInfo.title}`;
        }
        if (this.currentRoomDescription) {
            this.currentRoomDescription.textContent = roomInfo.description;
        }
        if (this.currentRoomName) {
            this.currentRoomName.textContent = roomInfo.title;
        }
        
        // Update active tab
        if (this.roomTabs) {
            const tabs = this.roomTabs.querySelectorAll('.room-tab');
            tabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.room === room);
            });
        }
    }
    
    switchRoom(room) {
        if (room === this.currentRoom) return;
        
        const oldRoom = this.currentRoom;
        this.currentRoom = room;
        
        // Update UI
        this.updateRoomInfo(room);
        
        // Clear messages
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
        
        // Emit room switch to server
        if (this.socket && this.isConnected) {
            this.socket.emit('switch_room', {
                room: room,
                username: this.username
            });
        }
        
        console.log(`Switched from ${oldRoom} to ${room}`);
    }
    
    // Private Room Management
    openCreateRoomModal() {
        if (this.createRoomModal) {
            this.createRoomModal.style.display = 'flex';
            if (this.roomNameInput) this.roomNameInput.focus();
        }
    }
    
    closeCreateRoomModal() {
        if (this.createRoomModal) {
            this.createRoomModal.style.display = 'none';
            // Clear inputs
            if (this.roomNameInput) this.roomNameInput.value = '';
            if (this.roomPasswordInput) this.roomPasswordInput.value = '';
            if (this.maxUsersInput) this.maxUsersInput.value = '5';
        }
    }
    
    openJoinRoomModal() {
        if (this.joinRoomModal) {
            this.joinRoomModal.style.display = 'flex';
            if (this.joinRoomCodeInput) this.joinRoomCodeInput.focus();
        }
    }
    
    closeJoinRoomModal() {
        if (this.joinRoomModal) {
            this.joinRoomModal.style.display = 'none';
            // Clear inputs
            if (this.joinRoomCodeInput) this.joinRoomCodeInput.value = '';
            if (this.joinRoomPasswordInput) this.joinRoomPasswordInput.value = '';
        }
    }
    
    createPrivateRoom() {
        const name = this.roomNameInput?.value.trim();
        const password = this.roomPasswordInput?.value.trim();
        const maxUsers = parseInt(this.maxUsersInput?.value) || 5;
        
        if (!name) {
            this.showNotification('Please enter a room name');
            return;
        }
        
        if (name.length > 30) {
            this.showNotification('Room name must be 30 characters or less');
            return;
        }
        
        this.socket.emit('create_room', {
            name,
            password: password || null,
            maxUsers,
            creator: this.username
        });
        
        this.closeCreateRoomModal();
    }
    
    joinPrivateRoom() {
        const code = this.joinRoomCodeInput?.value.trim().toUpperCase();
        const password = this.joinRoomPasswordInput?.value.trim();
        
        if (!code) {
            this.showNotification('Please enter a room code');
            return;
        }
        
        this.socket.emit('join_room', {
            code,
            password: password || null,
            username: this.username
        });
        
        this.closeJoinRoomModal();
    }
    
    refreshPrivateRooms() {
        if (this.socket && this.isConnected) {
            this.socket.emit('get_private_rooms', this.username);
        }
    }
    
    // Room Event Handlers
    handleRoomCreated(data) {
        this.showNotification(`Room "${data.name}" created! Share code: ${data.code}`);
        
        // Show the room code to the creator
        const message = `🎉 Private room created!\n\nRoom: ${data.name}\nCode: ${data.code}\nMax Users: ${data.maxUsers}\n\nShare this code with others to let them join!`;
        alert(message);
        
        this.refreshPrivateRooms();
    }
    
    handleRoomJoined(data) {
        this.showNotification(`Joined private room: ${data.name}`);
        
        // Store admin status and room code
        this.isAdmin = data.isAdmin || false;
        this.currentRoomCode = data.code;
        
        // Switch to private room view
        this.currentRoom = `private_${data.code}`;
        this.updateRoomInfo('general'); // Use general as fallback for private rooms
        
        if (this.currentRoomTitle) {
            this.currentRoomTitle.innerHTML = `<i class="fas fa-lock"></i> ${data.name}`;
        }
        if (this.currentRoomDescription) {
            this.currentRoomDescription.textContent = `Private room • ${data.users}/${data.maxUsers} users`;
        }
        
        // Clear messages and show join message
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
            this.addSystemMessage(`Welcome to ${data.name}! This is a private room.`);
            
            if (this.isAdmin) {
                this.addSystemMessage('You have admin privileges in this room. Right-click users to manage them.');
            }
        }
        
        this.refreshPrivateRooms();
    }
    
    handleRoomError(error) {
        this.showNotification(error.message);
    }
    
    updatePrivateRoomsList(rooms) {
        if (!this.privateRoomsList) return;
        
        this.privateRoomsList.innerHTML = '';
        
        if (rooms.length === 0) {
            this.privateRoomsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-door-closed"></i>
                    <span>No private rooms</span>
                </div>
            `;
            return;
        }
        
        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'private-room-item';
            roomElement.innerHTML = `
                <div class="private-room-info">
                    <div class="private-room-name">${this.escapeHtml(room.name)}</div>
                    <div class="private-room-code">Code: ${room.code}</div>
                </div>
                <div class="private-room-users">${room.users}/${room.maxUsers}</div>
            `;
            
            roomElement.addEventListener('click', () => {
                this.joinPrivateRoom();
                // Pre-fill the code
                if (this.joinRoomCodeInput) {
                    this.joinRoomCodeInput.value = room.code;
                }
            });
            
            this.privateRoomsList.appendChild(roomElement);
        });
    }
    
    addSystemMessage(message) {
        if (!this.chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message system';
        messageElement.innerHTML = `
            <div class="message-content">${this.escapeHtml(message)}</div>
        `;
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    // ===== ADMIN METHODS =====
    
    showContextMenu(event, username) {
        if (!this.userContextMenu || !this.isAdmin) return;
        
        this.selectedUser = username;
        this.userContextMenu.style.display = 'block';
        this.userContextMenu.style.left = event.pageX + 'px';
        this.userContextMenu.style.top = event.pageY + 'px';
    }
    
    hideContextMenu() {
        if (this.userContextMenu) {
            this.userContextMenu.style.display = 'none';
        }
        this.selectedUser = null;
    }
    
    kickSelectedUser() {
        if (!this.selectedUser || !this.currentRoomCode) return;
        
        if (confirm(`Kick ${this.selectedUser} from the room?`)) {
            this.socket.emit('kick_user', {
                targetUsername: this.selectedUser,
                roomCode: this.currentRoomCode
            });
        }
        
        this.hideContextMenu();
    }
    
    banSelectedUser() {
        if (!this.selectedUser || !this.currentRoomCode) return;
        
        if (confirm(`Ban ${this.selectedUser} from the room? They will not be able to rejoin.`)) {
            this.socket.emit('ban_user', {
                targetUsername: this.selectedUser,
                roomCode: this.currentRoomCode
            });
        }
        
        this.hideContextMenu();
    }
    
    makeSelectedUserAdmin() {
        if (!this.selectedUser || !this.currentRoomCode) return;
        
        if (confirm(`Make ${this.selectedUser} an admin of this room?`)) {
            this.socket.emit('make_admin', {
                targetUsername: this.selectedUser,
                roomCode: this.currentRoomCode
            });
        }
        
        this.hideContextMenu();
    }
    
    openRoomInfoModal() {
        if (!this.roomInfoModal || !this.currentRoomCode) return;
        
        this.roomInfoModal.style.display = 'flex';
        this.socket.emit('get_room_info', this.currentRoomCode);
    }
    
    closeRoomInfoModal() {
        if (this.roomInfoModal) {
            this.roomInfoModal.style.display = 'none';
        }
    }
    
    copyRoomCodeToClipboard() {
        if (!this.currentRoomCode) return;
        
        navigator.clipboard.writeText(this.currentRoomCode).then(() => {
            this.showNotification('Room code copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.currentRoomCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Room code copied to clipboard!');
        });
    }
    
    deleteCurrentRoom() {
        if (!this.currentRoomCode) return;
        
        if (confirm('Are you sure you want to delete this room? This action cannot be undone and all users will be kicked.')) {
            this.socket.emit('delete_room', this.currentRoomCode);
        }
    }
    
    // Admin Event Handlers
    handleKickedFromRoom(data) {
        this.showNotification(`You were kicked from ${data.roomName} by ${data.admin}`);
        this.switchRoom('gaming'); // Return to default room
    }
    
    handleBannedFromRoom(data) {
        this.showNotification(`You were banned from ${data.roomName} by ${data.admin}`);
        this.switchRoom('gaming'); // Return to default room
    }
    
    handlePromotedToAdmin(data) {
        this.showNotification(`You are now an admin of ${data.roomName}!`);
        this.isAdmin = true;
        this.currentRoomCode = data.roomCode;
        
        // Add admin message
        this.addSystemMessage('You now have admin privileges. Right-click users to manage them.');
    }
    
    handleRoomDeleted(data) {
        this.showNotification(`Room ${data.roomName} was deleted`);
        this.switchRoom('gaming'); // Return to default room
        this.isAdmin = false;
        this.currentRoomCode = null;
    }
    
    handleRoomInfoUpdate(data) {
        if (!this.roomInfoModal) return;
        
        // Update room info display
        if (this.adminRoomCode) {
            this.adminRoomCode.textContent = data.code;
        }
        if (this.adminUserCount) {
            this.adminUserCount.textContent = `${data.users}/${data.maxUsers}`;
        }
        if (this.adminCreatedTime) {
            this.adminCreatedTime.textContent = new Date(data.createdAt).toLocaleDateString();
        }
        
        // Update banned users list
        if (this.bannedUsersList) {
            this.bannedUsersList.innerHTML = '';
            
            if (data.bannedUsers.length === 0) {
                this.bannedUsersList.innerHTML = `
                    <div class="empty-state">
                        <span>No banned users</span>
                    </div>
                `;
            } else {
                data.bannedUsers.forEach(username => {
                    const bannedUserElement = document.createElement('div');
                    bannedUserElement.className = 'banned-user-item';
                    bannedUserElement.innerHTML = `
                        <span class="banned-user-name">${this.escapeHtml(username)}</span>
                        <button class="unban-btn" onclick="this.unbanUser('${username}')">
                            Unban
                        </button>
                    `;
                    
                    const unbanBtn = bannedUserElement.querySelector('.unban-btn');
                    unbanBtn.addEventListener('click', () => {
                        this.socket.emit('unban_user', {
                            targetUsername: username,
                            roomCode: this.currentRoomCode
                        });
                    });
                    
                    this.bannedUsersList.appendChild(bannedUserElement);
                });
            }
        }
    }
    
    handleAdminError(error) {
        this.showNotification(`Admin Error: ${error.message}`);
    }
}

// Initialize the chat app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
    
    // Add footer about link handler
    const aboutLink = document.getElementById('aboutLink');
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('ChatBox v1.0\n\nA modern real-time chat platform built with Node.js, Socket.io, and vanilla JavaScript.\n\nCreated with ❤️ by DriizzyyB\nGitHub: github.com/driizzyy/\n\nFeatures:\n• Real-time messaging\n• User presence tracking\n• Sound notifications\n• Mobile responsive design\n• Professional UI/UX');
        });
    }
});
