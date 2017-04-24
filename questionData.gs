var cache = CacheService.getScriptCache();

function cacheKey(key) {
  return 'v5/'+key;
}

function getCache(key) {
  var cached = cache.get(cacheKey(key));
  if (cached) {
    return JSON.parse(cached);
  }
  
  return null;
}

// cache is valid for at least one hour.
// then, is randomized to expire at some point in the next week.
function setCache(key, val) {
  var one_hour = 60 * 60;
  var rand = Math.random() * 167 * one_hour; // 167 is 6 days of 24 and 1 day of 23
  var expiration = one_hour + rand;
  cache.put(cacheKey(key), JSON.stringify(val), expiration);
}

function fetchQuestion(questionId) {
  var url = 'https://api.stackexchange.com/2.2/questions/' + questionId + '?order=desc&sort=activity&site=stackoverflow&filter=withbody';
  var response = fetch(url);
  return response.items[0];
}

function fetchAnswers(questionId) {
  var url = 'https://api.stackexchange.com/2.2/questions/' + questionId + '/answers?order=desc&sort=activity&site=stackoverflow&filter=withbody';
  var response = fetch(url);
  return response.items;
}

function fetch(url, option) {
  if (!option) { option = {}; }
  var cached = getCache(url);

  if (cached != null) {
    return cached;
  }

  var response = UrlFetchApp.fetch(url, option).getContentText();
  var parsedResponse = JSON.parse(response);    
  setCache(url, parsedResponse);
  return parsedResponse;
}

function getQuestionId(link) {
  if (link) {
    return link.split('stackoverflow.com/').pop().split('/')[1];
  }

  return '';
}

function getQuestionData(link, key) {
  var questionId = getQuestionId(link);
  if (questionId) {
    var question = fetchQuestion(questionId);
    return question[key];
  }

  return '';
}

function getTitle(link) {
  return getQuestionData(link, 'title');
}

function getBody(link) {
  return getQuestionData(link, 'body');
}

function getViews(link) {
  return getQuestionData(link, 'view_count');
}

function getAnswers(link) {
  return getQuestionData(link, 'answer_count');
}

function getIsAnswered(link) {
  return getQuestionData(link, 'is_answered');
}

function getScore(link) {
  return getQuestionData(link, 'score');
}

function getDate(link, key) {
  var response = getQuestionData(link, key);
  if (response ) {
    return new Date(response * 1000);
  } else {
    return '';
  }
}

function getLastActivityDate(link) {
  return getDate(link, 'last_activity_date');
}

function getCreationDate(link) {
  return getDate(link, 'creation_date');
}

function getLongestAnswer(link) {
  var questionId = getQuestionId(link);
  if (questionId) {
    var answers = fetchAnswers(questionId);
    if (answers) {

      return answers.reduce(function(longestAnswer, answer) {
        if (!longestAnswer.body) { return answer; }
        if (answer.body.length > longestAnswer.body.length) {
          return answer;
        }
        
        return longestAnswer;
      }, { });
    }
  }
  
  return null;
}

function getLongestAnswerData(link, key) {
  var answer = getLongestAnswer(link);
  if (answer) {
    return answer[key];
  }
  
  return '';
}

function getLongestAnswerCharacters(link) {
  return getLongestAnswerData(link, 'body').length;
}

function getTopAnswerScore(link) {
  var questionId = getQuestionId(link);
  if (questionId) {
   var answers = fetchAnswers(questionId);
   if (answers) {
     var topAnswer = answers.reduce(function(upvotedAnswer, answer) {

       if (!upvotedAnswer.score) { return answer; }
        if (answer.score > upvotedAnswer.score) {
          return answer;
        }
        
        return upvotedAnswer;
     }, {  });
     return topAnswer.score;
   }
  }
  return '';
}

function testIt() {
  var link = 'http://stackoverflow.com/questions/29313244/how-to-auto-slide-the-window-out-from-behind-keyboard-when-textinput-has-focus';
  var response = getTopAnswerScore(link);
 
}
