# Forms Monte Verde

Página de pré-inscrição da Expedição Monte Verde da Usina do Jet, realizada de 6 a 8 de novembro de 2026. Projeto construído com React, TypeScript, Vite e Tailwind CSS.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Validação

```bash
npm run lint
npm run build
node --test tests/protocol.test.js
```

## Integração com o Basin

O formulário já está preparado para enviar os dados e os documentos diretamente ao Basin. A geração do contrato não faz parte desta etapa.

O endpoint `https://usebasin.com/f/52f4bd4c726f` já está configurado no projeto. Não é necessário cadastrar `VITE_BASIN_ENDPOINT` na Vercel.

O envio usa `multipart/form-data`, mantém os documentos em seus formatos originais e apresenta os campos no painel do Basin com nomes legíveis. O protocolo (001, 002, 003...) aparece na confirmação e no campo **Protocolo da inscrição** de cada novo registro no Basin. O assunto do envio também inclui esse número. Inscrições já recebidas não são alteradas nem renumeradas.

## Contador de protocolos

A API `/api/protocol` usa um contador atômico no Redis, separado pela chave `monte-verde-2026`. No projeto da Vercel, associe um banco Upstash Redis e disponibilize `KV_REST_API_URL` e `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`) para a função. Sem essa integração, o formulário não envia dados ao Basin: exibe um erro e permite tentar novamente.

Em desenvolvimento local, `npm run dev` executa apenas o Vite e não disponibiliza a função `/api/protocol`. Use uma implantação de prévia na Vercel para testar a inscrição completa. Um teste real reserva um número; se quiser preservar o 001 para a primeira inscrição da edição, não envie um formulário de teste.
