/**
 * Executor ramping-vus (modelo fechado)
 *
 * O número de usuários sobe e desce conforme os stages.
 * Aqui, target é NÚMERO DE USUÁRIOS.
 *
 * Quando usar: rampa, patamar e descida, como na carga, no pico e na resistência.
 * O atalho { stages } da carga vira exatamente este executor.
 *
 * docker compose run --rm --service-ports k6 run /scripts/executores/ramping-vus.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

export const options = {
  scenarios: {
    rampa_de_usuarios: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },   // subida até 10 usuários
        { duration: '20s', target: 10 },   // patamar
        { duration: '15s', target: 0 },    // descida
      ],
      gracefulRampDown: '10s', // tempo para terminar a iteração em andamento na descida
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const res = http.post(`${BASE_URL}/api/pizza`,
    JSON.stringify({ maxCaloriesPerSlice: 1000 }),
    { headers: { 'Content-Type': 'application/json', Authorization: 'token abcdef0123456789' } });
  check(res, { 'pizza: status 200': (r) => r.status === 200 });

  sleep(1);
}
