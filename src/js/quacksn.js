//SuperNET compatibility layer

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

//mask all account fields
$(".modal").on("show.bs.modal", function() {
  var $inputFields = $(this).find("input[name=recipient], input[name=account_id], input[name=phasingWhitelisted]").not("[type=hidden]");
  $.each($inputFields, function() {
    if ($(this).hasClass("noMask")) {
      $(this).mask("NXT-****-****-****-*****", {
        "noMask": true
      }).removeClass("noMask");
    } else {
      $(this).mask("NXT-****-****-****-*****");
    }
  });
});

//Reset form to initial state when modal is closed
$(".modal").on("hidden.bs.modal", function() {
    $(this).find("input[name=recipient], input[name=account_id]").not("[type=hidden]").trigger("unmask");
    $(this).find(":input:not(button)").each(function() {
      var defaultValue = $(this).data("default");
      var type = $(this).attr("type");
      var tag = $(this).prop("tagName").toLowerCase();
      if (type == "checkbox") {
        if (defaultValue == "checked") {
          $(this).prop("checked", true);
        } else {
          $(this).prop("checked", false);
        }
      } else if (type == "hidden") {
        if (defaultValue !== undefined) {
          $(this).val(defaultValue);
        }
      } else if (tag == "select") {
        if (defaultValue !== undefined) {
          $(this).val(defaultValue);
        } else {
          $(this).find("option:selected").prop("selected", false);
          $(this).find("option:first").prop("selected", "selected");
        }
      } else {
        if (defaultValue !== undefined) {
          $(this).val(defaultValue);
        } else {
          $(this).val("");
        }
      }
    });

    //Hidden form field
    $(this).find("input[name=converted_account_id]").val("");

    //Hide/Reset any possible error messages
    $(this).find(".callout-danger:not(.never_hide), .error_message, .account_info").html("").hide();
    $(this).find(".advanced").hide();
  });

function submitProgress(modal) {
  var btn = modal.find("button.btn-primary:not([data-dismiss=modal])");
  modal.modal("lock");
  modal.find("button").prop("disabled", true);
  btn.button("loading");
}

function submitOk(modal) {
  var btn = modal.find("button.btn-primary:not([data-dismiss=modal])");
  modal.find("button").prop("disabled", false);
  btn.button("reset");
  modal.modal("unlock");
  modal.modal("hide");
}

function submitFailed(modal, response) {
  var btn = modal.find("button.btn-primary:not([data-dismiss=modal])");
  modal.find(".error_message").html(response).show();
  modal.find("button").prop("disabled", false);
  btn.button("reset");
  modal.modal("unlock");
}