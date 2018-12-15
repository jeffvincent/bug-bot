require('dotenv').config();

const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const qs = require('querystring');
const trello = require('./trello');
const clubhouse = require('./clubhouse');
const debug = require('debug')('slash-command-template:index');
const slack = require('./slack');

const app = express();

/*
 * Parse application/x-www-form-urlencoded && application/json
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('<h2>The Slash Command and Dialog app is running</h2> <p>Follow the' +
  ' instructions in the README to configure the Slack App and your environment variables.</p>');
});

/*
 * Endpoint to receive /helpdesk slash command from Slack.
 * Checks verification token and opens a dialog to capture more info.
 */
app.post('/commands', (req, res) => {
  
  // extract the verification token, slash command text,
  // and trigger ID from payload
  const { token, text, trigger_id } = req.body;

  // check that the verification token matches expected value
  if (token === process.env.SLACK_VERIFICATION_TOKEN) {
    
    slack.postBugDialog(trigger_id, text)
    .then((result) => {
      res.send('');
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });

  } else {
    debug('Verification token mismatch');
    res.sendStatus(500);
  }
});

/*
 * Endpoint to receive the dialog submission.
 */
app.post('/interactive-component', (req, res) => {
  const body = JSON.parse(req.body.payload);

  // check that the verification token matches expected value
  if (body.token === process.env.SLACK_VERIFICATION_TOKEN) {
    
    // immediately respond with a empty 200 response to let
    // Slack know the command was received
    res.send('');
    
    if (body.type === "message_action") {
      // this was a message action, we still need to open the dialog
      
      const trigger_id = body.trigger_id;
      const text = body.message.text;
      
      slack.postBugDialog(trigger_id, text)
        .then((result) => {
          res.send('');
        })
        .catch((err) => {
          console.log(err);
          res.sendStatus(500);
        });
      
    } else if (body.type === "interactive_message") {
      // this was a button click, we need to take care of it
      console.log("interactive message body:", body);
      
      if (body.actions[0].value != 'true') {
        return true;
      };
      
      const { user, callback_id } = body;
      
      const issueId = callback_id.replace('red_alert_', '');
      
      clubhouse.addRedAlertTo(issueId).then((result) => {
        const { story, notificationChannel } = result;
        slack.sendRedAlertNotification(user, story, notificationChannel);
      }).catch((err) => console.log(err));
      
      return true;
    } else {
      // this is a dialog submission, just create the Trello card.
      debug(`Form submission received: ${body.submission.trigger_id}`);
      //trello.createCard(body.user.id, body.submission);
      clubhouse.createStory(body.user.id, body.submission);
    }
  } else {
    debug('Token mismatch');
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}!`);
});