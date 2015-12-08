var Quack = (function(Quack, $, undefined) {
  //Quack utils
  Quack.utils = {};

  Quack.utils.now = function() {
    var d = new Date(2013, 10, 24, 12, 0, 0, 0);
    return Math.round((new Date().getTime() - d.getTime() + 500) / 1000);
  }

  Quack.utils.failed = function(callback) {
    callback({"ret": "error", "result": {"error": "timeout"}});
  }

  Quack.utils.errored = function(callback, result) {
    console.log("error from NRS: " + JSON.stringify(result));
    callback({"ret": "error", "result": result});
  }

  Quack.utils.txqueued = function(tx, queue, maxlength, callback) {

    var txid = tx.transaction;
    if (txid) {
      console.log("Queued transaction: " + txid);
      queue.push({"ret": "ok", "result": txid});
    } else {
      console.log("error from NRS: " + tx);
      queue.push({"ret": "error", "result": tx});
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

  Quack.utils.convertToQNT = function (quantity, decimals) {
    quantity = String(quantity);

    var parts = quantity.split(".");

    var qnt = parts[0];

    //no fractional part
    var i;
    if (parts.length == 1) {
      if (decimals) {
        for (i = 0; i < decimals; i++) {
          qnt += "0";
        }
      }
    } else if (parts.length == 2) {
      var fraction = parts[1];
      if (fraction.length > decimals) {
        throw $.t("error_fraction_decimals", {
          "decimals": decimals
        });
      } else if (fraction.length < decimals) {
        for (i = fraction.length; i < decimals; i++) {
          fraction += "0";
        }
      }
      qnt += fraction;
    } else {
      throw $.t("error_invalid_input");
    }

    //in case there's a comma or something else in there.. at this point there should only be numbers
    if (!/^\d+$/.test(qnt)) {
      throw $.t("error_invalid_input_numbers");
    }
    try {
      if (parseInt(qnt) === 0) {
        return "0";
      }
    } catch (e) {
    }

    //remove leading zeroes
    return qnt.replace(/^0+/, "");
  }

  Quack.utils.convertFromQNT = function (quantity, decimals) {
    var negative = "";
    var mantissa = "";

    if (typeof quantity != "object") {
      quantity = new BigInteger(String(quantity));
    }

    if (quantity.compareTo(BigInteger.ZERO) < 0) {
      quantity = quantity.abs();
      negative = "-";
    }

    var divider = new BigInteger("" + Math.pow(10, decimals));

    var fractionalPart = quantity.mod(divider).toString();
    quantity = quantity.divide(divider);

    if (fractionalPart && fractionalPart != "0") {
      mantissa = ".";

      for (var i = fractionalPart.length; i < decimals; i++) {
        mantissa += "0";
      }

      mantissa += fractionalPart.replace(/0+$/, "");
    }

    quantity = quantity.toString();
    return negative + quantity + mantissa;
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
                var price = Quack.utils.convertToQNT(assets[k].QNTin, decimals);
                assets[k].QNTout = price;
              }
              continue;
            }

            if(assets[k].id != assetId) continue;
            if(assets[k].type != assetType) continue;
            assets[k].decimals = decimals;
            if(decimals >= 0) {
              var price = Quack.utils.convertToQNT(assets[k].QNTin, decimals);
              assets[k].QNTout = price;
            }
          }
        }

        callback({"ret":"ok", "state":assets});
      } else {
        callback(assetsState);
      }
    });
  }

  //convert amountQNT to user amounts
  Quack.utils.parseQuantity = function(assets, callback) {
    
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
                var price = new BigInteger(String(assets[k].QNTin));
                assets[k].QNTout = Quack.utils.convertFromQNT(price, decimals);
              }
              continue;
            }

            if(assets[k].id != assetId) continue;
            if(assets[k].type != assetType) continue;
            assets[k].decimals = decimals;
            if(decimals >= 0) {
              var price = new BigInteger(String(assets[k].QNTin));
              assets[k].QNTout = Quack.utils.convertFromQNT(price, decimals);
            }
          }
        }

        callback({"ret":"ok", "state":assets});
      } else {
        callback(assetsState);
      }
    });
  }

  //convert amountQNT to user amounts
  Quack.utils.scanHelper = function(account, timelimit, callback) {

    Quack.api.scan(account, timelimit, function(result) {
      if(result.ret == "ok") {

        var swaps = result.state.lookup;

        for (var key of swaps.keys()) {
          var swap = swaps.get(key);

          var assetsA = swap.assetsA;
          var assetsB = swap.assetsB;

          if(account == swap.recipient) {
            assetsA = swap.assetsB;
            assetsB = swap.assetsA;
          }

          swap.assetsA = assetsA;
          swap.assetsB = assetsB;

          result.state.lookup.set(key, swap);
        }
        callback(result);
      } else {
        callback(result);
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