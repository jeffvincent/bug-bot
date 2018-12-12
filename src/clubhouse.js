const axios = require('axios');
const debug = require('debug')('slash-command-template:card');
const qs = require('querystring');
const users = require('./users');
const Clubhouse = require('clubhouse-lib');
      
const clubhouse = Clubhouse.create(process.env.CLUBHOUSE_API_TOKEN);

const labels = {
  web_app: { external_id: '178', name: 'web-app' },
  crx: { external_id: '32', name: 'crx' },
  sdk: { external_id: '523', name: 'sdk' },
  mobile: { external_id: '181', name: 'mobile-sdk' },
  nps: { external_id: '524', name: 'nps' },
  other: '',
  general_ux: ''
};

//
//  Send card creation confirmation via
//  chat.postMessage to the user who created it
//
const sendConfirmation = (story) => {

  const confirmationChannel = '#bugs';
  
  axios.post('https://slack.com/api/chat.postMessage', qs.stringify({
    token: process.env.SLACK_ACCESS_TOKEN,
    channel: confirmationChannel,
    text: `new issue in the *${story.category}* from <@${story.userId}>: ${story.name}`,
    attachments: JSON.stringify([
      {
        title: story.name,
        title_link: story.url,
        text: story.text,
        fields: [
          {
            title: 'Description',
            value: story.description || 'None provided',
          },
        ],
      },
    ]),
  })).then((result) => {
    debug('sendConfirmation: %o', result.data);
  }).catch((err) => {
    debug('sendConfirmation error: %o', err);
    console.error(err);
  });
};

//const fetchTrelloMemberId = new Promise((resolve, reject) => {
//  trelloApi.get('/organization/appcues/members').then((response) => {
//    console.log('userRealName is set as: ', userRealName);
//    let member = response.data.filter(m => m.fullName === userRealName);
//    console.log('member is: ', member[0]);
//    resolve(member && member[0] && member[0].id);
//  }).catch((err) => { reject(err); });
//});

// get Slack username
const fetchUserName = (userId) => {
  return new Promise((resolve, reject) => {
    users.find(userId).then((result) => {
      console.log(`Find user: ${userId}`);
      resolve({ name: result.data.user.profile.real_name_normalized, email: result.data.user.profile.email });
    }).catch((err) => { reject(err); });
  });
};

const fetchClubhouseUserId = (userEmail) => {
  return new Promise((resolve, reject) => {
    clubhouse.listMembers().then((members) => {
      console.log("userEmail: ", userEmail);
      let member = members.filter(m => m.profile.email_address === userEmail);
      console.log('member: ', member[0]);
      resolve(member && member[0] && member[0].id);
    }).catch((err) => { reject(err); });
  });
};

// Create Clubhouse story
const createStory = (userId, submission) => {
  const story = {};
  
  console.log("submission: ", submission);
  
  story.name = submission.title;
  story.projectId = process.env.CLUBHOUSE_BUGS_PROJECT_ID;
  story.story_type = 'bug';
  story.category = submission.category;
  story.labels = [];
  story.labels.push(labels[submission.category]);
  
  // used for confirmation
  story.userId = userId;

  fetchUserName(userId).then((result) => {
    console.log('result: ', result);
    const userName = result.name;
    const userEmail = result.email;
    
    // set the full description body (now that we have userName)
    story.description = `${submission.description}\n\n---\n Steps to Reproduce \n ${submission.description_reproduce}\n\n---\n Submitted by ${userName}`;
    
    return fetchClubhouseUserId(userEmail);
  }).then((result) => {
    console.log('fetch clubhouse user id result: ', result);
    
    // set the requested by ID 
    story.requested_by_id = result;
    
    // send story data to clubhouse
    clubhouse.createStory({
      name: story.name,
      project_id: story.projectId,
      requested_by_id: story.requested_by_id,
      description: story.description,
      story_type: story.story_type,
      labels: story.labels
    })
    .then((response) => {
      story.id = response.id;
      story.url = `https://app.clubhouse.io/appcues/story/${story.id}`;
      sendConfirmation(story);
    })
    .catch(function (error) {
      console.log(error);
    });

    return story;
  }).catch((err) => { console.error(err); });
};

module.exports = { createStory, sendConfirmation };
