import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    concurrency_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
    },
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  const userId = `user-${__VU}`;
  const corpCode = '00126380';
  const corpName = '삼성전자';
  const stockCode = '005930';

  const payload = JSON.stringify({
    corpCode,
    corpName,
    stockCode,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
  };

  const res = http.post(`${BASE_URL}/companies`, payload, params);

  check(res, {
    'status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'status is not 5xx': (r) => r.status < 500,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (res.status >= 500) {
    console.log(`ERROR ${res.status}: ${res.body}`);
  }

  sleep(0.1);
}
