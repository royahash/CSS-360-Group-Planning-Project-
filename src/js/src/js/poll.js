function createPoll() {
  return {
    dates: [],
    times: [],
    locations: [],
    activities: []
  };
}

function addPollOption(poll, category, name) {
  if (!poll[category]) return false;

  poll[category].push({
    name,
    votes: []
  });

  return true;
}

function voteForOption(poll, category, name, user) {
  const option = poll[category]?.find(item => item.name === name);
  if (!option || option.votes.includes(user)) return false;

  option.votes.push(user);
  return true;
}

function removeVote(poll, category, name, user) {
  const option = poll[category]?.find(item => item.name === name);
  if (!option || !option.votes.includes(user)) return false;

  option.votes = option.votes.filter(vote => vote !== user);
  return true;
}

function getPollResults(poll, category, name) {
  const option = poll[category]?.find(item => item.name === name);
  return option ? option.votes.length : 0;
}

function hasUserVoted(poll, category, name, user) {
  const option = poll[category]?.find(item => item.name === name);
  return option ? option.votes.includes(user) : false;
}

module.exports = {
  createPoll,
  addPollOption,
  voteForOption,
  removeVote,
  getPollResults,
  hasUserVoted
};
