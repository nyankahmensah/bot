require('dotenv').config();
const router = require('express').Router();
const request = require('request');
const axios = require('axios');
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN
const NEWS_API = process.env.NEWS_API

router.post('/', (req, res) => {
  	let body = req.body;
  	if (body.object === 'page') {
	    body.entry.forEach(function(entry) {
	      	let webhook_event = entry.messaging[0];
	      	console.log(webhook_event);
			let sender_psid = webhook_event.sender.id;
	        console.log('Sender PSID: ' + sender_psid);

	        if (webhook_event.message) {
	            console.log(webhook_event.message.text);
	            sendBotTyping(sender_psid, "typing_on");

	            const res = handleMessage(sender_psid, webhook_event.message, entry.id);

	            sendBotTyping(sender_psid, "typing_off");

	        }

	        if (webhook_event.postback) {
	            console.log(webhook_event.postback);

	            sendBotTyping(sender_psid, "typing_on");
	            const res = handlePostback(sender_psid, webhook_event.postback, entry.id);

	            console.log(res);
	            sendBotTyping(sender_psid, "typing_off");

	        }
	    });
	    res.status(200).send('EVENT_RECEIVED');
	} else {
	    res.sendStatus(404);
	}
});

router.get('/', (req, res) => {
  	let VERIFY_TOKEN = process.env.VERIFY_TOKEN
    let mode = req.query['hub.mode'];
  	let token = req.query['hub.verify_token'];
  	let challenge = req.query['hub.challenge'];
    if (mode && token) {
      	if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      		console.log('WEBHOOK_VERIFIED');
      		res.status(200).send(challenge);
    	} else {
      		res.sendStatus(403);
    	}
  	}
});

module.exports = router;


const handleMessage = async (sender_psid, received_message, pageId ) => {
	if (received_message.text) {
		response = {
		 	"attachment": {
		   		"type": "template",
		   		"payload": {
			 		"template_type": "generic",
			 		"elements": [{
			   			"title": `Is this the right message? "${received_message.text}"`,
			   			"subtitle": "Tap a button to answer.",
					   	"buttons": [
						 	{
						   		"type": "postback",
						   		"title": "Yes!",
						   		"payload": "yes",
						 	},
						 	{
						   		"type": "postback",
						   		"title": "No!",
						   		"payload": "no",
						 	}
			   			],
			 		}]
		   		}
		 	}
	 	}
	}
	callSendAPI(sender_psid, response)
};

const handlePostback = async (sender_psid, received_postback, pageId) => {
    let payload = received_postback.payload;
    if(payload === 'GET_STARTED'){
        let message = "Hello welcome to our page🤩!!!";
        handleMessageUnknown(sender_psid, message);
    }
    sendBotTyping(sender_psid, "typing_off");
};

const sendBotTyping = (sender_psid,typing_state, cb = null) => {
  	let request_body = {
    	"recipient":{
	      	"id":sender_psid
	    },
	   	"sender_action":typing_state
	};

	request({
	    "uri": "https://graph.facebook.com/v6.0/me/messages" ,
	    "qs": { "access_token": PAGE_ACCESS_TOKEN },
	    "method": "POST",
	    "json": request_body
	}, (err, _res, _body) => {
	    if (!err) {
	        if(cb){
	            cb();
	        }
	   	} else {
	        console.error("Unable to send message:" + err);
	    }
	});
};

const sendMessageReply = (psid, message) => {
	let body = {
	    "recipient":{
	      	"id":psid
	    },
	    "message":{
	      	"text":message
	    }
	};

	request(
		{
		    "uri": "https://graph.facebook.com/v6.0/me/messages" ,
		    "qs": { "access_token": PAGE_ACCESS_TOKEN },
		    "method": "POST",
		    "json": body
		}, (err, _res, _body) => {
		    if (!err) {

		    } else {
		        console.error("Unable to send message:" + err);
		    }
		}
	)
};

const callSendAPI = (sender_psid, response, cb = null) => {
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "messaging_type": "RESPONSE",
        "message": response
    };

    request(
		{
	        "uri": "https://graph.facebook.com/v6.0/me/messages" ,
	        "qs": { "access_token": PAGE_ACCESS_TOKEN },
	        "method": "POST",
	        "json": request_body
	    }, (err, _res, _body) => {
	        if (!err) {
	            if(cb){
	                cb();
	            }
	        } else {
	            console.error("Unable to send message:" + err);
	        }
	    }
	);
};

const handleMessageUnknown = (psid, message) => {
    var options = {
        "uri": "https://graph.facebook.com/v6.0/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": {
            "recipient": { id: psid },
            "message":{
                "attachment":{
                    "type":"template",
                    "payload":{
                        "template_type":"button",
                        "text": message,
                        "buttons":[
                            {
                                "type":"postback",
                                "title":"Not interested 😢",
                                "payload":"end"
                            },{
                                "type":"postback",
                                "title":"Do Something 💪🥳",
                                "payload":"explore"
                            }
                        ]
                    }
                }
            }
        }
  	};

  	request(options, function (error, response, body) {
    	if (error) throw new Error(error);
    	console.log(body);
  	});
};


const fetchNews = (country, cb) => {
	request.get(`https://newsapi.org/v2/top-headlines?apiKey=${NEWS_API}&country=${country}`, (err, _res, _body) => {
	    if (!err) {
			console.log("hello", JSON.parse(_body).articles)
			return JSON.parse(_body).articles
	   	} else {
	        console.log("Unable to send message:" + err);
	    }
	});
}
