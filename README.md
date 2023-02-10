# sky-api-tutorial-public-application-chrome-extension

## Overview
This tutorial demonstrates the interaction of a client application (Google Chrome extension) with the SKY API authorization service, using the [authorization code flow](https://tools.ietf.org/html/rfc6749#section-1.3.2) with Proof Key for Code Exchange (PKCE) to avoid the need to pass a client secret.

## Installing Locally

### Basic Requirements:

- Familiarity with git commands
- The latest, stable version of [Git](https://git-scm.com/)
- The [Chrome Browser](https://www.google.com/chrome/browser/desktop/) installed on your desktop
- A Google Inbox SDK App ID ([free registration](https://www.inboxsdk.com/register))

### Sky API Requirements:

- **A Blackbaud Developer Subscription Key**
    - If you have not already done so, be sure to complete the [Getting started guide](https://apidocs.sky.blackbaud.com/docs/getting-started/). This will guide you through the process of registering for a Blackbaud developer account and requesting a subscription to an API product.
    - Once approved, your subscription will contain a **Primary Key** and a **Secondary Key**.  You can use either key as the subscription key value for the `bb-api-subscription-key` request header when making calls to the API.
    - You can view your subscription keys on your [Blackbaud Developer Profile](https://developer.sky.blackbaud.com/developer).
- **A Blackbaud Developer Application ID**
    - [Register your application](https://developerapp.sky.blackbaud.com/applications) in order to obtain the **Application ID** (client ID).


### Step 1 — Clone the files
- Open Terminal/Command Prompt and type:
```
$  git clone https://github.com/blackbaud/sky-api-tutorial-public-application-chrome-extension
```

### Step 2 — Update files
- Update `service-worker.js` variables.

| Variable | Update |
| --- | --- |
| `subscriptionKey` | Your [SKY API (Blackbaud) developer subscription key](https://developer.sky.blackbaud.com/developer) (primary or secondary) |
| `clientId` | Your SKY API registered application's [Application ID](https://developerapp.sky.blackbaud.com/applications) |

- Update `scripts/content.js` variable.

| Variable | Update |
| --- | --- |
| `inboxSdkAppId` | Your Google Inbox SDK App ID ([free registration](https://www.inboxsdk.com/register)). |

### Step 3 — Install the extension
- From the root folder, run `npm install` to install the needed packages.
- From the root folder, run `npm start` to pack the application and create the `dist` folder
- Open Google Chrome on your desktop.
- Visit [chrome://extensions](chrome://extensions).
- Make sure **Developer Mode** is checked in the top-right corner of the page.
- Click **Load unpacked extension** and choose the `extension` directory `dist` folder.
- **IMPORTANT:** Make note of the `ID` field beneath the new extension's title on your list of installed extensions (you'll need the Extension ID for the next step).
- Add a Redirect URI to your [registered application](https://developer.blackbaud.com/apps/)'s Redirect URIs, following this format:<br>
  <ul>
    <li>The redirect URI follows the pattern `https://<extension-id>.chromiumapp.org/oauth2`.</li>
    <li>The `<extension-id>` represents the unique ID that is automatically generated when the Chrome extension is uploaded to Google's servers.</li>
    <li>When developing locally, Chrome generates a random ID automatically when you load it as an "unpacked extension".</li>
    <li>The ID can be found by visiting [chrome://extensions](chrome://extensions) in your Chrome browser; look for the `ID` label beneath the extension's listing.</li>
  </ul>

### Step 4 — Test the extension
- Visit [Gmail](http://mail.google.com/) using Google Chrome.
- Click **Compose** to start writing a new email.
- In the "To:" field, add any email address associated with a [constituent record](https://renxt.blackbaud.com/lists/constituents) Eg: rhernandez@net.com.
- Click the green "b" icon next to **Send**. This will begin the authorization code flow.
- After successfully authorizing the Chrome extension, a new fly-up should appear at the bottom of the screen, containing the constituent data that matches the email address provided.
