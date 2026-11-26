/**
 * Teste de navegador: 1 usuário clicando na tela + carga na API (VUS_API).
 *
 * ATENÇÃO: rode com o serviço k6-navegador, que tem o Chromium embutido.
 * Com o serviço k6, o teste falha com "k6 couldn't detect google chrome".
 *
 * docker compose run --rm --service-ports -e VUS_API=20 k6-navegador run -o experimental-prometheus-rw /scripts/navegador.js
 */
import http from 'k6/http';
import { browser } from 'k6/browser';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';
const VUS_API = Number(__ENV.VUS_API || 20);
const ateAPizza = new Trend('tempo_ate_pizza', true);

export const options = {
  scenarios: {
    api: {
      executor: 'constant-vus', exec: 'api',
      vus: VUS_API, duration: '1m',
    },
    tela: {
      executor: 'constant-vus', exec: 'tela',
      vus: 1, duration: '1m',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    'http_req_duration{scenario:api}': ['p(95)<500'],
    browser_web_vital_lcp: ['p(75)<2500'],
    tempo_ate_pizza: ['p(95)<1500'],
    checks: ['rate>0.99'],
  },
};

export function api() {
  const res = http.post(`${BASE_URL}/api/pizza`, JSON.stringify({}),
    { headers: { Authorization: 'token abcdef0123456789' } });
  check(res, { 'api: status 200': (r) => r.status === 200 });
  sleep(1);
}

export async function tela() {
  const page = await browser.newPage();
  try {
    await page.goto(BASE_URL);
    const inicio = Date.now();
    await page.locator('button[name="pizza-please"]').click();
    await page.locator('#recommendations').waitFor();
    ateAPizza.add(Date.now() - inicio);
    const nome = await page.locator('#pizza-name').textContent();
    check(nome, {
      'tela: mostrou a pizza': (t) => t.includes('recommendation'),
    });
  } finally {
    await page.close();
  }
  sleep(1);
}
