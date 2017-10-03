// TODO can we move to ES6?
var  conn = {};

//TODO add callbacks for each action to get tabs.
var actions = {
  navigate: function(id, p) {
    chrome.tabs.update(id, {url: p.url});
  }
,
  activate: function(id) {
    chrome.tabs.update(id, {active: true});
  },

  close: function(id) {
    chrome.tabs.remove(id);
  },

  reload: function(id) {
    chrome.tabs.reload(id);
  },

  open: function(_, p) {
    chrome.tabs.create({url: p.url});
  },

  mute: function(id) {
    chrome.tabs.get(id, function(tab) {
      var muteFlag = tab.mutedInfo && tab.mutedInfo.muted;
      chrome.tabs.update(id, {muted: !muteFlag});
    });
  },

  _zoom: function(id, type){
    chrome.tabs.getZoom(id, function(factor) {
      switch(type) {
        case "in":
          return chrome.tabs.setZoom(id, factor + 0.1)
          break
        case "out":
          return chrome.tabs.setZoom(id, factor - 0.1)
          break
        case "restore":
          return chrome.tabs.setZoom(id, 0)
          break
        default:
          break
      }
    });
  },

  zoomIn: function(id) {return this._zoom(id, "in")},
  zoomOut: function(id) {return this._zoom(id, "out")},
  zoomRestore: function(id) {return this._zoom(id, "restore")},
}

function dispatch(msg) {
  msg = JSON.parse(msg.data || "{}")
  console.log('dispatching ' + msg.action + ' for ' + msg.targetId );
  if (msg.action) actions[msg.action](msg.targetId, msg.params); //TODO change signature, add cb

  //chrome.extension.sendMessage(msg); in case of clients update
  //TODO after each successfull action send back clients list
}
/* {
 *   targetId: 42, // target tab id
 *   action: "nvaigate", //one of tab's actions
 *   params: {url: "http://linux.org.ru" } //parabs for action, if needed
 * }*/
function connect(id, endpoint){
  // TODO store URL in store; configure it via settings page
  var ws = new WebSocket("ws://localhost:8888/" + endpoint + "?token=" + id);
  ws.onmessage = dispatch;
  return ws;
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("ext message", request);
    switch(request.msg) {
      case "connect":
        chrome.storage.sync.get('browserHash', function(resp) {
          // TODO die if empty hash
          console.log('Hash is: ', resp.browserHash);
          conn = connect(resp.browserHash, 'browser');
        });
        break

      case "clients":
        console.log("ext clients call", request.data);
        // TODO
        // conn.send({title: "clients", data: {...})
        // chrome.extension.sendMessage( //to the ext. popup)
        break

      default:
        console.log("ext cannot handle", request);
        break

    }
  }
);

// TODO on store.hash update - drop connection
