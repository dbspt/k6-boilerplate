/**
 * Executor per-vu-iterations (modelo fechado)
 *
 * CADA usuário faz exatamente N iterações: 5 usuários x 10 = 50 no total.
 * O teste acaba quando o último usuário termina as suas (ou em maxDuration).
 *
 * Quando usar: cada usuário tem dados próprios, como um login por usuário.
 * Aqui, cada usuário pede pizzas com o seu próprio limite de calorias.
 *
 * docker compose run --rm --service-ports k6 run /scripts/executores/per-vu-iterations.js
 */
import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

// Massa de dados: uma linha por usuário.
const LIMITES_DE_CALORIAS = [500, 700, 900, 1100, 1300];

export const options = {
  scenarios: {
    por_usuario: {
      executor: 'per-vu-iterations',
      vus: 5,               // 5 usuários...
      iterations: 10,       // ...com 10 iterações cada
      maxDuration: '1m',
    },
  },
  thresholds: {
    checks: ['rate>0.99'],
  },
};

export default function () {
  // idInTest começa em 1: o usuário 1 usa a primeira linha da massa.
  const limite = LIMITES_DE_CALORIAS[exec.vu.idInTest - 1];

  const res = http.post(`${BASE_URL}/api/pizza`,
    JSON.stringify({ maxCaloriesPerSlice: limite }),
    { headers: { 'Content-Type': 'application/json', Authorization: 'token abcdef0123456789' } });
  check(res, { 'pizza: status 200': (r) => r.status === 200 });

  console.log(`usuário ${exec.vu.idInTest}, iteração ${exec.vu.iterationInScenario + 1} de 10, limite ${limite} kcal`);
}
