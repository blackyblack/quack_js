///HACK: add lock attribute to modals to make them wait for response
// save the original function object
var _superModal = $.fn.modal;

// add locked as a new option
$.extend(_superModal.Constructor.DEFAULTS, {
  locked: false
});

// capture the original hide
var _hide = _superModal.Constructor.prototype.hide;

// add the lock, unlock and override the hide of modal
$.extend(_superModal.Constructor.prototype, {
  // locks the dialog so that it cannot be hidden
  lock: function() {
    this.options.locked = true;
    this.$element.addClass("locked");
  }
  // unlocks the dialog so that it can be hidden by 'esc' or clicking on the backdrop (if not static)
  ,
  unlock: function() {
    this.options.locked = false;
    this.$element.removeClass("locked");
  },
  // override the original hide so that the original is only called if the modal is unlocked
  hide: function() {
    if (this.options.locked) {
      return;
    }
    _hide.apply(this, arguments);
  }
});

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