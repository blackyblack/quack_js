var Constants = (function(Constants, $, undefined) {

  Constants.isPlugin = false;
  Constants.isTestnet = true;
  ///TODO: broadcast = true
  Constants.broadcast = true;
  Constants.nxtApiUrl = "http://localhost:7876/nxt";
  
  if(Constants.isTestnet)
  {
    Constants.nxtApiUrl = "http://localhost:6876/nxt";
  }

  if(Constants.isPlugin) {
    Constants.nxtApiUrl = "nxt";
  }

  Constants.triggerAccount = "NXT-DAXR-PR6C-EA3X-8YGM4";

  if(Constants.isTestnet)
  {
    Constants.triggerAccount = "NXT-YTBB-LT9J-SRRR-7KLBQ";
  }

  Constants.triggerFee = 250000000;
  //default blocks count for a swap session
  Constants.swapBlocks = 720;
  Constants.defaultConfirmations = 0;
  Constants.defaultMessage = "You've got new Quack request. Use Quack plugin to check and accept the request.";

  return Constants;
} (Constants || {}, jQuery));