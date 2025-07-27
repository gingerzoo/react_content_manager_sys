let BASE_URL = '';
export const TIME_OUT = 10000;

if (import.meta.env.PROD) {
    BASE_URL = 'http://codercba.com:5000';
} else {
    BASE_URL = 'http://codercba.com:5000';
    // BASE_URL = 'http://coderwhy.prod:8000';
}

export { BASE_URL };
