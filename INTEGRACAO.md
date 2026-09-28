# Integração: registrar ligações do WhatsApp Web

Cada ligação feita pelo WhatsApp Web deve ser enviada para o endpoint abaixo. Ela entra no
Contador de Ligações como ligação **feita** e, se a pessoa atendeu, também como **atendida**.

## Endpoint

```
POST https://glgsvnipytucuazpsggm.supabase.co/functions/v1/registrar-ligacao
Content-Type: application/json
x-api-key: <token fornecido à parte>
```

O token é entregue separadamente, fora deste documento. Guarde-o como segredo: não o coloque
em repositório nem em código que roda no navegador de terceiros.

## De quem é a ligação

Cada ligação pertence a um usuário do Contador. Há dois tipos de token:

- **Token de um usuário:** todas as ligações enviadas com ele vão para essa pessoa.
  `usuario_email` é ignorado.
- **Token do sistema:** serve para vários usuários. Cada envio precisa de `usuario_email` com
  o e-mail da conta de quem fez a ligação no Contador.

Informamos junto com o token qual dos dois tipos ele é.

## Corpo da requisição

| Campo              | Tipo    | Obrigatório | Descrição                                                                 |
| ------------------ | ------- | ----------- | ------------------------------------------------------------------------- |
| `id`               | string  | sim         | Identificador único da ligação no seu sistema (até 200 caracteres).       |
| `atendida`         | boolean | sim         | `true` se a pessoa atendeu; `false` se não atendeu (ou ainda não se sabe). |
| `telefone`         | string  | não         | Número do contato, de preferência em E.164 (`+5511999999999`).            |
| `contato`          | string  | não         | Nome do contato como aparece no WhatsApp.                                 |
| `duracao_segundos` | inteiro | não         | Duração da conversa, em segundos.                                         |
| `iniciada_em`      | string  | não         | Início da ligação em ISO 8601 com fuso (`2026-09-28T10:00:00-03:00`). Se omitido, vale o horário do recebimento. |
| `usuario_email`    | string  | com token do sistema | E-mail da conta no Contador de quem fez a ligação.            |

Exemplo:

```json
{
  "id": "wa-call-3EB0C4F1A2",
  "atendida": true,
  "telefone": "+5511999999999",
  "contato": "Maria Souza",
  "duracao_segundos": 95,
  "iniciada_em": "2026-09-28T10:00:00-03:00",
  "usuario_email": "vendedor@empresa.com"
}
```

## Quando enviar

O mais simples é enviar **uma vez, quando a ligação termina**, já com `atendida` e
`duracao_segundos` definidos.

Também é possível enviar em dois momentos: ao iniciar a chamada (`atendida: false`) e de novo
ao terminar, com o **mesmo `id`**. O envio é idempotente:

- Repetir o mesmo `id` nunca conta a ligação duas vezes.
- Um reenvio com `atendida: true` acrescenta a contagem de atendida.
- Campos omitidos num reenvio mantêm o valor já salvo.
- Não existe "desfazer" por aqui. Um reenvio com `atendida: false` não remove uma atendida já
  registrada.

Registre apenas as ligações que vocês fazem (saída). Ligações recebidas não devem ser enviadas.

## Respostas

| Status | Corpo                                                     | Significado                         |
| ------ | --------------------------------------------------------- | ----------------------------------- |
| 200    | `{"ok": true, "registrada_como": ["feita", "atendida"]}`  | Registrada.                         |
| 400    | `{"erro": "Corpo precisa ser JSON"}`                      | Corpo não é JSON válido.            |
| 401    | `{"erro": "Token inválido"}`                              | Header `x-api-key` ausente ou errado. |
| 422    | `{"erro": "Dados inválidos", "detalhes": [...]}`          | Campo faltando ou no formato errado, ou `usuario_email` sem conta no Contador. |
| 500    | `{"erro": "Falha ao registrar a ligação"}`                | Erro do nosso lado. Pode reenviar.  |

Em caso de 500 ou falha de rede, reenvie com o mesmo `id`. Isso é seguro.

## Exemplos

curl:

```bash
curl -X POST https://glgsvnipytucuazpsggm.supabase.co/functions/v1/registrar-ligacao \
  -H "Content-Type: application/json" \
  -H "x-api-key: $TOKEN" \
  -d '{"id":"wa-call-3EB0C4F1A2","atendida":true,"telefone":"+5511999999999","duracao_segundos":95,"usuario_email":"vendedor@empresa.com"}'
```

JavaScript / TypeScript:

```ts
await fetch('https://glgsvnipytucuazpsggm.supabase.co/functions/v1/registrar-ligacao', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': TOKEN },
  body: JSON.stringify({ id: callId, atendida, telefone, contato, duracao_segundos, iniciada_em, usuario_email }),
})
```

O endpoint aceita CORS, então também pode ser chamado de uma extensão de navegador.
