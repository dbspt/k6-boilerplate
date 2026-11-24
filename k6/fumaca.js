/**
 * 01. INICIALIZAÇÃO
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

/**
 * 02. CONFIGURAÇÕES
 */
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {                           // os critérios de aprovação do teste
    http_req_failed: ['rate<0.01'],       // menos de 1% das requisições pode falhar (smoke teste requer tolerância zero!)
    checks: ['rate==1'],                  // 100% das verificações precisam passar
  },
};

/**
 * 03. EXECUÇÃO
 * 
 * A função setup() é executada uma vez antes de cada execução da função default.
 * A função default é executada repetidas vezes para cada usuário, 
 * do começo ao fim, até o tempo acabar.
 */
export function setup() {
  return { inicio: new Date().toISOString() };
}

export default function () {
  const home = http.get(`${BASE_URL}/`);
  check(home, { 
    'home: status 200': (r) => r.status === 200       // Check 01
  });

  const res = http.post(`${BASE_URL}/api/pizza`,
    JSON.stringify({ maxCaloriesPerSlice: 1000 }),
    { headers: { 'Content-Type': 'application/json',
                 Authorization: 'token abcdef0123456789' } });
  check(res, {
    'pizza: status 200': (r) => r.status === 200,     // Check 02
    'pizza: tem nome': (r) => !!r.json('pizza.name'), // Check 03
  });

  sleep(1); 
}

/**
 * 04. DESMONTAGEM
 */
export function teardown(data) {
  console.log(`Teste iniciado em ${data.inicio}`); 
}