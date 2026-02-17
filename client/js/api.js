const API_CONFIG = {
    BASE: "http://localhost:8000/api",
    WS: "ws://localhost:8000/ws/chat"
};

window.api = {
    socket: null, // Holds the active connection

    login: async (username, password) => {
        const res = await fetch(`${API_CONFIG.BASE}/login`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Login failed");
        return await res.json();
    },

    register: async (username, password) => {
        const res = await fetch(`${API_CONFIG.BASE}/register`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Registration failed");
        return await res.json();
    },

    getProjects: async (owner) => {
        const url = owner ? `${API_CONFIG.BASE}/projects?owner=${owner}` : `${API_CONFIG.BASE}/projects`;
        const res = await fetch(url);
        return await res.json();
    },
    
    createProject: async (data) => {
        const res = await fetch(`${API_CONFIG.BASE}/projects`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    deleteProject: async (id) => {
        const res = await fetch(`${API_CONFIG.BASE}/projects/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete failed");
        return await res.json();
    },

    saveProjectContent: async (id, content) => {
        const res = await fetch(`${API_CONFIG.BASE}/projects/${id}/content`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error("Failed to auto-save content");
        return await res.json();
    },

    saveProjectPrompts: async (id, prompts) => {
        const res = await fetch(`${API_CONFIG.BASE}/projects/${id}/prompts`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ prompts })
        });
        if (!res.ok) throw new Error("Failed to save prompts");
        return await res.json();
    },

    saveVersion: async (data) => {
        const res = await fetch(`${API_CONFIG.BASE}/versions`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    getVersions: async (projectId) => {
        const res = await fetch(`${API_CONFIG.BASE}/versions/${projectId}`);
        return await res.json();
    },

    // --- SOCKET LOGIC ---
    initSocket: (onMessage) => {
        // Close existing socket if one is already open
        if (window.api.socket) {
            window.api.socket.close();
        }

        window.api.socket = new WebSocket(API_CONFIG.WS);
        
        window.api.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'stream' && onMessage) onMessage(data.message);
        };

        window.api.socket.onclose = () => console.log("Socket connection closed.");
        window.api.socket.onerror = (err) => console.error("Socket error:", err);
    },

    sendMessage: (text) => {
        const s = window.api.socket;
        if (s && s.readyState === WebSocket.OPEN) {
            s.send(JSON.stringify({ input: text }));
        } else {
            console.error("Cannot send message: Socket is not open.");
        }
    },

    // --- NEW: STOP STREAM FUNCTION ---
    stopStream: () => {
        const s = window.api.socket;
        if (s && s.readyState === WebSocket.OPEN) {
            // Sends a specific stop signal to the backend
            s.send(JSON.stringify({ action: "stop" }));
            console.log("Stop command sent to backend.");
        }
    }
};