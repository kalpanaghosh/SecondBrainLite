document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const syncView = document.getElementById('sync-view');
    const statusEl = document.getElementById('status');
    const loginBtn = document.getElementById('login-btn');
    const syncBtn = document.getElementById('sync-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const API_URL = 'http://localhost:5000/api';

    const checkStatus = () => {
        chrome.storage.local.get(['token'], (data) => {
            if (data.token) {
                loginView.classList.add('hidden');
                syncView.classList.remove('hidden');
                syncCredentials(data.token);
            } else {
                loginView.classList.remove('hidden');
                syncView.classList.add('hidden');
            }
        });
    };

    const setStatus = (msg, isError = false) => {
        statusEl.textContent = msg;
        statusEl.className = isError ? 'error' : 'success';
        setTimeout(() => { statusEl.textContent = ''; }, 3000);
    };

    const syncCredentials = async (token) => {
        try {
            const res = await fetch(`${API_URL}/credentials`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const credentials = await res.json();
            if (res.ok) {
                chrome.storage.local.set({ credentials });
                setStatus(`Synced ${credentials.length} credentials!`);
            } else {
                setStatus('Failed to sync. Please login again.', true);
                logout();
            }
        } catch (err) {
            setStatus('Server offline.', true);
        }
    };

    const logout = () => {
        chrome.storage.local.remove(['token', 'credentials'], () => {
            checkStatus();
        });
    };

    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok && data.token) {
                chrome.storage.local.set({ token: data.token }, () => {
                    checkStatus();
                });
            } else {
                setStatus(data.msg || 'Login failed', true);
            }
        } catch (err) {
            setStatus('Server unreachable', true);
        }
    });

    syncBtn.addEventListener('click', () => {
        chrome.storage.local.get(['token'], (data) => {
            if (data.token) syncCredentials(data.token);
        });
    });

    logoutBtn.addEventListener('click', logout);

    checkStatus();
});
