/**
 * Executor ramping-arrival-rate (modelo aberto)
 *
 * A taxa de chegada sobe e desce conforme os stages.
 * Aqui, target é TAXA (iterações por timeUnit), não número de usuários.
 *
 * Quando usar: estresse, para achar em que taxa o sistema quebra.
 * É o executor do estresse.js, numa versão curta.
 *
 * docker compose run --rm --service-ports k6 run /scripts/executores/ramping-arrival-rate.js
 */
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

export const options = {
  scenarios: {
    rampa_de_chegadas: {
      executor: 'ramping-arrival-rate',
      startRate: 1,         // começa em 1 iteração por segundo
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      stages: [
        { duration: '15s', target: 10 },   // sobe até 10 por segundo
        { duration: '15s', target: 10 },   // segura
        { duration: '15s', target: 20 },   // sobe até 20 por segundo
        { duration: '15s', target: 0 },    // descida
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    dropped_iterations: ['count<10'],
  },
};

export default function () {
  const res = http.post(`${BASE_URL}/api/pizza`,
    JSON.stringify({ maxCaloriesPerSlice: 1000 }),
    { headers: { 'Content-Type': 'application/json', Authorization: 'token abcdef0123456789' } });
  check(res, { 'pizza: status 200': (r) => r.status === 200 });
}
