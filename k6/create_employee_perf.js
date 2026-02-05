import http from 'k6/http';
import { check, sleep } from 'k6';
import { parseHTML } from 'k6/html';

export const options = {
    stages: [
        { duration: '5s', target: 5 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.01'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'https://opensource-demo.orangehrmlive.com';

// 1. Setup Phase: Login once to get the Session Cookie/Token
export function setup() {
    // 1. Get Login Page to extract CSRF Token
    const loginPageRes = http.get(`${BASE_URL}/web/index.php/auth/login`);

    const doc = parseHTML(loginPageRes.body);
    let token = doc.find('input[name="_token"]').val();

    // Fallback for Vue-based login page
    if (!token) {
        const tokenMatch = loginPageRes.body.match(/:token="&quot;([^&]+)&quot;"/);
        if (tokenMatch) {
            token = tokenMatch[1];
        }
    }

    if (!token) {
        console.log('WARNING: Could not find CSRF token. Login might fail.');
    } else {
        console.log(`CSRF Token found: ${token.substring(0, 10)}...`);
    }

    // 2. Perform Login
    const loginRes = http.post(`${BASE_URL}/web/index.php/auth/validate`, {
        _token: token,
        username: 'Admin',
        password: 'admin123',
    });

    console.log(`Login Status: ${loginRes.status}`);


    const success = loginRes.status === 200 || loginRes.status === 302;
    if (!success) {
        console.log(`Login Request Failed. Body: ${loginRes.body.substring(0, 200)}`);
    }

    check(loginRes, {
        'Logged in successfully': (r) => success,
    });



    // 3. Extract Session Cookie
    const jar = http.cookieJar();
    const cookies = jar.cookiesForURL(BASE_URL);
    let sessionCookie = cookies.orangehrm;

    // Handle array return type from K6
    if (Array.isArray(sessionCookie)) {
        sessionCookie = sessionCookie.length > 0 ? sessionCookie[0] : null;
    }

    if (!sessionCookie) {
        console.log(`WARNING: No "orangehrm" cookie found. Cookies: ${JSON.stringify(cookies)}`);
    } else {
        console.log(`Session Cookie captured: ${String(sessionCookie).substring(0, 10)}...`);
    }

    // 4. Fetch Add Employee Page to get valid CSRF Token for API
    let actionToken = null;
    if (sessionCookie) {
        // Try extracting from Dashboard first (since we already have the login response, but we need to re-parse or re-fetch if we didn't save it)
        // We'll just fetch 'addEmployee' as it's a specific action page.

        const addPageRes = http.get(`${BASE_URL}/web/index.php/pim/addEmployee`, {
            headers: {
                'Cookie': `orangehrm=${sessionCookie}`
            }
        });

        const body = addPageRes.body;
        const addPageDoc = parseHTML(body);

        // Strategy 1: Hidden Input
        actionToken = addPageDoc.find('input[name="_token"]').val();

        // Strategy 2: Meta Tag (Laravel/Symfony standard)
        if (!actionToken) {
            // <meta name="csrf-token" content="...">
            actionToken = addPageDoc.find('meta[name="csrf-token"]').attr('content');
        }

        // Strategy 3: Vue/JS pattern
        if (!actionToken) {
            const tokenMatch = body.match(/&quot;_token&quot;:&quot;([a-zA-Z0-9_\-]+)&quot;/);
            if (tokenMatch) actionToken = tokenMatch[1];
        }

        // Strategy 4: Script variable (window.token = ...)
        if (!actionToken) {
            const scriptMatch = body.match(/["']csrf_token["']\s*:\s*["']([^"']+)["']/i);
            if (scriptMatch) actionToken = scriptMatch[1];
        }

        // Strategy 5: Vue prop pattern matching the login page style
        // :token="&quot;...&quot;"
        if (!actionToken) {
            const vueMatch = body.match(/:token="&quot;([^&]+)&quot;"/);
            if (vueMatch) actionToken = vueMatch[1];
        }


    }

    if (actionToken) {
        console.log(`Action Token (from AddEmployee Page) captured: ${actionToken.substring(0, 10)}...`);
    } else {
        console.log('WARNING: Could not find Action Token in Add Employee page source.');
    }

    return { sessionCookie: sessionCookie, actionToken: actionToken };
}

export default function (data) {
    if (!data.sessionCookie) {
        console.log("Skipping iteration due to missing session cookie");
        return;
    }

    // 2. Create Employee
    const randomId = Math.floor(Math.random() * 100000);

    // First, simulate the "check ID unique" validation call as observed
    const validateUrl = `${BASE_URL}/web/index.php/api/v2/core/validation/unique?value=${randomId}&entityName=Employee&attributeName=employeeId`;
    const validateParams = {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            // 'Cookie': `orangehrm=${data.sessionCookie}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
        }
    };
    http.get(validateUrl, validateParams);


    const url = `${BASE_URL}/web/index.php/api/v2/pim/employees`;

    // Use the session cookie for authentication
    const jar = http.cookieJar();
    jar.set(BASE_URL, 'orangehrm', data.sessionCookie);

    const payload = JSON.stringify({
        firstName: 'K6',
        middleName: 'Perf',
        lastName: `User_${randomId}`,
        employeeId: `${randomId}`,
        empPicture: null,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `orangehrm=${data.sessionCookie}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            // Use the extracted token. The API likely expects it as a header or checks query params, but headers is standard for internal V2.
            // We try 'token' as per user hint "use that tocken", and 'X-CSRF-TOKEN' as standard practice.
            'token': data.actionToken,
            'X-CSRF-TOKEN': data.actionToken
        },
    };

    const res = http.post(url, payload, params);

    const success = res.status === 200;
    if (!success) {
        console.log(`Create Employee Failed: ${res.status} - ${res.body}`);
    }

    check(res, {
        'Create Employee Status is 200': (r) => success,
    });

    sleep(1);
}
