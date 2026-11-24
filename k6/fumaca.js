import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate==1'],
  },
};

export default function () {
  const home = http.get(`${BASE_URL}/`);
  check(home, { 'home: status 200': (r) => r.status === 200 });

  const res = http.post(`${BASE_URL}/api/pizza`,
    JSON.stringify({ maxCaloriesPerSlice: 1000 }),
    { headers: { 'Content-Type': 'application/json',
                 Authorization: 'token abcdef0123456789' } });
  check(res, {
    'pizza: status 200': (r) => r.status === 200,
    'pizza: tem nome': (r) => !!r.json('pizza.name'),
  });

  sleep(1);
}
