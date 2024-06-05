/* eslint-disable no-console */
/* eslint-disable fiori-custom/sap-no-hardcoded-url */
/* eslint-disable max-depth */
/* eslint-disable complexity */
/* eslint-disable no-shadow */
sap.ui.define(
    [
        "sap/ui/base/Object",
        "com/leser/valvestar/class/formatter",
        "sap/m/Dialog",
        "sap/m/Button",
        "sap/m/FlexItemData",
        "sap/m/Title",
        "sap/m/Text",
        "sap/m/VBox",
        "sap/m/HBox",
        "sap/m/Image",
        "sap/m/Input",
        "sap/m/List",
        "sap/m/CustomListItem",
        "sap/m/ComboBox",
        "sap/m/MultiComboBox",
        "sap/m/RadioButtonGroup"
    ],
    function (UIObject, formatter, Dialog, Button, FlexItemData, Title, Text, VBox, HBox, Image, Input, List, CustomListItem, ComboBox, MultiComboBox, RadioButtonGroup) {
        "use strict";

        return UIObject.extend("com.leser.valvestar.class.GlobalFunction", {
            formatter: formatter,
            docKeys: {
                SC_IN_SIZ_STANDARD_VERSION: "",
                SC_IN_FLUID_STATE: ""
            },
            stVersion: {
                "00100": "API",
                "00200": "API",
                "00300": "ASME",
                "00400": "ASME",
                "00500": "ISO",
                "00600": "AD2000",
                "00700": "IBR"
            },
            fluidState: {
                "00100": "GAS",
                "00200": "LIQUID",
                "00300": "STEAM",
                "00400": "FLASHING",
                "00500": "SUBCOOLED",
                "00600": "SUPERCRITICAL"
            },

            configureProduct: function (articleNo) {
                var that = this;

                // Set article number
                var characteristic = this.getApplicationModel().getProperty("/customizing/productFindingAttrib");
                this.applicationDataModelWrite("/busyStart", true);
                this.setCharacteristicValue(
                    characteristic,
                    articleNo,
                    function () {
                        //that.getUiInformations(true);

                        // Get bom data
                        that.getBOMPositions(
                            {},
                            function (data, response) {
                                // Write bom data
                                that.applicationDataModelWrite("/bom", data.results, false);
                                // Get instance to load
                                var resultInstance = data.results.find(function (result) {
                                    return result.BOM_COMPNT === articleNo;
                                });
                                // Load instance
                                if (resultInstance) {
                                    if (that.getApplicationModel().getProperty("/customizing/sizingMaterial").toUpperCase() != resultInstance.bom_compnt) {
                                        that.loadBomInstance(
                                            {
                                                instance: resultInstance.CONFIG_SELF
                                            },
                                            function (instanceData) {
                                                that.applicationDataModelWrite("/configurationStatus", instanceData.STATUS, true);
                                                that.cmp = instanceData.BOM_COMPNT;
                                                that.applicationDataCurrentInstanceWrite(instanceData.CONFIG_SELF);
                                                //error here

                                                var fnSuccess = function (data, response) {
                                                    $("body").css("cursor", "default");
                                                    $("#overlay").remove();
                                                    if ((data && data.VALUE !== "I") || data.messages.results.length < 1) {
                                                        //TODO better code
                                                        that.getCharacteristicCategoryWithGroups(
                                                            function (instanceData) {
                                                                //that.navigateToConfiguration(that.cmp);
                                                                if (!that.applicationDataModelRead("/configScreen")) {
                                                                    that.saveConfiguration(
                                                                        {
                                                                            mode: "S"
                                                                        },
                                                                        that._successSave.bind(that),
                                                                        that._errorSave.bind(that)
                                                                    );
                                                                }
                                                            }
                                                        );
                                                        that.getCurrentConfiguration();
                                                    }
                                                    if (that.applicationDataModelRead("/configScreen")) {
                                                        that.navigateToConfiguration(instanceData.BOM_COMPNT);
                                                    }
                                                };
                                                var fnError = function (data, response) {};

                                                that.getInstanceInfo(null, fnSuccess, fnError);
                                            },
                                            function () {
                                                that.applicationDataModelWrite("/busyStart", false);
                                                that._loadBomInstanceError();
                                            }
                                        );
                                    } else {
                                        that.applicationDataModelWrite("/busyStart", false);
                                        that.loadBomInstance(
                                            {
                                                instance: resultInstance.CONFIG_SELF
                                            },
                                            null,
                                            function () {
                                                that.applicationDataModelWrite("/busyStart", false);
                                                that._loadBomInstanceError();
                                            }
                                        );
                                    }
                                } else {
                                    that.applicationDataModelWrite("/busyStart", false);
                                    $("#overlay").remove();
                                    const oDialog = that.getErrorDialog("Instance Issue");
                                    oDialog.open();
                                }
                            },
                            function () {
                                that.applicationDataModelWrite("/busyStart", false);
                                that._getBOMPositionsError();
                            }
                        );
                    },
                    function () {
                        that.applicationDataModelWrite("/busyStart", false);
                        that.changeCharacteristicValueError();
                    }
                );
            },

            _successSave: function (oThat, data, response) {
                if (data.statusCode === "400") {
                    var oDialog = this.createSaveDialogError(data);
                    oDialog.open();
                } else {
                    try {
                        if (!this.applicationDataModelRead("/configScreen")) {
                            var oDialogSave = this.createSaveDialog();
                            oDialogSave.open();
                        }
                    } catch (e) {
                        var oDialogSave = this.createSaveDialog();
                        oDialogSave.open();
                    }
                }
            },

            //displays an error dialog if the save was unsuccessdull
            _errorSave: function (oThat, data, response) {
                var oDialog = this.createSaveDialogError(data);
                oDialog.open();
            },

            navigateToConfiguration: function (matnr) {
                var key = "ConfigurationRoute";
                this.getComponent()
                    .getRouter()
                    .navTo(key, {
                        matnr: matnr || this.applicationDataModelRead("/sizingMaterialData/VALUE")
                    });
            },

            saveConfiguration: function (headers, fnSuccess, fnError) {
                try {
                    var parameter = {
                        action: "saveConfiguration",
                        busy: true,
                        keys: {
                            INSTANCE: this.applicationDataCurrentInstanceRead() || "00000001"
                        }
                    };

                    if (headers) {
                        parameter.headers = headers;
                        parameter.headers.mode = "S";
                    } else {
                        parameter.headers = {
                            mode: "S"
                        };
                    }

                    this.createEntity("config", parameter, fnSuccess, fnError);
                } catch (err) {
                    this.showLogOnConsole(err);
                }
            },

            getBOMPositions: function (headers, fnCallbackSuccess, fnCallbackError) {
                try {
                    var parameter = {
                        action: "getBOMPositions"
                    };
                    this.readEntitySet(
                        "configMultilevel",
                        parameter,
                        fnCallbackSuccess || jQuery.proxy(this._getBOMPositionsSuccess, this),
                        fnCallbackError || jQuery.proxy(this._getBOMPositionsError, this)
                    );
                } catch (err) {
                    this.showLogOnConsole(err);
                }
            },

            _getBOMPositionsSuccess: function (data, response) {
                this.applicationDataModelWrite("/bom", data.results, false);
            },

            _getBOMPositionsError: function (error) {
                this.applicationDataModelWrite("/bom", [], false);
            },

            loadBomInstance: function (headers, fnCallbackSuccess, fnCallbackError) {
                try {
                    var parameter = {
                        action: "loadInstance",
                        busy: true
                    };
                    if (headers) {
                        parameter.headers = headers;
                    }

                    return this.createEntity(
                        "configMultilevel",
                        parameter,
                        fnCallbackSuccess || jQuery.proxy(this._loadBomInstanceSuccess, this),
                        fnCallbackError || jQuery.proxy(this._loadBomInstanceError, this)
                    );
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            _loadBomInstanceSuccess: function (data, response) {
                this.applicationDataCurrentInstanceWrite(data.CONFIG_SELF);
                this.navigateToSizing();
                this.getUiInformations();
            },
            _loadBomInstanceError: function (error) {
                this.getUiInformations();
            },

            getSideNavigation: function (headers, fnCallbackSuccess, fnCallbackError) {
                try {
                    var parameter = {
                        action: "getSideNavigation",
                        urlParameters: {
                            $expand: "characteristics/values,groupings/characteristics/values"
                        }
                    };
                    this.readEntitySet(
                        "characteristicGroup",
                        parameter,
                        fnCallbackSuccess || this._getSideNavigationSuccess.bind(this),
                        fnCallbackError || jQuery.proxy(this._getSideNavigationError, this)
                    );
                } catch (err) {
                    this.showLogOnConsole(err);
                }
            },

            _getSideNavigationSuccess: function (data, response) {
                data.results.forEach((tab, tabIndex) => {
                    tab.groupings.results.forEach((grouping, groupingIndex) => {
                        grouping.characteristics.results.forEach((char, charIndex) => {
                            let val = grouping.characteristics.results.filter(element => element.VIEW_ID !== "" && element.VIEW_ID === char.VIEW_ID);
                            if (val.length > 1) {
                                val.sort((a, b) => {
                                    return a.ID - b.ID;
                                });

                                let foundIndex = grouping.characteristics.results.findIndex(element => element.ID == val[0].ID);
                                grouping.characteristics.results.filter(element => element.ID !== val[1].ID);
                                val[0].UNIT = val[1];
                                grouping.characteristics.results[foundIndex] = val[0];
                            }
                        });
                        grouping.characteristics.results = grouping.characteristics.results.filter(element => !element.ATNAM.includes("UNIT"));
                    });
                });
                this.applicationDataModelWrite("/characteristicGroups", data.results);
                this.populateConfigList();
            },

            _getSideNavigationError: function (error) {
                this.applicationDataModelWrite("/characteristicGroups", {});
            },

            getComponent: function () {
                try {
                    return sap.ui.getCore()._tvcComponent || null;
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            getDomainModel: function () {
                try {
                    return this.getComponent().getModel();
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            /* characteristicControlRead: function (group, atnam) {
                var oGroups = this.applicationDataModelRead("/charGroupPanels");
                var aControls = oGroups[group].items;
                for (var i = 0; i < aControls.length; i++) {
                    if (aControls[i]._atnam === atnam) {
                        return aControls[i];
                    }
                }
            }, */

            getApplicationModel: function () {
                try {
                    return this.getComponent().getModel("application");
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            getApplicationDataModel: function () {
                try {
                    return this.getComponent().getModel("applicationData");
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            applicationModelRead: function (path) {
                try {
                    return this.getApplicationModel().getProperty(path) || undefined;
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            applicationModelWrite: function (path, value) {
                try {
                    return this.getApplicationModel().setProperty(path, value);
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            applicationDataModelRead: function (path) {
                try {
                    return this.getApplicationDataModel().getProperty(path) || undefined;
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            setObjectToCurrentComponent: function (object, objectName) {
                if (!object || !objectName) {
                    return undefined;
                }

                this.getComponent()["_" + objectName] = object;
                return object;
            },

            getObjectFromCurrentComponent: function (objectName) {
                if (!objectName) {
                    return undefined;
                }

                if (!this.getComponent()["_" + objectName]) {
                    return undefined;
                } else {
                    return this.getComponent()["_" + objectName];
                }
            },

            applicationDataModelWrite: function (path, value, bRefresh) {
                try {
                    var oData = this.getApplicationDataModel().setProperty(path, value);
                    if (bRefresh) {
                        this.getApplicationDataModel().refresh();
                    }
                    return oData;
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            showLogOnConsole: function (message) {
                console.log(message);
            },

            getObject: function (sName, parameter) {
                try {
                    var object;
                    switch (sName) {
                        case "BackendRead":
                            object = "_backendRead";
                            break;
                        case "BackendWrite":
                            object = "_backendWrite";
                            break;
                        case "Model":
                            object = "_model";
                            break;
                        default:
                            return null;
                    }
                    if (this.getComponent()[object]) {
                        return this.getComponent()[object];
                    }

                    var path = "com/leser/valvestar/class/" + sName;
                    var ObjectClass = sap.ui.require(path);
                    var objectInstance = new ObjectClass(parameter);
                    this.getComponent()[object] = objectInstance;
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }

                return objectInstance;
            },

            getObjectBackendRead: function () {
                try {
                    return this.getObject("BackendRead");
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            getObjectBackendWrite: function () {
                try {
                    return this.getObject("BackendWrite");
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            getObjectModel: function () {
                try {
                    return this.getObject("Model");
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            readEntitySet: function (entity, parameter, onSuccess, onError) {
                try {
                    return this.getObjectBackendRead().readEntitySet(entity, parameter, onSuccess, onError);
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            readEntity: function (entity, parameter, onSuccess, onError) {
                try {
                    return this.getObjectBackendRead().readEntity(entity, parameter, onSuccess, onError);
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            createEntity: function (entity, parameter, onSuccess, onError) {
                try {
                    return this.getObjectBackendWrite().createEntity(entity, parameter, onSuccess, onError);
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            updateEntity: function (entity, parameter, onSuccess, onError) {
                try {
                    return this.getObjectBackendWrite().updateEntity(entity, parameter, onSuccess, onError);
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            createBusyDialog: function () {
                var busyDialog = new sap.m.BusyDialog("busy", {
                    customIcon: "img/preloaderVentil.gif",
                    customIconDensityAware: false,
                    customIconRotationSpeed: 0,
                    customIconHeight: "281px",
                    customIconWidth: "500px",
                    close: function (evt) {
                        evt.getSource().destroy();
                    }
                }).addStyleClass("customBusyDialog");
                this.applicationModelWrite("/controls/busyDialog", busyDialog);
                return busyDialog;
            },

            destroyBusyDialog: function () {
                var busyDialog = this.applicationModelRead("/controls/busyDialog");
                if (!busyDialog) {
                    return;
                }
                busyDialog.destroy();
                this.applicationModelWrite("/controls/busyDialog", null);
            },

            getBusyDialog: function () {
                return this.applicationModelRead("/controls/busyDialog");
            },

            openBusyDialog: function () {
                const busyDialog = this.getBusyDialog();
                if (!busyDialog) {
                    return null;
                }
                return busyDialog.open();
            },
            closeBusyDialog: function () {
                const busyDialog = this.getBusyDialog();
                if (!busyDialog || busyDialog.isDestroyed()) {
                    return null;
                }
                return busyDialog.close();
            },

            createSaveDialog: function (configId) {
                var bodyText = configId ? this.getText("saveSuccessTextConfigId").replace("*", configId) : this.getText("saveSuccessText");
                var saveDialog = new Dialog({
                    type: "Message",
                    title: this.getText("saveSuccess"),
                    state: "Success",
                    content: new Text({
                        text: bodyText
                    }),
                    beginButton: this.getLESERDialogButton()
                });
                this.applicationModelWrite("/controls/saveDialog", saveDialog);
                return saveDialog;
            },

            //creates an Error Dialog if the save of the configuration was not successfull
            createSaveDialogError: function (data) {
                this.saveDialog = new Dialog({
                    type: "Message",
                    title: "Error",
                    state: "Error",
                    content: new Text({
                        text: JSON.parse(data.responseText).error.message.value + "\n Error Code: " + JSON.parse(data.responseText).error.code
                    }),
                    beginButton: this.getLESERDialogButton()
                });
                this.applicationModelWrite("/controls/saveDialog", this.saveDialog);
                return this.saveDialog;
            },

            getText: function (sTextID) {
                return this.applicationDataModelRead("/i18n/" + sTextID);
            },

            getUrlParameterObject: function () {
                try {
                    var parameterArray = location.search.substr(1).split("&");
                    var parameterObject = {};
                    var allowedParameter = this.applicationModelRead("/urlParameter/allowed");
                    for (var key in parameterArray) {
                        var nameValueObject = parameterArray[key].split("=");
                        if (allowedParameter.indexOf(nameValueObject[0].toUpperCase()) === -1) {
                            continue;
                        }
                        if (nameValueObject[0].toLowerCase() === "sap-ui-language") {
                            nameValueObject[0] = "spras";
                        }
                        if (nameValueObject[0].toLowerCase() !== "sapguid") {
                            if (nameValueObject[1] !== "true" && nameValueObject[1] !== "false") {
                                parameterObject[nameValueObject[0].toLowerCase()] = nameValueObject[1].toUpperCase();
                            } else {
                                switch (nameValueObject[1]) {
                                    case "true":
                                        parameterObject[nameValueObject[0].toLowerCase()] = true;
                                        break;
                                    case "false":
                                        parameterObject[nameValueObject[0].toLowerCase()] = false;
                                        break;
                                    default:
                                }
                            }
                        } else {
                            parameterObject[nameValueObject[0].toLowerCase()] = nameValueObject[1];
                        }
                    }

                    if (Object.keys(parameterObject).length === 0) {
                        return false;
                    }
                } catch (err) {
                    this.showLogOnConsole(err);
                }

                return parameterObject;
            },

            initApplication: function (headers, fnCallback) {
                try {
                    var parameter = {
                        action: "initApplication",
                        busy: true
                    };
                    if (headers) {
                        parameter.headers = headers;
                    }

                    return this.readEntitySet("customizing", parameter, fnCallback);
                } catch (err) {
                    this.showLogOnConsole(err);
                    return undefined;
                }
            },

            startConfiguration: function (headers, fnCallbackSuccess, fnCallbackError) {
                const isConfigUUID = this.applicationDataModelRead("/isExistingConfigUUID");
                const isConfigID = this.applicationDataModelRead("/isExistingConfigID");
                if ((isConfigUUID === false || isConfigUUID === undefined) && (isConfigID === false || isConfigID === undefined)) {
                    try {
                        var parameter = {
                            action: "startConfiguration"
                        };
                        if (headers) {
                            parameter.headers = headers;
                            parameter.headers.mode = "C";
                        } else {
                            parameter.headers = {
                                mode: "C"
                            };
                        }
                        return this.createEntity("config", parameter, fnCallbackSuccess, fnCallbackError);
                    } catch (err) {
                        this.showLogOnConsole(err);
                        return false;
                    }
                } else {
                    try {
                        var parameter = {
                            action: "startConfiguration"
                        };
                        if (headers) {
                            parameter.headers = headers;
                            parameter.keys = {};
                            parameter.keys.INSTANCE = "00000001";
                            parameter.headers.mode = "C";
                            parameter.headers.loadnew = "X";
                        } else {
                            parameter.headers = {
                                mode: "C"
                            };
                        }
                        return this.readEntity("config", parameter, fnCallbackSuccess, fnCallbackError);
                    } catch (err) {
                        this.showLogOnConsole(err);
                        return false;
                    }
                }
            },

            getCharacteristicCategoryWithGroups: function (fnCallbackSuccess, fnCallbackError) {
                try {
                    var fnSuccess = function (data, response) {
                        this.setCategoryModelData(data, response, false);
                    }.bind(this);
                    this.readEntitySet(
                        "characteristicCategory",
                        {
                            action: "getSideNavigation",
                            urlParameters: {
                                $expand:
                                    "characteristicGroups/characteristics/values,characteristicGroups/groupings/characteristics/values,characteristicGroups/groupings/groupings/characteristics/values,characteristicGroups/groupings/groupings/groupings/characteristics/values"
                            }
                        },
                        fnCallbackSuccess || fnSuccess,
                        fnCallbackError
                    );
                } catch (err) {
                    this.showLogOnConsole(err);
                }
            },

            getCurrentRouteName: function () {
                var router = this.getComponent().getRouter();
                var currentHash = router.getHashChanger().getHash();
                return router.getRouteInfoByHash(currentHash).name;
            },

            getUiInformations: function (isConfiguration) {
                const currentRoute = this.getCurrentRouteName();
                this.getInstanceInfo();
                this.getCurrentConfiguration();
                if (currentRoute === "ConfigurationRoute") {
                    this.getSideNavigation();
                } else {
                    //TODO one line to delete
                    this.getCharacteristicCategoryWithGroups();
                    if (!isConfiguration) {
                        this.getProductsForSelection();
                    }
                }
            },

            _fireBindingChange: function () {
                var aElements = this.applicationModelRead("/expViewCtrls");
                for (var i = 0; i < aElements.length; i++) {
                    var oElem = aElements[i];
                    if (oElem.fireModelContextChange) {
                        oElem.fireModelContextChange();
                    }
                }
            },

            setCategoryModelData: function (data, response, bRefresh) {
                var aResults = data.results,
                    aExpGroupsL = [],
                    aExpGroupsR = [],
                    that = this,
                    bExpert = this.applicationModelRead("/customizing/sizingViewType") === "01" ? false : true;
                if (!data || aResults.length === 0) {
                    return;
                }
            
                var fnAssingInfoText = function (aChar) {
                    for (var i = 0; i < aChar.length; i++) {
                        var oTexts = that.applicationDataModelRead("/infoText");
                        if (oTexts[aChar[i].ATNAM]) {
                            aChar[i].INFO = oTexts[aChar[i].ATNAM];
                        }
                    }
                };

                var fnGroupings = function (aGroups, bExpert) {
                    for (var i = 0; i < aGroups.length; i++) {
                        var oGroup = aGroups[i];
                        var oTexts = that.applicationDataModelRead("/infoText");
                        if (oTexts[oGroup.GROUPING_ID]) {
                            oGroup.INFO = oTexts[oGroup.GROUPING_ID];
                        }
                        if (oGroup.characteristics && oGroup.characteristics.results && oGroup.characteristics.results.length > 0) {
                            if (bExpert) {
                                oGroup.characteristics.results.sort(function (a, b) {
                                    if (a.VIEW_ID === b.VIEW_ID) {
                                        return b.ID - a.ID;
                                    }
                                    return a.VIEW_ID > b.VIEW_ID ? 1 : -1;
                                });
                            }
                            fnAssingInfoText(oGroup.characteristics.results);
                        }
                        if (oGroup.groupings && oGroup.groupings.results && oGroup.groupings.results.length > 0) {
                            fnGroupings(oGroup.groupings.results, bExpert);
                        }
                    }
                };

                for (var i = 0; i < aResults.length; i++) {
                    var sCatId = window.location.host.includes(".dispatcher.hana.ondemand") ? "SIZING" : "02_SIZING";
                    if (sCatId) {
                        var aGroups = aResults[i].characteristicGroups.results;
                        for (var j = aGroups.length - 1; j >= 0; j--) {
                            var oTexts = that.applicationDataModelRead("/infoText");
                            if (oTexts[aGroups[j].GRUPPE]) {
                                aGroups[j].INFO = oTexts[aGroups[j].GRUPPE];
                            }
                            if (aGroups[j].characteristics && aGroups[j].characteristics.results && aGroups[j].characteristics.results.length > 0) {
                                if (bExpert) {
                                    aGroups[j].characteristics.results.sort(function (a, b) {
                                        return a.VIEW_ID - b.VIEW_ID;
                                    });
                                }

                                fnAssingInfoText(aGroups[j].characteristics.results);
                            }
                            if (aGroups[j].groupings && aGroups[j].groupings.results && aGroups[j].groupings.results.length > 0) {
                                fnGroupings(aGroups[j].groupings.results, bExpert);
                            }
                            if (parseInt(aGroups[j].ID, 10) > 99) {
                                if (parseInt(aGroups[j].ID, 10) < 500) {
                                    aExpGroupsL.push(aGroups[j]);
                                    aGroups.splice(j, 1);
                                } else {
                                    aExpGroupsR.push(aGroups[j]);
                                    aGroups.splice(j, 1);
                                }
                            }
                        }
                    }
                }

                if (bExpert) {
                    aExpGroupsL.sort(function (a, b) {
                        return a.ID - b.ID;
                    });
                    aExpGroupsR.sort(function (a, b) {
                        return a.ID - b.ID;
                    });
                    this.applicationDataModelWrite("/characteristicGroupsExpL", aExpGroupsL, bRefresh);
                    this.applicationDataModelWrite("/characteristicGroupsExpR", aExpGroupsR, bRefresh);
                    this._fireBindingChange();
                }
                this.applicationDataModelWrite("/characteristicCategories", aResults, bRefresh);
                $("body").css("cursor", "default");
                $("#overlay").remove();
                var sHash = this.getComponent().getRouter().getHashChanger().getHash();
                if (sHash.includes("ConfigurationRoute")) {
                    this.populateConfigList();
                }
            },

            getInstanceInfo: function (headers, fnCallbackSuccess, fnCallbackError) {
                try {
                    var instance = this.applicationDataCurrentInstanceRead() || "00000001";
                    var parameter = {
                        action: "getMessages",
                        keys: {
                            INSTANCE: instance
                        },
                        urlParameters: {
                            $expand: "messages"
                        }
                    };
                    if (headers) {
                        parameter.headers = headers;
                    } else {
                        parameter.headers = {
                            instance: instance
                        };
                    }
                    return this.readEntity("instanceInfo", parameter, fnCallbackSuccess || jQuery.proxy(this._setInstanceInfoData, this), fnCallbackError);
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            _setInstanceInfoData: function (data, response) {
                if (!data) {
                    return;
                }
                const sHash = this.getComponent().getRouter().getHashChanger().getHash();

                if (sHash.includes("ConfigurationRoute")) {
                    this.changeStatusDisplayConfigurationPage(data);
                }
                var areObjectsSimilar = function (obj1, obj2) {
                    return obj1.ATNAM === obj2.ATNAM && obj1.MSG === obj2.MSG;
                };

                var removeDuplicateObjects = function (array) {
                    const uniqueObjects = [];
                    array.forEach(obj => {
                        if (!uniqueObjects.some(uniqueObj => areObjectsSimilar(obj, uniqueObj))) {
                            uniqueObjects.push(obj);
                        }
                    });
                    return uniqueObjects;
                };

                if (data.messages.results.length > 0) {
                    data.messages.results = removeDuplicateObjects(data.messages.results);
                }

                this.applicationDataModelWrite("/instanceInfo", data, false);
                this.applicationDataModelWrite("/state", data.NAME === "STATE" ? data.VALUE : "", false);
            },

            getProductsForSelection: function (headers, fnCallbackSuccess, fnCallbackError) {
                try {
                    this.readEntitySet("productFinding", {}, fnCallbackSuccess || jQuery.proxy(this._setProductsForSelection, this), fnCallbackError);
                } catch (err) {
                    this.showLogOnConsole(err);
                }
            },

            getProductsForSelectionExpanded: function (headers, fnCallbackSuccess, fnCallbackError) {
                try {
                    this.applicationDataModelWrite("/backNavEnabled", false);
                    this.readEntitySet(
                        "productFinding",
                        {
                            urlParameters: {
                                $expand: "characteristics"
                            }
                        },
                        fnCallbackSuccess || jQuery.proxy(this._setProductsForSelectionExpanded, this),
                        fnCallbackError
                    );
                } catch (err) {
                    this.showLogOnConsole(err);
                }
            },

            _setProductsForSelection: function (data, response) {
                if (data.results.length > 50) {
                    this.navigateToSizing();
                }
                var prodBtn = this.applicationModelRead("/controls/toggleProdKonfButton");
                if (data.results.length === 1) {
                    this.applicationModelRead("/controls/btnGoToSelection").setText(this.getText("enterKonfigDataSheet"));
                    prodBtn.setEnabled(true);
                } else {
                    this.applicationModelRead("/controls/btnGoToSelection").setText(this.getText("goToSelection"));
                    prodBtn.setEnabled(false);
                }
                this.applicationDataModelWrite("/selectionProducts", data.results, false);
            },

            _setProductsForSelectionExpanded: function (data, response) {
                if (data.results.length > 50) {
                    this.navigateToSizing();
                }
                data.results.forEach(element => {
                    if (!element.Image_url) {
                        element.Image_url = "img/Symbolbild_POSV.png";
                    }
                });
                this.applicationDataModelWrite("/backNavEnabled", true);
                this.applicationDataModelWrite("/selectionProducts", data.results, false);
            },

            getLanguages: function (fnCallbackSuccess, fnCallbackError) {
                try {
                    var parameter = {
                        action: "getLanguages"
                    };
                    return this.readEntitySet("languageSet", parameter, fnCallbackSuccess || jQuery.proxy(this._getLanguagesSuccess, this), fnCallbackError);
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            _getLanguagesSuccess: function (data, response) {
                this.applicationDataModelWrite("/languageSet", data.results, false);
            },

            geti18n: function (fnCallbackSuccess, fnCallbackError) {
                try {
                    var parameter = {
                        action: "geti18n",
                        headers: {
                            spras: "DE"
                        }
                    };
                    return this.readEntitySet("i18n", parameter, fnCallbackSuccess || jQuery.proxy(this._geti18nSuccess, this), fnCallbackError || jQuery.proxy(this._geti18nError, this));
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            _geti18nSuccess: function (data, response) {
                var i18n = {},
                    prop;
                for (var n = 0; n < data.results.length; n++) {
                    prop = data.results[n];
                    i18n[prop.ID] = prop.DESCR;
                }

                this.applicationDataModelWrite("/i18n", i18n, true);
            },

            _geti18nError: function (data, response) {},

            getCurrentConfiguration: function (fnCallbackSuccess, fnCallbackError) {
                try {
                    var parameter = {
                        action: "getCurrentConfiguration"
                    };
                    return this.readEntitySet(
                        "currentConfiguration",
                        parameter,
                        fnCallbackSuccess || jQuery.proxy(this._getCurrentConfigurationSuccess, this),
                        fnCallbackError || jQuery.proxy(this._getCurrentConfigurationError, this)
                    );
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            _getCurrentConfigurationSuccess: function (data, response) {
                this.applicationDataModelWrite("/currentConfiguration", data.results, true);
                if (data.results.length === 0) {
                    this.applicationDataModelWrite("/selectionProducts", [], false);
                }
            },

            _getCurrentConfigurationError: function (error) {
                this.applicationDataModelWrite("/currentConfiguration", null, false);
            },

            populateCurrentConfigurationForSelection: function () {
                const results = this.applicationDataModelRead("/currentConfiguration");
               
                let oModel = [];
                if (this.applicationModelRead("/customizing/sizingViewType") === "02") {
                    const groupL = this.applicationDataModelRead(
                        "/characteristicGroupsExpL"
                      );
                      const groupR = this.applicationDataModelRead(
                        "/characteristicGroupsExpR"
                      );
                      const characteristicGroups = groupL.concat(groupR);
                      characteristicGroups.forEach((e) => {

                        let obj = {
                            key: "<strong>" + e.DESCRIPTION + "<strong>",
                            text: ""
                        };
                        oModel.push(obj);
                        e.characteristics.results.forEach((c) =>{
                            if(c.GRUPPE === e.GRUPPE){
                                if(c.values.results.length > 1){
                                    for (let i = 0; i < c.values.results.length; i++) {
                                        //c.values.results[i];
                                        let key = (i === 0 ) ? c.ATBEZ : " ";
                                        let obj = { 
                                            key: key ,
                                            text: c.values.results[i].ATWRT_DISP
                                        };

                                        oModel.push(obj);
                                    }

                                } else if(c.values.results.length === 1) {
                                let obj = {
                                    key: c.ATBEZ ,
                                    text: c.values.results[0].ATWRT_DISP
                                };
                                oModel.push(obj);
                            }
    
                                
                            }
                        });
                    });




                } else {
                const characteristicGroups = this.applicationDataModelRead("/characteristicCategories/1/characteristicGroups/results");         
                characteristicGroups.forEach(function (group) {
                    delete group.groupings;
                    let obj = {
                        key: "<strong>" + group.DESCRIPTION + "<strong>",
                        text: ""
                    };
                    oModel.push(obj);
                    results.forEach(function (char) {
                        if (char.GRUPPE === group.GRUPPE) {
                            let obj = {
                                key: char.ATBEZ ,
                                text: char.ATWTB
                            };

                            oModel.push(obj);

                        }
                    });
                    
               
                });
            }
                

                this.applicationDataModelWrite("/currentConfigurationForSelection", oModel, false);
            },

            deleteCurrentConfigurationForSelection: function () {
                this.applicationDataModelWrite("/currentConfigurationForSelection", null, false);
            },

            setCharacteristicValue: function (characteristic, characteristicValue, fnCallbackSuccess, fnCallbackError) {
                $("body").css("cursor", "progress");
                $("body").append('<div id="overlay" style="background-color:transparent;position:absolute;top:0;left:0;height:100%;width:100%;z-index:999"></div>');
                try {
                    var rating = [
                        {
                            atnam: characteristic,
                            atwrt: characteristicValue
                        }
                    ];
                    var parameter = {
                        action: "setCharacteristicValue",
                        busy: true,
                        keys: {
                            INSTANCE: this.applicationDataCurrentInstanceRead() || 1
                        },
                        headers: {
                            json: JSON.stringify(rating),
                            mode: "U"
                        }
                    };
                    return this.createEntity(
                        "configValueChange",
                        parameter,
                        fnCallbackSuccess || jQuery.proxy(this.changeCharacteristicValueSuccess, this),
                        fnCallbackError || jQuery.proxy(this.changeCharacteristicValueError, this)
                    );
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            setCharacteristicValueConfig: function (characteristic, characteristicValue, fnCallbackSuccess, fnCallbackError) {
                try {
                    var rating = [
                        {
                            atnam: characteristic,
                            atwrt: characteristicValue
                        }
                    ];
                    var parameter = {
                        action: "setCharacteristicValue",
                        busy: true,
                        keys: {
                            INSTANCE: this.applicationDataCurrentInstanceRead() || 1
                        },
                        headers: {
                            json: JSON.stringify(rating),
                            mode: "U"
                        }
                    };
                    return this.createEntity(
                        "configValueChange",
                        parameter,

                        function () {
                            this.getInstanceInfo();
                            this.getCharacteristicCategoryWithGroups();
                            this.getCurrentConfiguration();
                            this.getSideNavigation();
                        }.bind(this),
                        function () {
                            this.getInstanceInfo();
                            this.getCharacteristicCategoryWithGroups();
                            this.getCurrentConfiguration();
                            this.getSideNavigation();
                        }.bind(this)
                    );
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            deleteCharacteristicValue: function (characteristic, characteristicValues, fnCallbackSuccess, fnCallbackError) {
                try {
                    var deleting = [];
                    //for (var value in characteristicValues) {
                   //     deleting.push({
                    //        atnam: characteristic,
                    //        atwrt: characteristicValues[value]
                   //     });
                   // }
                   characteristicValues.forEach(value => {
                    deleting.push({
                        atnam: characteristic,
                        atwrt: value
                    });
                });
                    var parameter = {
                        action: "deleteCharacteristicValue",
                        busy: true,
                        keys: {
                            INSTANCE: this.applicationDataCurrentInstanceRead() || 1
                        },
                        headers: {
                            json: JSON.stringify(deleting),
                            mode: "D"
                        }
                    };
                    return this.createEntity(
                        "configValueChange",
                        parameter,
                        fnCallbackSuccess || jQuery.proxy(this.changeCharacteristicValueSuccess, this),
                        fnCallbackError || jQuery.proxy(this.changeCharacteristicValueError, this)
                    );
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            changeCharacteristicValueSuccess: function (data, response) {
                var sHash = this.getComponent().getRouter().getHashChanger().getHash();
                this.rotateSyncButton(false);
                this.getInstanceInfo();
                this.getCharacteristicCategoryWithGroups();
                this.getCurrentConfiguration();
                if (!sHash.includes("ConfigurationRoute")) {
                    this.getProductsForSelection();
                } else {
                    this.getSideNavigation();
                    //this.changeStatusDisplayConfigurationPage(data);
                }
            },

            //Ampel Display
            changeStatusDisplayConfigurationPage: function (data, context) {
                try {
                    var sStatus = data.STATUS ? data.STATUS : data.VALUE;

                    switch (sStatus) {
                        case "F":
                            this.applicationDataModelWrite("/saveBtn/active", true);
                            this.applicationDataModelWrite("/trafficLight/red", "transparent");
                            this.applicationDataModelWrite("/trafficLight/yellow", "transparent");
                            this.applicationDataModelWrite("/trafficLight/green", "green");
                            break;
                        case "I":
                            this.applicationDataModelWrite("/saveBtn/active", true);
                            this.applicationDataModelWrite("/trafficLight/red", "transparent");
                            this.applicationDataModelWrite("/trafficLight/yellow", "yellow");
                            this.applicationDataModelWrite("/trafficLight/green", "transparent");
                            break;
                        case "E":
                            this.applicationDataModelWrite("/saveBtn/active", false);
                            this.applicationDataModelWrite("/trafficLight/red", "red");
                            this.applicationDataModelWrite("/trafficLight/yellow", "transparent");
                            this.applicationDataModelWrite("/trafficLight/green", "transparent");
                            break;
                        default:
                            //do all others
                            break;
                    }
                } catch (e) {
                    this.showLogOnConsole(e.message);
                }
            },

            changeCharacteristicValueError: function (error) {
                this.rotateSyncButton(false);
                this.getInstanceInfo();
                this.getCharacteristicCategoryWithGroups();
                this.getCurrentConfiguration();
                this.getProductsForSelection();
            },

            navigateToSizing: function (matnr) {
                var key = "ProductFindungSizingRoute";
                this.getComponent()
                    .getRouter()
                    .navTo(key, {
                        matnr: matnr || this.applicationDataModelRead("/sizingMaterialData/VALUE")
                    });
                this.setPressedToggleButton("idTogSizing");
            },

            navigateToSelection: function (matnr) {
                var key = "ProductFindungSelectionRoute";
                this.getComponent()
                    .getRouter()
                    .navTo(key, {
                        matnr: matnr || this.applicationDataModelRead("/sizingMaterialData/VALUE")
                    });
                this.setPressedToggleButton("idTogSelection");
            },

            createGroupingControl: function (id, context) {
                var that = this;
                var object = context.getObject();
                var groupings = object.groupings.results;
                var characteristics = object.characteristics.results;

                var bindingData = this._getBindingData(context, groupings, characteristics);
                var path = bindingData.path;
                var factoryFunction = bindingData.factoryFunction;

                function createVerticalLayoutControl(showDescription, showInfo) {
                    var template = new VBox({
                        width: "auto",
                        layoutData: new FlexItemData({
                            styleClass: "customFlexBoxVerticalGroupingItem"
                        })
                    });

                    if (showDescription) {
                        if (showInfo) {
                            var oHBoxTitle = new HBox({
                                width: "auto",
                                layoutData: new FlexItemData({
                                    styleClass: "customFlexBoxHorizontalGroupingItem"
                                })
                            });
                            oHBoxTitle.addItem(
                                new Title({
                                    text: object.DESCRIPTION,
                                    level: "H2",
                                    titleStyle: "H2"
                                }).addStyleClass("customFlexGroupingItemTitle")
                            );
                            oHBoxTitle.addItem(
                                new Button({
                                    type: "Transparent",
                                    icon: "sap-icon://sys-help-2",
                                    visible: {
                                        path: "applicationData>INFO",
                                        formatter: formatter.showHelpButtonByInfoText
                                    },
                                    press: that.showCharacteristicInfoText.bind(that),
                                    layoutData: new FlexItemData({
                                        styleClass: "vcCharHelpButtonData"
                                    })
                                })
                                    .addStyleClass("vcCharHelpButton")
                                    .addDependent(
                                        new sap.ui.core.Item({
                                            key: "characteristic"
                                        })
                                    )
                            );
                            template.addItem(oHBoxTitle).addStyleClass("customFlexGroupingItemTitle");
                        } else {
                            template.addItem(
                                new Title({
                                    text: object.DESCRIPTION,
                                    level: "H2",
                                    titleStyle: "H2"
                                }).addStyleClass("customFlexGroupingItemTitle")
                            );
                        }
                    }

                    var aggrItem = new VBox({
                        width: "auto",
                        layoutData: new FlexItemData({
                            styleClass: "customFlexBoxVerticalGroupingItem"
                        })
                    });

                    if (factoryFunction) {
                        aggrItem.bindAggregation("items", {
                            path: path,
                            factory: jQuery.proxy(factoryFunction, that)
                        });
                    }

                    template.addItem(aggrItem);

                    return template;
                }

                function createHorizontalLayoutControl(showDescription, showInfo) {
                    if (showDescription) {
                        var template = new VBox({
                            width: "auto",
                            layoutData: new FlexItemData({
                                styleClass: "customFlexBoxHorizontalGroupingItem"
                            })
                        });

                        if (showInfo) {
                            var oHBoxTitle = new HBox({
                                width: "auto",
                                layoutData: new FlexItemData({
                                    styleClass: "customFlexBoxHorizontalGroupingItem"
                                })
                            });
                            oHBoxTitle.addItem(
                                new Title({
                                    text: object.DESCRIPTION,
                                    level: "H2",
                                    titleStyle: "H2"
                                }).addStyleClass("customFlexGroupingItemTitle")
                            );
                            oHBoxTitle.addItem(
                                new Button({
                                    type: "Transparent",
                                    icon: "sap-icon://sys-help-2",
                                    visible: {
                                        path: "applicationData>INFO",
                                        formatter: formatter.showHelpButtonByInfoText
                                    },
                                    press: that.showCharacteristicInfoText.bind(that),
                                    layoutData: new FlexItemData({
                                        styleClass: "vcCharHelpButtonData"
                                    })
                                })
                                    .addStyleClass("vcCharHelpButton")
                                    .addDependent(
                                        new sap.ui.core.Item({
                                            key: "characteristic"
                                        })
                                    )
                            );
                            template.addItem(oHBoxTitle).addStyleClass("customFlexGroupingItemTitle");
                        } else {
                            template.addItem(
                                new Title({
                                    text: object.DESCRIPTION,
                                    level: "H2",
                                    titleStyle: "H2"
                                }).addStyleClass("customFlexGroupingItemTitle")
                            );
                        }

                        var aggrItem = new HBox({
                            width: "auto",
                            alignItems: "Baseline",
                            layoutData: new FlexItemData({
                                styleClass: "customFlexBoxHorizontalGroupingItem"
                            })
                        });

                        if (factoryFunction) {
                            aggrItem.bindAggregation("items", {
                                path: path,
                                factory: jQuery.proxy(factoryFunction, that)
                            });
                        }

                        template.addItem(aggrItem);
                    } else {
                        template = new HBox({
                            width: "100%",
                            alignItems: "Baseline",
                            layoutData: new FlexItemData({
                                styleClass: "customFlexBoxHorizontalGroupingItem"
                            })
                        });
                        if (factoryFunction) {
                            template.bindAggregation("items", {
                                path: path,
                                factory: jQuery.proxy(factoryFunction, that)
                            });
                        }
                    }

                    return template;
                }

                switch (object.LAYOUT) {
                    case "H":
                        return createHorizontalLayoutControl(object.SHOW_DESCRIPTION, object.INFO);
                    case "V":
                    default:
                        return createVerticalLayoutControl(object.SHOW_DESCRIPTION, object.INFO);
                }
            },

            _getBindingData: function (context, groupings, characteristics) {
                // Create content template for characteristic control
                if (groupings && groupings.length > 0) {
                    var path = "applicationData>" + context.getPath() + "/groupings/results";
                    var factoryFunction = this.createGroupingControl;
                } else if (characteristics && characteristics.length > 0) {
                    path = "applicationData>" + context.getPath() + "/characteristics/results";
                    factoryFunction = this.createCharacteristicControl;
                }

                return {
                    path: path,
                    factoryFunction: factoryFunction
                };
            },

            createCharacteristicControlExp: function (object, sObjPath) {
                var layout = object.LAYOUT;
                var path = sObjPath;
                switch (layout) {
                    case "R":
                        var itemTemplate = new sap.m.RadioButton({
                            id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                            text: "{applicationData>ATWTB}" + "{applicationData>ATWRT_DISP}",
                            useEntireWidth: true
                        });

                        var template = new RadioButtonGroup({
                            editable: {
                                path: "applicationData>" + path + "/NO_INPUT",
                                formatter: formatter.setCharacteristicNoInput
                            },
                            select: jQuery.proxy(this.onRBGroupSelect, this),
                            modelContextChange: this.characteristicRBControlModelContextChange
                        })
                            .addStyleClass("characteristicExp")
                            .bindButtons({
                                path: "applicationData>" + path + "/values/results",
                                template: itemTemplate
                            });
                        template._atnam = object.ATNAM;
                        template.onAfterRendering = this.characteristicRBControlAfterRendering;
                        break;
                    case "M":
                        var itemTemplate = new CustomListItem({
                            id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                            content: [
                                new HBox({
                                    width: "auto",
                                    items: [
                                        new sap.ui.layout.VerticalLayout({
                                            content: [
                                                new Text({
                                                    text: "{applicationData>ATWRT_DISP}"
                                                }),
                                                new Text({
                                                    text: "{applicationData>ATWTB}"
                                                })
                                            ]
                                        }),
                                        new Text({
                                            text: "{applicationData>INFO}"
                                        }),
                                        new Image({
                                            src: "{applicationData>URL}",
                                            visible: "{= ${applicationData>URL} !== '' ? true : false}"
                                        })
                                    ]
                                })
                            ]
                        });

                        var template = new List({
                            editable: {
                                path: "applicationData>" + path + "/NO_INPUT",
                                formatter: formatter.setCharacteristicNoInput
                            },
                            mode: layout === "M" ? "MultiSelect" : "SingleSelectLeft",
                            selectionChange: jQuery.proxy(this.onListItemSelect, this),
                            modelContextChange: this.characteristicListControlModelContextChange
                        })
                            .addStyleClass("characteristicExp")
                            .bindItems({
                                path: "applicationData>" + path + "/values/results",
                                template: itemTemplate
                            });
                        template._atnam = object.ATNAM;
                        template.onAfterRendering = this.characteristicListControlAfterRendering;
                        break;
                    case "C":
                        itemTemplate = new sap.ui.core.Item({
                            text: "{applicationData>ATWRT_DISP}",
                            key: "{applicationData>ATWRT}"
                        });

                        template = new ComboBox({
                            id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                            editable: {
                                path: "applicationData>" + path + "/NO_INPUT",
                                formatter: formatter.setCharacteristicNoInput
                            },
                            required: {
                                path: "applicationData>OBLIGATORY",
                                formatter: formatter.setRequiredByState
                            },
                            placeholder: {
                                parts: [
                                    {
                                        path: "applicationData>ATNAM_DISCR_TYPE"
                                    },
                                    {
                                        path: "applicationData>VALUE_DISP"
                                    }
                                ],
                                formatter: formatter.showPlaceholderByDisplayType
                            },
                            change: jQuery.proxy(this.onCBValueChanged, this),
                            modelContextChange: this.characteristicComboBoxControlModelContextChangeExp
                        })
                            .addStyleClass("characteristicComboBox")
                            .addStyleClass("characteristicExp")
                            .bindItems({
                                path: "applicationData>" + path + "/values/results",
                                template: itemTemplate
                            });
                        template._atnam = object.ATNAM;
                        template.onAfterRendering = this.characteristicComboBoxControlAfterRendering;
                        break;
                    case "T":
                    default:
                        template = new Input({
                            id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                            editable: {
                                path: "applicationData>" + path + "/NO_INPUT",
                                formatter: formatter.setCharacteristicNoInput
                            },
                            required: {
                                path: "applicationData>OBLIGATORY",
                                formatter: formatter.setRequiredByState
                            },
                            placeholder: {
                                parts: [
                                    {
                                        path: "applicationData>ATNAM_DISCR_TYPE"
                                    },
                                    {
                                        path: "applicationData>VALUE_DISP"
                                    }
                                ],
                                formatter: formatter.showPlaceholderByDisplayType
                            },
                            type: "Text",
                            change: jQuery.proxy(this.onInputValueChanged, this),
                            modelContextChange: this.characteristicInputControlModelContextChangeExp
                        })
                            .addStyleClass("characteristicExp")
                            .addDependent(
                                new sap.ui.core.Item({
                                    key: path
                                })
                            );
                        template._atnam = object.ATNAM;
                        if (object.values.results.length > 0) {
                            template.setValue(object.values.results[0].ATWRT_DISP);
                        } else {
                            template.setValue("");
                        }
                        template.onAfterRendering = this.characteristicInputControlAfterRendering;
                }
                var aIds = this.applicationModelRead("/expViewCtrls");
                aIds.push(template);
                this.applicationModelWrite("/expViewCtrls", aIds);
                return template;
            },

            createCharacteristicControl: function (id, context) {
                var regex = new RegExp("^(trenner|separator)_?[0-9]*$", "gmi");
                var that = this;
                var object = context.getObject();
                var path = context.getPath();
                var layout = object.LAYOUT;

                switch (layout) {
                    case "R":
                    case "M":
                        var itemTemplate = new CustomListItem({
                            content: [
                                new HBox({
                                    id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                                    width: "auto",
                                    items: [
                                        new sap.ui.layout.VerticalLayout({
                                            content: [
                                                new Text({
                                                    text: "{applicationData>ATWRT_DISP}"
                                                }),
                                                new Text({
                                                    text: "{applicationData>ATWTB}"
                                                })
                                            ]
                                        }),
                                        new Text({
                                            text: "{applicationData>INFO}"
                                        }),
                                        new Image({
                                            src: "{applicationData>URL}",
                                            visible: "{= ${applicationData>URL} !== '' ? true : false}"
                                        })
                                    ]
                                })
                            ]
                        });

                        var template = new List({
                            blocked: object.NO_INPUT !== "X" ? false : true,
                            mode: layout === "M" ? "MultiSelect" : "SingleSelectLeft",
                            selectionChange: jQuery.proxy(that.onListItemSelect, this),
                            modelContextChange: that.characteristicListControlModelContextChange
                        }).bindItems({
                            path: "applicationData>" + path + "/values/results",
                            template: itemTemplate
                        });
                        template._atnam = object.ATNAM;
                        template.onAfterRendering = this.characteristicListControlAfterRendering;
                        break;
                    case "C":
                        itemTemplate = new sap.ui.core.Item({
                            text: "{applicationData>ATWRT_DISP}",
                            key: "{applicationData>ATWRT}"
                        });
                        template = new ComboBox({
                            id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                            enabled: {
                                path: "applicationData>NO_INPUT",
                                formatter: formatter.setCharacteristicNoInput
                            },
                            required: {
                                path: "applicationData>OBLIGATORY",
                                formatter: formatter.setRequiredByState
                            },
                            placeholder: {
                                parts: [
                                    {
                                        path: "applicationData>ATNAM_DISCR_TYPE"
                                    },
                                    {
                                        path: "applicationData>ATBEZ"
                                    }
                                ],
                                formatter: formatter.showPlaceholderByDisplayType
                            },
                            change: jQuery.proxy(that.onCBValueChanged, this),
                            modelContextChange: that.characteristicComboBoxControlModelContextChange
                        })
                            .addStyleClass("characteristicComboBox")
                            .bindItems({
                                path: "applicationData>" + path + "/values/results",
                                template: itemTemplate
                            });
                        template._atnam = object.ATNAM;
                        template.addStyleClass("generatedInput");
                        template.onAfterRendering = this.characteristicComboBoxControlAfterRendering;
                        break;
                    case "U":
                        itemTemplate = new sap.ui.core.Item({
                            text: "{applicationData>ATWRT_DISP}",
                            key: "{applicationData>ATWRT}"
                        });
                        template = new MultiComboBox({
                            id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                            enabled: {
                                path: "applicationData>NO_INPUT",
                                formatter: formatter.setCharacteristicNoInput
                            },
                            required: {
                                path: "applicationData>OBLIGATORY",
                                formatter: formatter.setRequiredByState
                            },
                            placeholder: {
                                parts: [
                                    {
                                        path: "applicationData>ATNAM_DISCR_TYPE"
                                    },
                                    {
                                        path: "applicationData>ATBEZ"
                                    }
                                ],
                                formatter: formatter.showPlaceholderByDisplayType
                            },
                            selectionChange: jQuery.proxy(that.onMCBValueChanged, this),
                            modelContextChange: that.characteristicMultiComboBoxControlModelContextChange
                        })
                            .addStyleClass("characteristicComboBox")
                            .bindItems({
                                path: "applicationData>" + path + "/values/results",
                                template: itemTemplate
                            });
                        template.addStyleClass("generatedInputConfig");
                        template._atnam = object.ATNAM;
                        template.onAfterRendering = this.characteristicMultiComboBoxControlAfterRendering;
                        break;
                    case "T":
                    default:
                        template = new Input({
                            id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                            enabled: {
                                path: "applicationData>NO_INPUT",
                                formatter: formatter.setCharacteristicNoInput
                            },
                            required: {
                                path: "applicationData>OBLIGATORY",
                                formatter: formatter.setRequiredByState
                            },
                            placeholder: {
                                parts: [
                                    {
                                        path: "applicationData>ATNAM_DISCR_TYPE"
                                    },
                                    {
                                        path: "applicationData>ATBEZ"
                                    }
                                ],
                                formatter: formatter.showPlaceholderByDisplayType
                            },
                            type: "Text",
                            modelContextChange: this.characteristicInputControlModelContextChange,
                            change: jQuery.proxy(that.onInputValueChanged, this)
                        });
                        template._atnam = object.ATNAM;
                        template.addStyleClass("generatedInput");
                        template.onAfterRendering = this.characteristicInputControlAfterRendering;
                        if (object.values.results.length > 0) {
                            template.setValue(object.values.results[0].ATWRT_DISP);
                        } else {
                            template.setValue("");
                        }
                }
                if (object.ATBEZ.endsWith(":")) {
                    object.ATBEZ = object.ATBEZ.slice(0, -1);
                }
                var vBox = new VBox({
                    width: "auto",
                    visible: {
                        path: "applicationData>NO_DISPLAY",
                        formatter: formatter.setCharacteristicNoDisplay
                    },
                    items: [
                        new HBox({
                            alignItems: "Center",
                            items: [
                                new Text({
                                    text: object.ATNAM_DISCR_TYPE === "" || object.ATNAM_DISCR_TYPE === "B" ? object.ATBEZ : ""
                                }).addStyleClass("vcLabel fontStandard"),
                                new Button({
                                    type: "Transparent",
                                    icon: "sap-icon://sys-help-2",
                                    visible: {
                                        path: "applicationData>INFO",
                                        formatter: formatter.showHelpButtonByInfoText
                                    },
                                    press: that.showCharacteristicInfoText.bind(that),
                                    layoutData: new FlexItemData({
                                        styleClass: "vcCharHelpButtonData"
                                    })
                                })
                                    .addStyleClass("vcCharHelpButton")
                                    .addDependent(
                                        new sap.ui.core.Item({
                                            key: "characteristic"
                                        })
                                    )
                            ]
                        }),
                        new HBox({
                            alignItems: "Center",
                            items: [
                                template,
                                new Button({
                                    type: "Transparent",
                                    icon: "sap-icon://sys-help-2",
                                    visible: {
                                        path: "applicationData>values/results",
                                        formatter: formatter.showHelpButtonBySelectedValue
                                    },
                                    press: that.showCharacteristicInfoText.bind(that),
                                    layoutData: new FlexItemData({
                                        styleClass: "vcCharHelpButtonData"
                                    })
                                })
                                    .addStyleClass("vcCharHelpButton")
                                    .addDependent(
                                        new sap.ui.core.Item({
                                            key: "characteristicValue"
                                        })
                                    )
                            ]
                        })
                    ]
                }).setLayoutData(
                    new FlexItemData({
                        styleClass: "customFlexBoxCharacteristicItem " + object.ATNAM
                    })
                );
                if (object.OBLIGATORY) {
                    vBox.addStyleClass("vcObligatory");
                }
                if (regex.test(object.ATNAM)) {
                    vBox.removeAllItems();
                }
                return vBox;
            },

            cleanLink: function () {
                const newSearch = window.location.search.replace(/&?config(?:id|uuid)=[^&]*/g, "");
                window.location.search = newSearch.startsWith("&") ? newSearch.substring(1) : newSearch;
            },

            createCharacteristicControlConfig: function (id, context) {
                var regex = new RegExp("^(trenner|separator)_?[0-9]*$", "gmi");
                var that = this;
                var object = context.getObject();
                var path = context.getPath();
                var layout = object.LAYOUT;
                if (object.ATBEZ.endsWith(":")) {
                    object.ATBEZ = object.ATBEZ.slice(0, -1);
                }
                switch (layout) {
                    case "R":
                    case "M":
                        var itemTemplate = new CustomListItem({
                            content: [
                                new HBox({
                                    id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                                    width: "auto",
                                    items: [
                                        new sap.ui.layout.VerticalLayout({
                                            content: [
                                                new Text({
                                                    text: "{applicationData>ATWRT_DISP}"
                                                }),
                                                new Text({
                                                    text: "{applicationData>ATWTB}"
                                                })
                                            ]
                                        }),
                                        new Text({
                                            text: "{applicationData>INFO}"
                                        }),
                                        new Image({
                                            src: "{applicationData>URL}",
                                            visible: "{= ${applicationData>URL} !== '' ? true : false}"
                                        })
                                    ]
                                })
                            ]
                        });

                        var template = new List({
                            blocked: object.NO_INPUT !== "X" ? false : true,
                            mode: layout === "M" ? "MultiSelect" : "SingleSelectLeft",
                            selectionChange: jQuery.proxy(that.onListItemSelectConfig, this),
                            modelContextChange: that.characteristicListControlModelContextChange
                        }).bindItems({
                            path: "applicationData>" + path + "/values/results",
                            template: itemTemplate
                        });
                        template._atnam = object.ATNAM;
                        template.onAfterRendering = this.characteristicListControlAfterRendering;
                        break;
                    case "C":
                        itemTemplate = new sap.ui.core.Item({
                            text: "{applicationData>ATWRT_DISP}",
                            key: "{applicationData>ATWRT}"
                        });
                        template = new ComboBox({
                            id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                            enabled: {
                                path: "applicationData>NO_INPUT",
                                formatter: formatter.setCharacteristicNoInput
                            },
                            required: {
                                path: "applicationData>OBLIGATORY",
                                formatter: formatter.setRequiredByState
                            },
                            placeholder: {
                                parts: [
                                    {
                                        path: "applicationData>ATNAM_DISCR_TYPE"
                                    },
                                    {
                                        path: "applicationData>ATBEZ"
                                    }
                                ],
                                formatter: formatter.showPlaceholderByDisplayType
                            },
                            change: jQuery.proxy(that.onCBValueChangedConfig, this),
                            modelContextChange: that.characteristicComboBoxControlModelContextChange
                        })
                            .addStyleClass("characteristicComboBox")
                            .bindItems({
                                path: "applicationData>" + path + "/values/results",
                                template: itemTemplate
                            });
                        template._atnam = object.ATNAM;
                        template.addStyleClass("generatedInputConfig");
                        template.onAfterRendering = this.characteristicComboBoxControlAfterRendering;
                        break;
                    case "U":
                        itemTemplate = new sap.ui.core.Item({
                            text: "{applicationData>ATWRT_DISP}",
                            key: "{applicationData>ATWRT}"
                        });
                        template = new MultiComboBox({
                            id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                            enabled: {
                                path: "applicationData>NO_INPUT",
                                formatter: formatter.setCharacteristicNoInput
                            },
                            required: {
                                path: "applicationData>OBLIGATORY",
                                formatter: formatter.setRequiredByState
                            },
                            placeholder: {
                                parts: [
                                    {
                                        path: "applicationData>ATNAM_DISCR_TYPE"
                                    },
                                    {
                                        path: "applicationData>ATBEZ"
                                    }
                                ],
                                formatter: formatter.showPlaceholderByDisplayType
                            },
                            selectionChange: jQuery.proxy(that.onMCBValueChangedConfig, this),
                            modelContextChange: that.characteristicMultiComboBoxControlModelContextChange
                        })
                            .addStyleClass("characteristicComboBox")
                            .bindItems({
                                path: "applicationData>" + path + "/values/results",
                                template: itemTemplate
                            });
                        template.addStyleClass("generatedInputConfig");
                        template._atnam = object.ATNAM;
                        template.onAfterRendering = this.characteristicMultiComboBoxControlAfterRendering;
                        break;
                    case "T":
                    default:
                        template = new Input({
                            id: object.ATNAM + "-" + Math.random().toString().substr(2, 6),
                            enabled: {
                                path: "applicationData>NO_INPUT",
                                formatter: formatter.setCharacteristicNoInput
                            },
                            required: {
                                path: "applicationData>OBLIGATORY",
                                formatter: formatter.setRequiredByState
                            },
                            placeholder: {
                                parts: [
                                    {
                                        path: "applicationData>ATNAM_DISCR_TYPE"
                                    },
                                    {
                                        path: "applicationData>ATBEZ"
                                    }
                                ],
                                formatter: formatter.showPlaceholderByDisplayType
                            },
                            type: "Text",
                            modelContextChange: this.characteristicInputControlModelContextChange,
                            change: jQuery.proxy(that.onInputValueChangedConfig, this)
                        });
                        template.addStyleClass("generatedInputConfig");
                        template.onAfterRendering = this.characteristicInputControlAfterRendering;
                        template._atnam = object.ATNAM;
                        if (object.values.results.length > 0) {
                            template.setValue(object.values.results[0].ATWRT_DISP);
                        } else {
                            template.setValue("");
                        }
                }
                if (object.UNIT) {
                    switch (object.UNIT.LAYOUT) {
                        case "R":
                        case "M":
                            var unitTemplate = new CustomListItem({
                                content: [
                                    new HBox({
                                        id: object.UNIT.ATNAM + "-" + Math.random().toString().substr(2, 6),
                                        width: "auto",
                                        items: [
                                            new sap.ui.layout.VerticalLayout({
                                                content: [
                                                    new Text({
                                                        text: "{applicationData>ATWRT_DISP}"
                                                    }),
                                                    new Text({
                                                        text: "{applicationData>ATWTB}"
                                                    })
                                                ]
                                            }),
                                            new Text({
                                                text: "{applicationData>INFO}"
                                            }),
                                            new Image({
                                                src: "{applicationData>URL}",
                                                visible: "{= ${applicationData>URL} !== '' ? true : false}"
                                            })
                                        ]
                                    })
                                ]
                            });

                            var templateUnit = new List({
                                blocked: object.UNIT.NO_INPUT !== "X" ? false : true,
                                mode: layout === "M" ? "MultiSelect" : "SingleSelectLeft",
                                selectionChange: jQuery.proxy(that.onListItemSelect, this),
                                modelContextChange: that.characteristicListControlModelContextChange
                            }).bindItems({
                                path: "applicationData>" + path + "/values/results",
                                templateUnit: unitTemplate
                            });
                            templateUnit.addStyleClass("sapUiTinyMarginBegin");
                            templateUnit.addStyleClass("generatedInputConfig");
                            templateUnit._atnam = object.UNIT.ATNAM;
                            templateUnit.onAfterRendering = this.characteristicListControlAfterRendering;
                            break;
                        case "C":
                            unitTemplate = new sap.ui.core.Item({
                                text: "{applicationData>ATWRT_DISP}",
                                key: "{applicationData>ATWRT}"
                            });
                            templateUnit = new ComboBox({
                                id: object.UNIT.ATNAM + "-" + Math.random().toString().substr(2, 6),
                                enabled: {
                                    path: "applicationData>NO_INPUT",
                                    formatter: formatter.setCharacteristicNoInput
                                },
                                required: {
                                    path: "applicationData>OBLIGATORY",
                                    formatter: formatter.setRequiredByState
                                },
                                placeholder: {
                                    parts: [
                                        {
                                            path: "applicationData>ATNAM_DISCR_TYPE"
                                        },
                                        {
                                            path: "applicationData>ATBEZ"
                                        }
                                    ],
                                    formatter: formatter.showPlaceholderByDisplayType
                                },
                                change: jQuery.proxy(that.onCBValueChanged, this),
                                modelContextChange: that.characteristicComboBoxControlModelContextChange
                            })
                                .addStyleClass("characteristicComboBox")
                                .bindItems({
                                    path: "applicationData>" + path + "/UNIT/values/results",
                                    template: unitTemplate
                                });
                            templateUnit._atnam = object.UNIT.ATNAM;
                            templateUnit.addStyleClass("sapUiTinyMarginBegin");
                            templateUnit.addStyleClass("generatedInputConfig");
                            templateUnit.onAfterRendering = this.characteristicComboBoxControlAfterRendering;
                            break;
                        case "T":
                        default:
                            templateUnit = new Input({
                                id: object.UNIT.ATNAM + "-" + Math.random().toString().substr(2, 6),
                                enabled: {
                                    path: "applicationData>NO_INPUT",
                                    formatter: formatter.setCharacteristicNoInput
                                },
                                required: {
                                    path: "applicationData>OBLIGATORY",
                                    formatter: formatter.setRequiredByState
                                },
                                placeholder: {
                                    parts: [
                                        {
                                            path: "applicationData>ATNAM_DISCR_TYPE"
                                        },
                                        {
                                            path: "applicationData>ATBEZ"
                                        }
                                    ],
                                    formatter: formatter.showPlaceholderByDisplayType
                                },
                                type: "Text",
                                modelContextChange: this.characteristicInputControlModelContextChange,
                                change: jQuery.proxy(that.onInputValueChanged, this)
                            });
                            templateUnit._atnam = object.UNIT.ATNAM;
                            templateUnit.addStyleClass("sapUiTinyMarginBegin");
                            templateUnit.addStyleClass("generatedInputConfig");
                            templateUnit.onAfterRendering = this.characteristicInputControlAfterRendering;
                            if (object.UNIT.values.results.length > 0) {
                                templateUnit.setValue(object.UNIT.values.results[0].ATWRT_DISP);
                            } else {
                                templateUnit.setValue("");
                            }
                    }
                }

                var oParentGrid = new sap.ui.layout.Grid({
                    defaultSpan: "XL4 L4 M4 S12",
                    width: "100%",
                    content: [
                        new HBox({
                            alignItems: "Center",
                            items: [
                                new Text({
                                    text: object.ATNAM_DISCR_TYPE === "" || object.ATNAM_DISCR_TYPE === "B" ? object.ATBEZ + ":" : ""
                                }).addStyleClass("vcLabel fontStandard")
                            ]
                        }),
                        new HBox({
                            alignItems: "Center",
                            layoutData: new sap.ui.layout.GridData({
                                span: "XL8 L8 M8 S12"
                            }),
                            items: [template, templateUnit]
                        })
                    ]
                });
                oParentGrid.setLayoutData(
                    new FlexItemData({
                        styleClass: "customFlexBoxCharacteristicItem " + object.ATNAM
                    })
                );
                oParentGrid.addStyleClass("noMargin");
                if (object.OBLIGATORY) {
                    oParentGrid.addStyleClass("vcObligatory");
                }
                if (regex.test(object.ATNAM)) {
                    oParentGrid.removeAllItems();
                }
                return oParentGrid;
            },

            saveChanges: function () {
                if (this.applicationDataModelRead("/expertSaveMode")) {
                    let deleteData = [];
                    let changeData = [];
                    let data = this.applicationDataModelRead("/changedData");

                    data.forEach(element => {
                        if (element.mode == "U") {
                            element.value.mode = "U";
                            changeData.push(element.value);
                        } else if (element.mode == "D") {
                            element.value.mode = "D";
                            changeData.push(element.value);
                        }
                    });
                    this.applicationDataModelWrite("/changedData", []);

                    if (deleteData.length > 0) {
                        var parameter = {
                            action: "deleteCharacteristicValue",
                            busy: true,
                            keys: {
                                INSTANCE: this.applicationDataCurrentInstanceRead() || 1
                            },
                            headers: {
                                json: JSON.stringify(deleteData),
                                mode: "D"
                            }
                        };

                        this.createEntity("configValueChange", parameter, jQuery.proxy(this.changeCharacteristicValueSuccess, this), jQuery.proxy(this.changeCharacteristicValueError, this));
                    }

                    if (changeData.length > 0) {
                        var parameter = {
                            action: "setCharacteristicValue",
                            busy: true,
                            keys: {
                                INSTANCE: this.applicationDataCurrentInstanceRead() || 1
                            },
                            headers: {
                                json: JSON.stringify(changeData),
                                mode: "U"
                            }
                        };

                        this.createEntity("configValueChange", parameter, jQuery.proxy(this.changeCharacteristicValueSuccess, this), jQuery.proxy(this.changeCharacteristicValueError, this));
                    }

                    if (changeData.length === 0 && deleteData.length === 0) {
                        this.rotateSyncButton(false);
                    }
                }
            },

            characteristicRBControlModelContextChange: function () {
                this.setSelectedIndex(-1);
                if (RadioButtonGroup.prototype.onAfterRendering) {
                    RadioButtonGroup.prototype.onAfterRendering.apply(this, arguments);
                }
                var selectedItem = this.getSelectedButton();
                if (selectedItem) {
                    var bindingContext = selectedItem.getBindingContext("applicationData");
                    var object = bindingContext.getObject();
                    this._atwrt = object.ATWRT;
                }
            },

            characteristicListControlAfterRendering: function () {
                if (List.prototype.onAfterRendering) {
                    List.prototype.onAfterRendering.apply(this, arguments);
                }
                var selectedItem = this.getSelectedItem();
                if (selectedItem) {
                    var bindingContext = selectedItem.getBindingContext("applicationData");
                    var object = bindingContext.getObject();
                    this._atwrt = object.ATWRT;
                }
            },

            characteristicListControlModelContextChange: function () {
                var that = this;
                if (List.prototype.onAfterRendering) {
                    List.prototype.onAfterRendering.apply(this, arguments);
                }
                var items = this.getItems();

                var bFound = false;
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var bindingContext = item.getBindingContext("applicationData");
                    var object = bindingContext.getObject();
                    var selected = object.IS_SELECTED === "X" ? true : false;
                    that.setSelectedItem(item, selected);
                    if (selected === true) {
                        bFound = true;
                    }
                }
                if (!bFound) {
                    that.setSelectedItem(null);
                }
            },

            characteristicControlWrite: function (group, atnam, control) {
                var groups = this.applicationModelRead("/characteristicControls");
                if (!groups[group]) {
                    groups[group] = {};
                }
                groups[group][atnam] = control;

                this.applicationModelWrite("/characteristicControls/", groups);
            },

            characteristicComboBoxControlAfterRendering: function () {
                if (ComboBox.prototype.onAfterRendering) {
                    ComboBox.prototype.onAfterRendering.apply(this, arguments);
                }
                var selectedItem = this.getSelectedItem();
                if (selectedItem) {
                    var bindingContext = selectedItem.getBindingContext("applicationData");
                    var object = bindingContext.getObject();
                    this._atwrt = object.ATWRT;
                }

                var GlobalFunction = sap.ui.require("com/leser/valvestar/class/GlobalFunction");
                var globalFunction = new GlobalFunction();
                var charCntrl = globalFunction.applicationModelRead("/characteristicSelect");
                if (charCntrl && charCntrl._atnam === this._atnam) {
                    this.addStyleClass("highlight");
                    document.querySelector("." + charCntrl._atnam).scrollIntoView(false);
                    this.focus();
                }
            },

            characteristicMultiComboBoxControlAfterRendering: function () {
                if (ComboBox.prototype.onAfterRendering) {
                    ComboBox.prototype.onAfterRendering.apply(this, arguments);
                }
                var selectedItem = this.getSelectedItems();
                if (selectedItem) {
                    selectedItem.forEach(element => {
                        var bindingContext = element.getBindingContext("applicationData");
                        var object = bindingContext.getObject();
                        this._atwrt = object.ATWRT;
                    });
                }

                var GlobalFunction = sap.ui.require("com/leser/valvestar/class/GlobalFunction");
                var globalFunction = new GlobalFunction();
                var charCntrl = globalFunction.applicationModelRead("/characteristicSelect");
                if (charCntrl && charCntrl._atnam === this._atnam) {
                    this.addStyleClass("highlight");
                    document.querySelector("." + charCntrl._atnam).scrollIntoView(false);
                    this.focus();
                }
            },

            characteristicComboBoxControlModelContextChange: function () {
                var that = this;
                if (ComboBox.prototype.onAfterRendering) {
                    ComboBox.prototype.onAfterRendering.apply(this, arguments);
                }
                var items = this.getItems();
                items.forEach(function (item) {
                    var bindingContext = item.getBindingContext("applicationData");
                    var object = bindingContext.getObject();
                    var selected = object.IS_SELECTED === "X" ? true : false;
                    if (selected) {
                        that.setSelectedItem(item);
                        return;
                    }
                });
            },

            characteristicMultiComboBoxControlModelContextChange: function (evt) {
                if (MultiComboBox.prototype.onAfterRendering) {
                    MultiComboBox.prototype.onAfterRendering.apply(this, arguments);
                }
                var items = this.getItems();
                let keys = [];
                items.forEach(function (item) {
                    var bindingContext = item.getBindingContext("applicationData");
                    var object = bindingContext.getObject();
                    var selected = object.IS_SELECTED === "X" ? true : false;
                    if (selected) {
                        keys.push(object.ATWRT);
                    }
                });
                this.setSelectedKeys(keys);
            },

            characteristicComboBoxControlModelContextChangeExp: function () {
                var that = this;
                if (ComboBox.prototype.onAfterRendering) {
                    ComboBox.prototype.onAfterRendering.apply(this, arguments);
                }
                var items = this.getItems();
                var bFound = false;
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var bindingContext = item.getBindingContext("applicationData");
                    var object = bindingContext.getObject();
                    var selected = object.IS_SELECTED === "X" ? true : false;
                    if (selected) {
                        bFound = true;
                        that.setSelectedItem(item);
                        break;
                    }
                }
                if (!bFound) {
                    that.setSelectedItem(null);
                }
            },

            characteristicInputControlModelContextChangeExp: function () {
                if (Input.prototype.onAfterRendering) {
                    Input.prototype.onAfterRendering.apply(this, arguments);
                }
                if (this.getModel("applicationData").getProperty(this.getDependents()[0].getKey())) {
                    var aValues = this.getModel("applicationData").getProperty(this.getDependents()[0].getKey()).values.results;
                    if (aValues && aValues.length > 0) {
                        this.setValue(aValues[0].ATWRT_DISP);
                    } else {
                        this.setValue("");
                    }
                }
            },

            characteristicInputControlModelContextChange: function () {
                if (Input.prototype.onAfterRendering) {
                    Input.prototype.onAfterRendering.apply(this, arguments);
                }
                if (this.getDependents()[0] && this.getModel("applicationData").getProperty(this.getDependents()[0].getKey())) {
                    var aValues = this.getModel("applicationData").getProperty(this.getDependents()[0].getKey()).values.results;
                    if (aValues && aValues.length > 0) {
                        this.setValue(aValues[0].ATWRT_DISP);
                    }
                }
            },

            populateConfigList: function () {
                let oData = this.applicationDataModelRead("/characteristicGroups");
                let aReturn = [];
                oData.forEach(element => {
                    let obj = {
                        key: "<strong>" + element.DESCRIPTION + "<strong>",
                        text: ""
                    };
                    aReturn.push(obj);
                    element.groupings.results.forEach(group => {
                        group.characteristics.results.forEach(char => {
                            let charValue = char.values.results.filter(element => element.IS_SELECTED === "X");
                            let charUnit = char.UNIT?.values.results.filter(element => element.IS_SELECTED === "X");
                            let textCharUnit = "";
                            let text = "";
                            if (charUnit) {
                                if (charUnit.length > 0) {
                                    textCharUnit = charUnit[0].ATWRT_DISP;
                                }
                            }

                            if (charValue) {
                                if (charValue.length === 1) {
                                    text = charValue[0].ATWRT_DISP + " " + textCharUnit;
                                } else if (charValue.length > 1) {
                                    charValue.forEach(element => {
                                        text = text + element.ATWRT_DISP + "<br>";
                                    });
                                }
                            }
                            if (char.VALUE_DISP.endsWith(":")) {
                                var valueDisplay = char.VALUE_DISP;
                            } else {
                                var valueDisplay = char.VALUE_DISP + ":";
                            }
                            let obj = {
                                key: valueDisplay,
                                text: text,
                                id: char.ATNAM
                            };
                            aReturn.push(obj);
                        });
                    });
                });
                this.applicationDataModelWrite("/currentConfigurationForKonfig", aReturn);
            },

            characteristicInputControlAfterRendering: function () {
                if (Input.prototype.onAfterRendering) {
                    Input.prototype.onAfterRendering.apply(this, arguments);
                }

                var GlobalFunction = sap.ui.require("com/leser/valvestar/class/GlobalFunction");
                var globalFunction = new GlobalFunction();
                var charCntrl = globalFunction.applicationModelRead("/characteristicSelect");
                if (charCntrl && charCntrl._atnam === this._atnam) {
                    this.addStyleClass("highlight");
                    document.querySelector("." + charCntrl._atnam).scrollIntoView(false);
                    this.focus();
                }
            },

            onListItemSelect: function (evt, params) {
                var selectedItem = evt.getParameter("listItem");
                if (selectedItem) {
                    var object = selectedItem.getBindingContext("applicationData").getObject();
                    var characteristic = evt.getSource().getBindingContext("applicationData").getObject().ATNAM;
                    var characteristicValue = object.ATWRT;
                    this.setCharacteristicValue(characteristic, characteristicValue, null, null);
                }
            },

            onListItemSelectConfig: function (evt, params) {
                var selectedItem = evt.getParameter("listItem");
                if (selectedItem) {
                    var object = selectedItem.getBindingContext("applicationData").getObject();
                    var characteristic = evt.getSource().getBindingContext("applicationData").getObject().ATNAM;
                    var characteristicValue = object.ATWRT;
                    let config = this.applicationDataModelRead("/currentConfigurationForKonfig");
                    let element = config.find(element => element.id === characteristic);
                    if (element) {
                        element.text = selectedItem.getContent()[0].getItems()[0].getContent()[0].getText();
                    }
                    this.applicationDataModelWrite("/currentConfigurationForKonfig", config);
                    this.setCharacteristicValueConfig(characteristic, characteristicValue, null, null);
                }
            },

            onRBGroupSelect: function (evt) {
                var selectedItem = evt.getSource().getSelectedButton();
                if (selectedItem) {
                    var object = selectedItem.getBindingContext("applicationData").getObject();
                    var characteristic = evt.getSource().getBindingContext("applicationData").getObject().ATNAM;
                    var characteristicValue = object.ATWRT;
                    this.setCharacteristicValue(characteristic, characteristicValue, null, null);
                }
            },

            onCBValueChanged: function (evt) {
                var selectedItem = evt.getSource().getSelectedItem();
                if (selectedItem) {
                    var object = selectedItem.getBindingContext("applicationData").getObject();
                    var characteristic = evt.getSource()._atnam;
                    var characteristicValue = object.ATWRT;
                    if (this.applicationDataModelRead("/expertSaveMode") && this.applicationModelRead("/customizing/sizingViewType") === "02") {
                        let data = this.applicationDataModelRead("/changedData");
                        data.push({
                            mode: "U",
                            value: {
                                atnam: characteristic,
                                atwrt: characteristicValue
                            }
                        });
                        this.applicationDataModelWrite("/changedData", data);
                    } else {
                        //$('body').css('cursor', 'progress');
                        this.applicationModelRead("/controls/langSelect").setEnabled(false);
                        this.setCharacteristicValue(characteristic, characteristicValue, null, null);
                    }
                    if (characteristic === "SC_IN_SIZ_STANDARD_VERSION" || characteristic === "SC_IN_FLUID_STATE") {
                        this.docKeys[characteristic] = characteristicValue;
                        if (this.docKeys.SC_IN_SIZ_STANDARD_VERSION && this.docKeys.SC_IN_FLUID_STATE) {
                            this._getPIMDoc();
                        }
                    }
                } else {
                    if (this.applicationDataModelRead("/expertSaveMode") && this.applicationModelRead("/customizing/sizingViewType") === "02") {
                        var characteristic = evt.getSource()._atnam;
                        var characteristicValue = evt.getSource()._atwrt;
                        let data = this.applicationDataModelRead("/changedData");
                        data.push({
                            mode: "D",
                            value: {
                                atnam: characteristic,
                                atwrt: characteristicValue
                            }
                        });
                        this.applicationDataModelWrite("/changedData", data);
                    } else {
                        //$('body').css('cursor', 'progress');
                        this.applicationModelRead("/controls/langSelect").setEnabled(false);
                        this.deleteCharacteristicValue(evt.getSource()._atnam, [evt.getSource()._atwrt]);
                        if (evt.getSource()._atnam === "SC_IN_SIZ_STANDARD_VERSION" || evt.getSource()._atnam === "SC_IN_FLUID_STATE") {
                            this.applicationModelWrite("/supportingDocuments", []);
                        }
                    }
                }
            },

            onMCBValueChanged: function (evt) {
                var isSelected = evt.getParameter("selected");
                var selectedItem = evt
                    .getSource()
                    .getItems()
                    .find(element => element.getBindingContext("applicationData").getObject().ATWRT === evt.getParameter("changedItem").getBindingContext("applicationData").getObject().ATWRT);
                if (selectedItem) {
                    var object = selectedItem.getBindingContext("applicationData").getObject();
                    var characteristic = evt.getSource()._atnam;
                    var characteristicValue = object.ATWRT;

                    if (this.applicationDataModelRead("/expertSaveMode") && this.applicationModelRead("/customizing/sizingViewType") === "02") {
                        let data = this.applicationDataModelRead("/changedData");
                        data.push({
                            mode: "U",
                            value: {
                                atnam: characteristic,
                                atwrt: characteristicValue
                            }
                        });
                        this.applicationDataModelWrite("/changedData", data);
                    } else {
                        //$('body').css('cursor', 'progress');
                        this.applicationModelRead("/controls/langSelect").setEnabled(false);
                        if (isSelected) {
                            this.setCharacteristicValue(characteristic, characteristicValue, null, null);
                        } else {
                            this.deleteCharacteristicValue(characteristic, [characteristicValue]);
                        }
                    }
                    if (characteristic === "SC_IN_SIZ_STANDARD_VERSION" || characteristic === "SC_IN_FLUID_STATE") {
                        this.docKeys[characteristic] = characteristicValue;
                        if (this.docKeys.SC_IN_SIZ_STANDARD_VERSION && this.docKeys.SC_IN_FLUID_STATE) {
                            this._getPIMDoc();
                        }
                    }
                } else {
                    if (this.applicationDataModelRead("/expertSaveMode") && this.applicationModelRead("/customizing/sizingViewType") === "02") {
                        var characteristic = evt.getSource()._atnam;
                        var characteristicValue = evt.getSource()._atwrt;
                        let data = this.applicationDataModelRead("/changedData");
                        data.push({
                            mode: "D",
                            value: {
                                atnam: characteristic,
                                atwrt: characteristicValue
                            }
                        });
                        this.applicationDataModelWrite("/changedData", data);
                    } else {
                        //$('body').css('cursor', 'progress');
                        this.applicationModelRead("/controls/langSelect").setEnabled(false);
                        this.deleteCharacteristicValue(evt.getSource()._atnam, [evt.getSource()._atwrt]);
                        if (evt.getSource()._atnam === "SC_IN_SIZ_STANDARD_VERSION" || evt.getSource()._atnam === "SC_IN_FLUID_STATE") {
                            this.applicationModelWrite("/supportingDocuments", []);
                        }
                    }
                }
            },

            onCBValueChangedConfig: function (evt) {
                var selectedItem = evt.getSource().getSelectedItem();
                if (selectedItem) {
                    var object = selectedItem.getBindingContext("applicationData").getObject();
                    var characteristic = evt.getSource()._atnam;
                    var characteristicValue = object.ATWRT;
                    let config = this.applicationDataModelRead("/currentConfigurationForKonfig");
                    let element = config.find(element => element.id === characteristic);
                    if (element) {
                        element.text = selectedItem.getText();
                    }
                    this.applicationDataModelWrite("/currentConfigurationForKonfig", config);
                    this.setCharacteristicValueConfig(characteristic, characteristicValue, null, null);

                    if (characteristic === "SC_IN_SIZ_STANDARD_VERSION" || characteristic === "SC_IN_FLUID_STATE") {
                        this.docKeys[characteristic] = characteristicValue;
                        if (this.docKeys.SC_IN_SIZ_STANDARD_VERSION && this.docKeys.SC_IN_FLUID_STATE) {
                            this._getPIMDoc();
                        }
                    }
                } else {
                    this.deleteCharacteristicValue(evt.getSource()._atnam, [evt.getSource()._atwrt]);
                    if (evt.getSource()._atnam === "SC_IN_SIZ_STANDARD_VERSION" || evt.getSource()._atnam === "SC_IN_FLUID_STATE") {
                        this.applicationModelWrite("/supportingDocuments", []);
                    }
                }
            },
            onMCBValueChangedConfig: function (evt) {
                var isSelected = evt.getParameter("selected");
                var selectedItem = evt
                    .getSource()
                    .getItems()
                    .find(element => element.getBindingContext("applicationData").getObject().ATWRT === evt.getParameter("changedItem").getBindingContext("applicationData").getObject().ATWRT);
                if (selectedItem) {
                    var object = selectedItem.getBindingContext("applicationData").getObject();
                    var characteristic = evt.getSource()._atnam;
                    var characteristicValue = object.ATWRT;
                    let config = this.applicationDataModelRead("/currentConfigurationForKonfig");
                    let element = config.find(element => element.id === characteristic);
                    if (element) {
                        element.text = selectedItem.getText();
                    }
                    this.applicationDataModelWrite("/currentConfigurationForKonfig", config);

                    if (isSelected) {
                        this.setCharacteristicValueConfig(characteristic, characteristicValue, null, null);
                    } else {
                        this.deleteCharacteristicValue(characteristic, [characteristicValue]);
                    }

                    if (characteristic === "SC_IN_SIZ_STANDARD_VERSION" || characteristic === "SC_IN_FLUID_STATE") {
                        this.docKeys[characteristic] = characteristicValue;
                        if (this.docKeys.SC_IN_SIZ_STANDARD_VERSION && this.docKeys.SC_IN_FLUID_STATE) {
                            this._getPIMDoc();
                        }
                    }
                } else {
                    this.deleteCharacteristicValue(evt.getSource()._atnam, [evt.getSource()._atwrt]);
                    if (evt.getSource()._atnam === "SC_IN_SIZ_STANDARD_VERSION" || evt.getSource()._atnam === "SC_IN_FLUID_STATE") {
                        this.applicationModelWrite("/supportingDocuments", []);
                    }
                }
            },

            rotateSyncButton: function (bRotate, oRotateButton) {
                if (oRotateButton) {
                    this.oSyncButton = oRotateButton;
                }

                if (!this.oSyncButton) {
                    return;
                }

                if (bRotate) {
                    this.oSyncButton.addStyleClass("tvcRotate");
                } else {
                    this.oSyncButton.removeStyleClass("tvcRotate");
                }
            },

            rotatePrintButton: function (bRotate, oRotateButton) {
                if (oRotateButton) {
                    this.oPrintButton = oRotateButton;
                }

                if (!this.oPrintButton) {
                    return;
                }

                if (bRotate) {
                    this.oPrintButton.addStyleClass("tvcRotateIcon");
                } else {
                    this.oPrintButton.removeStyleClass("tvcRotateIcon");
                    this.oPrintButton.setIcon("sap-icon://print");
                }
            },

            rotateSaveButton: function (bRotate, oRotateButton) {
                if (oRotateButton) {
                    this.oSaveButton = oRotateButton;
                }

                if (!this.oSaveButton) {
                    return;
                }

                if (bRotate) {
                    this.oSaveButton.addStyleClass("tvcRotateIcon");
                } else {
                    this.oSaveButton.removeStyleClass("tvcRotateIcon");
                    this.oSaveButton.setIcon("sap-icon://save");
                }
            },

            _getPIMDoc: function () {
                var sKey = "CONTENTOBJECT_SIZING_" + this.stVersion[this.docKeys.SC_IN_SIZ_STANDARD_VERSION] + "_" + this.fluidState[this.docKeys.SC_IN_FLUID_STATE];
                // create XHR object
                var xhttp = new XMLHttpRequest();
                var that = this;
                // gets everytime fired when the XHR request state changes
                xhttp.onreadystatechange = function () {
                    // 4 means request is finished and response is ready
                    // 200 means request is just fine
                    if (this.readyState == 4 && this.status == 200) {
                        // "this" refers here to the XHR object
                        var oResult = JSON.parse(this.response).Documents;
                        var aDocs = [],
                            oDoc = {
                                title: oResult[sKey].Title,
                                link: oResult[sKey].URL
                            };
                        aDocs.push(oDoc);
                        that.applicationModelWrite("/supportingDocuments", aDocs);
                    }
                };
                // set the XHR request parameters
                let sLink = "https://pwb102.saas.contentserv.com/admin/rest/contentdocuments";
                const sLangu = this.applicationModelRead("/customizing/LAISO");
                var sLanguIso = "";
                //temporary fix for iso language key
                switch (sLangu) {
                    case "DE":
                    case "de":
                        sLanguIso = "de_DE";
                        break;
                    case "EN":
                    case "en":
                        sLanguIso = "en_GB";
                        break;
                    default:
                        sLanguIso = "en_GB";
                }
                //-------------------------------------------
                sLink = sLink + "?lang=" + sLanguIso;
                xhttp.open("GET", sLink, true);
                // fire the XHR request
                xhttp.send();
            },

            onInputValueChanged: function (evt) {
                const input = evt.getSource();
                var characteristic = input._atnam;
                var characteristicValue = evt.getParameter("value");

                let config = this.applicationDataModelRead("/currentConfiguration");
                let element = config.find(element => element.id === characteristic);
                if (element) {
                    element.text = input.getValue();
                }
                this.applicationDataModelWrite("/currentConfiguration", config);
                if (this.applicationDataModelRead("/expertSaveMode") && this.applicationModelRead("/customizing/sizingViewType") === "02") {
                    let data = this.applicationDataModelRead("/changedData");
                    data.push({
                        mode: "U",
                        value: {
                            atnam: characteristic,
                            atwrt: characteristicValue
                        }
                    });
                    this.applicationDataModelWrite("/changedData", data);
                } else {
                    //$('body').css('cursor', 'progress');
                    this.applicationModelRead("/controls/langSelect").setEnabled(false);
                    this.setCharacteristicValue(characteristic, characteristicValue, null, null);
                }
            },

            onInputValueChangedConfig: function (evt) {
                var input = evt.getSource();
                var characteristic = input._atnam;
                var characteristicValue = evt.getParameter("value");

                this.setCharacteristicValueConfig(characteristic, characteristicValue, null, null);
            },

            showCharacteristicInfoText: function (evt) {
                var dependent = evt.getSource().getDependents()[0];
                var key = dependent.getKey();
                if (key === "characteristic") {
                    var object = evt.getSource().getBindingInfo("visible").binding.oContext.getObject();
                } else if (key === "characteristicValue") {
                    var values = evt.getSource().getBindingInfo("visible").binding.oContext.getObject().values.results;
                    object = values.find(function (item) {
                        return item.IS_SELECTED === "X";
                    });
                }

                if (!object) {
                    return;
                }

                var popover;

                var fnClose = function (e) {
                    popover.close();
                };

                popover = new sap.m.ResponsivePopover({
                    placement: "HorizontalPreferredRight",
                    showArrow: false,
                    showHeader: false,
                    modal: true,
                    content: [
                        new sap.ui.core.HTML({
                            content: object.INFO
                        })
                    ],
                    endButton: new Button({
                        type: "Emphasized",
                        icon: "sap-icon://accept",
                        press: fnClose
                    }).addStyleClass("vcButtonBlue")
                }).addStyleClass("sapUiResponsiveContentPadding");

                popover.openBy(evt.getSource());

                document.addEventListener(
                    "click",
                    function closeDialog(oEvent) {
                        if (oEvent.target.id === "sap-ui-blocklayer-popup") {
                            this.close();
                            document.removeEventListener("click", closeDialog);
                        }
                    }.bind(popover)
                );
            },

            applicationDataCurrentInstanceWrite: function (currentInstance) {
                try {
                    if (!currentInstance || currentInstance === undefined) {
                        return false;
                    }

                    var model = this.getApplicationDataModel();
                    return model.setProperty("/configurationInformation/currentInstance", currentInstance) || false;
                } catch (err) {
                    this.showLogOnConsole(err);
                }
            },

            applicationDataCurrentInstanceRead: function () {
                try {
                    var model = this.getApplicationDataModel();
                    return model.getProperty("/configurationInformation/currentInstance");
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            applicationDataSizingInstanceRead: function () {
                try {
                    var model = this.getApplicationDataModel();
                    return model.getProperty("/configurationInformation/sizingInstance");
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            getEntitySet: function (entity) {
                try {
                    var path = "/target/" + entity;
                    var entitySet = this.applicationModelRead(path);
                } catch (err) {
                    this.showLogOnConsole(err);
                }

                if (!entitySet) {
                    return false;
                }
                return entitySet;
            },

            getCustomizing: function (headers, actionNext, callParameter, fnCallback) {
                try {
                    var parameter = {
                        action: "getCustomizing",
                        busy: true,
                        actionNext: actionNext,
                        callParameter: callParameter
                    };
                    if (headers) {
                        parameter.headers = headers;
                    }

                    return this.readEntitySet("customizing", parameter, fnCallback);
                } catch (err) {
                    this.showLogOnConsole(err);
                    return undefined;
                }
            },

            setPressedToggleButton: function (id) {
                try {
                    var toggleSizingButton = this.applicationModelRead("/controls/toggleSizingButton");
                    var toggleSelectionButton = this.applicationModelRead("/controls/toggleSelectionButton");
                    var toggleProdKonfButton = this.applicationModelRead("/controls/toggleProdKonfButton");
                    var leftTriangle = this.applicationModelRead("/controls/leftTriangle");
                    var rightTriangle = this.applicationModelRead("/controls/rightTriangle");

                    var toggleSizingText = this.applicationModelRead("/controls/toggleSizingText");
                    var toggleSelectionText = this.applicationModelRead("/controls/toggleSelectionText");
                    var toggleProdKonfText = this.applicationModelRead("/controls/toggleProdKonfText");

                    switch (id) {
                        case "idTogSizing":
                            toggleSizingButton.setPressed(true);
                            toggleSelectionButton.setPressed(false);
                            toggleProdKonfButton.setPressed(false);
                            toggleSelectionButton.setEnabled(true);
                            toggleSizingButton.removeStyleClass("inactiveGrey");

                            leftTriangle.removeStyleClass("trianglegrau");
                            leftTriangle.removeStyleClass("triangleganzgrau");
                            leftTriangle.addStyleClass("triangleblau");
                            leftTriangle.removeStyleClass("triangleganzgrauinverted");

                            rightTriangle.removeStyleClass("triangleblau");
                            rightTriangle.removeStyleClass("trianglegrau");
                            rightTriangle.addStyleClass("triangleganzgrau");

                            toggleSelectionText.addStyleClass("vcToggleText");
                            toggleSelectionText.removeStyleClass("vcToggleTextWhite");
                            toggleProdKonfText.addStyleClass("vcToggleText");
                            toggleProdKonfText.removeStyleClass("vcToggleTextWhite");
                            toggleSizingText.addStyleClass("vcToggleTextWhite");
                            toggleSizingText.removeStyleClass("vcToggleText");
                            toggleProdKonfButton.removeStyleClass("noopac");
                            toggleProdKonfText.removeStyleClass("noopac");
                            toggleProdKonfButton.removeStyleClass("opac");
                            toggleProdKonfText.removeStyleClass("opac");
                            toggleSizingButton.removeStyleClass("opac");
                            toggleSizingText.removeStyleClass("opac");

                            break;
                        case "idTogSelection":
                            toggleSizingButton.setPressed(false);
                            toggleSelectionButton.setPressed(true);
                            toggleProdKonfButton.setPressed(false);
                            toggleSelectionButton.setEnabled(true);
                            toggleSizingButton.addStyleClass("inactiveGrey");

                            leftTriangle.removeStyleClass("triangleblau");
                            leftTriangle.removeStyleClass("triangleganzgrau");
                            leftTriangle.addStyleClass("trianglegrau");
                            leftTriangle.removeStyleClass("triangleganzgrauinverted");

                            rightTriangle.removeStyleClass("triangleganzgrau");
                            rightTriangle.removeStyleClass("trianglegrau");
                            rightTriangle.addStyleClass("triangleblau");

                            toggleSelectionText.addStyleClass("vcToggleTextWhite");
                            toggleSelectionText.removeStyleClass("vcToggleText");
                            toggleProdKonfText.addStyleClass("vcToggleText");
                            toggleProdKonfText.removeStyleClass("vcToggleTextWhite");
                            toggleSizingText.addStyleClass("vcToggleText");
                            toggleSizingText.removeStyleClass("vcToggleTextWhite");
                            toggleProdKonfButton.removeStyleClass("noopac");
                            toggleProdKonfText.removeStyleClass("noopac");
                            toggleSizingButton.removeStyleClass("opac");
                            toggleSizingText.removeStyleClass("opac");
                            break;
                        case "idTogProdKonf":
                            toggleSizingButton.setPressed(false);
                            toggleSelectionButton.setPressed(false);
                            toggleProdKonfButton.setPressed(true);
                            toggleSelectionButton.setEnabled(false);
                            toggleSizingButton.removeStyleClass("inactiveGrey");

                            leftTriangle.removeStyleClass("triangleblau");
                            leftTriangle.removeStyleClass("trianglegrau");
                            leftTriangle.addStyleClass("triangleganzgrauinverted");

                            rightTriangle.removeStyleClass("triangleganzgrau");
                            rightTriangle.removeStyleClass("triangleblau");
                            rightTriangle.addStyleClass("trianglegrau");

                            toggleSelectionText.addStyleClass("vcToggleText");
                            toggleSelectionText.removeStyleClass("vcToggleTextWhite");
                            toggleProdKonfText.addStyleClass("vcToggleTextWhite");
                            toggleProdKonfText.removeStyleClass("vcToggleText");
                            toggleSizingText.addStyleClass("vcToggleText");
                            toggleSizingText.removeStyleClass("vcToggleTextWhite");
                            toggleProdKonfButton.addStyleClass("noopac");
                            toggleProdKonfText.addStyleClass("noopac");
                            toggleSizingButton.addStyleClass("opac");
                            toggleSizingText.addStyleClass("opac");
                            break;
                    }
                } catch (err) {
                    this.showLogOnConsole(err);
                }
            },

            setCustomizing: function (data) {
                try {
                   /* for (var key in data) {
                        if (data[key].VALUE === "true") {
                            data[key].VALUE = true;
                        } else if (data[key].VALUE === "false") {
                            data[key].VALUE = false;
                        }

                        if (data[key].NAME === "showPdfButton") {
                            if (this.browserIsIe() || this.browserIsEdge()) {
                                data[key].VALUE = false;
                            }
                        }
                        this.applicationModelWrite("/customizing/" + data[key].NAME, data[key].VALUE);
                    }*/
                    Object.entries(data).forEach(([key, value]) => {
                        if (value.VALUE === "true") {
                            value.VALUE = true;
                        } else if (value.VALUE === "false") {
                            value.VALUE = false;
                        }
                    
                        if (value.NAME === "showPdfButton") {
                            if (this.browserIsIe() || this.browserIsEdge()) {
                                value.VALUE = false;
                            }
                        }
                    
                        this.applicationModelWrite(`/customizing/${value.NAME}`, value.VALUE);
                    });
                } catch (err) {
                    this.showLogOnConsole(err);
                }
            },

            getErrorDialog(text) {
                if (!text) {
                    text = "Something went wrong";
                }
                return new Dialog({
                    type: "Message",
                    title: "Error",
                    state: "Error",
                    content: new Text({ text: text }),
                    beginButton: this.getLESERDialogButton()
                });
            },


            getLESERDialogButton(){
                return  new Button({
                    type: "Emphasized",
                    icon: "sap-icon://accept",
                    press: function (evt) {
                        evt.getSource().getParent().close();
                    }
                }).addStyleClass("vcButtonBlue");
            },

            browserIsIe: function () {
                try {
                    var deviceModel = this.getComponent().getModel("device");
                    var browser = deviceModel.getData().browser.name;
                    if (browser !== "ie") {
                        return false;
                    }
                    return true;
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },

            browserIsEdge: function () {
                try {
                    var deviceModel = this.getComponent().getModel("device");
                    var browser = deviceModel.getData().browser.name;
                    if (browser !== "ed") {
                        return false;
                    }
                    return true;
                } catch (err) {
                    this.showLogOnConsole(err);
                    return false;
                }
            },
            
            downloadPdf: function () {
                this.getComponent()
                    .getModel()
                    .callFunction("/reportInstanceConfiguration", {
                        urlParameters: {
                            instance_product: this.applicationDataCurrentInstanceRead(),
                            instance_sizing: this.applicationDataSizingInstanceRead() || "00000001"
                        },
                        method: "GET",
                        success: (oData, response) => {
                            var a = document.createElement("a");
                            a.href = "data:" + oData.Mimetype + ";base64," + oData.Report;
                            a.download = "Formular." + oData.Fileextension;
                            a.click();
                            this.rotatePrintButton(false);
                        },
                        error: function (oError) {
                            const oDialog = this.getErrorDialog("No Download-File available");
                            oDialog.open();
                        }
                    });
            },

            onLanguageChangeCell: function (oEvent) {
                var fnSuccess = function (data, response) {
                    this.getComponent().getRouter().navTo("startPage");
                    const href = new URL(window.location.href);
                    href.searchParams.set("sap-language", this.applicationDataModelRead("/systemLanguage"));
                    window.location.href = href.href;
                }.bind(this);
                var fnError = function (error) {
                    const oDialog = this.getErrorDialog("Language Error");
                    oDialog.open();
                }.bind(this);
                if (oEvent.getParameter("selectedItem")) {
                    var language = oEvent.getParameter("selectedItem").getBindingContext("applicationData").getObject("LAISO");
                    var parameter = {
                        headers: {
                            spras: language
                        },
                        keys: {
                            LAISO: language
                        }
                    };
                    this.updateEntity("languageSet", parameter, fnSuccess, fnError);
                }
            },

            initLang: function () {
                var fnSuccess = function (data, response) {
                    this.getPIMInfoTexts();
                    if (this.applicationModelRead("/supportingDocuments") && this.applicationModelRead("/supportingDocuments").length > 0) {
                        this._getPIMDoc();
                    }
                }.bind(this);
                var fnError = function (error) {
                    const oDialog = this.getErrorDialog("Language Error");
                    oDialog.open();
                }.bind(this);
                if (this.applicationModelRead("/controls/langSelect").getSelectedItem()) {
                    const sLang = this.applicationDataModelRead("/systemLanguage");
                    var parameter = {
                        headers: {
                            spras: sLang
                        },
                        keys: {
                            LAISO: sLang
                        }
                    };
                    this.updateEntity("languageSet", parameter, fnSuccess, fnError);
                }
            },

            getPIMInfoTexts: function () {
                // create XHR objt
                var xhttp = new XMLHttpRequest();
                var that = this;
                // gets everytime fired when the XHR request state changes
                xhttp.onreadystatechange = function () {
                    // 4 means request is finished and response is ready
                    // 200 means request is just fine
                    if (this.readyState === 4 && this.status === 200) {
                        // "this" refers here to the XHR object
                        var oResult = JSON.parse(this.response).Texts;

                        that.applicationDataModelWrite("/infoText", oResult);
                    }
                };
                // set the XHR request parameters
                var sLink = "https://pwb102.saas.contentserv.com/admin/rest/contenttexts/";
                var sLangu = this.applicationModelRead("/customizing/LAISO");
                var sLanguIso;
                //-------------------------------------
                //temporary fix for iso language key
                switch (sLangu) {
                    case "DE":
                    case "de":
                        sLanguIso = "de_DE";
                        break;
                    case "EN":
                    case "en":
                        sLanguIso = "en_GB";
                        break;
                    default:
                        sLanguIso = "en_GB";
                }

                sLink = sLink + "?lang=" + sLanguIso;
                xhttp.open("GET", sLink, true);
                //xhttp.setRequestHeader('Content-type', 'text/html; charset=utf-8');

                // fire the XHR request
                xhttp.send();
            }
        });
    }
);
