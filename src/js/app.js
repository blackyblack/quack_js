function now() {
    var d = new Date(2013, 10, 24, 12, 0, 0, 0);
    return Math.round((new Date().getTime() - d.getTime() + 500) / 1000);
  }

  function failed(callback) {
    callback({"ret": "error", "result": "NRS not found"});
  }

  function errored(callback, result) {
    console.log("error from NRS: " + JSON.stringify(result));
    callback({"ret": "error", "result": result});
  }

  function txqueued(tx, queue, maxlength, callback) {

    var txid = tx.transaction;
    if (txid) {
      console.log("Queued transaction: " + txid);
      queue.push("" + txid);
    } else {
      console.log("error from NRS: " + tx);
      queue.push("0");
    }

    queueReadyCallback(queue, maxlength, callback);
  }

  function queueReadyCallback(queue, length, callback) {
    if(queue.length >= length) {
      callback({"ret": "ok", "queue": queue});
    }
  }

  function txok(state, counter, status, callback) {
    if (status == "ok") {
      counter.ok++;
    } else {
      counter.errors++;
    }

    okReadyCallback(state, counter, callback);
  }

  function okReadyCallback(state, counter, callback) {
    if((counter.ok + counter.errors) >= counter.maxcount) {
      callback({"ret": "ok", "state": state});
    }
  }

function quackCreate() {
  var senderRS = "NXT-YTBB-LT9J-SRRR-7KLBQ";
  var recipientRS = "NXT-GAHZ-GQNW-ANZS-6A4WW";
  var secret = "blackyblack";
  var assets = new Array();
  var expectedAssets = new Array();
  var privateMessage = "";

  Quack.account = senderRS;

  assets.push({
    "id":"17091401215301664836",
    "QNT":5,
    "type":"A"
  });
  
  expectedAssets.push({
    "id":"1",
    "QNT":5,
    "type":"NXT"
  });

  $.post(Constants.nxtApiUrl, {
    "requestType": "getBlockchainStatus"
    },

    function(status) {

      var currentBlock = status.numberOfBlocks;  
      var finishHeight = currentBlock + Constants.swapBlocks;

      Quack.currentBlock = currentBlock;
      Quack.init(secret, recipientRS, finishHeight, assets, expectedAssets, privateMessage, function(result) {
        ///TODO: show success code on UI
        console.log("UI update here");

        if(result.ret == "ok") {

          console.log("Success response");
          var ids = result.queue;
          ///TODO: check ids for 0 return. At least one 0 in ids is error.
          console.log("queue: " + ids);
        }
        else {
          console.log("Error response");
          console.log("result = " + JSON.stringify(result.result));
        }

      });
    },
    "json"
  );
}

function quackTrigger() {
  var senderRS = "NXT-YTBB-LT9J-SRRR-7KLBQ";
  var secret = "blackyblack";

  Quack.account = senderRS;

  var triggerBytes = "001013aeb903a0054ec621bae8b0f35a31cdf81d29e15d8ca78026a4b3034b3a4fb3a41b6b375a7129650f4f9651265b80b2e60e0000000000e1f5050000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000783b0700c9d651ab3cf50e1001170000807b22717561636b223a312c2274726967676572223a317d";

  Quack.trigger(secret, triggerBytes, function(result) {
    ///TODO: show success code on UI
    console.log("UI update here");

    if(result.ret == "ok") {

      console.log("Success response");
      var txid = result.txid;
      console.log("txid: " + txid);
    }
    else {
      console.log("Error response");
      console.log("result = " + JSON.stringify(result.result));
    }
  });
}

function quackAccept() {
  var senderRS = "NXT-YTBB-LT9J-SRRR-7KLBQ";
  var recipientRS = "NXT-GAHZ-GQNW-ANZS-6A4WW";
  var secret = "blackyblack";
  var assets = new Array();

  Quack.account = senderRS;
  
  assets.push({
    "id":"1",
    "QNT":5,
    "type":"NXT"
  });

  $.post(Constants.nxtApiUrl, {
    "requestType": "getBlockchainStatus"
    },

    function(status) {

      var currentBlock = status.numberOfBlocks;
      ///HACK: finishHeight must be equal to assets tx finishHeight
      var finishHeight = currentBlock + Constants.swapBlocks;
      var triggerHash = "0f5f58042971ef5ec188483c172d133847880e2b7bf0bd80b0071028d5dbe5a9";

      Quack.currentBlock = currentBlock;
      Quack.accept(secret, recipientRS, finishHeight, assets, triggerHash, function(result) {
        ///TODO: show success code on UI
        console.log("UI update here");

        if(result.ret == "ok") {

          console.log("Success response");
          var ids = result.queue;
          ///TODO: check ids for 0 return. At least one 0 in ids is error.
          console.log("queue: " + ids);
        }
        else {
          console.log("Error response");
          console.log("result = " + JSON.stringify(result.result));
        }
    
      });
    },
    "json"
  );
}

function quackScan() {
  var senderRS = "NXT-YTBB-LT9J-SRRR-7KLBQ";
  var timelimit = 60 * 60 * 24 * 100;

  $.post(Constants.nxtApiUrl, {
    "requestType": "getBlockchainStatus"
    },

    function(status) {

      var currentBlock = status.numberOfBlocks;

      Quack.currentBlock = currentBlock;
      Quack.scan(senderRS, timelimit, function(result) {
        ///TODO: show success code on UI
        console.log("UI update here");

        if(result.ret == "ok") {

          console.log("Success response");
          var swaps = result.state.lookup;
          for (var key of swaps.keys()) {
            console.log("swap: " + key + " -> " + JSON.stringify(swaps.get(key)));
          }
        }
        else {
          console.log("Error response");
          console.log("result = " + JSON.stringify(result.result));
        }
    
      });
    },
    "json"
  );
}

function getDecimals(assets, callback) {
  var length = assets.length;
  var state = assets;
  var counter = {"ok": 0, "errors": 0, "maxcount": 0};
  counter.maxcount = length;

  for (i = 0; i < length; i++) {
    var asset = assets[i];
    var assetId = asset.id;

    var apiobject = {};

    if (asset.type == "A") {
      apiobject = {
        "requestType": "getAsset",
        "asset": assetId
      };
    } else if (asset.type == "M") {
      apiobject = {
        "requestType": "getCurrency",
        "currency": assetId
      };
    } else if (asset.type == "NXT") {
      state[i].decimals = 8;
      txok(state, counter, "ok", callback);
      continue;
    } else {
      state[i].decimals = 0;
      txok(state, counter, "ok", callback);
      continue;
    }

    $.post(Constants.nxtApiUrl, apiobject,

      function(result) {

        var decimals = result.decimals;
        var assetId = result.asset;
        if(!assetId) {
          assetId = result.currency;
        }

        if(assetId && decimals) {
          for (k = 0; k < length; k++) {
            if(state[k].id == assetId) {
              state[k].decimals = decimals;
            }
          }

          txok(state, counter, "ok", callback);
        } else {
          txok(state, counter, "error", callback);
        }

      },
      "json"
    ).fail(function() { txok(state, counter, "error", callback); });
  }
}

//convert user amounts to amountQNT
function updateQuantity(assets, callback) {
  
  var assetsSet = new Map();

  for(i = 0; i < assets.length; i++) {
    var asset = assets[i];
    var assetId = "NXT";
    var assetType = asset.type;
    if(assetType == "A") {
      assetId = "a:" + asset.id;
    } else if (assetType == "M") {
      assetId = "m:" + asset.id;
    }
    assetsSet.set(assetId, 1);
  }

  var allAssets = new Array();

  for (var key of assetsSet.keys()) {
    var asset = {};
    var sub = key.substring(0, 2);
    if(key == "NXT") {
      asset.id = "1";
      asset.type = "NXT"
    }

    if(sub == "a:") {
      asset.id = key.substring(2);
      asset.type = "A"
    } else if (sub == "m:") {
      asset.id = key.substring(2);
      asset.type = "M"
    }
        
    allAssets.push(asset);
  }  

  //allAssets now contains only unique assetIds

  getDecimals(allAssets, function(assetsState) {
    if(assetsState.ret == "ok") {

      for(i = 0; i < assetsState.state.length; i++) {
        var assetDecimalInfo = assetsState.state[i];
        var assetId = assetDecimalInfo.id;
        var decimals = assetDecimalInfo.decimals;
        var assetType = assetDecimalInfo.type;

        for(k = 0; k < assets.length; k++) {
          if(assetType == "NXT" && assets[k].type == "NXT") {
            var price = new BigInteger(String(assets[k].QNT));
            assets[k].QNT = price.multiply(new BigInteger("" + Math.pow(10, decimals))).toString();
            continue;
          }

          if(assets[k].id != assetId) continue;
          if(assets[k].type != assetType) continue;

          var price = new BigInteger(String(assets[k].QNT));
          assets[k].QNT = price.multiply(new BigInteger("" + Math.pow(10, decimals))).toString();
        }
      }

      callback({"ret":"ok", "state":assets});
    } else {
      callback(assetsState);
    }
  });
}