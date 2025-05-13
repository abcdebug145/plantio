$(document).ready(function () {
    fetch('/api/auth/check-auth')
        .then(res => res.json())
        .then(data => {
            const navbarRight = document.getElementById('navbar-right');
            if (data.isAuthenticated) {
                navbarRight.innerHTML = `
                        <span style="color:#388e3c;font-weight:bold; margin-right: 20px;">
                            Xin chào, ${data.user.username}
                        </span>
                        <a href="/logout" id="logout-link" style="color: black; font-weight: 300; font-size: 12px;">
                            <img src="../assets/images/logout.svg" alt="Logout" style="width: 20px; height: 20px;">
                        </a>
                    `;

                // Thêm xử lý đăng xuất
                document.getElementById('logout-link').addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        const response = await fetch('/api/auth/logout', {
                            method: 'POST'
                        });
                        if (response.ok) {
                            window.location.reload();
                        }
                    } catch (error) {
                        console.error('Lỗi đăng xuất:', error);
                    }
                });
            } else {
                navbarRight.innerHTML = `
                        <a href="/login" class="navbar-link" id="login-link">Đăng nhập</a>
                        <a href="/register" class="navbar-link" id="register-link">Đăng ký</a>
                    `;
            }
        })
        .catch(error => {
            console.error('Lỗi kiểm tra đăng nhập:', error);
        });

    // Xử lý chat
    const chatButton = document.getElementById('chat-button');
    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const chatImage = document.getElementById('chat-image');
    const chatHideBtn = document.getElementById('chat-hide-btn');

    chatButton.onclick = function () {
        if (chatContainer.style.display === 'none' || !chatContainer.style.display) {
            chatContainer.style.display = 'flex';
        } else {
            chatContainer.style.display = 'none';
        }
    };

    chatHideBtn.onclick = function () {
        chatContainer.style.display = 'none';
    };

    function appendMessage(message, isUser, imageUrl) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message' + (isUser ? ' user' : '');
        const contentDiv = document.createElement('div');
        contentDiv.className = 'chat-message-content';
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '120px';
            img.style.maxHeight = '120px';
            img.style.display = 'block';
            img.style.marginBottom = '6px';
            contentDiv.appendChild(img);
        }
        contentDiv.appendChild(document.createTextNode(message));
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            appendMessage(message, true);
            chatInput.value = '';
            fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            })
                .then(res => res.json())
                .then(data => {
                    console.log('Response:', data);
                    if (data && data.response) {
                        appendMessage(data.response, false);
                    } else {
                        console.error('Không có response từ server:', data);
                    }
                })
                .catch(error => {
                    console.error('Lỗi gửi tin nhắn:', error);
                });
        }
    }

    sendButton.onclick = sendMessage;
    chatInput.onkeydown = function (event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    // Xử lý gửi ảnh
    chatImage.onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (evt) {
                appendMessage('Ảnh đã gửi:', true, evt.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

});