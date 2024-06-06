/* eslint-disable guard-for-in */
/* eslint-disable max-depth */
/* eslint-disable max-statements */
/* eslint-disable complexity */
sap.ui.define(
    [
        "com/leser/valvestar/controller/BaseController",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/BindingMode",
        "sap/ui/layout/form/Form",
        "sap/ui/layout/form/FormContainer",
        "sap/ui/layout/form/FormElement",
        "sap/f/Card"
    ],
    function (Controller, JSONModel, BindingMode, Form, FormContainer, FormElement, Card) {
        "use strict";
        return Controller.extend("com.leser.valvestar.controller.SizingPage", {
            _bExpertLoaded: false,
            onInit: function () {
                Controller.prototype.onInit.apply(this, arguments);

                this.sizingModel = new JSONModel({
                    busy: false,
                    delay: this.getView().getBusyIndicatorDelay(),
                    mode: "01"
                });

                this.sizingModel.setDefaultBindingMode(BindingMode.TwoWay);
                this.getView().setModel(this.sizingModel, "sizingModel");

                this.getOwnerComponent().getRouter().getRoute("ProductFindungSizingRoute").attachPatternMatched(this._onPatternMatched, this);

                // Register an event handler to changes of the screen size
                sap.ui.Device.media.attachHandler(this._sizeChanged.bind(this), null, sap.ui.Device.media.RANGESETS.SAP_STANDARD);
                // Do some initialization work based on the current size

                this._sizeChanged(sap.ui.Device.media.getCurrentRange(sap.ui.Device.media.RANGESETS.SAP_STANDARD));
                this.globalFunction.applicationModelWrite("/controls/btnGoToSelection", this.getView().byId("btnGoToSelection"));

                this.oLink = this.getView().byId("expandLink");
                this.oLink.setModel(this.globalFunction.getApplicationDataModel());
                this.oLink.bindElement("/i18n");
                this.oLink.bindProperty("text", "expandAll");
            },

            _sizeChanged: function (mParams) {
                switch (mParams.name) {
                    case "Phone":
                        this.getView().byId("sizingStatusVBox").setVisible(false);
                        this.getView().byId("sizingStatusVBoxIncl").setVisible(true);
                        break;
                    case "Tablet":
                        this.getView().byId("sizingStatusVBox").setVisible(false);
                        this.getView().byId("sizingStatusVBoxIncl").setVisible(true);
                        break;
                    case "Desktop":
                        this.getView().byId("sizingStatusVBox").setVisible(true);
                        this.getView().byId("sizingStatusVBoxIncl").setVisible(false);
                        break;
                }
            },

            onAfterRendering: function (oEvent) {
                //checks if a language was passed from the sap
                //if yes, changes the app language and locks the language fix
                //locking is temporaray until the issues with langauge switching are fixed
                //if language is, DE, set DE
                //if its something else, set EN
                //if no language is passed, set EN
                //
                /* if (this.globalFunction.applicationDataModelRead('/systemLanguage') && this.globalFunction.applicationDataModelRead('/systemLanguage') == 'DE') {
                    sap.ui.getCore().byId('__select0').setSelectedKey(this.globalFunction.applicationDataModelRead('/systemLanguage'));
                    sap.ui.getCore().byId('__select0').setEnabled(false);
                } else if (this.globalFunction.applicationDataModelRead('/systemLanguage') && this.globalFunction.applicationDataModelRead('/systemLanguage') !== 'DE') {
                    sap.ui.getCore().byId('__select0').setSelectedKey('EN');
                    sap.ui.getCore().byId('__select0').setEnabled(false);
                } else {
                    sap.ui.getCore().byId('__select0').setSelectedKey('EN');
                } */
                if(this.globalFunction.applicationModelRead("/controls/langSelect").getEnabled()){
                this.globalFunction.initLang();
            }
                /* sap.ui
                    .getCore()
                    .byId('__select0')
                    .fireChange({
                        selectedItem: sap.ui.getCore().byId('__select0').getSelectedItem()
                    }); */

                const oSizingCharBox = this.getView().byId("sizingCharactGroupVBox");
                oSizingCharBox.addEventDelegate(
                    {
                        onAfterRendering: function () {
                            if (oSizingCharBox.getItems().length > 0) {
                                oSizingCharBox.getItems()[0].setExpandable(true);
                            }
                            if (oSizingCharBox.getDomRef().offsetTop && oSizingCharBox.getDomRef().offsetTop !== 0 && !this.getView().byId("messageVBox").getVisible()) {
                                this.getView()
                                    .byId("emptyBox")
                                    .setHeight(oSizingCharBox.getDomRef().offsetTop + "px");
                            }
                        }
                    },
                    this
                );

                var screenWidth = document.body.offsetWidth / 16;
                var toolbarMarginLeft = screenWidth - 6.4 + "rem";

                // Set width of toolbar first space
                this.getView().byId("hbSizing").setWidth(toolbarMarginLeft);

                sap.ui.Device.resize.attachHandler(
                    function () {
                        var screenWidth = document.body.offsetWidth / 16;
                        var toolbarMarginLeft = screenWidth - 6.4 + "rem";

                        // Set width of toolbar first space
                        this.getView().byId("hbSizing").setWidth(toolbarMarginLeft);
                    }.bind(this),
                    this.getView().byId("hbSizing")
                );
            },

            onLinkPressed: function (oEvent) {
                var atnam = oEvent.getSource().data("atnam");
                document.querySelector("." + atnam).scrollIntoView(false);
                document.querySelector("." + atnam + " > div input").select();
            },

            expandCollapseAll: function () {
                const oSizingCharBox = this.getView().byId("sizingCharactGroupVBox");
                const aPanels = oSizingCharBox.getItems();
                const isAllExpanded = this.globalFunction.applicationDataModelRead("/isAllExpnded");
                let bExpand;
                if (isAllExpanded) {
                    bExpand = false;
                    this.oLink.bindProperty("text", "expandAll");
                } else {
                    bExpand = true;
                    this.oLink.bindProperty("text", "collapseAll");
                }
                for (let index = 0; index < aPanels.length; index++) {
                    if (!bExpand && index === 0) {
                        aPanels[index].setExpanded(bExpand);
                        continue;
                    }
                    aPanels[index].setExpandable(bExpand);
                    aPanels[index].setExpanded(bExpand);
                }
                this.globalFunction.applicationDataModelWrite("/isAllExpnded", bExpand);
            },

            _onPatternMatched: function (oEvent) {
                this.matnr = oEvent.getParameter("arguments").matnr;
                //this._bExpertLoaded = false;
                 // Set toogle button selected
                this.globalFunction.setPressedToggleButton("idTogSizing");
                if (this.globalFunction.getApplicationModel().getProperty("/customizing/productFindingAttrib")) {
                    var that = this;
                    this.globalFunction.getBOMPositions({}, function (n, e) {
                        that.globalFunction.applicationDataModelWrite("/bom", n.results);
                        var o = n.results.find(function (n) {
                            return n.BOM_COMPNT === that.matnr;
                        });
                        if (o) {
                            that.globalFunction.loadBomInstance(
                                {
                                    instance: o.CONFIG_SELF
                                },
                                function (aData, e) {
                                    that.globalFunction.applicationDataCurrentInstanceWrite(aData.CONFIG_SELF);
                                    that.getInstanceInfo(undefined, jQuery.proxy(that._getInstanceInfoError, that));
                                    that.globalFunction.getCharacteristicCategoryWithGroups(jQuery.proxy(that._setCategoryModelData, that), jQuery.proxy(that._onRequestError, that));
                                    that.getProductsForSelection(undefined, undefined, jQuery.proxy(that._getProductsForSelectionError, that));
                                    that.readCurrentConfiguration();
                                    that.globalFunction.closeBusyDialog();
                                }
                            );
                        }
                    });
                } //else {
                // Read characteristic categories
                //this.globalFunction.getCharacteristicCategoryWithGroups(jQuery.proxy(this._SetCategoryModelData, this), jQuery.proxy(this._onRequestError, this));
                //this.readCurrentConfiguration();
                // }
                if (this.globalFunction.applicationDataModelRead("/startExpert")) {
                    var oButton = this.getView().byId("sbWizExp");
                    oButton.fireSelectionChange({
                        item: oButton.getItems()[1]
                    });
                }
            },

            _setCategoryModelData: function (data, response) {
                // Set first Panel expandable
                this.globalFunction.setCategoryModelData(data, response, true);
                this._expBuild();
                var viewType = this.applicationModel.getProperty("/customizing/sizingViewType");

                if (
                    (viewType === "01" && this.getView().byId("sizingCharactGroupVBox").getItems() && this.getView().byId("sizingCharactGroupVBox").getItems().length > 0) ||
                    (viewType === "02" && this.globalFunction.applicationDataModelRead("/startExpert"))
                ) {
                    this.getView().byId("sizingCharactGroupVBox").getItems()[0].setExpandable(true);
                }
            },

            readCurrentConfiguration: function (fnCallbackSuccess, fnCallbackError) {
                this.globalFunction.getCurrentConfiguration(fnCallbackSuccess, fnCallbackError);
            },

            _ReadCurrentConfigError: function (error) {
                this.applicationDataModel.setProperty("/currentConfiguration", null);
                this._onRequestError(error);
            },

            getProductsForSelection: function (headers, fnCallbackSuccess, fnCallbackError) {
                this.globalFunction.getProductsForSelection(headers, fnCallbackSuccess, fnCallbackError);
            },

            _getProductsForSelectionError: function (error) {
                this.globalFunction.applicationDataModelWrite("/selectionProducts", [], false);
            },

            getInstanceInfo: function (fnCallbackSuccess, fnCallbackError) {
                this.globalFunction.getInstanceInfo(null, fnCallbackSuccess, fnCallbackError);
            },

            _getInstanceInfoError: function (error) {
                this.globalFunction.applicationDataModelWrite(
                    "/instanceInfo",
                    {
                        STATE: "E"
                    },
                    false
                );
            },

            //_setGlobalHeaderModelData: function (data) {
            //    this.getOwnerComponent().getModel("globalHeaderModel").setData(data);
           // },

            _setSizingModelData: function (data) {
                this.sizingModel.setProperty("/characteristicGroups", data);
                var characteristicGroups = {
                    characteristicGroups: data
                };
                this.sizingModel.setData(characteristicGroups);
            },

            groupingControlFactory: function (id, context) {
                return this.globalFunction.createGroupingControl(id, context);
            },

            onNextStep: function (evt) {
                var that = this;
                var currentPanel = evt.getSource().getParent();
                var panels = this.getView().byId("sizingCharactGroupVBox").getItems();

                // Check all required characteristics are rated
                try {
                    var currentCharacteristicGroup = currentPanel.getBindingContext("applicationData").getObject();
                    var requiredCharacteristics = this.formatter.getRequiredCharacteristics(currentCharacteristicGroup);
                    var requiredCharacteristicObjects = this._getRequiredCharacteristicObjects(currentPanel.getContent(), requiredCharacteristics);
                    requiredCharacteristicObjects.forEach(function (requiredChar) {
                        requiredChar.addStyleClass("reqCharHighlighted");
                        requiredChar.setPlaceholder(that.globalFunction.getText("reqCharMessage"));
                    });
                    if (requiredCharacteristics.length === 0) {
                        throw {
                            message: "Keine Pflichtmerkmale gefunden"
                        };
                    } else {
                        return;
                    }
                } catch (err) {
                    this.globalFunction.showLogOnConsole("Keine Pflichtmerkmale gefunden");
                }

                for (var key in panels) {
                    var panel = panels[key];
                    currentPanel.setExpanded(false);
                    if (panel === currentPanel) {
                        var nextPanel = panels[parseFloat(key) + 1];
                    }
                }
                if (nextPanel) {
                    nextPanel.setExpandable(true);
                    nextPanel.setExpanded(true);
                } else {
                    this.globalFunction.applicationDataModelWrite("/charGroupPanels", this._getControlsInGroups());
                    this.getOwnerComponent().getRouter().navTo("ProductFindungSelectionRoute", {
                        matnr: this.matnr
                    });
                }
            },

            _getControlsInGroups: function () {
                var aPanels = this.getView().byId("sizingCharactGroupVBox").getItems();
                var oData = {};
                var aData = [];
                var fnLoop = function (oBoxes) {
                    for (var j = 0; j < oBoxes.length; j++) {
                        if (oBoxes[j].getMetadata()._sClassName === "sap.m.VBox" || oBoxes[j].getMetadata()._sClassName === "sap.m.HBox") {
                            fnLoop(oBoxes[j].getItems());
                        } else if (oBoxes[j].getMetadata()._sClassName !== "sap.m.Button" && oBoxes[j].getMetadata()._sClassName !== "sap.m.Title") {
                            aData.push(oBoxes[j]);
                        }
                    }
                    return aData;
                };
                for (var i = 0; i < aPanels.length; i++) {
                    var oGroup = aPanels[i];
                    var oBoxes = oGroup.getContent();
                    aData = [];
                    oData[oGroup.getBindingContext("applicationData").getObject().GRUPPE] = {
                        cntrl: oGroup,
                        items: fnLoop(oBoxes)
                    };
                }
                return oData;
            },

            _getRequiredCharacteristicObjects: function (currGroupItems, requiredCharacteristics) {
                function searchCharObject(groupItem, className) {
                    var objects = [];

                    if (groupItem.getMetadata()._sClassName === className) {
                        return [groupItem];
                    }

                    try {
                        var items = groupItem.getItems();
                        items.forEach(function (item) {
                            if (item.getMetadata()._sClassName !== className) {
                                var tempObj = searchCharObject(item, className);
                                tempObj.forEach(function (obj) {
                                    objects.push(obj);
                                });
                            } else {
                                objects.push(item);
                            }
                        });
                    } catch (err) {
                        return [];
                    }

                    return objects;
                }

                var objects = [];

                requiredCharacteristics.forEach(function (requiredChar) {
                    var tempItems = [];
                    var atnam = requiredChar.ATNAM;
                    var layout = requiredChar.LAYOUT;
                    switch (layout) {
                        case "C":
                            var className = "sap.m.ComboBox";
                            break;
                        case "R" || "M":
                            className = "sap.m.List";
                            break;
                        case "T":
                            className = "sap.m.Input";
                            break;
                        default:
                    }

                    currGroupItems.forEach(function (currGroupItem) {
                        var tempObj = searchCharObject(currGroupItem, className);
                        tempObj.forEach(function (obj) {
                            tempItems.push(obj);
                        });
                    });

                    tempItems.forEach(function (tempItem) {
                        var tempAtnam = tempItem.getBindingContext("applicationData").getObject("ATNAM");
                        if (tempAtnam === atnam) {
                            objects.push(tempItem);
                        }
                    });
                });

                return objects;
            },

            setCharacteristicValue: function (characteristic, characteristicValue, fnCallbackSuccess, fnCallbackError) {
                this.globalFunction.setCharacteristicValue(characteristic, characteristicValue, fnCallbackSuccess, fnCallbackError);
            },

            showCharacteristicInfoText: function (evt) {
                this.globalFunction.showCharacteristicInfoText(evt);
            },

            toggleSizingView: function (evt) {
                const sViewType  = evt.getParameter("item").getKey();
              /*   var fnTest = function (evt) {
                    //	 Switch MSG - LESER unten
                    var fnCarSuccess = null;
                    if (evt.getParameter("item").getKey() === "02") {
                        if (!this._bExpertLoaded) {
                            fnCarSuccess = function (data, response) {
                                this.globalFunction.setCategoryModelData(data, response, true);
                                this._expBuild();
                                this.getView().byId("sbWizExp").setSelectedKey("02");
                                this.getView().getModel("sizingModel").setProperty("/mode", "02");
                            }.bind(this);
                        } else {
                            fnCarSuccess = function (data, response) {
                                this.globalFunction.setCategoryModelData(data, response, true);
                                this.getView().byId("sbWizExp").setSelectedKey("02");
                                this.getView().getModel("sizingModel").setProperty("/mode", "02");
                                this._fireBindingChange();
                            }.bind(this);
                        }
                    } else {
                        fnCarSuccess = function (data, response) {
                            this.globalFunction.setCategoryModelData(data, response, false);
                            this.getView().byId("sbWizExp").setSelectedKey("01");
                            this.getView().getModel("sizingModel").setProperty("/mode", "01");
                        }.bind(this);
                    }
                    this._bExpertLoaded = true;
                    this.globalFunction.getInstanceInfo();
                    this.globalFunction.getCharacteristicCategoryWithGroups(fnCarSuccess);
                    this.globalFunction.getCurrentConfiguration();
                    this.globalFunction.getProductsForSelection();
                }.bind(this); */

                var fnToggle = function (evt) {
                    var fnCarSuccess = null;
                    var fnSuccess = function (data, response) {
                        this._bExpertLoaded = true;
                        this.globalFunction.getInstanceInfo();
                        this.globalFunction.getCharacteristicCategoryWithGroups(fnCarSuccess);
                        this.globalFunction.getCurrentConfiguration();
                        this.globalFunction.getProductsForSelection();
                    }.bind(this);
                    if (sViewType === "02") {
                        if (!this._bExpertLoaded) {
                            fnCarSuccess = function (data, response) {
                                this.globalFunction.setCategoryModelData(data, response, true);
                                this._expBuild();
                                this.getView().byId("sbWizExp").setSelectedKey("02");
                                this.getView().getModel("sizingModel").setProperty("/mode", "02");
                            }.bind(this);
                        } else {
                            fnCarSuccess = function (data, response) {
                                this.globalFunction.setCategoryModelData(data, response, true);
                                this.getView().byId("sbWizExp").setSelectedKey("02");
                                this.getView().getModel("sizingModel").setProperty("/mode", "02");
                                this._fireBindingChange();
                            }.bind(this);
                        }
                    } else {
                        fnCarSuccess = function (data, response) {
                            this.globalFunction.setCategoryModelData(data, response, false);
                            this.getView().byId("sbWizExp").setSelectedKey("01");
                            this.getView().getModel("sizingModel").setProperty("/mode", "01");
                        }.bind(this);
                    }
            
                        this.globalFunction.applicationModelWrite("/customizing/sizingViewType", sViewType);
                        this.setCharacteristicValue("SC_WEB_UI_VIEW", sViewType, fnSuccess, null);
                  
                    
                }.bind(this);
                fnToggle(evt);
            },

            _fireBindingChange: function () {
                var aElements = this.applicationModel.getObject("/expViewCtrls");
                for (var i = 0; i < aElements.length; i++) {
                    var oElem = aElements[i];
                    if (oElem.fireModelContextChange) {
                        oElem.fireModelContextChange();
                    }
                }
            },

            _expBuild: function () {
                this.getView().byId("sizingExpR")?.destroyItems();
                this.getView().byId("sizingExpL")?.destroyItems();
                const aLCards = this.applicationDataModel.getObject("/characteristicGroupsExpL");
                for (let i = 0; i < aLCards.length; i++) {
                    let oCtx = this.applicationDataModel.getContext("/characteristicGroupsExpL/" + i);
                    this.getView().byId("sizingExpL").addItem(this._buildExpertView(oCtx));
                }

                const aRCards = this.applicationDataModel.getObject("/characteristicGroupsExpR");
                for (let i = 0; i < aRCards.length; i++) {
                    let oCtx = this.applicationDataModel.getContext("/characteristicGroupsExpR/" + i);
                    this.getView().byId("sizingExpR").addItem(this._buildExpertView(oCtx));
                }
            },

            _buildExpertView: function (context) {
                var //      oGroup,
                    oExpGroups = {},
                    oFormElem;

                var fnCreateForm = function (oGroup, oCtx, sWidth) {
                    var bChildGrps = oGroup.groupings && oGroup.groupings.results && Array.isArray(oGroup.groupings.results) && oGroup.groupings.results.length > 0;
                    var sTitleStyle = sWidth || bChildGrps ? "expertTitleSub" : "expTitle";

                    var sRotateStyle = sWidth ? "rotate90Sub" : "rotate90";
                    var oHBox = new sap.m.HBox({
                        fitContainer: true,
                        width: "100%"
                    }).addStyleClass("expForm");
                    oHBox.onAfterRendering = function () {
                        if (sap.m.HBox.prototype.onAfterRendering) {
                            sap.m.HBox.prototype.onAfterRendering.apply(this, arguments);
                        }
                        var fnLoop = function (aItems) {
                            for (var i = 0; i < aItems.length; i++) {
                                if (aItems[i].getMetadata()._sClassName === "sap.m.Title") {
                                    var aCtrls = this.getModel("application").getProperty("/expTitleCtrls");
                                    aCtrls[aItems[i].getId()] = this.$().height();
                                    this.getModel("application").setProperty("/expTitleCtrls", aCtrls);
                                    aItems[i].setVisible(true);
                                } else if (aItems[i].getItems) {
                                    fnLoop(aItems[i].getItems());
                                }
                            }
                        }.bind(this);

                        var items = this.getItems();
                        fnLoop(items);
                    };
                    var width;
                    if (sWidth) {
                        width = sWidth;
                    } else {
                        width = bChildGrps ? "2.5rem" : "5rem";
                    }
                    var oBoxTitle = new sap.m.VBox({
                        alignItems: sap.m.FlexAlignItems.Center,
                        justifyContent: sap.m.FlexJustifyContent.Center,
                        alignContent: sap.m.FlexAlignContent.Center,
                        width: width
                    }).addStyleClass(sTitleStyle);
                    var sTitle = oGroup.VALUE_DISP ? "applicationData>" + oCtx.getPath() + "/VALUE_DISP" : "applicationData>" + oCtx.getPath() + "/DESCRIPTION";
                    var oTitle = new sap.m.Title({
                        text: {
                            path: sTitle
                        },
                        tooltip: {
                            path: sTitle
                        },
                        wrapping: true,
                        wrappingType: sap.m.WrappingType.Hyphenated,
                        visible: false
                    }).addStyleClass(sRotateStyle);
                    oTitle.onAfterRendering = function () {
                        if (sap.m.Title.prototype.onAfterRendering) {
                            sap.m.Title.prototype.onAfterRendering.apply(this, arguments);
                        }
                        var height = this.getModel("application").getProperty("/expTitleCtrls")[this.getId()];
                        this.$().height(height - 10 + "px");
                        var sCSS = this.aCustomStyleClasses;
                        for (var i = 0; i < sCSS.length; i++) {
                            if (sCSS[i] === "rotate90Sub") {
                                this.$()
                                    .parent()
                                    .css("padding-top", (this.$().parent().parent().height() - this.$().parent().height()) / 2);
                            }
                        }
                    };
                    oBoxTitle.addItem(oTitle);
                    oHBox.addItem(oBoxTitle);

                    if (bChildGrps) {
                        var oGrpsVBox = new sap.m.VBox({
                            fitContainer: true,
                            width: "100%"
                        });

                        for (var i = 0; i < oGroup.groupings.results.length; i++) {
                            oGrpsVBox.addItem(fnCreateForm(oGroup.groupings.results[i], oCtx.getModel().getContext(oCtx.getPath() + "/groupings/results/" + i), "2.5rem"));
                        }
                        oHBox.addItem(oGrpsVBox);
                        return oHBox;
                    } else {
                        var oForm = new Form({
                            layout: new sap.ui.layout.form.ResponsiveGridLayout({
                                labelSpanXL: 2,
                                labelSpanL: 3,
                                labelSpanM: 3,
                                labelSpanS: 3,
                                adjustLabelSpan: false,
                                emptySpanXL: 0,
                                emptySpanL: 0,
                                emptySpanM: 0,
                                emptySpanS: 0,
                                columnsXL: 2,
                                columnsL: 2,
                                columnsM: 1,
                                singleContainerFullSize: true
                            }).addStyleClass("gridPaddingTiny")
                        })
                            .addStyleClass("expForm")
                            .addStyleClass("customExpertView");

                        var oFormCont = new FormContainer();
                        var aElements = oGroup.characteristics.results;
                        for (var j = 0; j < aElements.length; j++) {
                            if (aElements[j].VIEW_ID !== "") {
                                if (oExpGroups[aElements[j].VIEW_ID]) {
                                    aElements[j].custPath = oCtx.getPath() + "/characteristics/results/" + j;
                                    oExpGroups[aElements[j].VIEW_ID].push(aElements[j]);
                                } else {
                                    aElements[j].custPath = oCtx.getPath() + "/characteristics/results/" + j;
                                    oExpGroups[aElements[j].VIEW_ID] = [aElements[j]];
                                }
                                if (j < aElements.length - 1) {
                                    if (oExpGroups[aElements[j].VIEW_ID] === oExpGroups[aElements[j + 1].VIEW_ID]) {
                                        continue;
                                    }
                                }
                            }

                            if (oExpGroups && !jQuery.isEmptyObject(oExpGroups)) {
                                for (var key in oExpGroups) {
                                    var aComb = oExpGroups[key];
                                    for (var k = 0; k < aComb.length; k++) {
                                        if (k === 0) {
                                            var oLabel = new sap.m.Label({
                                                wrapping: false,
                                                text: {
                                                    path: "applicationData>" + aComb[0].custPath + "/VALUE_DISP"
                                                },
                                                tooltip: {
                                                    path: "applicationData>" + aComb[0].custPath + "/VALUE_DISP"
                                                }
                                            });
                                            oFormElem = new FormElement({
                                                label: oLabel
                                            });
                                        }
                                        oFormElem.addField(this.globalFunction.createCharacteristicControlExp(aComb[k], aComb[k].custPath));
                                    }
                                    oFormCont.addFormElement(oFormElem);
                                    delete oExpGroups[key];
                                }
                            } else {
                                var sObjPath = oCtx.getPath() + "/characteristics/results/" + j;
                                var oLabel = new sap.m.Label({
                                    wrapping: false,
                                    text: {
                                        path: "applicationData>" + sObjPath + "/VALUE_DISP"
                                    },
                                    tooltip: {
                                        path: "applicationData>" + sObjPath + "/VALUE_DISP"
                                    }
                                });
                                oFormElem = new FormElement({
                                    label: oLabel
                                });
                                oFormElem.addField(this.globalFunction.createCharacteristicControlExp(aElements[j], sObjPath));
                                oFormCont.addFormElement(oFormElem);
                            }
                        }
                        oForm.addFormContainer(oFormCont);
                        oHBox.addItem(oForm);
                        return oHBox;
                    }
                }.bind(this);

                var oCard = new Card().addStyleClass("styleCard");
                oCard.setContent(fnCreateForm(context.getObject(), context));
                return oCard;
            },

            navigateToSelection: function (oEvent) {
                if (oEvent.getSource().getId().includes("btnGoToSelection")) {
                    const selectionProducts = this.globalFunction.applicationDataModelRead("/selectionProducts");
                    if (selectionProducts.length === 1) {
                        const aProds = this.globalFunction.applicationDataModelRead("/selectionProducts");
                        this.globalFunction.configureProduct(aProds[0].Matnr);
                        return;
                    }
                }
                this.globalFunction.applicationDataModelWrite("/charGroupPanels", this._getControlsInGroups());
                this.globalFunction.navigateToSelection();
            },

            saveChanges: function () {
                this.globalFunction.applicationModelRead("/controls/langSelect").setEnabled(false);
                this.globalFunction.rotateSyncButton(true, this.byId("saveBtn"));
                this.globalFunction.saveChanges();
            }
        });
    }
);
