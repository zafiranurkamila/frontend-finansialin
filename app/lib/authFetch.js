export async function authFetch(url, options = {}) {
    const token = localStorage.getItem("accessToken");

    const defaultHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    const finalOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    };

    const response = await fetch(url, finalOptions);

    return response;
}
