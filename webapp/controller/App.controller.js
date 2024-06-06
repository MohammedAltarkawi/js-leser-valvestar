/* eslint-disable fiori-custom/sap-no-location-reload */
/* eslint-disable camelcase */
/* eslint-disable guard-for-in */
/* eslint-disable max-statements */
sap.ui.define(
  [
    "com/leser/valvestar/controller/BaseController",
    "sap/m/Dialog"
  ],
  function(BaseController, Dialog) {
    "use strict";

    return BaseController.extend("com.leser.valvestar.controller.App", {
      onBeforeRendering: function() {
        if (this.getOwnerComponent().getRouter().getHashChanger().getHash() !== "SalesOrderList") {
          // Create and open busy dialog
          var busyDialog = this.globalFunction.createBusyDialog();
          busyDialog.open();
        }

        // slight update to account for browsers not supporting e.which
        // To disable f5
        /* jQuery < 1.7 */
        $(document).bind("keydown", this.disableF5);
        /* OR jQuery >= 1.7 */
        $(document).on("keydown", this.disableF5);

        var that = this;
        var sizingMaterialData;
        // Read url parameter
        this.globalFunction.setObjectToCurrentComponent(this.globalFunction.getUrlParameterObject(), "urlParamter");
        // Application initializing
        var urlParameter = this.globalFunction.getObjectFromCurrentComponent("urlParamter");
        var headers = {
          init: "X"
        };
        if (urlParameter) {
          for (var prop in urlParameter) {
            headers[prop] = urlParameter[prop];
          }
          headers.url_para = JSON.stringify(urlParameter);
        }

        if (urlParameter?.configid?.length > 0) {
          this.globalFunction.applicationDataModelWrite("/isExistingConfigID", true);
          this.globalFunction.applicationDataModelWrite("/existingConfigID", urlParameter.configid);
        } else {
          this.globalFunction.applicationDataModelWrite("/isExistingConfigID", false);
        }

        if (urlParameter?.configuuid?.length > 0) {
          this.globalFunction.applicationDataModelWrite("/isExistingConfigUUID", true);
          this.globalFunction.applicationDataModelWrite("/existingConfigUUID", urlParameter.configuuid);
        } else {
          this.globalFunction.applicationDataModelWrite("/isExistingConfigUUID", false);
        }

        if (urlParameter && urlParameter["sap-language"] && urlParameter["sap-language"].length > 0) {
          this.globalFunction.applicationDataModelWrite("/systemLanguage", urlParameter["sap-language"]);
        } else {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set("sap-language", "EN");
          window.history.replaceState({}, "", newUrl);
          window.location.reload();
        }

        if (urlParameter && urlParameter.ui5authtoken && urlParameter.ui5authtoken.length > 0) {
          this.globalFunction.applicationDataModelWrite("/ssoToken", urlParameter.ui5authtoken);
        }

        if (urlParameter && urlParameter.view) {
          this.globalFunction.applicationDataModelWrite("/viewParameterStart", true);
          this.globalFunction.applicationModelWrite("/customizing/sizingViewType", "01");
        }
        this.globalFunction.applicationDataModelWrite("/backNavEnabled", true);
        this.globalFunction.applicationDataModelWrite("/expertSaveMode", true);
        this.globalFunction.applicationDataModelWrite("/configScreen", true);
        if (urlParameter && urlParameter.screen && urlParameter.screen === "2") {
          this.globalFunction.applicationDataModelWrite("/configScreen", false);
        }

        if (urlParameter && urlParameter.view && urlParameter.view === "EXPERT") {
          this.globalFunction.applicationDataModelWrite("/startExpert", true);
          this.globalFunction.applicationModelWrite("/customizing/sizingViewType", "02");
        }

        this.globalFunction.initApplication(headers, function(oData, oResponse) {
          sizingMaterialData = oData.results.find(function(setting) {
            return setting.NAME === "sizingMaterial";
          });
          sizingMaterialData.VALUE = sizingMaterialData.VALUE.toUpperCase();
          that.globalFunction.applicationDataModelWrite("/sizingMaterialData", sizingMaterialData, false);

          that.globalFunction.getCustomizing(
            {
              url_para: JSON.stringify({
                matnr: sizingMaterialData.VALUE
              })
            },
            "startConfiguration",
            {
              matnr: sizingMaterialData.VALUE
            },
            function(result, response) {
              // Set customizing
              that.globalFunction.setCustomizing(result.results);
              let oConfig;
              if (that.globalFunction.applicationDataModelRead("/isExistingConfigUUID")) {
                oConfig = {
                  matnr: sizingMaterialData.VALUE,
                  configuuid: that.globalFunction.applicationDataModelRead("/existingConfigUUID")
                };
              } else if (that.globalFunction.applicationDataModelRead("/isExistingConfigID")) {
                oConfig = {
                  matnr: sizingMaterialData.VALUE,
                  configid: that.globalFunction.applicationDataModelRead("/existingConfigID")
                };
              } else {
                oConfig = {
                  matnr: sizingMaterialData.VALUE
                };
              }
              //Start configuration for this material
              that.globalFunction.startConfiguration(
                oConfig,
                function(data) {
                  that.globalFunction.applicationDataModelWrite("configurationInformation/currentInstance", data.INSTANCE, false);
                  that.globalFunction.getLanguages();
                  that.globalFunction.geti18n();
                  if (
                    that.getOwnerComponent().getRouter().getHashChanger().getHash() !== "SalesOrderList" ||
                                  that.getOwnerComponent().getRouter().getHashChanger().getHash().includes("Project")
                  ) {
                    that.getOwnerComponent().getRouter().navTo("ProductFindungStartRoute", {
                      matnr: sizingMaterialData.VALUE
                    });
                  }
                },
                function(data) {
                  var saveDialog = new Dialog({
                    type: "Message",
                    title: "Error",
                    state: "Error",
                    content: new sap.m.Text({
                      text: JSON.parse(data.responseText).error.message.value + "\n Error Code: " + JSON.parse(data.responseText).error.code
                    }),
                    beginButton: new sap.m.Button({
                      type: "Emphasized",
                      icon: "sap-icon://accept",
                      press: function(evt) {
                        evt.getSource().getParent().close();
                        //this["TVC/VC_UI5/class/GlobalFunction"].prototype["cleanLink"]()
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.delete("configid");
                        newUrl.searchParams.delete("configuuid");
                        window.history.replaceState({}, "", newUrl);
                        window.location.reload();
                      }
                    }).addStyleClass("vcButtonBlue")
                  });

                  saveDialog.open();
                }
              );
            }
          );
        });
      },



      disableF5: function(e) {
        if ((e.which || e.keyCode) === 116) { e.preventDefault(); }
      }
    });
  }
);
