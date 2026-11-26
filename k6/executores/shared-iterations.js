/**
 * Executor shared-iterations (modelo fechado)
 *
 * Um TOTAL de iterações dividido entre os usuários. Quem termina antes
 * pega a próxima iteração disponível, então a divisão não é igual.
 * O teste acaba quando as 50 iterações terminam (ou em maxDuration).
 *
 * Quando usar: rodar N vezes no total e terminar, como preparar massa de dados.
 *
 * docker compose run --rm --service-ports k6 run /scripts/executores/shared-iterations.js
 */
import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

export const options = {
  scenarios: {
    total_compartilhado: {
      executor: 'shared-iterations',
      vus: 5,               // 5 usuários dividem...
      iterations: 50,       // ...50 iterações no total
      maxDuration: '1m',    // teto de segurança (padrão: 10m)
    },
  },
  thresholds: {
    checks: ['rate>0.99'],
  },
};

export default function () {
  const res = http.post(`${BASE_URL}/api/pizza`,
    JSON.stringify({ maxCaloriesPerSlice: 1000 }),
    { headers: { 'Content-Type': 'application/json', Authorization: 'token abcdef0123456789' } });
  check(res, { 'pizza: status 200': (r) => r.status === 200 });

  // Mostra quem fez cada iteração: a contagem por usuário não sai igual.
  console.log(`usuário ${exec.vu.idInTest} fez a iteração ${exec.scenario.iterationInTest + 1} de 50`);
}
