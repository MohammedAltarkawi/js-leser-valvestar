/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/leser/valvestar/model/models",
        "com/leser/valvestar/class/BackendRead", 
        "com/leser/valvestar/class/BackendWrite",
        "sap/ui/model/json/JSONModel"
    ],
    function (UIComponent, Device, models, BackendRead, BackendWrite,  JSONModel) {
        "use strict";

        return UIComponent.extend("com.leser.valvestar.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
                 init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            
                sap.ui.getCore()._tvcComponent = this;

                //global header
                //this.setModel(new JSONModel(), "globalHeaderModel");
            }
        });
    }
);