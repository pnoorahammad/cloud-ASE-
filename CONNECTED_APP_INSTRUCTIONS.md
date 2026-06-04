# Salesforce Connected App Setup

1. In Salesforce setup, create a new Connected App.
2. Set the Callback URL to `http://localhost:5000/auth/callback` for local testing (backend handles OAuth).
3. Enable OAuth and select scopes: `api`, `refresh_token`, `full`, `openid`.
4. Save the Consumer Key and Consumer Secret to the backend environment variables: `SF_CLIENT_ID` and `SF_CLIENT_SECRET`.

For production, update the `SF_REDIRECT_URI` to your deployed frontend callback endpoint and set `SF_LOGIN_URL` to `https://login.salesforce.com` (or test.salesforce.com for sandboxes).
