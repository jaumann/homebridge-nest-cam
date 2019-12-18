const Promise = require('bluebird');
const rp = require('request-promise');

module.exports = GoogleAuth;

// Timeout other API calls after this number of seconds
const API_TIMEOUT_SECONDS = 40;

// We want to look like a browser
const USER_AGENT_STRING = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36';

function GoogleAuth(config, log) {
    this.config = config;
    this.log = log;
    this.accessToken = '';
}

GoogleAuth.prototype.auth = function() {
    return new Promise(resolve => {
        Promise.coroutine(function* () {
            let req, body;

            this.connected = false;
            this.token = null;
            let issueToken = this.config.googleAuth.issueToken;
            let cookies = this.config.googleAuth.cookies;

            this.log('Authenticating via Google.');
            req = {
                method: 'GET',
                followAllRedirects: true,
                timeout: API_TIMEOUT_SECONDS * 1000,
                uri: issueToken,
                headers: {
                    'Sec-Fetch-Mode': 'cors',
                    'User-Agent': USER_AGENT_STRING,
                    'X-Requested-With': 'XmlHttpRequest',
                    'Referer': 'https://accounts.google.com/o/oauth2/iframe',
                    'cookie': cookies
                },
                json: true
            };
            let result = yield rp(req);
            let googleAccessToken = result.access_token;
            req = {
                method: 'POST',
                followAllRedirects: true,
                timeout: API_TIMEOUT_SECONDS * 1000,
                uri: 'https://nestauthproxyservice-pa.googleapis.com/v1/issue_jwt',
                body: {
                    embed_google_oauth_access_token: true,
                    expire_after: '3600s',
                    google_oauth_access_token: googleAccessToken,
                    policy_id: 'authproxy-oauth-policy'
                },
                headers: {
                    'Authorization': 'Bearer ' + googleAccessToken,
                    'User-Agent': USER_AGENT_STRING,
                    'x-goog-api-key': this.config.googleAuth.apiKey,
                    'Referer': 'https://home.nest.com'
                },
                json: true
            };
            result = yield rp(req);
            this.accessToken = result.jwt;
        }).call(this);
    });
};
