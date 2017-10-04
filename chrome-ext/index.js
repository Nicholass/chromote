function generateBrowserHash() {
  return Math.random().toString(36).slice(2, 8);
}

function updateHash() {
  var hash = generateBrowserHash();
  return chrome.storage.sync.set({'browserHash': hash}, function() {
    displayHash(hash);
  });
}

function displayHash(hash) {
  return document.getElementById('browserHash').value = hash || '';
}

function runConnect() {
  return chrome.extension.sendMessage({ msg: "connect" });
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get('browserHash', function(resp) {
    displayHash(resp.browserHash);
  });
  // Check the connection state on popup open
  chrome.extension.sendMessage({msg: "connection"});

  document.getElementById('generate').onclick = updateHash;
  document.getElementById('connect').onclick = runConnect;
});

function renderClients(clients) {
  // TODO for each client build table
    // | client hostname | type |
  console.log("clients", clients);
  if (clients.length > 0) {
    clients.forEach(function(client) {
      console.log(client);
    });
  }
  return;
}

function colorBeacon(color, tip) {
  var $beacon = document.getElementById('connection-beacon')

  $beacon.style.color = color;
  $beacon.title = tip;

}

function blinkBeacon(color) {
  var defaultColor = document.getElementById('connection-beacon').style.color;
  var cycle = 1000; //blink cycle in ms

  var timerId = setInterval(function() {
    colorBeacon(color);
    setTimeout(colorBeacon, cycle/2, defaultColor);
  }, cycle)
}

function setConnectionStateBeacon(state) {
  var timer = null;
  switch(state){
    case 0: //opening
      blinkBeacon("green", "Connecting");
      break
    case 1: //open
      colorBeacon("green", "Connected")
      break
    case 2: //closing
      blinkBeacon("red", "Closing connection");
      break
    case 3: //closed
      colorBeacon("red", "Connection closed");
      break

  }

}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse){
    console.log('client got message', request)
    switch(request.title) {
      case "clients":
        renderClients(request.data);
        break
      case "connection":
        setConnectionStateBeacon(request.state)
        break
      default:
        console.log("client cannot handle", request);
        break
    }
  }
);
