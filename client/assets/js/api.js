// centralized API handler
const API_BASE = '/api';

export async function request(path, options={}) {
    const res = await fetch(API_BASE + path, options);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
}
