const axios = require('axios');
const debug = require('debug')('slash-command-template:card');
const qs = require('querystring');
const users = require('./users');
const slack = require('./slack');
const ClubhouseApi = require('clubhouse-lib');      
const clubhouse = ClubhouseApi.create(process.env.CLUBHOUSE_API_TOKEN);

// categories that map between submission options and teams
const categories = {
  web_app: { 
    label: {external_id: '178', name: 'web-app' },
    channel: '#team-web-app'
  },
  crx: {
    label: { external_id: '32', name: 'crx' },
    channel: '#team-flow-builder'
  },
  sdk: {
    label: { external_id: '523', name: 'sdk' },
    channel: '#team-web-app',
  },
  mobile: {
    label: { external_id: '181', name: 'mobile-sdk' },
    channel: '#team-mobile'
  },
  nps: {
    label: { external_id: '524', name: 'nps' },
    channel: '#team-nps'
  },
  platform: {
    label: { external_id: '528', name: 'platform' },
    channel: '#team-platform'
  },
  red_alert: {
    label: { external_id: '538', name: 'Red Alert' }
  }
};

// get name and email from slack
const fetchUserName = (userId) => {
  return new Promise((resolve, reject) => {
    users.find(userId).then((result) => {
      resolve({ name: result.data.user.profile.real_name_normalized, email: result.data.user.profile.email });
    }).catch((err) => { reject(err); });
  });
};

// get clubhouse user id
const fetchClubhouseUserId = (userEmail) => {
  return new Promise((resolve, reject) => {
    clubhouse.listMembers().then((members) => {
      let member = members.filter(m => m.profile.email_address === userEmail);
      resolve(member && member[0] && member[0].id);
    }).catch((err) => { reject(err); });
  });
};

// get clubhouse story
const fetchStory = (storyId) => {
  return new Promise((resolve, reject) => {
    clubhouse.getStory(storyId).then((story) => {
      resolve(story);
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
  story.labels.push(categories[submission.category].label);
  
  // used for confirmation
  story.userId = userId;

  fetchUserName(userId).then((result) => {
    const userName = result.name;
    const userEmail = result.email;
    
    // set the full description body (now that we have userName)
    story.description = `${submission.description}\n\n---\n Steps to Reproduce \n ${submission.description_reproduce}`;
    
    return fetchClubhouseUserId(userEmail);
  }).then((result) => {
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
      story.description = story.description + `\n\n issue #${story.id}\n slack channel #_clubhouse_${story.id}`;
      slack.sendConfirmation(story);
    })
    .catch(function (error) {
      console.log(error);
    });

    return story;
  }).catch((err) => { console.error(err); });
};

const addLabel = (storyId, label) => {
  return new Promise((resolve, reject) => {
    const story = {};
    fetchStory(storyId).then((story) => {
      story = story;
      let notificationChannel = {};

      let issueLabels = [];
      story.labels.map((label) => {
        let categoryName = label.name.replace(/ /g, '_');
        issueLabels.push(categories[categoryName].label);
        
        // TODO this is super lame
        notificationChannel = categories[categoryName].channel;
      });

      issueLabels.push(label);

      clubhouse.updateStory(storyId, {
        labels: issueLabels
      }).then((result) => {
        resolve({story, notificationChannel});
      })
    }).catch((err) => reject(err));
  });
};

// specifically for red alerts
const addRedAlertTo = (storyId) => {
  return new Promise((resolve, reject) => {
    addLabel(storyId, categories.red_alert.label).then((story) => {
      resolve(story);
    }).catch((err) => reject(err));
  })
};

module.exports = { createStory, addLabel, addRedAlertTo };
