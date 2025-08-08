// ChatBox v2.0 - Real-Time Chat Application
// Version: 2.0 - Enhanced with Advanced Features

const SERVER_URL = 'https://simple-chat-backend-ook3.onrender.com';

class ChatBox {
    constructor() {
        this.socket = null;
        this.username = '';
        this.isConnected = false;
        this.currentRoom = 'gaming';
        this.connectionStartTime = null;
        this.connectionTimer = null;
        this.isAdmin = false;
        this.privateRooms = new Map();
        this.selectedUser = null;
        this.isTyping = false;
        this.typingUsers = new Set();
        this.typingTimer = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.lastMessageTime = 0;
        this.rateLimitDelay = 1000; // 1 second between messages
        
        // Notifications system
        this.notifications = [];
        this.maxNotifications = 50;
        
        // User management
        this.connectedUsers = [];
        
        // Private Room Management
        this.privateRooms = new Map();
        this.userRoles = new Map(); // Track user roles in rooms
        this.bannedUsers = new Map(); // Track banned users per room
        
        // Session Statistics
        this.sessionStats = {
            messagesSent: 0,
            messagesReceived: 0,
            totalMessages: 0,
            startTime: Date.now(),
            onlineUsers: 1
        };
        
        // Chat History Storage
        this.chatHistory = new Map();
        this.maxMessagesPerRoom = 100;
        
        // User Settings
        this.settings = {
            soundEnabled: true,
            desktopNotifications: false,
            darkMode: true,
            messageAnimations: true,
            sendOnEnter: true,
            showTimestamps: true,
            autoJoinLastRoom: true,
            compactMode: false,
            playTypingSounds: true,
            showTypingIndicators: true,
            messagePreview: true
        };
        
        // Room Configuration
        this.roomData = {
            gaming: {
                title: 'Gaming',
                icon: 'fas fa-gamepad',
                description: 'Gaming discussions and LFG • Let\'s play together!'
            },
            coding: {
                title: 'Coding',
                icon: 'fas fa-code',
                description: 'Programming & development • Code together!'
            },
            chilling: {
                title: 'Chilling',
                icon: 'fas fa-coffee',
                description: 'Casual conversations • Relax and chat!'
            },
            general: {
                title: 'General',
                icon: 'fas fa-comments',
                description: 'General discussions • Talk about anything!'
            }
        };
        
        this.init();
    }
    
    async init() {
        try {
            await this.initElements();
            this.bindEvents();
            this.loadSettings();
            this.applyTheme(); // Apply theme after loading settings
            this.hideAllModals();
            
            // Show loading screen briefly then reveal welcome screen
            setTimeout(() => {
                this.hideLoadingScreen();
                this.showWelcomeScreen();
            }, 2000);
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.hideLoadingScreen();
            this.showWelcomeScreen();
        }
    }
    
    async initElements() {
        // Loading and main containers
        this.loadingScreen = document.getElementById('loadingScreen');
        this.appContainer = document.getElementById('appContainer');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.chatInterface = document.getElementById('chatInterface');
        
        // Welcome screen elements
        this.usernameInput = document.getElementById('usernameInput');
        this.joinBtn = document.getElementById('joinBtn');
        
        // Header elements
        this.notificationBtn = document.getElementById('notificationBtn');
        this.notificationDropdown = document.getElementById('notificationDropdown');
        this.notificationBadge = document.getElementById('notificationBadge');
        this.notificationList = document.getElementById('notificationList');
        this.clearAllNotifications = document.getElementById('clearAllNotifications');
        this.notificationSettings = document.getElementById('notificationSettings');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.userAvatar = document.getElementById('userAvatar');
        
        // Chat interface elements
        this.roomTabs = document.getElementById('roomTabs');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.joinPrivateBtn = document.getElementById('joinPrivateBtn');
        this.currentRoomName = document.getElementById('currentRoomName');
        this.messageCount = document.getElementById('messageCount');
        this.roomStatus = document.getElementById('roomStatus');
        this.toggleSounds = document.getElementById('toggleSounds');
        this.leaveBtn = document.getElementById('leaveBtn');
        
        // Chat area elements
        this.currentRoomIcon = document.getElementById('currentRoomIcon');
        this.currentRoomTitle = document.getElementById('currentRoomTitle');
        this.currentRoomDescription = document.getElementById('currentRoomDescription');
        this.messagesList = document.getElementById('messagesList');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.charCounter = document.getElementById('charCounter');
        this.emojiBtn = document.getElementById('emojiBtn');
        
        // Activity panel elements
        this.sessionTime = document.getElementById('sessionTime');
        this.totalMessages = document.getElementById('totalMessages');
        this.onlineUsers = document.getElementById('onlineUsers');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.exportChatBtn = document.getElementById('exportChatBtn');
        this.copyRoomLinkBtn = document.getElementById('copyRoomLinkBtn');
        
        // Modal elements
        this.settingsModal = document.getElementById('settingsModal');
        this.createRoomModal = document.getElementById('createRoomModal');
        this.joinRoomModal = document.getElementById('joinRoomModal');
        this.userListModal = document.getElementById('userListModal');
        this.userListContainer = document.getElementById('userListContainer');
        this.toastContainer = document.getElementById('toastContainer');
        this.userContextMenu = document.getElementById('userContextMenu');
        
        // Settings modal elements
        this.soundToggle = document.getElementById('soundToggle');
        this.desktopNotifications = document.getElementById('desktopNotifications');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.messageAnimations = document.getElementById('messageAnimations');
        this.sendOnEnter = document.getElementById('sendOnEnter');
        this.showTimestamps = document.getElementById('showTimestamps');
        
        // Create room modal elements
        this.roomNameInput = document.getElementById('roomNameInput');
        this.roomDescriptionInput = document.getElementById('roomDescriptionInput');
        this.roomPasswordInput = document.getElementById('roomPasswordInput');
        this.maxUsersInput = document.getElementById('maxUsersInput');
        this.enableModeration = document.getElementById('enableModeration');
        
        // Join room modal elements
        this.joinRoomCodeInput = document.getElementById('joinRoomCodeInput');
        this.joinRoomPasswordInput = document.getElementById('joinRoomPasswordInput');
        this.roomPreview = document.getElementById('roomPreview');
        this.previewRoomName = document.getElementById('previewRoomName');
        this.previewMemberCount = document.getElementById('previewMemberCount');
        this.previewRoomStatus = document.getElementById('previewRoomStatus');
        
        return true;
    }
    
    bindEvents() {
        // Welcome screen events
        if (this.joinBtn) {
            this.joinBtn.addEventListener('click', () => this.handleJoinChat());
        }
        
        if (this.usernameInput) {
            this.usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleJoinChat();
                }
            });
            this.usernameInput.addEventListener('input', () => this.validateUsernameInput());
        }
        
        // Header events
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
        }
        
        if (this.notificationBtn) {
            this.notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotificationDropdown();
            });
        }
        
        if (this.clearAllNotifications) {
            this.clearAllNotifications.addEventListener('click', () => this.clearNotifications());
        }
        
        if (this.notificationSettings) {
            this.notificationSettings.addEventListener('click', () => {
                this.toggleNotificationDropdown();
                this.openSettingsModal();
            });
        }
        
        // Room events
        if (this.roomTabs) {
            this.roomTabs.addEventListener('click', (e) => {
                const roomTab = e.target.closest('.room-tab');
                if (roomTab) {
                    const roomName = roomTab.dataset.room;
                    if (roomName) {
                        this.switchRoom(roomName);
                    }
                }
            });
        }
        
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', () => this.openCreateRoomModal());
        }
        
        if (this.joinPrivateBtn) {
            this.joinPrivateBtn.addEventListener('click', () => this.openJoinRoomModal());
        }
        
        if (this.leaveBtn) {
            this.leaveBtn.addEventListener('click', () => this.leaveChat());
        }
        
        if (this.toggleSounds) {
            this.toggleSounds.addEventListener('click', () => this.toggleSoundSettings());
        }
        
        // Message input events
        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => {
                this.updateCharCounter();
                this.handleTyping();
            });
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && this.settings.sendOnEnter) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            this.messageInput.addEventListener('keyup', () => {
                this.handleTypingStop();
            });
            this.messageInput.addEventListener('focus', () => {
                this.messageInput.parentElement.classList.add('focused');
            });
            this.messageInput.addEventListener('blur', () => {
                this.messageInput.parentElement.classList.remove('focused');
                this.handleTypingStop();
            });
        }
        
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        // Activity panel events
        if (this.clearChatBtn) {
            this.clearChatBtn.addEventListener('click', () => this.clearCurrentRoomChat());
        }
        
        if (this.exportChatBtn) {
            this.exportChatBtn.addEventListener('click', () => this.exportChatHistory());
        }
        
        if (this.copyRoomLinkBtn) {
            this.copyRoomLinkBtn.addEventListener('click', () => this.copyRoomLink());
        }
        
        // Make online users count clickable
        if (this.onlineUsers) {
            this.onlineUsers.parentElement.classList.add('clickable');
            this.onlineUsers.parentElement.addEventListener('click', () => this.openUserListModal());
        }
        
        // Modal events
        this.bindModalEvents();
        
        // Global events
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
        window.addEventListener('beforeunload', () => this.cleanup());
    }
    
    bindModalEvents() {
        // Settings modal
        const closeSettings = document.getElementById('closeSettings');
        if (closeSettings) {
            closeSettings.addEventListener('click', () => this.closeSettingsModal());
        }
        
        const saveSettings = document.getElementById('saveSettings');
        if (saveSettings) {
            saveSettings.addEventListener('click', () => this.saveSettings());
        }
        
        const resetSettings = document.getElementById('resetSettings');
        if (resetSettings) {
            resetSettings.addEventListener('click', () => this.resetSettings());
        }
        
        // Create room modal
        const closeCreateRoom = document.getElementById('closeCreateRoom');
        if (closeCreateRoom) {
            closeCreateRoom.addEventListener('click', () => this.closeCreateRoomModal());
        }
        
        const confirmCreateRoom = document.getElementById('confirmCreateRoom');
        if (confirmCreateRoom) {
            confirmCreateRoom.addEventListener('click', () => this.createPrivateRoom());
        }
        
        const cancelCreateRoom = document.getElementById('cancelCreateRoom');
        if (cancelCreateRoom) {
            cancelCreateRoom.addEventListener('click', () => this.closeCreateRoomModal());
        }
        
        // Join room modal
        const closeJoinRoom = document.getElementById('closeJoinRoom');
        if (closeJoinRoom) {
            closeJoinRoom.addEventListener('click', () => this.closeJoinRoomModal());
        }
        
        const confirmJoinRoom = document.getElementById('confirmJoinRoom');
        if (confirmJoinRoom) {
            confirmJoinRoom.addEventListener('click', () => this.joinPrivateRoom());
        }
        
        const cancelJoinRoom = document.getElementById('cancelJoinRoom');
        if (cancelJoinRoom) {
            cancelJoinRoom.addEventListener('click', () => this.closeJoinRoomModal());
        }
        
        // User list modal
        const closeUserList = document.getElementById('closeUserList');
        if (closeUserList) {
            closeUserList.addEventListener('click', () => this.closeUserListModal());
        }
        
        const refreshUserList = document.getElementById('refreshUserList');
        if (refreshUserList) {
            refreshUserList.addEventListener('click', () => this.refreshUserList());
        }
        
        // Room creation and joining events
        if (this.joinRoomCodeInput) {
            this.joinRoomCodeInput.addEventListener('input', () => this.previewRoom());
        }
        
        // Modal overlay clicks
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeAllModals();
                }
            });
        });
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                if (this.appContainer) {
                    this.appContainer.style.display = 'flex';
                }
            }, 500);
        }
    }
    
    showWelcomeScreen() {
        if (this.welcomeScreen) {
            this.welcomeScreen.style.display = 'flex';
        }
        if (this.chatInterface) {
            this.chatInterface.style.display = 'none';
        }
    }
    
    showChatInterface() {
        if (this.welcomeScreen) {
            this.welcomeScreen.style.display = 'none';
        }
        if (this.chatInterface) {
            this.chatInterface.style.display = 'grid';
        }
        this.startSessionTimer();
        this.updateActivityStats();
    }
    
    validateUsernameInput() {
        const username = this.usernameInput?.value.trim() || '';
        const isValid = username.length >= 1 && username.length <= 20;
        
        if (this.joinBtn) {
            this.joinBtn.disabled = !isValid;
        }
        
        return isValid;
    }
    
    handleJoinChat() {
        if (!this.validateUsernameInput()) {
            this.showToast('Please enter a valid username (1-20 characters)', 'error');
            return;
        }
        
        this.username = this.usernameInput.value.trim();
        this.connectToServer();
    }
    
    connectToServer() {
        try {
            this.socket = io(SERVER_URL, {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });
            
            this.bindSocketEvents();
            this.showToast('Connecting to server...', 'info');
            
        } catch (error) {
            console.error('Connection error:', error);
            this.showToast('Failed to connect to server', 'error');
        }
    }
    
    bindSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.connectionStartTime = Date.now();
            this.showChatInterface();
            
            // Join default room
            this.socket.emit('join-room', {
                username: this.username,
                room: this.currentRoom
            });
            
            // Request message history for the room
            this.socket.emit('get_history', {
                room: this.currentRoom
            });
            
            // Request user stats
            this.socket.emit('get_stats', {});
            
            this.showToast(`Welcome to ChatBox v2.0, ${this.username}!`, 'success');
            this.addNotification('system', 'Connected to ChatBox v2.0', 'You are now online and ready to chat!');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.showToast('Connection lost. Attempting to reconnect...', 'warning');
            this.addNotification('warning', 'Connection Lost', 'Attempting to reconnect to the server...');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.showToast('Unable to connect to server. Please try again.', 'error');
            this.addNotification('error', 'Connection Failed', 'Unable to connect to server. Please check your internet connection.');
        });
        
        this.socket.on('room-joined', (data) => {
            console.log('Joined room:', data);
            this.currentRoom = data.room;
            this.updateRoomInfo(data.room);
            this.loadRoomHistory(data.room);
        });
        
        this.socket.on('user-list', (users) => {
            this.updateUsersList(users);
            this.sessionStats.onlineUsers = users.length;
            this.updateActivityStats();
        });
        
        this.socket.on('new-message', (data) => {
            this.handleNewMessage(data);
        });
        
        this.socket.on('user-joined', (data) => {
            this.showToast(`${data.username} joined the room`, 'info');
            this.addNotification('user', 'User Joined', `${data.username} joined ${this.currentRoom}`);
        });
        
        this.socket.on('user-left', (data) => {
            this.showToast(`${data.username} left the room`, 'info');
            this.addNotification('user', 'User Left', `${data.username} left ${this.currentRoom}`);
        });
        
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.showToast(error.message || 'An error occurred', 'error');
        });
        
        // Enhanced socket events for better functionality
        this.socket.on('typing-start', (data) => {
            if (data.username !== this.username && data.room === this.currentRoom) {
                this.showTypingIndicator(data.username);
            }
        });
        
        this.socket.on('typing-stop', (data) => {
            if (data.username !== this.username && data.room === this.currentRoom) {
                this.hideTypingIndicator(data.username);
            }
        });
        
        this.socket.on('user-status-change', (data) => {
            this.updateUserStatus(data);
        });
        
        this.socket.on('room-stats', (data) => {
            this.updateRoomStats(data);
        });
        
        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            this.reconnectAttempts = 0;
            this.showToast('Reconnected to server', 'success');
            this.addNotification('success', 'Reconnected', 'Successfully reconnected to the server');
        });
        
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('Reconnection attempt', attemptNumber);
            this.reconnectAttempts = attemptNumber;
            this.showToast(`Reconnecting... (${attemptNumber}/${this.maxReconnectAttempts})`, 'warning');
        });
        
        this.socket.on('reconnect_failed', () => {
            console.log('Reconnection failed');
            this.showToast('Unable to reconnect. Please refresh the page.', 'error');
            this.addNotification('error', 'Reconnection Failed', 'Unable to reconnect. Please refresh the page.');
        });
        
        // Private room events
        this.socket.on('room_created', (data) => {
            console.log('Room created:', data);
            const roomData = {
                roomId: data.code,
                name: data.name,
                description: '',
                maxUsers: data.maxUsers,
                creator: this.username,
                role: 'admin'
            };
            this.addPrivateRoom(roomData);
            this.switchRoom(data.code);
            this.addNotification('success', 'Room Created', `Successfully created ${data.name}`);
            this.showToast(`Room "${data.name}" created successfully! Code: ${data.code}`, 'success');
        });
        
        this.socket.on('room_error', (error) => {
            console.error('Room error:', error);
            this.showToast(error.message || 'Room operation failed', 'error');
        });
        
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.showToast('Connection error occurred', 'error');
        });

        // Enhanced features - New socket event handlers
        this.socket.on('history_data', (data) => {
            this.handleHistoryData(data);
        });

        this.socket.on('user_stats', (data) => {
            this.displayUserStats(data);
        });

        this.socket.on('user_typing', (data) => {
            this.showTypingIndicator(data.username);
        });

        this.socket.on('user_stopped_typing', (data) => {
            this.hideTypingIndicator(data.username);
        });

        this.socket.on('room_info', (data) => {
            this.updateRoomInfoDisplay(data);
        });

        this.socket.on('announcement', (data) => {
            this.displayAnnouncement(data);
        });

        this.socket.on('banned', (data) => {
            alert(`You have been banned: ${data.reason}`);
            this.cleanup();
            this.showWelcomeScreen();
        });
        
        this.socket.on('room_joined', (data) => {
            console.log('Joined private room:', data);
            const roomData = {
                roomId: data.code,
                name: data.name,
                description: '',
                maxUsers: data.maxUsers,
                creator: '',
                role: data.isAdmin ? 'admin' : 'member'
            };
            this.addPrivateRoom(roomData);
            this.setUserRole(data.code, this.username, data.isAdmin ? 'admin' : 'member');
            this.switchRoom(data.code);
            this.updateRoomInfo(data.code);
            this.showToast(`Joined room "${data.name}"!`, 'success');
        });
        
        this.socket.on('room-preview', (data) => {
            this.showRoomPreview(data);
        });
        
        this.socket.on('user-kicked', (data) => {
            if (data.kickedUser === this.username) {
                this.showToast(`You were kicked from ${data.roomName}`, 'warning');
                this.switchRoom('gaming'); // Switch to default room
            } else {
                this.showToast(`${data.kickedUser} was kicked from the room`, 'info');
            }
        });
        
        this.socket.on('user-banned', (data) => {
            if (data.bannedUser === this.username) {
                this.showToast(`You were banned from ${data.roomName}`, 'error');
                this.switchRoom('gaming'); // Switch to default room
            } else {
                this.showToast(`${data.bannedUser} was banned from the room`, 'info');
            }
        });
        
        this.socket.on('room-deleted', (data) => {
            this.removePrivateRoom(data.roomId);
            if (this.currentRoom === data.roomId) {
                this.switchRoom('gaming'); // Switch to default room
            }
            this.showToast(`Room "${data.roomName}" was deleted`, 'info');
        });
    }
    
    // Notification Management
    toggleNotificationDropdown() {
        if (this.notificationDropdown) {
            const isVisible = this.notificationDropdown.classList.contains('show');
            if (isVisible) {
                this.notificationDropdown.classList.remove('show');
            } else {
                this.closeAllDropdowns();
                this.notificationDropdown.classList.add('show');
            }
        }
    }
    
    closeAllDropdowns() {
        // Close any open dropdowns
        document.querySelectorAll('.notification-dropdown, .user-context-menu').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
    
    addNotification(type, title, message) {
        const notification = {
            id: Date.now(),
            type: type,
            title: title,
            message: message,
            timestamp: Date.now(),
            read: false
        };
        
        this.notifications.unshift(notification);
        
        // Limit notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }
        
        this.updateNotificationUI();
        this.updateNotificationBadge();
    }
    
    updateNotificationUI() {
        if (!this.notificationList) return;
        
        if (this.notifications.length === 0) {
            this.notificationList.innerHTML = `
                <div class="notification-item empty-state">
                    <div class="notification-icon">
                        <i class="fas fa-bell-slash"></i>
                    </div>
                    <div class="notification-content">
                        <p>No notifications yet</p>
                        <small>You'll see messages and activity here</small>
                    </div>
                </div>
            `;
            return;
        }
        
        this.notificationList.innerHTML = this.notifications.map(notification => {
            const timeAgo = this.getTimeAgo(notification.timestamp);
            const iconMap = {
                system: 'fas fa-info-circle',
                user: 'fas fa-user',
                message: 'fas fa-comment',
                warning: 'fas fa-exclamation-triangle',
                error: 'fas fa-times-circle',
                success: 'fas fa-check-circle'
            };
            
            return `
                <div class="notification-item ${notification.read ? 'read' : ''}" data-id="${notification.id}">
                    <div class="notification-icon">
                        <i class="${iconMap[notification.type] || iconMap.system}"></i>
                    </div>
                    <div class="notification-content">
                        <p>${this.escapeHtml(notification.title)}</p>
                        <small>${this.escapeHtml(notification.message)}</small>
                    </div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
            `;
        }).join('');
        
        // Add click handlers for notifications
        this.notificationList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const notificationId = parseInt(item.dataset.id);
                this.markNotificationAsRead(notificationId);
            });
        });
    }
    
    updateNotificationBadge() {
        if (!this.notificationBadge) return;
        
        const unreadCount = this.notifications.filter(n => !n.read).length;
        this.notificationBadge.textContent = unreadCount.toString();
        this.notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    
    markNotificationAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.updateNotificationUI();
            this.updateNotificationBadge();
        }
    }
    
    clearNotifications() {
        this.notifications = [];
        this.updateNotificationUI();
        this.updateNotificationBadge();
        this.showToast('All notifications cleared', 'info');
    }
    
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
    
    startSessionTimer() {
        if (this.connectionTimer) {
            clearInterval(this.connectionTimer);
        }
        
        this.connectionTimer = setInterval(() => {
            if (this.connectionStartTime && this.sessionTime) {
                const elapsed = Date.now() - this.connectionStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                this.sessionTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    switchRoom(roomName) {
        if (roomName === this.currentRoom) return;
        
        // Save current room chat history
        this.saveRoomHistory(this.currentRoom);
        
        // Update UI
        this.updateActiveRoomTab(roomName);
        this.currentRoom = roomName;
        
        // Socket room switch
        if (this.socket && this.isConnected) {
            // Check if it's a private room (starts with room code format)
            const isPrivateRoom = this.privateRooms.has(roomName);
            
            if (isPrivateRoom) {
                // For private rooms, use the private room key format
                const roomKey = `private_${roomName}`;
                this.socket.emit('switch_room', {
                    username: this.username,
                    room: roomKey
                });
            } else {
                // For standard rooms, use normal room switching
                this.socket.emit('switch_room', {
                    username: this.username,
                    room: roomName
                });
            }
        }
        
        // Update room info and load history
        this.updateRoomInfo(roomName);
        this.loadRoomHistory(roomName);
        
        // Check if it's a private room for the toast message
        const isPrivateRoom = this.privateRooms.has(roomName);
        const roomDisplayName = isPrivateRoom ? 
            this.privateRooms.get(roomName).name : 
            (this.roomData[roomName]?.title || roomName);
        
        this.showToast(`Switched to ${roomDisplayName}`, 'info');
    }
    
    updateActiveRoomTab(roomName) {
        document.querySelectorAll('.room-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-room="${roomName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }
    
    updateRoomInfo(roomName) {
        // Check if it's a private room first
        const privateRoom = this.privateRooms.get(roomName);
        
        if (privateRoom) {
            // Handle private room
            if (this.currentRoomIcon) {
                this.currentRoomIcon.className = 'fas fa-users';
            }
            
            if (this.currentRoomTitle) {
                this.currentRoomTitle.textContent = privateRoom.name;
            }
            
            if (this.currentRoomDescription) {
                this.currentRoomDescription.textContent = privateRoom.description || 'Private room';
            }
            
            if (this.currentRoomName) {
                this.currentRoomName.textContent = privateRoom.name;
            }
        } else {
            // Handle default rooms
            const roomData = this.roomData[roomName];
            if (!roomData) return;
            
            if (this.currentRoomIcon) {
                this.currentRoomIcon.className = roomData.icon;
            }
            
            if (this.currentRoomTitle) {
                this.currentRoomTitle.textContent = roomData.title;
            }
            
            if (this.currentRoomDescription) {
                this.currentRoomDescription.textContent = roomData.description;
            }
            
            if (this.currentRoomName) {
                this.currentRoomName.textContent = roomData.title;
            }
        }
    }
    
    saveRoomHistory(roomName) {
        if (!this.messagesList) return;
        
        const messages = Array.from(this.messagesList.children);
        this.chatHistory.set(roomName, messages.map(msg => msg.cloneNode(true)));
    }
    
    loadRoomHistory(roomName) {
        if (!this.messagesList) return;
        
        // Clear current messages
        this.messagesList.innerHTML = '';
        
        // Load saved history
        const history = this.chatHistory.get(roomName) || [];
        history.forEach(messageElement => {
            this.messagesList.appendChild(messageElement.cloneNode(true));
        });
        
        this.scrollToBottom();
        this.updateMessageCount();
    }
    
    handleNewMessage(data) {
        if (data.room !== this.currentRoom) return;
        
        this.addMessageToChat(data);
        this.sessionStats.messagesReceived++;
        this.sessionStats.totalMessages++;
        this.updateActivityStats();
        
        // Add notification for messages from other users
        if (data.username !== this.username) {
            this.addNotification('message', `New message from ${data.username}`, data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''));
        }
        
        // Play notification sound
        if (this.settings.soundEnabled && data.username !== this.username) {
            this.playNotificationSound();
        }
        
        // Show desktop notification
        if (this.settings.desktopNotifications && data.username !== this.username) {
            this.showDesktopNotification(data);
        }
    }
    
    addMessageToChat(data) {
        if (!this.messagesList) return;
        
        const messageElement = this.createMessageElement(data);
        this.messagesList.appendChild(messageElement);
        
        // Animate message in
        if (this.settings.messageAnimations) {
            messageElement.style.animation = 'messageSlideIn 0.3s ease-out forwards';
        } else {
            messageElement.style.opacity = '1';
        }
        
        // Clean up old messages
        this.cleanupOldMessages();
        this.scrollToBottom();
        this.updateMessageCount();
    }
    
    createMessageElement(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${data.username === this.username ? 'own' : ''}`;
        
        const isOwnMessage = data.username === this.username;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${data.username.charAt(0).toUpperCase()}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${this.escapeHtml(data.username)}</span>
                    ${this.settings.showTimestamps ? `<span class="message-timestamp">${this.formatTimestamp(data.timestamp || Date.now())}</span>` : ''}
                </div>
                <div class="message-text">${this.formatMessage(data.message)}</div>
            </div>
        `;
        
        return messageDiv;
    }
    
    // Typing Indicators
    handleTyping() {
        if (!this.isConnected || !this.settings.showTypingIndicators) return;
        
        if (!this.isTyping) {
            this.isTyping = true;
            this.socket.emit('typing', {
                username: this.username,
                room: this.currentRoom
            });
        }
        
        // Reset typing timer
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
        
        this.typingTimer = setTimeout(() => {
            this.handleTypingStop();
        }, 1000);
    }
    
    handleTypingStop() {
        if (this.isTyping) {
            this.isTyping = false;
            if (this.socket && this.isConnected) {
                this.socket.emit('stop_typing', {
                    username: this.username,
                    room: this.currentRoom
                });
            }
        }
        
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
    }
    
    showTypingIndicator(username) {
        this.typingUsers.add(username);
        this.updateTypingIndicator();
    }
    
    hideTypingIndicator(username) {
        this.typingUsers.delete(username);
        this.updateTypingIndicator();
    }
    
    updateTypingIndicator() {
        const typingContainer = document.getElementById('typingIndicator') || this.createTypingIndicator();
        
        if (this.typingUsers.size === 0) {
            typingContainer.style.display = 'none';
            return;
        }
        
        const typingArray = Array.from(this.typingUsers);
        let typingText = '';
        
        if (typingArray.length === 1) {
            typingText = `${typingArray[0]} is typing...`;
        } else if (typingArray.length === 2) {
            typingText = `${typingArray[0]} and ${typingArray[1]} are typing...`;
        } else {
            typingText = `${typingArray.length} people are typing...`;
        }
        
        typingContainer.innerHTML = `
            <div class="typing-indicator-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span class="typing-text">${typingText}</span>
            </div>
        `;
        typingContainer.style.display = 'flex';
    }
    
    createTypingIndicator() {
        const typingContainer = document.createElement('div');
        typingContainer.id = 'typingIndicator';
        typingContainer.className = 'typing-indicator';
        
        if (this.messagesList && this.messagesList.parentNode) {
            this.messagesList.parentNode.appendChild(typingContainer);
        }
        
        return typingContainer;
    }
    
    sendMessage() {
        const message = this.messageInput?.value.trim();
        if (!message || !this.isConnected) return;
        
        // Rate limiting
        const now = Date.now();
        if (now - this.lastMessageTime < this.rateLimitDelay) {
            this.showToast('Please wait before sending another message', 'warning');
            return;
        }
        this.lastMessageTime = now;
        
        if (message.length > 500) {
            this.showToast('Message too long (max 500 characters)', 'error');
            return;
        }
        
        const messageData = {
            message: message,
            room: this.currentRoom,
            username: this.username,
            timestamp: Date.now()
        };
        
        this.socket.emit('send-message', messageData);
        this.messageInput.value = '';
        this.updateCharCounter();
        this.sendBtn.disabled = true;
        
        // Stop typing indicator when message is sent
        this.handleTypingStop();
        
        this.sessionStats.messagesSent++;
        this.sessionStats.totalMessages++;
        this.updateActivityStats();
        
        // Auto-focus back to input
        setTimeout(() => {
            if (this.messageInput) {
                this.messageInput.focus();
            }
        }, 100);
    }
    
    updateCharCounter() {
        if (!this.messageInput || !this.charCounter) return;
        
        const length = this.messageInput.value.length;
        this.charCounter.textContent = `${length}/500`;
        
        if (this.sendBtn) {
            this.sendBtn.disabled = length === 0;
        }
    }
    
    updateUsersList(users) {
        this.connectedUsers = users || [];
        
        // Always include current user if not in the list
        const currentUserExists = this.connectedUsers.some(user => user.username === this.username);
        if (!currentUserExists && this.username) {
            this.connectedUsers.push({
                username: this.username,
                id: 'current-user'
            });
        }
        
        this.sessionStats.onlineUsers = this.connectedUsers.length;
        this.updateActivityStats();
        
        // Update user list modal if it's open
        if (this.userListModal && this.userListModal.classList.contains('show')) {
            this.populateUserListModal();
        }
    }
    
    updateActivityStats() {
        if (this.totalMessages) {
            this.totalMessages.textContent = this.sessionStats.totalMessages.toString();
        }
        
        if (this.onlineUsers) {
            this.onlineUsers.textContent = this.sessionStats.onlineUsers.toString();
        }
    }
    
    updateMessageCount() {
        if (this.messageCount && this.messagesList) {
            this.messageCount.textContent = this.messagesList.children.length.toString();
        }
    }
    
    cleanupOldMessages() {
        if (!this.messagesList) return;
        
        const messages = this.messagesList.children;
        if (messages.length > this.maxMessagesPerRoom) {
            const excess = messages.length - this.maxMessagesPerRoom;
            for (let i = 0; i < excess; i++) {
                this.messagesList.removeChild(messages[0]);
            }
        }
    }
    
    scrollToBottom() {
        if (this.messagesList) {
            this.messagesList.scrollTop = this.messagesList.scrollHeight;
        }
    }
    
    // Modal Management
    openSettingsModal() {
        this.showModal(this.settingsModal);
        this.loadSettingsUI();
    }
    
    closeSettingsModal() {
        this.hideModal(this.settingsModal);
    }
    
    openCreateRoomModal() {
        this.showModal(this.createRoomModal);
    }
    
    closeCreateRoomModal() {
        this.hideModal(this.createRoomModal);
    }
    
    openJoinRoomModal() {
        this.showModal(this.joinRoomModal);
    }
    
    closeJoinRoomModal() {
        this.hideModal(this.joinRoomModal);
    }
    
    openUserListModal() {
        this.showModal(this.userListModal);
        this.populateUserListModal();
    }
    
    closeUserListModal() {
        this.hideModal(this.userListModal);
    }
    
    populateUserListModal() {
        if (!this.userListContainer) return;
        
        if (this.connectedUsers.length === 0) {
            this.userListContainer.innerHTML = `
                <div class="user-list-empty">
                    <i class="fas fa-users"></i>
                    <p>No users online</p>
                    <small>Be the first to join the conversation!</small>
                </div>
            `;
            return;
        }
        
        const isCurrentUserAdmin = this.isRoomAdmin(this.currentRoom, this.username);
        const isPrivateRoom = this.privateRooms.has(this.currentRoom);
        
        this.userListContainer.innerHTML = this.connectedUsers.map(user => {
            const isCurrentUser = user.username === this.username;
            const userRole = this.getUserRole(this.currentRoom, user.username);
            
            return `
                <div class="user-item" data-username="${this.escapeHtml(user.username)}">
                    <div class="user-avatar-small">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-info">
                        <div class="user-name">
                            ${this.escapeHtml(user.username)}
                            ${isCurrentUser ? '<small>(You)</small>' : ''}
                            ${userRole === 'admin' ? '<small style="color: #F59E0B;">(Admin)</small>' : ''}
                        </div>
                        <div class="user-status">
                            <i class="fas fa-circle"></i>
                            Online
                        </div>
                    </div>
                    ${!isCurrentUser ? `
                        <div class="user-actions">
                            <button class="user-action-btn" title="Send Message" onclick="window.chatApp.startPrivateMessage('${this.escapeHtml(user.username)}')">
                                <i class="fas fa-comment"></i>
                            </button>
                            <button class="user-action-btn" title="View Profile" onclick="window.chatApp.viewUserProfile('${this.escapeHtml(user.username)}')">
                                <i class="fas fa-user"></i>
                            </button>
                            ${isCurrentUserAdmin && isPrivateRoom ? `
                                <button class="user-action-btn admin-btn warning" title="Kick User" onclick="window.chatApp.promptKickUser('${this.escapeHtml(user.username)}')">
                                    <i class="fas fa-user-times"></i>
                                </button>
                                <button class="user-action-btn admin-btn danger" title="Ban User" onclick="window.chatApp.promptBanUser('${this.escapeHtml(user.username)}')">
                                    <i class="fas fa-ban"></i>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        // Add admin controls section if user is admin
        if (isCurrentUserAdmin && isPrivateRoom) {
            const adminControls = document.createElement('div');
            adminControls.className = 'admin-controls';
            adminControls.innerHTML = `
                <div class="admin-header">
                    <i class="fas fa-shield-alt"></i>
                    Room Administration
                </div>
                <div class="admin-actions">
                    <button class="btn admin-btn" onclick="window.chatApp.showRoomInfo('${this.currentRoom}')">
                        <i class="fas fa-info-circle"></i>
                        Room Info
                    </button>
                    <button class="btn admin-btn" onclick="window.chatApp.shareRoom('${this.currentRoom}')">
                        <i class="fas fa-share"></i>
                        Share Room
                    </button>
                    <button class="btn admin-btn danger" onclick="window.chatApp.deleteRoom('${this.currentRoom}')">
                        <i class="fas fa-trash"></i>
                        Delete Room
                    </button>
                </div>
            `;
            this.userListContainer.appendChild(adminControls);
        }
    }
    
    refreshUserList() {
        this.populateUserListModal();
        this.showToast('User list refreshed', 'success');
    }
    
    showModal(modal) {
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    hideModal(modal) {
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    hideAllModals() {
        this.closeAllModals();
    }
    
    // Settings Management
    loadSettings() {
        try {
            const saved = localStorage.getItem('chatbox-v2-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }
    
    saveSettings() {
        this.collectSettingsFromUI();
        
        try {
            localStorage.setItem('chatbox-v2-settings', JSON.stringify(this.settings));
            this.showToast('Settings saved successfully', 'success');
            this.closeSettingsModal();
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showToast('Failed to save settings', 'error');
        }
    }
    
    loadSettingsUI() {
        if (this.soundToggle) this.soundToggle.checked = this.settings.soundEnabled;
        if (this.desktopNotifications) this.desktopNotifications.checked = this.settings.desktopNotifications;
        if (this.darkModeToggle) {
            this.darkModeToggle.checked = this.settings.darkMode;
            this.applyTheme();
        }
        if (this.messageAnimations) this.messageAnimations.checked = this.settings.messageAnimations;
        if (this.sendOnEnter) this.sendOnEnter.checked = this.settings.sendOnEnter;
        if (this.showTimestamps) this.showTimestamps.checked = this.settings.showTimestamps;
    }
    
    collectSettingsFromUI() {
        if (this.soundToggle) this.settings.soundEnabled = this.soundToggle.checked;
        if (this.desktopNotifications) this.settings.desktopNotifications = this.desktopNotifications.checked;
        if (this.darkModeToggle) {
            this.settings.darkMode = this.darkModeToggle.checked;
            this.applyTheme();
        }
        if (this.messageAnimations) this.settings.messageAnimations = this.messageAnimations.checked;
        if (this.sendOnEnter) this.settings.sendOnEnter = this.sendOnEnter.checked;
        if (this.showTimestamps) this.settings.showTimestamps = this.showTimestamps.checked;
    }
    
    resetSettings() {
        this.settings = {
            soundEnabled: true,
            desktopNotifications: false,
            darkMode: true,
            messageAnimations: true,
            sendOnEnter: true,
            showTimestamps: true,
            autoJoinLastRoom: true,
            compactMode: false,
            playTypingSounds: true,
            showTypingIndicators: true,
            messagePreview: true
        };
        
        this.loadSettingsUI();
        this.showToast('Settings reset to defaults', 'info');
    }
    
    applyTheme() {
        const body = document.body;
        if (this.settings.darkMode) {
            body.removeAttribute('data-theme');
        } else {
            body.setAttribute('data-theme', 'light');
        }
    }
    
    // Activity Panel Actions
    clearCurrentRoomChat() {
        if (confirm('Are you sure you want to clear the chat history for this room?')) {
            if (this.messagesList) {
                this.messagesList.innerHTML = '';
            }
            this.chatHistory.delete(this.currentRoom);
            this.updateMessageCount();
            this.showToast('Chat history cleared', 'info');
        }
    }
    
    exportChatHistory() {
        if (!this.messagesList) return;
        
        const messages = Array.from(this.messagesList.children);
        const chatData = messages.map(msg => {
            const author = msg.querySelector('.message-author')?.textContent || '';
            const text = msg.querySelector('.message-text')?.textContent || '';
            const timestamp = msg.querySelector('.message-timestamp')?.textContent || '';
            return `[${timestamp}] ${author}: ${text}`;
        }).join('\n');
        
        const blob = new Blob([chatData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatbox-${this.currentRoom}-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Chat history exported', 'success');
    }
    
    copyRoomLink() {
        const roomUrl = `${window.location.origin}${window.location.pathname}?room=${this.currentRoom}`;
        navigator.clipboard.writeText(roomUrl).then(() => {
            this.showToast('Room link copied to clipboard', 'success');
        }).catch(() => {
            this.showToast('Failed to copy room link', 'error');
        });
    }
    
    toggleSoundSettings() {
        this.settings.soundEnabled = !this.settings.soundEnabled;
        
        if (this.toggleSounds) {
            const icon = this.toggleSounds.querySelector('i');
            if (icon) {
                icon.className = this.settings.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
        }
        
        this.showToast(`Sound ${this.settings.soundEnabled ? 'enabled' : 'disabled'}`, 'info');
    }
    
    // Utility Functions
    showToast(message, type = 'info') {
        if (!this.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check',
            error: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation',
            info: 'fas fa-info'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    <i class="${icons[type] || icons.info}"></i>
                </div>
                <div class="toast-message">
                    <div class="toast-title">${this.toTitleCase(type)}</div>
                    <div class="toast-text">${this.escapeHtml(message)}</div>
                </div>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.removeToast(toast);
            });
        }
        
        this.toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeToast(toast);
        }, 5000);
    }
    
    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }
    
    playNotificationSound() {
        if (!this.settings.soundEnabled) return;
        
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmocCDOH0fPTgjUGHWq+8+OZQQ4PVqzn77BdGAg+ltryy38qBSp+zPLaizsIGGS57OihUgwOUarm+LVpGgU+jdX0zoFCGgEsd8rz34NSFwg8htT1ynwrBSl+zPLaizsIGGS77OihUgwOUarm+LVpGgU+jdX0zoJCGgEsd8rz34NSFwg8htT1ynwrBSl+zPLaizsIGGS77OihUgwOUarm+LVpGgU+jdX0zoJCGgEsd8rz34NSFwg8htT1ynwrBSl+zPLaizsIGGS77OihUgwOUarm+LVpGgU+jdX0zoJCGgEsd8rz34NSFwg8htT1ynwrBSl+zPLaizsIGGS77OihUgwOUarm+LVpGgU+jdX0zoJCGgEsd8rz34NSFwg8htT1ynwrBQ==');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore autoplay restrictions
            });
        } catch (error) {
            console.warn('Failed to play notification sound:', error);
        }
    }
    
    showDesktopNotification(data) {
        if (!this.settings.desktopNotifications || !('Notification' in window)) return;
        
        if (Notification.permission === 'granted') {
            new Notification(`New message from ${data.username}`, {
                body: data.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showDesktopNotification(data);
                }
            });
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    toTitleCase(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    handleGlobalClick(e) {
        // Close notification dropdown if clicking outside
        if (this.notificationDropdown && !this.notificationDropdown.contains(e.target) && !this.notificationBtn.contains(e.target)) {
            this.notificationDropdown.classList.remove('show');
        }
        
        // Close context menu if clicking outside
        if (this.userContextMenu && !this.userContextMenu.contains(e.target)) {
            this.userContextMenu.classList.remove('show');
        }
    }
    
    leaveChat() {
        if (confirm('Are you sure you want to leave the chat?')) {
            this.cleanup();
            this.showWelcomeScreen();
            this.showToast('You have left the chat', 'info');
        }
    }
    
    // Additional Enhancement Methods
    updateUserStatus(data) {
        // Update user status in the users list
        const userItems = document.querySelectorAll('.user-item');
        userItems.forEach(item => {
            const userName = item.querySelector('.user-name')?.textContent;
            if (userName === data.username) {
                const statusElement = item.querySelector('.user-status');
                if (statusElement) {
                    statusElement.textContent = data.status || 'Online';
                    statusElement.className = `user-status ${data.status?.toLowerCase() || 'online'}`;
                }
            }
        });
    }
    
    updateRoomStats(data) {
        // Update room statistics from server
        if (data.room === this.currentRoom) {
            if (this.messageCount && data.messageCount !== undefined) {
                this.messageCount.textContent = data.messageCount.toString();
            }
        }
    }
    
    // Enhanced message formatting with link detection
    formatMessage(text) {
        if (!text) return '';
        
        // Basic URL detection and conversion to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let formattedText = this.escapeHtml(text);
        
        formattedText = formattedText.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">${url}</a>`;
        });
        
        // Basic emoji support
        const emojiMap = {
            ':)': '😊',
            ':D': '😃',
            ':(': '😢',
            ':P': '😛',
            ';)': '😉',
            '<3': '❤️',
            ':thumbsup:': '👍',
            ':thumbsdown:': '👎',
            ':fire:': '🔥',
            ':heart:': '❤️'
        };
        
        Object.keys(emojiMap).forEach(key => {
            const regex = new RegExp(this.escapeRegex(key), 'g');
            formattedText = formattedText.replace(regex, emojiMap[key]);
        });
        
        return formattedText;
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Auto-scroll management
    shouldAutoScroll() {
        if (!this.messagesList) return true;
        
        const container = this.messagesList;
        const threshold = 50; // pixels from bottom
        
        return (container.scrollHeight - container.scrollTop - container.clientHeight) <= threshold;
    }
    
    scrollToBottomSmooth() {
        if (this.messagesList && this.shouldAutoScroll()) {
            this.messagesList.scrollTo({
                top: this.messagesList.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
    
    // Enhanced notification system
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                this.settings.desktopNotifications = permission === 'granted';
                if (permission === 'granted') {
                    this.showToast('Desktop notifications enabled', 'success');
                } else {
                    this.showToast('Desktop notifications disabled', 'info');
                }
            });
        }
    }
    
    // Save last used room
    saveLastRoom() {
        try {
            localStorage.setItem('chatbox-v2-last-room', this.currentRoom);
        } catch (error) {
            console.warn('Failed to save last room:', error);
        }
    }
    
    loadLastRoom() {
        if (!this.settings.autoJoinLastRoom) return 'gaming';
        
        try {
            return localStorage.getItem('chatbox-v2-last-room') || 'gaming';
        } catch (error) {
            console.warn('Failed to load last room:', error);
            return 'gaming';
        }
    }
    
    cleanup() {
        if (this.socket) {
            this.socket.disconnect();
        }
        
        if (this.connectionTimer) {
            clearInterval(this.connectionTimer);
        }
        
        this.isConnected = false;
        this.username = '';
        this.currentRoom = 'gaming';
        this.chatHistory.clear();
    }
    
    // Private Room Functions
    createPrivateRoom() {
        const roomName = this.roomNameInput?.value.trim();
        const description = this.roomDescriptionInput?.value.trim();
        const password = this.roomPasswordInput?.value.trim();
        const maxUsers = parseInt(this.maxUsersInput?.value) || 10;
        const enableModeration = this.enableModeration?.checked || true;
        
        // Validation
        if (!roomName || roomName.length < 3) {
            this.showToast('Room name must be at least 3 characters', 'error');
            return;
        }
        
        if (roomName.length > 30) {
            this.showToast('Room name too long (max 30 characters)', 'error');
            return;
        }
        
        // Check if room name already exists
        if (this.privateRooms.has(roomName.toLowerCase())) {
            this.showToast('A room with this name already exists', 'error');
            return;
        }
        
        const roomData = {
            name: roomName,
            description: description || '',
            password: password || null,
            maxUsers: maxUsers,
            enableModeration: enableModeration,
            creator: this.username,
            isPrivate: true
        };
        
        // Send room creation request to server
        console.log('Creating room with data:', roomData);
        this.socket.emit('create_room', roomData);
        this.closeCreateRoomModal();
        
        // Clear form
        if (this.roomNameInput) this.roomNameInput.value = '';
        if (this.roomDescriptionInput) this.roomDescriptionInput.value = '';
        if (this.roomPasswordInput) this.roomPasswordInput.value = '';
        if (this.maxUsersInput) this.maxUsersInput.value = '10';
        if (this.enableModeration) this.enableModeration.checked = true;
    }
    
    joinPrivateRoom() {
        const roomCode = this.joinRoomCodeInput?.value.trim();
        const password = this.joinRoomPasswordInput?.value.trim();
        
        if (!roomCode) {
            this.showToast('Please enter a room code or name', 'error');
            return;
        }
        
        const joinData = {
            code: roomCode,
            password: password || null,
            username: this.username
        };
        
        // Send join request to server
        console.log('Joining room with data:', joinData);
        this.socket.emit('join_room', joinData);
        this.closeJoinRoomModal();
        
        // Clear form
        if (this.joinRoomCodeInput) this.joinRoomCodeInput.value = '';
        if (this.joinRoomPasswordInput) this.joinRoomPasswordInput.value = '';
        if (this.roomPreview) this.roomPreview.style.display = 'none';
    }
    
    previewRoom() {
        const roomCode = this.joinRoomCodeInput?.value.trim();
        
        if (roomCode && roomCode.length >= 3) {
            // Request room preview from server
            this.socket.emit('preview-room', { roomCode: roomCode });
        } else {
            if (this.roomPreview) {
                this.roomPreview.style.display = 'none';
            }
        }
    }
    
    showRoomPreview(data) {
        if (!this.roomPreview) return;
        
        if (data.error) {
            this.roomPreview.style.display = 'none';
            return;
        }
        
        if (this.previewRoomName) this.previewRoomName.textContent = data.name;
        if (this.previewMemberCount) this.previewMemberCount.textContent = `${data.memberCount}/${data.maxUsers}`;
        if (this.previewRoomStatus) {
            this.previewRoomStatus.textContent = data.hasPassword ? 'Password Protected' : 'Open';
            this.previewRoomStatus.className = 'preview-value ' + (data.hasPassword ? 'warning' : 'success');
        }
        
        this.roomPreview.style.display = 'block';
    }
    
    addPrivateRoom(roomData) {
        this.privateRooms.set(roomData.roomId, roomData);
        this.createRoomTab(roomData);
        
        // Set user role if provided
        if (roomData.role) {
            this.setUserRole(roomData.roomId, this.username, roomData.role);
        }
    }
    
    removePrivateRoom(roomId) {
        this.privateRooms.delete(roomId);
        const roomTab = document.querySelector(`[data-room="${roomId}"]`);
        if (roomTab) {
            roomTab.remove();
        }
        this.chatHistory.delete(roomId);
    }
    
    createRoomTab(roomData) {
        if (!this.roomTabs) return;
        
        const roomTab = document.createElement('div');
        roomTab.className = 'room-tab private';
        roomTab.dataset.room = roomData.roomId;
        
        const isAdmin = this.getUserRole(roomData.roomId, this.username) === 'admin';
        
        roomTab.innerHTML = `
            <div class="tab-icon">
                <i class="fas fa-users"></i>
            </div>
            <div class="tab-content">
                <span class="tab-name">${this.escapeHtml(roomData.name)}</span>
                <span class="tab-status">
                    <i class="fas fa-lock" style="color: #EF4444;"></i>
                </span>
            </div>
            ${isAdmin ? '<div class="room-admin-badge">ADMIN</div>' : ''}
            <div class="private-room-actions">
                <button class="private-room-btn" title="Room Info" onclick="window.chatApp.showRoomInfo('${roomData.roomId}')">
                    <i class="fas fa-info"></i>
                </button>
                <button class="private-room-btn" title="Share Room" onclick="window.chatApp.shareRoom('${roomData.roomId}')">
                    <i class="fas fa-share"></i>
                </button>
                ${isAdmin ? `<button class="private-room-btn" title="Delete Room" onclick="window.chatApp.deleteRoom('${roomData.roomId}')">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </div>
        `;
        
        this.roomTabs.appendChild(roomTab);
    }
    
    // User Role Management
    setUserRole(roomId, username, role) {
        if (!this.userRoles.has(roomId)) {
            this.userRoles.set(roomId, new Map());
        }
        this.userRoles.get(roomId).set(username, role);
    }
    
    getUserRole(roomId, username) {
        const roomRoles = this.userRoles.get(roomId);
        return roomRoles ? roomRoles.get(username) || 'member' : 'member';
    }
    
    isRoomAdmin(roomId, username) {
        return this.getUserRole(roomId, username) === 'admin';
    }
    
    // Room Moderation Functions
    kickUser(username, roomId = null) {
        const targetRoom = roomId || this.currentRoom;
        
        if (!this.isRoomAdmin(targetRoom, this.username)) {
            this.showToast('You do not have permission to kick users', 'error');
            return;
        }
        
        if (username === this.username) {
            this.showToast('You cannot kick yourself', 'error');
            return;
        }
        
        this.socket.emit('kick-user', {
            roomId: targetRoom,
            username: username,
            moderator: this.username
        });
        
        this.showToast(`Kicking ${username} from the room...`, 'info');
    }
    
    banUser(username, roomId = null) {
        const targetRoom = roomId || this.currentRoom;
        
        if (!this.isRoomAdmin(targetRoom, this.username)) {
            this.showToast('You do not have permission to ban users', 'error');
            return;
        }
        
        if (username === this.username) {
            this.showToast('You cannot ban yourself', 'error');
            return;
        }
        
        this.socket.emit('ban-user', {
            roomId: targetRoom,
            username: username,
            moderator: this.username
        });
        
        this.showToast(`Banning ${username} from the room...`, 'warning');
    }
    
    shareRoom(roomId) {
        const room = this.privateRooms.get(roomId);
        if (!room) return;
        
        const shareText = `Join my private room "${room.name}" on ChatBox v2.0!\nRoom Code: ${roomId}`;
        
        if (navigator.share) {
            navigator.share({
                title: `Join ${room.name}`,
                text: shareText
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showToast('Room info copied to clipboard!', 'success');
            }).catch(() => {
                this.showToast('Failed to copy room info', 'error');
            });
        }
    }
    
    showRoomInfo(roomId) {
        const room = this.privateRooms.get(roomId);
        if (!room) return;
        
        const isAdmin = this.isRoomAdmin(roomId, this.username);
        
        const infoHTML = `
            <div class="room-info-modal">
                <h4>${this.escapeHtml(room.name)}</h4>
                <p><strong>Description:</strong> ${this.escapeHtml(room.description) || 'No description'}</p>
                <p><strong>Room Code:</strong> <code>${roomId}</code></p>
                <p><strong>Members:</strong> ${this.connectedUsers.length}/${room.maxUsers}</p>
                <p><strong>Created by:</strong> ${this.escapeHtml(room.creator)}</p>
                ${isAdmin ? '<p><strong>Your Role:</strong> <span style="color: #F59E0B;">Administrator</span></p>' : ''}
            </div>
        `;
        
        // You could implement a proper info modal here
        this.showToast('Room info displayed in console', 'info');
        console.log('Room Info:', room);
    }
    
    deleteRoom(roomId) {
        const room = this.privateRooms.get(roomId);
        if (!room) return;
        
        if (!this.isRoomAdmin(roomId, this.username)) {
            this.showToast('You do not have permission to delete this room', 'error');
            return;
        }
        
        if (confirm(`Are you sure you want to delete the room "${room.name}"? This action cannot be undone.`)) {
            this.socket.emit('delete-room', {
                roomId: roomId,
                moderator: this.username
            });
        }
    }
    
    // User interaction functions
    startPrivateMessage(username) {
        this.showToast(`Private messaging with ${username} coming soon!`, 'info');
        this.closeUserListModal();
    }
    
    viewUserProfile(username) {
        this.showToast(`User profile for ${username} coming soon!`, 'info');
        this.closeUserListModal();
    }
    
    // Admin user actions
    promptKickUser(username) {
        if (this.isRoomAdmin(this.currentRoom, this.username)) {
            if (confirm(`Are you sure you want to kick ${username} from this room?`)) {
                this.kickUser(username);
            }
        } else {
            this.showToast('You do not have admin permissions', 'error');
        }
    }
    
    promptBanUser(username) {
        if (this.isRoomAdmin(this.currentRoom, this.username)) {
            if (confirm(`Are you sure you want to ban ${username} from this room? They will not be able to rejoin.`)) {
                this.banUser(username);
            }
        } else {
            this.showToast('You do not have admin permissions', 'error');
        }
    }
    
    // Enhanced features methods
    handleHistoryData(data) {
        if (data.messages && data.messages.length > 0) {
            // Clear existing messages first
            if (this.chatMessages) {
                this.chatMessages.innerHTML = '';
            }
            
            // Add historical messages
            data.messages.forEach(msgData => {
                this.displayMessage(msgData.username, msgData.message, msgData.timestamp);
            });
            
            this.showToast(`Loaded ${data.messages.length} previous messages`, 'success');
        }
    }
    
    displayUserStats(data) {
        if (data.stats) {
            const statsText = `Users online: ${data.stats.totalUsers} | Messages today: ${data.stats.messagesToday}`;
            
            // Update stats display if element exists
            let statsElement = document.getElementById('user-stats');
            if (!statsElement) {
                statsElement = document.createElement('div');
                statsElement.id = 'user-stats';
                statsElement.className = 'user-stats';
                const header = document.querySelector('.chat-header');
                if (header) {
                    header.appendChild(statsElement);
                }
            }
            statsElement.textContent = statsText;
        }
    }
    
    showTypingIndicator(username) {
        if (!this.settings.showTypingIndicators || username === this.username) return;
        
        let typingContainer = document.getElementById('typing-indicators');
        if (!typingContainer) {
            typingContainer = document.createElement('div');
            typingContainer.id = 'typing-indicators';
            typingContainer.className = 'typing-indicators';
            this.chatMessages.appendChild(typingContainer);
        }
        
        // Remove existing indicator for this user
        const existingIndicator = document.getElementById(`typing-${username}`);
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Add new typing indicator
        const indicator = document.createElement('div');
        indicator.id = `typing-${username}`;
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <span class="username">${this.escapeHtml(username)}</span> is typing
            <span class="dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </span>
        `;
        typingContainer.appendChild(indicator);
        
        this.scrollToBottom();
    }
    
    hideTypingIndicator(username) {
        const indicator = document.getElementById(`typing-${username}`);
        if (indicator) {
            indicator.remove();
        }
        
        // Remove container if empty
        const typingContainer = document.getElementById('typing-indicators');
        if (typingContainer && typingContainer.children.length === 0) {
            typingContainer.remove();
        }
    }
    
    updateRoomInfoDisplay(data) {
        if (data.room) {
            let roomInfoElement = document.getElementById('room-info');
            if (!roomInfoElement) {
                roomInfoElement = document.createElement('div');
                roomInfoElement.id = 'room-info';
                roomInfoElement.className = 'room-info';
                const chatHeader = document.querySelector('.chat-header');
                if (chatHeader) {
                    chatHeader.appendChild(roomInfoElement);
                }
            }
            
            roomInfoElement.innerHTML = `
                <span class="room-name">Room: ${this.escapeHtml(data.room.name)}</span>
                <span class="user-count">${data.room.userCount} users</span>
            `;
        }
    }
    
    displayAnnouncement(data) {
        const announcement = document.createElement('div');
        announcement.className = 'system-announcement';
        announcement.innerHTML = `
            <div class="announcement-header">
                <i class="fas fa-bullhorn"></i>
                System Announcement
                <span class="timestamp">${this.formatTimestamp(data.timestamp)}</span>
            </div>
            <div class="announcement-message">${this.escapeHtml(data.message)}</div>
        `;
        
        this.chatMessages.appendChild(announcement);
        this.scrollToBottom();
        
        // Show toast notification
        this.showToast('New system announcement!', 'info');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('ChatBox Pro v2.0 - Initializing...');
    window.chatApp = new ChatBox();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.chatApp && !document.hidden) {
        // Reset notification badge when page becomes visible
        if (window.chatApp.notificationBadge) {
            window.chatApp.notificationBadge.textContent = '0';
        }
    }
});

// Add toast slide out animation to CSS (if not already present)
const toastSlideOutStyle = document.createElement('style');
toastSlideOutStyle.textContent = `
@keyframes toastSlideOut {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(100%);
    }
}
`;
document.head.appendChild(toastSlideOutStyle);
