/**
 * Métricas personalizadas: um exemplo de cada tipo
 *
 * O k6 tem quatro tipos de métrica, cada um com o seu módulo em k6/metrics:
 *   Counter  soma valores                      (ex.: http_reqs, iterations)
 *   Gauge    guarda o último valor, mín. e máx. (ex.: vus, vus_max)
 *   Rate     % de valores verdadeiros           (ex.: http_req_failed, checks)
 *   Trend    distribuição: média, p90, p95...   (ex.: http_req_duration)
 *
 * As métricas criadas aqui aparecem no resumo do terminal, no Grafana
 * e podem ter critérios (thresholds) como as do próprio k6.
 *
 * docker compose run --rm --service-ports k6 run -o experimental-prometheus-rw /scripts/metricas.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';
const BODY = JSON.stringify({ maxCaloriesPerSlice: 1000 });
const PARAMS = {
  headers: { 'Content-Type': 'application/json', Authorization: 'token abcdef0123456789' },
};

// 1. Counter: soma. Quantos ingredientes o QuickPizza serviu no teste inteiro.
const ingredientesServidos = new Counter('ingredientes_servidos');

// 2. Gauge: último valor. As calorias da pizza mais recente (o resumo mostra também mín. e máx.).
const caloriasUltimaPizza = new Gauge('calorias_ultima_pizza');

// 3. Rate: porcentagem de verdadeiros. Quantas pizzas vieram vegetarianas.
const pizzasVegetarianas = new Rate('pizzas_vegetarianas');

// 4. Trend: distribuição. O tempo só do pedido de pizza; true = valores em milissegundos.
const tempoPizza = new Trend('tempo_pizza', true);

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    tempo_pizza: ['p(95)<500'],             // Trend: avg, min, max, med, p(N)
    ingredientes_servidos: ['count>0'],     // Counter: count ou rate (por segundo)
    calorias_ultima_pizza: ['value<=1000'], // Gauge: value
    pizzas_vegetarianas: ['rate<1'],        // Rate: rate (nem toda pizza é vegetariana)
  },
};

export default function () {
  const res = http.post(`${BASE_URL}/api/pizza`, BODY, PARAMS);
  if (check(res, { 'pizza: status 200': (r) => r.status === 200 })) {
    const corpo = res.json();
    ingredientesServidos.add(corpo.pizza.ingredients.length); // soma
    caloriasUltimaPizza.add(corpo.calories);                  // substitui o valor anterior
    pizzasVegetarianas.add(corpo.vegetarian);                 // true conta como 1, false como 0
    tempoPizza.add(res.timings.duration);                     // cada valor entra na distribuição
  }

  sleep(1);
}
