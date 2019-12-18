# homebridge-nest-cam

Use your Nest Cam as IP camera in HomeKit with [Homebridge](https://github.com/nfarina/homebridge).

## Installation

1. Install ffmpeg
2. Install this plugin using: npm install -g homebridge-nest-cam
3. Edit ``config.json`` and add the camera.
3. Run Homebridge
4. Add extra camera accessories in Home app. The setup code is the same as homebridge.

### Config.json Example

    {
      "platform": "Nest-cam",
      "access_token": "",
      "ffmpegCodec": "libx264"
    }

On Raspberry Pi you might want to use OMX for transcoding as CPU on the board is too slow. In that case, make sure the ffmpeg you installed has `h264_omx` support and set `ffmpegCodec` above to `h264_omx`. There are [pre-compiled deb](https://github.com/legotheboss/homebridge-camera-ffmpeg-omx) online if you don't want to compile one yourself.

On MacOS you might want to use VideoToolbox hardware acceleration for transcoding. In that case, make sure the ffmpeg you installed has `videotoolbox` support and set `ffmpegCodec` to `h264_videotoolbox`.

### How to get an Access Token?

You can get an access token from your Nest account by running the following command in terminal. If your account does not have 2FA enabled, you should be able to see `access_token` in the response.

```
curl -X "POST" "https://home.nest.com/session" \
     -H 'User-Agent: iPhone iPhone OS 11.0 Dropcam/5.14.0 com.nestlabs.jasper.release Darwin' \
     -H 'Content-Type: application/x-www-form-urlencoded; charset=utf-8' \
     --data-urlencode "email=YOUR_NEST_EMAIL" \
     --data-urlencode "password=YOUR_PASSWORD"
```

If your account has 2FA enabled, after running the command above, you should see a `2fa_token` in the response, use that and the code you received from SMS to make the second request. If success, you should see `access_token` in the response.

```
curl -X "POST" "https://home.nest.com/api/0.1/2fa/verify_pin" \
     -H 'User-Agent: iPhone iPhone OS 11.0 Dropcam/5.14.0 com.nestlabs.jasper.release Darwin' \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{"pin": "CODE_FROM_SMS","2fa_token": "TOKEN_FROM_PRIOR_REQUEST"}'
```


### Using a Google Account

Google Accounts (mandatory for new Nest devices after August 2019, with an optional migration for earlier accounts) are now supported. Setting up a Google Account with homebridge-nest is a pain, but only needs to be done once, as long as you don't log out of your Google Account.

Google Accounts are configured using the `"googleAuth"` object in `config.json`, which contains three fields, `"issueToken"`, `"cookies"` and `"apiKey"`, and looks like this:

```
      "googleAuth": {
        "issueToken": "https://accounts.google.com/o/oauth2/iframerpc?action=issueToken...",
        "cookies": "OCAK=TOMPYI3cCPAt...",
        "apiKey": "AIzaS..."
      },
```

The values of `"issueToken"`, `"cookies"` and `"apiKey"` are specific to your Google Account. To get them, follow these steps (only needs to be done once, as long as you stay logged into your Google Account).

1. Open a Chrome browser tab in Incognito Mode (or clear your cache).
2. Open Developer Tools (View/Developer/Developer Tools).
3. Click on 'Network' tab. Make sure 'Preserve Log' is checked.
4. In the 'Filter' box, enter `issueToken`
5. Go to `home.nest.com`, and click 'Sign in with Google'. Log into your account.
6. One network call (beginning with `iframerpc`) will appear in the Dev Tools window. Click on it.
7. In the Headers tab, under General, copy the entire `Request URL` (beginning with `https://accounts.google.com`, ending with `nest.com`). This is your `"issueToken"` in `config.json`.
8. In the 'Filter' box, enter `oauth2/iframe`
9. Several network calls will appear in the Dev Tools window. Click on the last `iframe` call.
10. In the Headers tab, under Request Headers, copy the entire `cookie` (beginning `OCAK=...` - **include the whole string which is several lines long and has many field/value pairs** - do not include the `cookie:` name). This is your `"cookies"` in `config.json`.
11. In the 'Filter' box, enter `issue_jwt`
12. Click on the last `issue_jwt` call.
13. In the Headers tab, under Request Headers, copy the entire `x-goog-api-key` (do not include the `x-goog-api-key:` name). This is your `"apiKey"` in `config.json`.
