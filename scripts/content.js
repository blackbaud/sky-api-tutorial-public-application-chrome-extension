import * as InboxSDK from "@inboxsdk/core";

(() => {
  "use strict";

  // Update with your Inbox SDK Application ID
  var inboxSdkAppId = '<YOUR_InboxSdk_App_ID>';


  var constituentUrl = 'https://host.nxt.blackbaud.com/constituent/records/';

  function getConstituentByEmailAddress(emailAddress) {
    return new Promise((resolve, reject) => {
      sendMessage("apiSearch", {
        emailAddress: emailAddress,
      })
        .then(resolve)
        .catch(reject);
    });
  }

  function init(sdk) {

    // When the user begins writing a new email...
    sdk.Compose.registerComposeViewHandler((composeView) => {
      // a compose view has come into existence, do something with it!
      composeView.addButton({
        title: "Constituent Information",
        iconUrl: chrome.runtime.getURL("bbicon.png"),
        onClick: (event) => {
          var recipients;
          recipients = event.composeView.getToRecipients();

          if (!recipients.length) {
            sdk.ButterBar.showMessage({
              text: "Please enter a valid email address.",
            });
            return;
          }

          sdk.ButterBar.showMessage({
            text: "Attempting to match recipients to constituent records. Please wait...",
          });

          // For each email address in the <TO> field...
          recipients?.forEach((contact) => {
            // Attempt to match the email address with a SKY API constituent record.
            getConstituentByEmailAddress(contact.emailAddress)
              .then((data) => {

                // Something bad happened with the API.
                if (!!data?.error) {
                  sdk.ButterBar.showError({
                    text: data.error
                  });
                  return;
                }

                // The request to the API was valid, but didn't return any records.
                if (!data || !data.count || data.count === 0) {
                  sdk.ButterBar.showMessage({
                    text: "The recipient email addresses did not match any constituent records.",
                  });
                  return;
                }

                sdk.ButterBar.showMessage({
                  text: `${data.count} constituent record(s) found!`,
                });

                // Create a mole view displaying the constituent's information.
                data?.value?.forEach((constituent) => {
                  var element, header, list, strong, term, definition, link;
                  element = document.createElement("p");
                  element.setAttribute('style', 'padding: 10px;');
                  
                  header = document.createElement("h2");
                  header.innerText = 'Constituent Info';
                  element.appendChild(header);

                  list = document.createElement("dl");
                  
                  for (const property in constituent) {
                    strong = document.createElement("strong");
                    term = document.createElement("dt");
                    term.innerText = property;
                    strong.appendChild(term);

                    definition = document.createElement("dd");
                    definition.innerText = constituent[property];

                    list.appendChild(strong);
                    list.appendChild(definition);
                  }
                  
                  element.appendChild(list);

                  link = document.createElement("a");
                  link.setAttribute('href', `${constituentUrl}${constituent.id}`);
                  link.setAttribute('target', '_blank');
                  link.innerText = 'View constituent record >';

                  element.appendChild(link);

                  sdk.Widgets.showMoleView({
                    el: element,
                    chrome: true,
                    title: constituent.name,
                  });
                });
              })
              .catch((reason) => {
                sdk.ButterBar.showMessage({
                  text: reason,
                });
              });
          });
        },
      });
    });
  }

  // This method communicates with the background script.
  function sendMessage(type, message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: type,
          message: message,
        },
        resolve
      );
    });
  }

  // Load dependencies and initialize the extension.
  window.onload = () => {
    InboxSDK.load(2, inboxSdkAppId).then(init);
  };
})();
