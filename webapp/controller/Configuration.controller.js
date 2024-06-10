sap.ui.define(["com/leser/valvestar/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/model/BindingMode"], function(Controller, JSONModel, BindingMode) {
  "use strict";
  return Controller.extend("com.leser.valvestar.controller.configuration.Configuration", {
    onInit: function() {
      var that = this;
      Controller.prototype.onInit.apply(this, arguments);
      this.getOwnerComponent().getRouter().getRoute("ConfigurationRoute").attachPatternMatched(this._onPatternMatched, this);
      this.globalFunction.applicationDataModelWrite("/currentConfigurationForSelection", []);
      this.globalFunction.applicationDataModelWrite("/currentConfigurationForKonfig", []);
      var oViewModel = new JSONModel({
        selectedGrp: ""
      });
      oViewModel.setDefaultBindingMode(BindingMode.TwoWay);
      this.getView().setModel(oViewModel, "viewModel");

      var oVBox = this.getView().byId("sizingCharactGroupVBox");
      oVBox.onAfterRendering = function() {
        if (sap.m.VBox.prototype.onAfterRendering) {
          sap.m.VBox.prototype.onAfterRendering.apply(this, arguments);
        }
      };

      var oGrpBox = this.getView().byId("grpButtons");
      oGrpBox.onAfterRendering = function() {
        if (sap.m.VBox.prototype.onAfterRendering) {
          sap.m.VBox.prototype.onAfterRendering.apply(this, arguments);
        }
        var BreakException = {};

        try {
          this.getItems().forEach(function(oItem) {
            if (oItem.getVisible()) {
              oItem.firePress();
              that.globalFunction.applicationDataModelWrite("/busyStart", false);
              throw BreakException;
            }
          });
        } catch (err) {
          if (err !== BreakException) { throw err; }
        }
      };
    },

    showCharacteristicInfoText: function(evt) {
      var object = evt.getSource().getBindingContext("applicationData").getObject();

      var popover;

      var fnClose = function(e) {
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
        endButton: new sap.m.Button({
          text: this.globalFunction.getText("close"),
          press: fnClose
        })
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

    /*  onAfterRendering: function() {
      let screenWidth = this.getView().$().width() / 16;
      let boxWidth = screenWidth - 6.4 + "rem";

      // Set width of toolbar first space
      this.getView().byId("vbProdKonf").setWidth(boxWidth);

      sap.ui.Device.resize.attachHandler(
        function() {
          let screenWidthDev = this.getView().$().width() / 16;
          let boxWidthDev = screenWidthDev - 6.4 + "rem";
          // Set width of toolbar first space
          this.getView().byId("vbProdKonf").setWidth(boxWidthDev);
        }.bind(this),
        this.getView().byId("vbProdKonf")
      );
    }, */

    onLinkPressed: function(oEvent) {
      var oAtnam = oEvent.getSource().data("atnam");
      document.querySelector("." + oAtnam).scrollIntoView(false);
      document.querySelector("." + oAtnam + " > div input").select();
    },

    _onPatternMatched: function(oEvent) {
      var that = this;
      this.matnr = oEvent.getParameter("arguments").matnr;
      this.globalFunction.applicationModelRead("/controls/langSelect").setEnabled(false);
      this.globalFunction.getSideNavigation({}, function(oResult, data) {
        oResult.results.forEach((tab, tabIndex) => {
          tab.groupings.results.forEach((grouping, groupingIndex) => {
            grouping.characteristics.results.forEach((char, charIndex) => {
              let val = grouping.characteristics.results.filter(element => element.VIEW_ID !== "" && element.VIEW_ID === char.VIEW_ID);
              if (val.length > 1) {
                val.sort((a, b) => {
                  return a.ID - b.ID;
                });

                let foundIndex = grouping.characteristics.results.findIndex(element => element.ID === val[0].ID);
                grouping.characteristics.results.filter(element => element.ID !== val[1].ID);
                val[0].UNIT = val[1];
                grouping.characteristics.results[foundIndex] = val[0];
              }
            });
            grouping.characteristics.results = grouping.characteristics.results.filter(element => !element.ATNAM.includes("UNIT"));
          });
        });
        that.globalFunction.destroyBusyDialog();
        that.globalFunction.applicationDataModelWrite("/characteristicGroups", oResult.results);
        that.globalFunction.getApplicationDataModel().refresh();
        that.globalFunction.populateConfigList();
      });

      this.getInstanceInfo(undefined, jQuery.proxy(this._getInstanceInfoError, this));
      this.globalFunction.setPressedToggleButton("idTogProdKonf");
      var oBtnGrp = this.getView().byId("grpButtons");
      if (oBtnGrp && oBtnGrp.getItems() && oBtnGrp.getItems().length > 0 && oBtnGrp.getItems()[0].getVisible()) {
        this.globalFunction.applicationDataModelWrite("/busyStart", false);
      }
      this.globalFunction.applicationDataModelWrite("/saveBtn/visible", true);
      this.globalFunction.applicationDataModelWrite("/busyStart", false);
      this.globalFunction.changeStatusDisplayConfigurationPage({
        STATUS: this.globalFunction.applicationDataModelRead("/configurationStatus")
      });
    },

    getInstanceInfo: function(t, e) {
      this.globalFunction.getInstanceInfo({}, t, e);
    },
    _getInstanceInfoError: function(t) {
      this.globalFunction.applicationDataModelWrite("/instanceInfo", {
        STATE: "E"
      });
    },

    createCharacteristicControlConfig: function(t, e) {
      return this.globalFunction.createCharacteristicControlConfig(t, e);
    },

    onGrpChange: function(oEvent) {
      var aCustData = oEvent.getSource().getCustomData(),
        sGrpId = "";
      for (var i = 0; i < aCustData.length; i++) {
        if (aCustData[i].getKey() === "grpId") {
          sGrpId = aCustData[i].getValue();
        }
      }

      this.getView().getModel("viewModel").setProperty("/selectedGrp", sGrpId);

      this.getView()
        .byId("grpButtons")
        .getItems()
        .forEach(function(oItem) {
          var aCustDataBtn = oItem.getCustomData(),
            sGenGrpId = "";
          for (var j = 0; j < aCustDataBtn.length; j++) {
            if (aCustDataBtn[j].getKey() === "grpId") {
              sGenGrpId = aCustDataBtn[j].getValue();
            }
          }
          if (sGenGrpId === sGrpId) {
            oItem.removeStyleClass("vcButtonGrey");
            oItem.addStyleClass("vcButtonPKBlue");
          } else {
            oItem.removeStyleClass("vcButtonPKBlue");
            oItem.addStyleClass("vcButtonGrey");
          }
        });
    },

    /* expandCharacteristicGroup: function (t) {
            if (!t.getParameter("triggeredByInteraction")) {
                return;
            }
            var e = t.getParameter("expand") ? t.getSource() : null;
            this._togglePanels(e);
        },

        _togglePanels: function (t) {
            if (!t) {
                return;
            }
            var e = this.getView().byId("sizingCharactGroupVBox").getItems();
            e.forEach(function (e) {
                if (e !== t) {
                    e.setExpanded(false);
                }
            });
        }, */
    navigateToSelection: function() {
      this.globalFunction.navigateToSelection();
    }
  });
});
