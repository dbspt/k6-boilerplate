/**
 * Executor constant-arrival-rate (modelo aberto)
 *
 * Taxa FIXA de iterações iniciadas por unidade de tempo: 10 por segundo.
 * O k6 inicia cada iteração no horário, mesmo que as anteriores não tenham
 * terminado; se o sistema ficar lento, ele cria mais usuários (até maxVUs).
 *
 * Quando usar: provar que o sistema sustenta uma meta de vazão.
 *
 * docker compose run --rm --service-ports k6 run /scripts/executores/constant-arrival-rate.js
 */
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

export const options = {
  scenarios: {
    vazao_fixa: {
      executor: 'constant-arrival-rate',
      rate: 20,             // 10 iterações...
      timeUnit: '1s',       // ...por segundo
      duration: '15s',
      preAllocatedVUs: 5,   // usuários criados no início
      maxVUs: 20,           // teto: se faltar usuário, a iteração é descartada
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    dropped_iterations: ['count<10'], // iterações que não começaram por falta de usuário
  },
};

// Sem sleep: no modelo aberto, quem define o ritmo é a taxa de chegada.
export default function () {
  const res = http.post(`${BASE_URL}/api/pizza`,
    JSON.stringify({ maxCaloriesPerSlice: 1000 }),
    { headers: { 'Content-Type': 'application/json', Authorization: 'token abcdef0123456789' } });
  check(res, { 'pizza: status 200': (r) => r.status === 200 });
}
