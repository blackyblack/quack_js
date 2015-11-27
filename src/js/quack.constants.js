var Quack = (function(Quack, $, undefined) {
  //Quack constants
  Quack.constants = {};

  Quack.constants.isPlugin = false;
  Quack.constants.isTestnet = true;
  ///TODO: broadcast = true
  Quack.constants.broadcast = true;
  Quack.constants.nxtApiUrl = "http://localhost:7876/nxt";
  
  if(Quack.constants.isTestnet)
  {
    Quack.constants.nxtApiUrl = "http://localhost:6876/nxt";
  }

  if(Quack.constants.isPlugin) {
    Quack.constants.nxtApiUrl = "nxt";
  }

  Quack.constants.triggerAccount = "NXT-DAXR-PR6C-EA3X-8YGM4";

  if(Quack.constants.isTestnet)
  {
    Quack.constants.triggerAccount = "NXT-YTBB-LT9J-SRRR-7KLBQ";
  }

  Quack.constants.triggerFee = 250000000;
  //default blocks count for a swap session
  Quack.constants.swapBlocks = 720;
  Quack.constants.defaultConfirmations = 0;
  Quack.constants.defaultMessage = "You've got new Quack request. Use Quack plugin to check and accept the request.";

  return Quack;
} (Quack || {}, jQuery));