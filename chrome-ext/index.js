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

  document.getElementById('generate').onclick = updateHash;
  document.getElementById('connect').onclick = runConnect;
})

function renderClients(clients) {
  // TODO
  // for each client build table
  // | client hostname | type |
  if (clients.length > 0) {
    clients.forEach();
  }
  return;
}

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse){
      if(request.title == "clients") {
        renderClients(request.data)
      }
    }
);
