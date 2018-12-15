const axios = require('axios');
const debug = require('debug')('slash-command-template:card');
const qs = require('querystring');
const bodyParser = require('body-parser');

// only post notifications in #integration-sandbox
const debugMode = true;
const debugChannel = '#integration-sandbox';

// create the dialog payload - includes the dialog structure, Slack API token, and trigger ID
const bugDialog = (trigger_id, text) => {
  return {
    token: process.env.SLACK_ACCESS_TOKEN,
    trigger_id,
    dialog: JSON.stringify({
      title: 'Report an issue',
      callback_id: 'submit-card',
      submit_label: 'Submit',
      elements: [
        {
          label: 'Title',
          type: 'text',
          name: 'title',
          value: text,
          hint: 'for questions/ideas, ping @jeff',
        },
        {
          label: 'Area affected',
          type: 'select',
          name: 'category',
          options: [
            { label: 'Web App', value: 'web_app' },
            { label: 'Flow Builder', value: 'crx' },
            { label: 'SDK', value: 'sdk' },
            { label: 'NPS', value: 'nps' },
            { label: 'Mobile', value: 'mobile' },
            { label: 'General UX', value: 'general_ux' },
            { label: 'Other', value: 'other' }
          ],
        },
        {
          label: 'Description',
          type: 'textarea',
          name: 'description',
          placeholder: `Context on the issue. Include Support ticket URL, customers experiencing it, screenshots, links to recordings, etc.`,
        },
        {
          label: 'Steps to reproduce',
          type: 'textarea',
          name: 'description_reproduce',
          optional: true,
          placeholder: `Steps to reproduce`,
        }
      ],
    })
  }
};

const postBugDialog = (trigger_id, text) => {
  return new Promise((resolve, reject) => {
    // open the dialog by calling dialogs.open method and sending the payload
    axios.post('https://slack.com/api/dialog.open', qs.stringify(bugDialog(trigger_id, text)))
      .then((result) => {
        debug('dialog.open: %o', result.data);
        resolve(result);
      }).catch((err) => {
        debug('dialog.open call failed: %o', err);
        reject(err);
      });
  });
};


// send slack confirmation of story being created
const confirmationChannel = '#bugs'
const sendConfirmation = (story) => {
  axios.post('https://slack.com/api/chat.postMessage', qs.stringify({
    token: process.env.SLACK_ACCESS_TOKEN,
    channel: debugMode ? debugChannel : confirmationChannel,
    text: `new issue in the *${story.category}* from <@${story.userId}>`,
    attachments: JSON.stringify([
      {
        title: story.name,
        title_link: story.url,
        text: story.text,
        fields: [
          {
            value: story.description || 'None provided',
          },
        ],
      },
      {            
        "fallback": "You are unable to party.",
        "callback_id": `red_alert_${story.id}`,
        "color": "#F35A00",
        "attachment_type": "default",
        "actions": [
          {
            "name": "yes",
            "text": "Red Alert!",
            "style": "danger",
            "type": "button",
            "value": "true",
            "confirm": {
                "title": "Confirm the Red Alert",
                "text": "This will alert the team responsible. A guide to Red Alerts: https://bit.ly/2UNx7bS",
                "ok_text": "Yes, shields up!",
                "dismiss_text": "Nope, just kidding."
            }
          }
        ]
      }
    ]),
  })).then((result) => {
    debug('sendConfirmation: %o', result.data);
  }).catch((err) => {
    debug('sendConfirmation error: %o', err);
    console.error(err);
  });
};

const sendRedAlertNotification = (user, notificationChannel, story) => {
  axios.post('https://slack.com/api/chat.postMessage', qs.stringify({
    token: process.env.SLACK_ACCESS_TOKEN,
    channel: debugMode ? debugChannel : notificationChannel,
    text: `a new red alert has been raised in the *${story.category}* by <@${user.id}>`,
    attachments: JSON.stringify([
      {
        title: story.name,
        title_link: story.url,
        text: story.text
      }
    ])
  })).then((result) => {
    console.log("Red Alert has been sent!");
    debug('sendConfirmation: %o', result.data);
  }).catch((err) => {
    debug('sendConfirmation error: %o', err);
    console.error(err);
  });
};

module.exports = { postBugDialog, sendConfirmation, sendRedAlertNotification };