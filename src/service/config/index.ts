let BASE_URL = '';
export const TIME_OUT = 10000;

if (import.meta.env.PROD) {
    BASE_URL = 'http://localhost:3000';
} else {
    BASE_URL = '/api';
    // BASE_URL = 'http://coderwhy.prod:8000';
}

export { BASE_URL };
