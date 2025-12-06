// app/utils/authHelper.js
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export const refreshAccessToken = async () => {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        
        // Update tokens
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }

        return data.access_token;
    } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        throw error;
    }
};

export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('access_token');
    
    // First attempt
    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    // If 401, try to refresh token and retry
    if (response.status === 401) {
        console.log('🔄 Token expired, refreshing...');
        
        try {
            const newToken = await refreshAccessToken();
            
            // Retry with new token
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            // Refresh failed, user will be redirected to login
            throw error;
        }
    }

    return response;
};

// Check if token is expired or about to expire
export const isTokenExpired = (token) => {
    if (!token) return true;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        
        // Consider expired if less than 5 minutes remaining
        return expiry - now < 5 * 60 * 1000;
    } catch (error) {
        return true;
    }
};

// Auto-refresh token before it expires
export const setupTokenRefresh = () => {
    const checkAndRefresh = async () => {
        const token = localStorage.getItem('access_token');
        
        if (isTokenExpired(token)) {
            console.log('⚠️ Token is about to expire, refreshing...');
            try {
                await refreshAccessToken();
                console.log('✅ Token refreshed successfully');
            } catch (error) {
                console.error('❌ Failed to refresh token');
            }
        }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAndRefresh, 5 * 60 * 1000);
    
    // Check immediately
    checkAndRefresh();

    return () => clearInterval(interval);
};