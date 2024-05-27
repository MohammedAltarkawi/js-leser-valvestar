sap.ui.define(["com/leser/valvestar/class/BaseClass"], function (BaseClass) {
    "use strict";

    return BaseClass.extend("com.leser.valvestar.class.BackendWrite", {
        createEntity: function (entity, parameter, onSuccess, onError) {
            this.domainModel = this.globalFunction.getDomainModel();
            if (!parameter) {
                return false;
            }
            try {
                // Get entity set name
                var entitySet = this.globalFunction.getEntitySet(entity);

                // Set header parameter on domain model
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

                if (parameter.headers) {
                    this.domainModel.setHeaders(parameter.headers);
                }

                if (!parameter.inputParameter) {
                    parameter.inputParameter = {};
                }

                // Calling of create entity set method on backend
                this.domainModel.create(entitySet, parameter.inputParameter, {
                    success: onSuccess, //jQuery.proxy(this._onSuccess, this, parameter),
                    error: onError, //jQuery.proxy(this._onError, this, parameter),
                    groupId: parameter.groupId
                });
            } catch (err) {
                return false;
            }

            return true;
        },

        updateEntity: function (entity, parameter, onSuccess, onError) {
            this.domainModel = this.globalFunction.getDomainModel();
            if (this.domainModel.sDefaultUpdateMethod !== "PUT") {
                this.domainModel.sDefaultUpdateMethod = "PUT";
            }

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

                if (!parameter.inputParameter) {
                    parameter.inputParameter = {};
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

                // Calling of create entity set method on backend
                this.domainModel.update(entitySet, parameter.inputParameter, {
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
