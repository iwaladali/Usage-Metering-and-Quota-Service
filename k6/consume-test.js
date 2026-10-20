
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    consume_test: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 10000,
      maxDuration: '5m',
    },
  },
};

export default function () {
  const response = http.post(
    'http://localhost:8080/api/usage/consume', // عدّل المسار حسب route عندك
    JSON.stringify({
      externalUserId: 'demo-user-1',
      units: 1,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${__ENV.API_KEY}`,
        'Idempotency-Key': `k6-${__VU}-${__ITER}`,
      },
    },
  );
  console.log(`Status: ${response.status}`);
  console.log(`Body: ${response.body}`);
  check(response, {
    'consume accepted': (r) => r.status === 200,
  });
}
