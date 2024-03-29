var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var aWss = expressWs.getWss('/');
var userCount = 0;
var voteTrue = 0;
var voteFalse = 0;
var voteFinal = "";

app.use(function (req, res, next) {
  //console.log('middleware');
  req.testing = 'testing';
  console.log("connected");
  //console.log(userCount);
  userCount++;
  aWss.clients.forEach(function (client) {
    client.send(JSON.stringify({command: "userCount", message: userCount}));
  });    
  return next();
});
 
app.get('/', function(req, res, next){
  console.log('get route', req.testing);
  res.end();
});

app.ws('/', function(ws, req) {

  ws.on('message', function(msg) {

    aWss.clients.forEach(function (client) {
        client.send(JSON.stringify({command: "userCount", message: userCount}));
    });

    //ws.send(JSON.stringify({command: "userCount", message: userCount}));
    msg = JSON.parse(msg);

    if(msg.choice === "askQuestion"){
        voteTrue = 0;
        voteFalse = 0;
        aWss.clients.forEach(function (client) {
            if (client !== ws) client.send(JSON.stringify({command: "beginVote", message: "beginVote", usermsg: msg.text}));
        });  
    }
    if(msg.choice === "votingEndMaster"){
        ws.send(JSON.stringify({command: "makeChoice", text: msg.text}));
    }

    if(msg.choice === "votingEndSlave"){
        ws.send(JSON.stringify({command: "lockScreen"}));
    }    

    if(msg.choice === "finalChoice"){
        aWss.clients.forEach(function (client) {
            client.send(JSON.stringify({command: "finalChoice", final_choice: msg.finalChoice, true_votes: voteTrue, false_votes: voteFalse}));
        });          
    }

    if(msg.choice === true){
        voteTrue++;
    }
    if(msg.choice === false){
        voteFalse++;
    }
    else{
        ws.send(JSON.stringify({command: false, message: "Connected"}));
    }
  });

  ws.on('close', function(){
    userCount --;
    aWss.clients.forEach(function (client) {
        client.send(JSON.stringify({command: "userCount", message: userCount}));
    });    
  })
});

app.listen(3001);