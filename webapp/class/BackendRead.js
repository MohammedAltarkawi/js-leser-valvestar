sap.ui.define(["com/leser/valvestar/class/BaseClass"], function (BaseClass) {
    "use strict";

    return BaseClass.extend("com.leser.valvestar.class.BackendRead", {
        readEntitySet: function (entity, parameter, onSuccess, onError) {
            this.domainModel = this.globalFunction.getDomainModel();
            if (!parameter) {
                return false;
            }

            try {
                // Get entity set name
                var entitySet = this.globalFunction.getEntitySet(entity);
                //add Token to Headers here SSO Token
                if (!parameter.headers) {
                    parameter.headers = {};
                }

                parameter.headers["sap-language"] = this.globalFunction.applicationDataModelRead("/systemLanguage");

                if (this.globalFunction.applicationDataModelRead("/ssoToken")) {
                    parameter.headers.Cookie = "MYSAPSSO2=" + this.globalFunction.applicationDataModelRead("/ssoToken");
                }

                if (this.globalFunction.applicationDataModelRead("/viewParameterStart")) {
                    if (this.globalFunction.applicationModelRead("/customizing/sizingViewType") === "02") {
                        parameter.headers.view = "expert";
                    } else {
                        parameter.headers.view = "wizard";
                    }
                }

                // Set header parameter on domain model
                if (parameter.headers) {
                    this.domainModel.setHeaders(parameter.headers);
                }

                if (!onError) {
                    onError = function (data) {
                        this.globalFunction.applicationDataModelWrite("/busyStart", false);
                        var oDialog = this.globalFunction.getErrorDialog(data.message);
                        oDialog.open();
                    }.bind(this);
                }

                // Calling of create entity set method on backend
                this.domainModel.read(entitySet, {
                    urlParameters: parameter.urlParameters,
                    success: onSuccess, //jQuery.proxy(this._onSuccess, this, parameter),
                    error: onError, //jQuery.proxy(this._onError, this, parameter),
                    groupId: parameter.groupId
                });

                if (parameter.busy) {
                    this.globalFunction.showBusyDialog();
                }
            } catch (err) {
                return false;
            }
            return true;
        },

        readEntity: function (entity, parameter, onSuccess, onError) {
            if (!parameter) {
                return false;
            }

            try {
                // Get entity set name
                var entitySet = this.globalFunction.getEntitySet(entity);

                //add Token to Headers here SSO Token

                // Set header parameter on domain model
                if (!parameter.headers) {
                    parameter.headers = {};
                }
                parameter.headers["sap-language"] = this.globalFunction.applicationDataModelRead("/systemLanguage");

                if (this.globalFunction.applicationDataModelRead("/ssoToken")) {
                    parameter.headers.Cookie = "MYSAPSSO2=" + this.globalFunction.applicationDataModelRead("/ssoToken");
                }

                if (!parameter.inputParameter) {
                    parameter.inputParameter = {};
                }

                if (this.globalFunction.applicationDataModelRead("/viewParameterStart")) {
                    if (this.globalFunction.applicationModelRead("/customizing/sizingViewType") === "02") {
                        parameter.headers.view = "expert";
                    } else {
                        parameter.headers.view = "wizard";
                    }
                }

                if (parameter.headers) {
                    this.domainModel.setHeaders(parameter.headers);
                }

                if (parameter.keys) {
                    var keyString = "";
                    for (var prop in parameter.keys) {
                        if (parameter.keys[prop].match(/guid'/)) {
                            keyString += prop + "=" + parameter.keys[prop] + "',";
                        } else {
                            keyString += prop + "='" + parameter.keys[prop] + "',";
                        }
                    }
                    keyString = keyString.substr(0, keyString.length - 1);
                    entitySet = entitySet + "(" + keyString + ")";
                }

                if (parameter.busy) {
                    this.globalFunction.showBusyDialog();
                }

                if (!onError) {
                    onError = function (data) {
                        this.globalFunction.applicationDataModelWrite("/busyStart", false);
                        var oDialog = this.globalFunction.getErrorDialog(data.message);
                        oDialog.open();
                    }.bind(this);
                }

                // Calling of create entity set method on backend
                this.domainModel.read(entitySet, {
                    urlParameters: parameter.urlParameters,
                    success: onSuccess, //jQuery.proxy(this._onSuccess, this, parameter),
                    error: onError, //jQuery.proxy(this._onError, this, parameter),
                    groupId: parameter.groupId
                });
            } catch (err) {
                return false;
            }

            return true;
        }
    });
});
