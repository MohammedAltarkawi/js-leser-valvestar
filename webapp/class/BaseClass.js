sap.ui.define(["com/leser/valvestar/class/GlobalFunction", "sap/ui/base/Object"], function(GlobalFunction, UIObject) {
  "use strict";

  return UIObject.extend("com.leser.valvestar.class.BaseClass", {
    constructor: function() {
      this.globalFunction = new GlobalFunction();
    }
  });
});
