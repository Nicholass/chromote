var  conn = {};

function navigate(id, url) {
  chrome.tabs.update(id, {url: url});
}

function activate(id) {
  chrome.tabs.update(id, {active: true});
}

function dispatch(msg) {
  console.log('Got from server: ', msg);
  // TODO case by action field and then operate tabs
  chrome.extension.sendMessage({title: "clients", data: msg.clients});
  //TODO ws.send chrome.tabs
}
/* {
 *   targetId: 42, // target tab id
 *   action: "nvaigate", //one of tab's actions
 *   params: "http://linux.org.ru" //parabs for action, if needed
 * }*/
function connect(id, endpoint){
  // TODO store URL in store; configure it via settings page
  var ws = new WebSocket("ws://localhost:5555/" + endpoint + "?token=" + id);
  ws.onmessage = dispatch();
  return ws;
}

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse){
      if(request.msg == "connect") {
        chrome.storage.sync.get('browserHash', function(resp) {
          // TODO die if empty hash
          console.log('Hash is: ', resp.browserHash);
          conn = connect(resp.browserHash, 'browser');
        })
      }
    }
);

// TODO on store.hash update - drop connection
