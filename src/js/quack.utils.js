var Quack = (function(Quack, $, undefined) {
  //Quack utils
  Quack.utils = {};

  Quack.utils.now = function() {
    var d = new Date(2013, 10, 24, 12, 0, 0, 0);
    return Math.round((new Date().getTime() - d.getTime() + 500) / 1000);
  }

  Quack.utils.failed = function(callback) {
    callback({"ret": "error", "result": "NRS not found"});
  }

  Quack.utils.errored = function(callback, result) {
    console.log("error from NRS: " + JSON.stringify(result));
    callback({"ret": "error", "result": result});
  }

  Quack.utils.txqueued = function(tx, queue, maxlength, callback) {

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

  Quack.utils.txok = function(state, counter, status, callback) {
    if (status == "ok") {
      counter.ok++;
    } else {
      counter.errors++;
    }

    okReadyCallback(state, counter, callback);
  }

  Quack.utils.getDecimals = function(assets, callback) {
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
        Quack.utils.txok(state, counter, "ok", callback);
        continue;
      } else {
        state[i].decimals = -1;
        Quack.utils.txok(state, counter, "ok", callback);
        continue;
      }

      $.ajax({
        url: Quack.constants.nxtApiUrl,
        dataType: "json",
        type: "POST",
        context:{"id":state[i].id},
        data: apiobject
      }).done(function (result) {
        var decimals = result.decimals;
        if(typeof decimals === "undefined") decimals = -1;

        for (k = 0; k < length; k++) {
          if(state[k].id == this.id) {
            state[k].decimals = decimals;
          }
        }

        Quack.utils.txok(state, counter, "ok", callback);

      }).fail(function () {
        for (k = 0; k < length; k++) {
          if(state[k].id == this.id) {
            state[k].decimals = -1;
          }
        }

        Quack.utils.txok(state, counter, "error", callback);
      });
    }
  }

  //convert user amounts to amountQNT
  Quack.utils.updateQuantity = function(assets, callback) {
    
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

    Quack.utils.getDecimals(allAssets, function(assetsState) {
      if(assetsState.ret == "ok") {

        for(i = 0; i < assetsState.state.length; i++) {
          var assetDecimalInfo = assetsState.state[i];
          var assetId = assetDecimalInfo.id;
          var decimals = assetDecimalInfo.decimals;
          var assetType = assetDecimalInfo.type;

          for(k = 0; k < assets.length; k++) {
            if(assetType == "NXT" && assets[k].type == "NXT") {
              assets[k].decimals = decimals;
              if(decimals >= 0) {
                var price = new BigInteger(String(assets[k].QNT));
                assets[k].QNT = price.multiply(new BigInteger("" + Math.pow(10, decimals))).toString();
              }
              continue;
            }

            if(assets[k].id != assetId) continue;
            if(assets[k].type != assetType) continue;
            assets[k].decimals = decimals;
            if(decimals >= 0) {
              var price = new BigInteger(String(assets[k].QNT));
              assets[k].QNT = price.multiply(new BigInteger("" + Math.pow(10, decimals))).toString();
            }
          }
        }

        callback({"ret":"ok", "state":assets});
      } else {
        callback(assetsState);
      }
    });
  }

  //private functions

  function queueReadyCallback(queue, length, callback) {
    if(queue.length >= length) {
      callback({"ret": "ok", "queue": queue});
    }
  }

  function okReadyCallback(state, counter, callback) {
    if((counter.ok + counter.errors) >= counter.maxcount) {
      callback({"ret": "ok", "state": state});
    }
  }

  return Quack;
} (Quack || {}, jQuery));