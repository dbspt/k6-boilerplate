# QuickPizza Lab: testes de performance com k6, Prometheus e Grafana

Laboratório local do Módulo 06. O **k6** gera a carga contra o **QuickPizza**; as métricas vão para o
**Prometheus** e aparecem no **Grafana**. A **ServeRest** entra no trabalho final.

## Endereços

| Serviço | URL |
|---|---|
| QuickPizza (alvo dos exercícios) | http://localhost:3333 |
| Grafana (painel, sem login) | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| Painel web do k6 | http://localhost:5665 (só durante um teste) |
| ServeRest (trabalho final) | http://localhost:3000 e http://localhost:3000/status |

## Subir e desligar

```bash
docker compose up -d
```

```bash
docker compose down
```

A ServeRest só sobe quando chamada pelo nome:

```bash
docker compose up -d serverest
```

## Scripts

| Script | Tipo | Encontro |
|---|---|---|
| `k6/fumaca.js` | Fumaça: 1 usuário, 30 s | 1, Exercício 1 |
| `k6/carga.js` | Carga: rampa até 20 usuários, 2 min | 1, Exercício 2 |
| `k6/estresse.js` | Estresse: degraus de chegadas por segundo | 2, Exercício 3 |
| `k6/pico.js` | Pico: salto brusco de usuários | 2, Exercício 4 |
| `k6/resistencia.js` | Resistência: duração via `DURACAO` | 2, Exercício 5 |
| `k6/navegador.js` | Navegador: 1 usuário clicando na tela + carga na API (`VUS_API`) | 2, extra |
| `k6/serverest/fumaca.js` | Fumaça na ServeRest | 2, trabalho final |
| `k6/serverest/gabarito-carga.js` | Gabarito dos instrutores | 2, trabalho final |

Executar (Linux e macOS; no Windows PowerShell troque a `\` do fim da linha pela crase `` ` ``):

```bash
docker compose run --rm --service-ports k6 \
  run -o experimental-prometheus-rw /scripts/carga.js
```

Resistência com duração escolhida:

```bash
docker compose run --rm --service-ports -e DURACAO=10m k6 \
  run -o experimental-prometheus-rw /scripts/resistencia.js
```

Teste de navegador (usa o serviço `k6-navegador`, que tem o Chromium embutido):

```bash
docker compose run --rm --service-ports -e VUS_API=20 k6-navegador \
  run -o experimental-prometheus-rw /scripts/navegador.js
```

`VUS_API` é o número de usuários de API gerando carga ao mesmo tempo (mínimo 1). Na primeira vez, o Docker baixa a
imagem com o navegador (cerca de 840 MB em disco).

Contra a ServeRest:

```bash
docker compose run --rm --service-ports -e BASE_URL=http://serverest:3000 k6 \
  run /scripts/serverest/fumaca.js
```

O relatório HTML de cada execução é gravado em `k6/report.html` (sobrescrito a cada teste).

## Saídas de referência

A pasta `saidas-de-referencia/` guarda o resumo do terminal de uma execução real de cada script (MacBook com chip M1),
para comparar com o que você obtiver. Os números variam de máquina para máquina; o que deve se repetir é o
comportamento: fumaça e carga passam, o estresse quebra a partir de 40 req/s, o pico se recupera, a resistência
fica estável (a referência usou um patamar de 4 minutos).

## Cuidados

- **O comando não termina com o painel do k6 aberto.** Se a aba de http://localhost:5665 estiver aberta no navegador,
  o k6 termina o teste mas fica esperando ela fechar antes de mostrar o resumo e encerrar. Feche a aba (ou não a abra)
  e o comando termina sozinho. Interromper com Ctrl+C nesse ponto pode deixar o resumo e o `report.html` sem gravar.
- **Reinicie o QuickPizza entre exercícios pesados** (`docker compose restart quickpizza`). Depois de um estresse, ele leva algum tempo para voltar ao normal, e o resultado do teste seguinte fica contaminado.
- **Espere o painel zerar entre testes.** O Grafana calcula percentis por janela de tempo, mas os usuários virtuais continuam aparecendo por alguns minutos depois do fim de um teste.
- **Mac com chip Apple:** a imagem da ServeRest é só `amd64` e roda emulada; os tempos medidos ficam acima do real.
- A saída `experimental-prometheus-rw` funciona no k6 2.x, mas está marcada para remoção no k6 v3.
