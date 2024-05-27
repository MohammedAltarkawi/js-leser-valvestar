sap.ui.define(["sap/ui/core/mvc/Controller", 
"com/leser/valvestar/class/GlobalFunction", 
"com/leser/valvestar/class/formatter"], 
function (Controller, GlobalFunction, formatter) {
    "use strict";

    return Controller.extend("com.leser.valvestar.controller.BaseController", {
        formatter: formatter,

        onInit: function () {
            this.globalFunction = new GlobalFunction();
            this.applicationModel = this.globalFunction.getApplicationModel();
            this.applicationDataModel = this.globalFunction.getApplicationDataModel();
            this.getView().setModel(this.applicationModel, "application");
            this.getView().setModel(this.applicationDataModel, "applicationData");
        }
    });
});
