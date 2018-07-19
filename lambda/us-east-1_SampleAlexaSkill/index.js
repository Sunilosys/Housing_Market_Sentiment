/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * App ID for the skill
 */
var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var http = require('http'),
    alexaDateUtil = require('./alexaDateUtil');

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var HousingMento = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
HousingMento.prototype = Object.create(AlexaSkill.prototype);
HousingMento.prototype.constructor = HousingMento;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

HousingMento.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

HousingMento.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

HousingMento.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

/**
 * override intentHandlers to map intent handling functions.
 */
HousingMento.prototype.intentHandlers = {
    "OneshotHMIntent": function (intent, session, response) {
        handleOneshotHMRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {

        var speechOutput = {
            speech: "<speak><p>Thank you Ellie Mae Hackers, If you like me, my voice and my super awesome team Jack in the box <break time='2s'/> oh sorry I meant Hack in the box, please vote for us.</p><p>Goodbye</p></speak>",
            type: AlexaSkill.speechOutputType.SSML
        };
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye,Have a good time.";
        response.tell(speechOutput);
    }
};


function handleWelcomeRequest(response) {
    var whatDoYouLikeToKnowPrompt = "<p>What do you like to know?</p>",
        speechOutput = {
            speech: "<speak><p>Welcome to Housimento</p><p>Thank you for getting us in the finals of Ellie Mae Hackathon 2016</p><p>I could provide you the housing market sentiment from the social media.</p>"
                 + whatDoYouLikeToKnowPrompt 
                + "</speak>",
              
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech: "<p>I could provide you the housing market sentiment for past 10 days "
                + "or today.</p> "
                + "you can ask what is the housing market sentiment for past 10 days or today.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.ask(speechOutput, repromptOutput);
}

function handleHelpRequest(response) {
    var repromptText =  "<p>What do you like to know?</p>";
    var speechOutput = {
                speech : "<speak><p>I could provide you the housing market sentiment for past 10 days "
                + "or today.</p> "
                + "<p>you can ask what is the housing market sentiment for past 10 days or today.</p></speak>",
                type:AlexaSkill.speechOutputType.SSML
    }

    response.ask(speechOutput,repromptText);
}


function handleOneshotHMRequest(intent, session, response) {

    getFinalHMResponse(response);
}

/**
 * Both the one-shot and dialog based paths lead to this method to issue the request, and
 * respond to the user with the final answer.
 */
function getFinalHMResponse(response) {

    // Issue the request, and respond to the user
    makeHMRequest(function HMResponseCallback(err, HMResponse) {
        var speechOutput;

        if (err) {
            speechOutput = {
                speech : "<speak>Sorry, the housimento service is experiencing a problem. Please try again later</speak>",
                type:AlexaSkill.speechOutputType.SSML
                }
            
        } else {
             speechOutput = {
                speech : "<speak>" + HMResponse + "<break time='2s'/><p>Thank you Ellie Mae Hackers, If you like me, my voice and my super awesome team Jack in the box <break time='1s'/> oh sorry I meant Hack in the box, please vote for us</p><p>Goodbye</p></speak>",
                type:AlexaSkill.speechOutputType.SSML
                }
        }

        response.tell(speechOutput);
    });
}



function makeHMRequest(HMResponseCallback) {

    var endpoint = 'http://housimento.io/data';
    
    http.get(endpoint, function (res) {
        var hmResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            HMResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            hmResponseString += data;
        });

        res.on('end', function () {
           HMResponseCallback(null, hmResponseString);
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        HMResponseCallback(new Error(e.message));
    });
}



// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var housingMento = new HousingMento();
    housingMento.execute(event, context);
};

