# session-handler

:boom: [ESM] The session handler for Node.js according to rfc6265

---

![npm](https://img.shields.io/david/awesomeorganization/session-handler)
![npm](https://img.shields.io/npm/v/@awesomeorganization/session-handler)
![npm](https://img.shields.io/npm/dt/@awesomeorganization/session-handler)
![npm](https://img.shields.io/npm/l/@awesomeorganization/session-handler)
![npm](https://img.shields.io/bundlephobia/minzip/@awesomeorganization/session-handler)
![npm](https://img.shields.io/bundlephobia/min/@awesomeorganization/session-handler)

---

## Example

Full example in `/example` folder.

```
import { http } from '@awesomeorganization/servers'
import { sessionHandler } from '@awesomeorganization/session-handler'

const example = async () => {
  const sessionMiddleware = await sessionHandler()
  http({
    listenOptions: {
      host: '127.0.0.1',
      port: 3000,
    },
    async onRequest(request, response) {
      const { sessionId, storage } = await sessionMiddleware.handle({
        request,
        response,
      })
      const counter = storage.get('counter') ?? 0
      storage.set('counter', counter + 1)
      response.end(`Hi ${sessionId}! you have visited this page ${counter} times`)
    },
  })
  // TRY
  // http://127.0.0.1:3000/
}

example()
```
