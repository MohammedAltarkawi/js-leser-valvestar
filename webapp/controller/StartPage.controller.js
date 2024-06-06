/* eslint-disable fiori-custom/sap-no-location-reload */
sap.ui.define([
  "com/leser/valvestar/controller/BaseController"
],

function(Controller) {
  "use strict";

  return Controller.extend("com.leser.valvestar.controller.StartPage", {
    onInit: function() {
      Controller.prototype.onInit.apply(this, arguments);
      this.getOwnerComponent().getRouter().getRoute("ProductFindungStartRoute").attachPatternMatched(this._onPatternMatched, this);
      this.globalFunction.applicationModelWrite("/controls/toggleSizingButton", this.getView().byId("idTogSizing"));
      this.globalFunction.applicationModelWrite("/controls/toggleSelectionButton", this.getView().byId("idTogSelection"));
      this.globalFunction.applicationModelWrite("/controls/toggleProdKonfButton", this.getView().byId("idTogProdKonf"));
      this.globalFunction.applicationModelWrite("/controls/leftTriangle", this.getView().byId("left-triangle"));
      this.globalFunction.applicationModelWrite("/controls/rightTriangle", this.getView().byId("right-triangle"));

      this.globalFunction.applicationModelWrite("/controls/toggleSizingText", this.getView().byId("idTogSizingText"));
      this.globalFunction.applicationModelWrite("/controls/toggleSelectionText", this.getView().byId("idTogSelectionText"));
      this.globalFunction.applicationModelWrite("/controls/toggleProdKonfText", this.getView().byId("idTogPordKonfText"));
      this.globalFunction.applicationModelWrite("/controls/langSelect", this.getView().byId("systemLanguage"));
    },

    onBeforeRendering: function() {
      var that = this;

      var toSizingButton = this.getView().byId("idTogSizing");
      toSizingButton.onAfterRendering = function() {
        if (sap.m.ToggleButton.prototype.onAfterRendering) {
          sap.m.ToggleButton.prototype.onAfterRendering.apply(this, arguments);
        }

        // Set margin property of toolbar
        $("#" + this.getId() + "-content").css("margin-left", "3.2rem");
      };

      var toSizingText = this.getView().byId("idTogSizingText");
      toSizingText.onAfterRendering = function() {
        if (sap.m.Text.prototype.onAfterRendering) {
          sap.m.Text.prototype.onAfterRendering.apply(this, arguments);
        }

        $("#" + this.getId()).css("margin-left", "3.2rem");
      };

      var oPageHeader = this.getView().byId("pageHeader");
      oPageHeader.onAfterRendering = function() {
        if (sap.m.OverflowToolbar.prototype.onAfterRendering) {
          sap.m.OverflowToolbar.prototype.onAfterRendering.apply(this, arguments);
        }

        var oCont = that.getView().byId("navContainerProdFindung");
        oCont.setHeight(that.getView().byId("parentPage").$().height() - this.$().height() - that.getView().byId("toolbarBox").$().height() - 10 + "px");
      };
    },

    _onPatternMatched: function(oEvent) {
      const that = this;
      const matnr = oEvent.getParameter("arguments").matnr;
      this.globalFunction.getProductsForSelection({}, function(result, response) {
        that.globalFunction.applicationDataModelWrite("/selectionProducts", result.results, false);
        if (result.results.length === 1) {
          that.globalFunction.configureProduct(result.results[0].Matnr);
        } else {
          that.getOwnerComponent().getRouter().navTo("ProductFindungSizingRoute", {
            matnr: matnr
          });
        }
      });
    },

    onTogSizingPress: function(oEvent) {
      this.globalFunction.navigateToSizing(this.matnr);
    },

    onTogSelectionPress: function(oEvent) {
      this.globalFunction.navigateToSelection(this.matnr);
    },

    onTogPordKonfPress: function(oEvent) {
      var prods = this.globalFunction.applicationDataModelRead("/selectionProducts");
      this.globalFunction.configureProduct(prods[0].Matnr);
    },

    onResetPress: function(oEvent) {
      this.globalFunction.getComponent().getRouter().navTo("startPage");
      if (this.globalFunction.applicationDataModelRead("/isExistingConfigUUID") || this.globalFunction.applicationDataModelRead("/isExistingConfigID")) {
        this.globalFunction.cleanLink();
      } else {
        window.location.reload();
      }
    },

    onLoadConfiguration: function(oEvent) {
      const item = oEvent.getParameter("query");

      if (item !== "" && !oEvent.getParameter("clearButtonPressed")) {
        //const oLink = window.location.search;
        let sParameter;

        if (item.length === 26) {
          sParameter = "configuuid";
        } else if (item.length <= 10 && this._isNumber(item)) {
          sParameter = "configid";
        }

        if (sParameter) {
          // Remove existing configid or configuuid parameter
          //const newSearch = oLink.replace(/&?config(?:id|uuid)=[^&]*/g, "");
          // Add the new parameter

          this.globalFunction.getComponent().getRouter().getHashChanger().setHash("");
          var newUrl = new URL(window.location.href);
          newUrl.searchParams.set(sParameter, item);
          window.history.replaceState({}, "", newUrl);
          window.location.reload();
          //window.location.search = newSearch + sParameter + item;
        } else {
          const oErrorDialog = this.globalFunction.getErrorDialog(this.globalFunction.getText("IDIsInvalid"));
          oErrorDialog.open();
        }
      } else {
        // Remove existing configid or configuuid parameter
        this.globalFunction.getComponent().getRouter().getHashChanger().setHash("");
        this.globalFunction.cleanLink();
      }
    },

    onLanguageChange: function(oEvent) {
      //moved to global function
      this.globalFunction.onLanguageChangeCell(oEvent);
    },

    onSavePress: function() {
      this.getView().byId("saveBtn").setIcon("sap-icon://refresh");
      this.globalFunction.rotateSaveButton(true, this.byId("saveBtn"));
      this.globalFunction.saveConfiguration(
        {
          mode: "S"
        },
        jQuery.proxy(this._successSave, this),
        jQuery.proxy(this._successSave, this)
      );
    },

    onPrintPress: function() {
      this.getView().byId("printBtn").setIcon("sap-icon://refresh");
      this.globalFunction.rotatePrintButton(true, this.byId("printBtn"));
      this.globalFunction.saveConfiguration(
        {
          mode: "S"
        },
        jQuery.proxy(this.handleSavePrint, this),
        jQuery.proxy(this._successSave, this)
      );
    },

    handleSavePrint: function() {
      this.globalFunction.downloadPdf();
    },

    _isNumber: function(number) {
      const regex = /^\d{1,10}$/;
      return regex.test(number);
    },

    _successSave: function(data, response) {
      this.globalFunction.rotateSaveButton(false);
      if (data.statusCode === "400") {
        let oDialog = this.globalFunction.createSaveDialogError(data);
        oDialog.open();
      } else {
        let oDialog = this.globalFunction.createSaveDialog(data.CONFIG_UUID);
        oDialog.open();
      }
    },

    //displays an error dialog if the save was unsuccessdull
    _errorSave: function(data, response) {
      var oDialog = this.globalFunction.createSaveDialogError(data);
      oDialog.open();
    }
  });
});
