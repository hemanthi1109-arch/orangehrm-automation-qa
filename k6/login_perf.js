import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 20 },  // Stay at 20 users
        { duration: '10s', target: 0 },  // Ramp down to 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    },
};

export default function () {
    // Login Endpoint usually requires CSRF tokens or similar on real apps.
    // For OrangeHRM demo, we simulate a POST request.
    // Note: Actual implementation depends on specific API details which might be hidden behind CSRF.
    // This is a generic structure.

    const baseUrl = __ENV.BASE_URL || 'https://opensource-demo.orangehrmlive.com';
    const url = `${baseUrl}/web/index.php/auth/validate`;
    const payload = {
        username: 'Admin',
        password: 'admin123',
    };

    const params = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };

    const res = http.post(url, payload, params);

    check(res, {
        'status is 200 or 302': (r) => r.status === 200 || r.status === 302,
    });

    sleep(1);
}
