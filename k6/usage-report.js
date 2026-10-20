
import http from "k6/http";
import { check } from "k6";


export const options = {
  scenarios: {
    usage_report_test: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 10000,
      maxDuration: '5m',
    },
  },
};


export default function () {
  const baseUrl = __ENV.BASE_URL || "http://localhost:8080";
  const apiKey = __ENV.API_KEY ;

  if (!apiKey) {
    throw new Error("API_KEY environment variable is required");
  }

  const response = http.get(`${baseUrl}/api/usage/account`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
    // console.log(`Status: ${response.status}`);
    // console.log(`Body: ${response.body}`);
  check(response, {
    "status is 200": (r) => r.status === 200,
    "response contains usage": (r) => {
      try {
        return r.json("usage") !== undefined;
      } catch {
        return false;
      }
    },
  });
}
