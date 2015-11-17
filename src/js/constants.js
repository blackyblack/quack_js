var Constants = (function(Constants, $, undefined) {

  Constants.isTestnet = true;
  ///TODO: broadcast = true
  Constants.broadcast = false;
  Constants.nxtApiUrl = "http://localhost:7876/nxt";
  
  if(Constants.isTestnet)
  {
    Constants.nxtApiUrl = "http://localhost:6876/nxt";
  }

  Constants.triggerAccount = "NXT-DAXR-PR6C-EA3X-8YGM4";

  if(Constants.isTestnet)
  {
    Constants.triggerAccount = "NXT-YTBB-LT9J-SRRR-7KLBQ";
  }

  Constants.triggerFee = 250000000;
  //default blocks count for a swap session
  Constants.swapBlocks = 720;

  return Constants;
} (Constants || {}, jQuery));