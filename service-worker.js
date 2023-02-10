import { getPkce } from "./scripts/pkce.js";
import { getState } from "./scripts/state.js";

(() => {
  "use strict";

  // Update the client ID with the SKY Application ID
  var clientId = "<YOUR_SKY_APPLICATION_ID>";
  // Update the subscription key with the SKY API Subscription Key
  var subscriptionKey = '<YOUR_SKY_API_SUBSCRIPTION_KEY>';
  
  
  var authorizeUrl = "https://app.blackbaud.com/oauth/authorize";
  var tokenUrl = "https://oauth2.sky.blackbaud.com/token";

  /**
   * Provides the current authorization if the access token is valid.
   * Otherwise, starts the authorization process to retrieve a new access token.
   */
  function checkAccessToken() {
    return new Promise((resolve, reject) => {
      getStorageAuth()
        .then((auth) => {
          if (!!auth.access_token) {
            resolve(auth);
          } else {
            getAccessToken().then(resolve).catch(reject);
          }
        })
        .catch(reject);
    });
  }

  function getStorageAuth() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["authorization"]).then((result) => {
        if (!!result.authorization) {
          resolve(JSON.parse(result.authorization));
        } else {
          resolve({});
        }
      });
    });
  }

  /**
   * Starts the authorization flow and retrieves an access token upon success.
   */
  function getAccessToken() {
    return new Promise((resolve, reject) => {
      var url;
      const pkce = getPkce();
      const state = getState();

      url =
        `${authorizeUrl}?client_id=${clientId}&response_type=code&code_challenge_method=S256` +
        `&code_challenge=${
          pkce.challenge
        }&redirect_uri=${chrome.identity.getRedirectURL(
          "oauth2"
        )}&state=${state}`;

      // Starts an authorization flow at the specified URL.
      // - https://developer.chrome.com/apps/identity#method-launchWebAuthFlow
      chrome.identity.launchWebAuthFlow(
        {
          url: url,
          interactive: true,
        },

        // Retrieves the value of the `code` and `state`URL parameter.
        function handleRedirect(authCodeUrl) {
          // Handle any errors encountered.
          if (chrome.runtime.lastError) {
            console.log(
              chrome.runtime.lastError.message +
                " Is your SKY API Application redirect URI set to " +
                chrome.identity.getRedirectURL("oauth2") +
                "?"
            );
            return reject({
              error:
                chrome.runtime.lastError.message +
                " Check the Background Page console for more info.",
            });
          }

          const authCodeFragments = getUrlParams(
            "?" + authCodeUrl.split("?")[1]
          );
          const code = authCodeFragments.code;
          const responseState = authCodeFragments.state;

          if (responseState !== state) {
            reject("State parameter was not valid");
          }

          if (!code) {
            reject("Error getting authorization code");
          }

          fetch(tokenUrl, {
            method: "post",
            body: new URLSearchParams({
              client_id: clientId,
              grant_type: "authorization_code",
              redirect_uri: chrome.identity.getRedirectURL("oauth2"),
              code: code,
              code_verifier: pkce.verifier,
            }),
          })
            .then((response) => response.json())
            .then((body) => {
              if (!body.access_token) {
                reject(body);
              } else {
                chrome.storage.local.set({
                  authorization: JSON.stringify(body),
                });
                resolve(body);
              }
            })
            .catch(reject);
        }
      );
    });
  }

  /**
   * Makes a request to SKY API Constituent Search endpoint:
   *  - https://developer.sky.blackbaud.com/docs/services/56b76470069a0509c8f1c5b3/operations/56b76471069a050520297727
   * The search text parameter's value is set to an email address.
   */
  function getConstituentByEmailAddress(emailAddress) {
    return getStorageAuth().then((auth) => {
      return fetch(
        "https://api.sky.blackbaud.com/constituent/v1/constituents/search?" +
          new URLSearchParams({
            search_text: emailAddress,
          }),
        {
          headers: {
            "bb-api-subscription-key": subscriptionKey,
            Authorization: "Bearer " + auth.access_token,
          },
        }
      ).then((response) => response.json());
    });
  }

  /**
   * Parses URL attributes into a usable object.
   */
  function getUrlParams(str) {
    var params;
    params = {};
    if (!str) {
      return params;
    }
    str.replace(/[?&]+([^=&]+)=([^&]*)/gi, (str, key, value) => {
      params[key] = value;
    });
    return params;
  }

  /**
   * Receives (and returns) messages from the content.js script.
   */
  function messageHandler(request, sender, callback) {
    var emailAddress, parseError;

    parseError = (reason) => {
      if (typeof reason === "string") {
        return callback({
          error: reason,
        });
      }
      console.log("MESSAGE ERROR:", reason);
      try {
        if (!!reason.error) {
          reason = `${reason.error}: ${reason.error_description}`;
        } else {
          reason =
            reason.message ||
            reason.responseJSON.message ||
            JSON.parse(reason.responseText);
        }
      } catch (error) {
        reason =
          "Something bad happened. Please reload the page and try again.";
      }
      return callback({
        error: reason,
      });
    };

    switch (request.type) {
      // this seemed to be needed for the inbox sdk to work
      case "inboxsdk__injectPageWorld":
        chrome.scripting.executeScript({
          target: { tabId: sender?.tab?.id },
          world: "MAIN",
          files: ["pageWorld.js"],
        });
        callback(true);
        break;
      // Make a request to the constituent search API.
      case "apiSearch":
        emailAddress = request.message.emailAddress;
        checkAccessToken()
          .then(() => {
            getConstituentByEmailAddress(emailAddress)
              .then((data) => {
                // The token has expired. Attempt to refresh.
                if (data?.statusCode === 401) {
                  getAccessToken()
                    .then(() => {
                      getConstituentByEmailAddress(emailAddress)
                        .then(callback)
                        .catch(parseError);
                    })
                    .catch(parseError);
                }

                // All is well, return the constituent data.
                else {
                  callback(data);
                }
              })
              .catch(parseError);
          })
          .catch(parseError);
        break;

      // Unrecognized message type.
      default:
        console.log("Unrecognized request to background script.");
        callback({
          error: "Invalid message type.",
        });
        break;
    }

    // Indicate that we wish to send a response message asynchronously.
    // http://developer.chrome.com/extensions/runtime.html#event-onMessage
    return true;
  }

  // clear the authorization if there is one already
  chrome.storage.local.remove("authorization");

  // Allow content.js to communicate with this script.
  chrome.runtime.onMessage.addListener(messageHandler);
})();
