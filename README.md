# Slack dialog --> Trello card & Clubhouse story

🎏 Remixed from [https://glitch.com/~slack-slash-command-and-dialogs-blueprint](https://glitch.com/~slack-slash-command-and-dialogs-blueprint)

## What's this app now?

This is a Slack app that creates Trello cards and Clubhouse stories from dialog submissions in Slack. Specifically, here's what it does:

* Displays a [dialog](https://api.slack.com/dialogs) when a person in your Slack organization enters a particular [slash command](https://api.slack.com/slash-commands).
* Takes the data submitted to that dialog, and [creates a Trello card](https://trello.readme.io/v1.0/reference#cards-2) with it.
* Takes the data submitted to that dialog, and creates a Clubhouse story with it.

But you can use it for _anything_ – so long as that thing involves displaying a dialog in Slack, and creating Clubhouse stories from it.

## Remixing Instructions

### 1. Remix this app in Glitch

Click the Remix button here in Glitch to make a copy of this app. If you can edit this text, you've already remixed it!

### 2. Create a new app in your Slack organization at [https://api.slack.com/apps](https://api.slack.com/apps).

* Navigate to the OAuth & Permissions page and add the following scopes:
  * `commands`
  * `users:read`
  * `users:read:email`
  * `chat:write:bot`
* Click 'Save Changes' and install the app

### 3. Enable your app's Slack /slash-command

On your app's page in Slack (listed [here](https://api.slack.com/apps]))...

1. Slick on Slash Commands.
2. Click the 'Create New Command' button and fill in the following:
  * Command: `/your-desired-slash-command`
  * Request URL: Your Glitch project URL + `/commands`
  * Short description: What's your app going to do?
  * Usage hint: a hint to show when people type `/your-slash-command` in Slack.

### 4. Configure your app's Slack dialog

1. In your Slack app's settings, click on Interactive Components.
2. Set the Request URL to your Glitch project URL + `/interactive-component`

### 5. Set your environment variables

Open `.env` in the file tree on the left (here in Glitch). Follow the instructions in the comments there and set your environment variables (AKA secret stuff to connect this app to your Slack app and Trello account). Come back here after filling those in.

### 6. Set up your Trello board and list

1. Create a board on Trello
2. Create a list on that board.
3. See the comments in `src/trello.js` to finish setting up the Trello end of things.

---

Once that's done, you should be able to type `/your-slash-command` in Slack, submit some info, and see that a Trello card gets created! 🎉

If you have any trouble, [ask for help in Glitch](https://medium.com/glitch/just-raise-your-hand-how-glitch-helps-aa6564cb1685) or [tweet at @mrdavidjcole](https://twitter.com/mrdavidjcole).