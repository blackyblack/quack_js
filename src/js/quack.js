var Quack = (function(Quack, $, undefined) {
  //Quack API

  ///HACK: account can be obtained with the secret but NXT plugin can give us account
  //Quack.account = "";
  Quack.currentBlock = 0;

  ///------------- public functions
  
  //init call
  Quack.init = function(secret, recipientRS, finishHeight, assets, expectedAssets, privateMessage, callback) {

    var rest = finishHeight - Quack.currentBlock;
    var deadline = rest / 2;

    if (deadline < 3) {
      deadline = 3;
    }

    if ((deadline + 1) > rest)
    {
      console.log("Too short period until timeout");
      callback({"ret": "error", "result": "Too short period until timeout"});
      return;
    }

    console.log("creating trigger tx");
    createtrigger(Constants.triggerAccount, secret, 1440, Constants.triggerFee, function(result) {

      if(result.fullHash) {

        var fullHash = result.fullHash;
        var unsignedBytes = result.unsignedTransactionBytes;
        var count = 0;
        var messageObject = {"quack": 1};
        var encryptedMessage = "";
        var txids = new Array();

        for (i = 0; i < assets.length; i++) {

          var asset = assets[i];

          if (count == 0)
          {
            messageObject = {
              "quack": 1,
              "recipient": recipientRS,
              "triggerBytes": unsignedBytes,
              "assets": assets,
              "expected_assets": expectedAssets

            };
            encryptedMessage = privateMessage;
          }

          var apiobject = {};

          if (asset.type == "NXT") {
            apiobject = {
              "requestType": "sendMoney",
              "recipient": recipientRS,
              "secretPhrase": secret,
              "feeNQT": 0,
              "broadcast": "" + Constants.broadcast,
              "deadline": "" + deadline,
              "amountNQT": "" + asset.QNT,
              "message": JSON.stringify(messageObject),
              "messageIsText": "true",
              "messageIsPrunable": "true",
              "messageToEncrypt": encryptedMessage,
              "messageToEncryptIsText": "true",
              ///HACK: cannot have both encrypted and unencrypted prunnable messages
              "encryptedMessageIsPrunable": "false",
              "phased": "true",
              "phasingFinishHeight": "" + finishHeight,
              "phasingVotingModel": "4",
              "phasingQuorum": "1",
              "phasingLinkedFullHash": fullHash
            };
          } else if (asset.type == "A") {
            apiobject = {
              "requestType": "transferAsset",
              "recipient": recipientRS,
              "secretPhrase": secret,
              "feeNQT": 0,
              "broadcast": "" + Constants.broadcast,
              "deadline": "" + deadline,
              "asset": asset.id,
              "quantityQNT": "" + asset.QNT,
              "message": JSON.stringify(messageObject),
              "messageIsText": "true",
              "messageIsPrunable": "true",
              "messageToEncrypt": encryptedMessage,
              "messageToEncryptIsText": "true",
              ///HACK: cannot have both encrypted and unencrypted prunnable messages
              "encryptedMessageIsPrunable": "false",
              "phased": "true",
              "phasingFinishHeight": "" + finishHeight,
              "phasingVotingModel": "4",
              "phasingQuorum": "1",
              "phasingLinkedFullHash": fullHash
            };
          } else if (asset.type == "M") {
            apiobject = {
              "requestType": "transferCurrency",
              "recipient": recipientRS,
              "secretPhrase": secret,
              "feeNQT": 0,
              "broadcast": "" + Constants.broadcast,
              "deadline": "" + deadline,
              "currency": asset.id,
              "units": "" + asset.QNT,
              "message": JSON.stringify(messageObject),
              "messageIsText": "true",
              "messageIsPrunable": "true",
              "messageToEncrypt": encryptedMessage,
              "messageToEncryptIsText": "true",
              ///HACK: cannot have both encrypted and unencrypted prunnable messages
              "encryptedMessageIsPrunable": "false",
              "phased": "true",
              "phasingFinishHeight": "" + finishHeight,
              "phasingVotingModel": "4",
              "phasingQuorum": "1",
              "phasingLinkedFullHash": fullHash
            };
          } else {
            console.log("undefined asset type: " + asset.type);
          }

          $.post(Constants.nxtApiUrl, apiobject,

            function(txobject) {
              txqueued(txobject, txids, assets.length, callback);
            },
            "json"
          ).fail(function() {
            txqueued("error", txids, assets.length, callback);
          });

          count++;
        }
      } 
      // if (result.fullHash)
      else {
        callback({"ret": "error", "result": result});
      }

    });
  }

  //trigger call
  Quack.trigger = function(secret, triggerBytes, callback) {

    $.post(Constants.nxtApiUrl, {
      "requestType": "signTransaction",
      "unsignedTransactionBytes": triggerBytes,
      "secretPhrase": secret
      },

      function(result) {

        var txBytes = result.transactionBytes;
        if (txBytes) {

          $.post(Constants.nxtApiUrl, {
            "requestType": "broadcastTransaction",
            "transactionBytes": txBytes
            },

            function(result2) {

              var txid = result2.transaction;
              if (txid) {

                console.log("Trigger txid: " + txid);
                callback({"ret": "ok", "txid": txid});
                
              } else {
                errored(callback, result2);
              }
                      
            },
            "json"
          ).fail(function() { failed(callback); });
        } else {
          errored(callback, result);
        }

      },
      "json"
    ).fail(function() { failed(callback); });
  }

  //accept call
  Quack.accept = function(secret, recipientRS, finishHeight, assets, triggerHash, callback) {

    var rest = finishHeight - Quack.currentBlock;
    var deadline = rest / 2;

    if (deadline < 3) {
      deadline = 3;
    }

    if ((deadline + 1) > rest)
    {
      console.log("Too short period until timeout");
      callback({"ret": "error", "result": "Too short period until timeout"});
      return;
    }

    var messageJson = "{\"quack\":1}";
    var txids = new Array();

    for (i = 0; i < assets.length; i++) {

      var asset = assets[i];
      var apiobject = {};

      if (asset.type == "NXT") {
        apiobject = {
          "requestType": "sendMoney",
          "recipient": recipientRS,
          "secretPhrase": secret,
          "feeNQT": 0,
          "broadcast": "" + Constants.broadcast,
          "deadline": "" + deadline,
          "amountNQT": "" + asset.QNT,
          "message": messageJson,
          "messageIsText": "true",
          "messageIsPrunable": "true",
          "phased": "true",
          "phasingFinishHeight": "" + finishHeight,
           "phasingVotingModel": "4",
          "phasingQuorum": "1",
          "phasingLinkedFullHash": triggerHash
        };
      } else if (asset.type == "A") {
        apiobject = {
          "requestType": "transferAsset",
          "recipient": recipientRS,
          "secretPhrase": secret,
          "feeNQT": 0,
          "broadcast": "" + Constants.broadcast,
          "deadline": "" + deadline,
          "asset": asset.id,
          "quantityQNT": "" + asset.QNT,
          "message": messageJson,
          "messageIsText": "true",
          "messageIsPrunable": "true",
          "phased": "true",
          "phasingFinishHeight": "" + finishHeight,
          "phasingVotingModel": "4",
          "phasingQuorum": "1",
          "phasingLinkedFullHash": triggerHash
        };
      } else if (asset.type == "M") {
        apiobject = {
          "requestType": "transferCurrency",
          "recipient": recipientRS,
          "secretPhrase": secret,
          "feeNQT": 0,
          "broadcast": "" + Constants.broadcast,
          "deadline": "" + deadline,
          "currency": asset.id,
          "units": "" + asset.QNT,
          "message": messageJson,
          "messageIsText": "true",
          "messageIsPrunable": "true",
          "phased": "true",
          "phasingFinishHeight": "" + finishHeight,
          "phasingVotingModel": "4",
          "phasingQuorum": "1",
          "phasingLinkedFullHash": triggerHash
        };
      } else {
        console.log("undefined asset type: " + asset.type);
      }

      $.post(Constants.nxtApiUrl, apiobject,

        function(txobject) {
          txqueued(txobject, txids, assets.length, callback);
        },
        "json"
      ).fail(function() {
        txqueued("error", txids, assets.length, callback);
      });
    }
  }

  //scan call
  //account - what account to scan
  //timelimit - limit in seconds how old transactions do we scan
  //callback - returns {ret:ok, swaps:swaps} on success
  Quack.scan = function(account, timelimit, callback) {
    //create a hashmap of swap sessions with fullHash as a key
    var lookup = new Map();

    var timestamp = "" + 0;
    if ((now() - timelimit) > 0) timestamp = "" + (now() - timelimit);

    //get a list of transaction for account
    $.post(Constants.nxtApiUrl, {
      "requestType": "getBlockchainTransactions",
      "account": account,
      "timestamp": timestamp
      },

      function(result) {

        var transactions = result.transactions;
        if (transactions) {
          //got transactions list for our account
          var length = transactions.length;
          var triggerDataTxs = new Array();
          var triggerIdsQueue = new Array();
          var counter = {"ok": 0, "errors": 0, "maxcount": 0};
          var state = {"lookup": lookup};
          
          for(i = 0; i < length; i++) {
            var tx = transactions[i];
            if(!tx) continue;
            var attach = tx.attachment;
            if(!attach) continue;
            var message = attach.message;
            if(!message) continue;
            var jsonMessage;
            try {
              jsonMessage = JSON.parse(message);
            } catch (e) {
              console.log("could not parse: " + message);
            }
            if(!jsonMessage) continue;

            //filter quack transactions (quack: 1 in message)
            if(jsonMessage.quack != 1) continue;

            //got a quack message
            console.log("quack message id: " + tx.transaction);

            //process trigger message
            if(jsonMessage.trigger == 1) {
              var fullHash = tx.fullHash;
              if(!fullHash) continue;

              //if trigger transaction found - close swap session for it
              var swapInfo = lookup.get(fullHash);
              if (!swapInfo) swapInfo = {};
              swapInfo.assetsA = new Array();
              swapInfo.assetsB = new Array();
              swapInfo.gotTrigger = true;
              lookup.set(fullHash, swapInfo);
              console.log("finalized quack session: " + fullHash);
              continue;
            }

            //for each phased transaction in txs check it's linkedFullHash and finishHeight
            var linkedhashes = attach.phasingLinkedFullHashes;
            if(!linkedhashes) continue;
            if(linkedhashes.length == 0) continue;

            var finishHeight = attach.phasingFinishHeight;
            if(!finishHeight) continue;
            if(finishHeight == 0) continue;

            var hashdata = linkedhashes[0];
            if(!hashdata) continue;

            var txSender = tx.senderRS;
            var txRecipient = tx.recipientRS;
            if(!txSender) continue;
            if(!txRecipient) continue;

            var txType = tx.type;
            var txSubtype = tx.subtype;
            if(!txType) continue;
            if(!txSubtype) continue;

            //update swap information in map based on this info
            var swapInfo = lookup.get(hashdata);
            if (!swapInfo) {
              swapInfo = {};
              swapInfo.assetsA = new Array();
              swapInfo.assetsB = new Array();
              swapInfo.minFinishHeight = finishHeight;
            }

            if(finishHeight < swapInfo.minFinishHeight) swapInfo.minFinishHeight = finishHeight;

            //check if it is payment
            if(txType == 0 && txSubtype == 0) {
              var assetInfo = {"id": 1, "type": "NXT", "QNT": tx.amountNQT, "tx": tx};
              if(account == txSender) {
                swapInfo.assetsA.push(assetInfo);
              } else {
                swapInfo.assetsB.push(assetInfo);
              }
            }
            //check if it is asset transfer
            else if (txType == 2 && txSubtype == 1) {
              var assetInfo = {"id": attach.asset, "type": "A", "QNT": attach.quantityQNT, "tx": tx};
              if(account == txSender) {
                swapInfo.assetsA.push(assetInfo);
              } else {
                swapInfo.assetsB.push(assetInfo);
              }
            }
            //check if it is currency transfer
            else if (txType == 5 && txSubtype == 3) {
              var assetInfo = {"id": attach.currency, "type": "M", "QNT": attach.units, "tx": tx};
              if(account == txSender) {
                swapInfo.assetsA.push(assetInfo);
              } else {
                swapInfo.assetsB.push(assetInfo);
              }
            }

            lookup.set(hashdata, swapInfo);

            //check for swap information available
            var triggerBytes = jsonMessage.triggerBytes;
            if(triggerBytes) {
              triggerDataTxs.push({"tx": tx, "hashdata": hashdata, "message": jsonMessage});
            }
          }

          counter.maxcount = triggerDataTxs.length;
          state.lookup = lookup;

          if(counter.maxcount > 0) {
            for(i = 0; i < counter.maxcount; i++) {
              var hashdata = triggerDataTxs[i].hashdata;
              var message = triggerDataTxs[i].message;
              var txSender = triggerDataTxs[i].tx.senderRS;

              tryUpdateInformation(state, counter, account, txSender, hashdata, message, callback);
            }
          } else {
            callback({"ret": "ok", "state": state});
          }
          
        } else {
          errored(callback, result);
        }
      },
      "json"
    ).fail(function() { failed(callback); });
  }

  ///------------- private functions

  function createtrigger(account, secret, deadline, fee, callback) {
    var messageJson = "{\"quack\":1,\"trigger\":1}";

    $.post(Constants.nxtApiUrl, {
      "requestType": "sendMoney",
      "recipient": account,
      "secretPhrase": secret,
      "feeNQT": 0,
      "broadcast": "false",
      "deadline": "" + deadline,
      "amountNQT": "" + fee,
      "message": messageJson,
      "messageIsText": "true",
      "messageIsPrunable": "false"
      },

      function(result) {
        callback(result);
      },
      "json"
    ).fail(function() { failed(callback); });
  }

  function tryUpdateInformation(state, counter, account, sender, hashdata, message, callback) {
    var swapInfo = state.lookup.get(hashdata);
    if(swapInfo.assets && swapInfo.assets.length > 0 && txSender != account) {
      txok(state, counter, "error", callback);
      return;
    }

    if(!message) {
      txok(state, counter, "error", callback);
      return;
    }

    //parse trigger bytes to get swap data
    $.post(Constants.nxtApiUrl, {
      "requestType": "parseTransaction",
      "transactionBytes": message.triggerBytes
      },

      function(tx) {
        if(tx.amountNQT) {
          var payment = tx.amountNQT;
          var feeRecipient = tx.recipientRS;
          var sender = tx.senderRS;
          var recipient = message.recipient;

          //check fee recipient and amount
          if(payment < Constants.triggerFee) {
            txok(state, counter, "error", callback);
            return;
          }

          if(feeRecipient != Constants.triggerAccount) {
            txok(state, counter, "error", callback);
            return;
          }
          
          swapInfo.sender = sender;
          swapInfo.recipient = recipient;
          swapInfo.triggerBytes = message.triggerBytes;
          swapInfo.assets = message.assets;
          swapInfo.expectedAssets = message.expected_assets;
          state.lookup.set(hashdata, swapInfo);

          txok(state, counter, "ok", callback);
        } else {
          txok(state, counter, "error", callback);
        } 
      },
      "json"
    ).fail(function() {
      txok(state, counter, "error", callback);
    });

    
  }

  return Quack;
} (Quack || {}, jQuery));