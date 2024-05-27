sap.ui.define(["com/leser/valvestar/controller/BaseController"], function (Controller) {
    "use strict";
    return Controller.extend("com.leser.valvestar.controller.SelectionPage", {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         * @memberOf com.leser.valvestar.SelectionPage
         */
        _paneWidths: [],
        onInit: function () {
            Controller.prototype.onInit.apply(this, arguments);
            this.getOwnerComponent().getRouter().getRoute("ProductFindungSelectionRoute").attachPatternMatched(this._onPatternMatched, this);
            this._resizeHandler = this.onSplitterResize.bind(this);
            document.addEventListener("touchend", this._resizeHandler);
            document.addEventListener("mouseup", this._resizeHandler);
            sap.ui.Device.resize.attachHandler(
                function (mParams) {
                    this._resizePageContent();
                }.bind(this)
            );
        },

        _onPatternMatched: function (oEvent) {
            // Set toogle button selected
            this.globalFunction.setPressedToggleButton("idTogSelection");
            this.globalFunction.getProductsForSelectionExpanded();
            this.globalFunction.populateCurrentConfigurationForSelection();
        },

        handleToggleDetail: function (oEvent) {
            var aVBoxItems = oEvent.getSource().getParent().getItems();
            for (var i = 0; i < aVBoxItems.length; i++) {
                if (aVBoxItems[i].getId().includes("vbAdditionalInformation")) {
                    var avbAddInfos = aVBoxItems[i].getItems()[0];
                    aVBoxItems[i].getItems()[0].setVisible(!avbAddInfos.getVisible());
                }
            }
        },

        _resizePageContent: function () {
            var oNavPage = this.getView().getParent(),
                iPageHeight = oNavPage.getParent().getDomRef().clientHeight,
                iHeaderHeight = oNavPage.getParent().getCustomHeader().getDomRef().clientHeight,
                iNavHeight = oNavPage.getParent().getContent()[0].getDomRef().clientHeight,
                restHeight = iPageHeight - iHeaderHeight - iNavHeight;
            oNavPage.setHeight(restHeight + "px");
        },

        onSplitterResize: function () {
            var resized = false;
            var panes = this.getView().byId("pnContSelPage").getPanes();
            for (var index = 0; index < panes.length; index++) {
                var paneWidth = $(panes[index].getContent().getDomRef()).parent().css("width");
                if (paneWidth !== this._paneWidths[index]) {
                    this._paneWidths[index] = paneWidth;
                    resized = true;
                }
            }
            if (resized) {
                this._resizePageContent();
            }
        },

        configureProduct: function (t) {
            var e = t.getSource().getParent().getParent();
            var n = e.getBindingContext("applicationData").getObject("Articleno");

            this.globalFunction.configureProduct(n);
        }
    });
});
