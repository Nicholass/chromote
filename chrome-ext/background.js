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
  connectionState();

  msg = JSON.parse(msg.data || "{}")
  console.log('dispatching ' + msg.action + ' for ' + msg.targetId );
  if (msg.action) actions[msg.action](msg.targetId, msg.params); //TODO change signature, add cb

  if (msg.meta && msg.meta.clients) {
    chrome.extension.sendMessage({
      title: "clients",
      data: msg.meta.clients
    });
  }

}

function connectionState() {
  chrome.extension.sendMessage({title: "connection", state: conn.readyState})
  //chrome.storage.sync.set({'connectionState': conn.readyState}
}

function connect(id, endpoint){
  // TODO store URL in store; configure it via settings page
  var ws = new WebSocket("ws://localhost:8888/" + endpoint + "?token=" + id);
  ws.onopen = connectionState;
  ws.onclose = connectionState;
  ws.onerror = connectionState;
  ws.onmessage = dispatch;
  return ws;
}

function sendTabs() {
  if (conn.readyState == 1) {
    chrome.tabs.query({}, function(tabs) {
      conn.send(JSON.stringify({title: "tabs", data: tabs}));
    });
  } else {
    console.log("Connection is not ready");
  }
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("ext got message", request);
    switch(request.msg) {
      case "connect":
        chrome.storage.sync.get('browserHash', function(resp) {
          conn = connect(resp.browserHash, 'browser');
        });

        // subscribe on all tabs events
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
          console.log('Updating tablis as ', changeInfo)
          sendTabs();
        });

        chrome.tabs.onCreated.addListener(function(tab) {
          sendTabs();
        });
        //TODO all other tab events
        break

      case "clients":
        console.log("ext clients call", request.data);
        chrome.extension.sendMessage({
          title: "clients",
          data: request.data
        })
        break

      case "connection":
        connectionState();
        break

      default:
        console.log("ext cannot handle", request);
        break

    }
  }
);

chrome.storage.onChanged.addListener(function(changes, namespace) {
  console.log('storgae changes');
  if (namespace == 'sync') {
    for (key in changes) {
      if (key == 'browserHash') {
        if (conn.readyState == 1) {
          conn.close();
        }
      }
    }
  }
});
// TODO on store.hash update - drop connection
