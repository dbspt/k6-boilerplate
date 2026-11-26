/**
 * Executor constant-vus (modelo fechado)
 *
 * Número FIXO de usuários repetindo a função durante um tempo.
 * Cada usuário só começa a próxima iteração quando a anterior termina:
 * se o sistema ficar lento, chegam menos requisições.
 *
 * Quando usar: X pessoas usando o sistema ao mesmo tempo, sem variação.
 * O atalho { vus, duration } da fumaça vira exatamente este executor.
 *
 * docker compose run --rm --service-ports k6 run /scripts/executores/constant-vus.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

export const options = {
  scenarios: {
    usuarios_fixos: {
      executor: 'constant-vus',
      vus: 10,              // 10 usuários o tempo todo
      duration: '30s',
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

  sleep(1); // tempo de "leitura" do usuário: no modelo fechado ele define o ritmo
}
