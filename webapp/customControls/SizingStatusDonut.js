/* eslint-disable max-statements */
/* eslint-disable complexity */
sap.ui.define(["sap/ui/core/Control"], function(Control) {
  "use strict";

  return Control.extend("com.leser.valvestar.customControls.SizingStatusDonut", {
    metadata: {
      properties: {
        title: {
          type: "string"
        },
        infoTitle: {
          type: "string"
        },
        info: {
          type: "string"
        },
        width: {
          type: "string",
          defaultValue: "auto"
        },
        height: {
          type: "string",
          defaultValue: "auto"
        },
        visible: {
          type: "boolean",
          defaultValue: true
        },
        state: {
          type: "string",
          defaultValue: "None"
        },
        progress: {
          type: "int",
          defaultValue: 0
        }
      }
    },

    onAfterRendering: function() {
      if (sap.ui.core.Control.onAfterRendering) {
        sap.ui.core.Control.onAfterRendering.apply(this, arguments);
      }
    },

    renderer: function(rm, control) {
      rm.write("<div");
      rm.writeControlData(control);
      rm.addClass("statusDonutSize");
      rm.writeClasses();
      rm.addStyle("width", control.getWidth());
      rm.addStyle("height", control.getHeight());
      rm.writeStyles();
      rm.write(">");

      // Create title element
      rm.write("<div");
      rm.addStyle("margin", "0rem 0rem 0rem 1rem");
      rm.writeStyles();
      rm.write(">");

      rm.write("<h2");
      rm.addClass("statusDonutTitle");
      rm.writeClasses();
      rm.write(">");
      rm.write(control.getTitle() || "");
      rm.write("</h2>");

      rm.write("</div>");

      // Create donut element
      rm.write("<div");
      rm.addStyle("display", "-webkit-inline-box");
      rm.addStyle("margin", "0rem 0rem 1rem 1rem");
      rm.addStyle("height", "auto");
      rm.addStyle("width", "auto");
      rm.writeStyles();
      rm.write(">");

      rm.write("<div");
      rm.addClass("statusDonutPieWrapper");
      rm.writeClasses();
      rm.write(">");

      rm.write("<div>");

      rm.write("<div>");

      rm.write("<span");
      rm.addClass("statusDonutLabel");
      switch (control.getState()) {
      case "None":
        break;
      case "Success":
        rm.addClass("statusDonutLabelSuccess");
        break;
      case "Warning":
        rm.addClass("statusDonutLabelWarning");
        break;
      case "Error":
        rm.addClass("statusDonutLabelError");
        break;
      default:
      }
      rm.writeClasses();
      rm.write(">");

      rm.write("<span");
      rm.addClass("statusDonutIcon");
      switch (control.getState()) {
      case "None":
        break;
      case "Success":
        rm.addClass("statusDonutIconSuccess");
        break;
      case "Warning":
        rm.addClass("statusDonutIconWarning");
        break;
      case "Error":
        rm.addClass("statusDonutIconError");
        break;
      default:
      }
      rm.writeClasses();
      rm.write("/>");

      rm.write("</span>");

      rm.write("</div>");

      rm.write("<div");
      var percent = Math.round(control.getProgress());
      var deg = Math.round(360 * (percent / 100));
      if (percent > 50) {
        rm.addStyle("clip", "rect(auto, auto, auto, auto)");
      } else {
        rm.addStyle("clip", "rect(0px, 5em, 5em, 2.5em)");
      }
      rm.writeStyles();
      rm.addClass("statusDonutPie");
      rm.writeClasses();
      rm.write(">");
      rm.write("<div");
      if (percent > 0) {
        rm.addStyle("border-width", "1em");
        if (percent <= 50) {
          rm.addStyle("border-color", "black");
        } else if (percent > 50) {
          rm.addStyle("border-color", "green");
        }
      } else if (percent === 0) {
        rm.addStyle("border-width", "0em");
        rm.addStyle("border-color", "#BDC3C7");
      }
      rm.addStyle("transform", "rotate(" + deg + "deg)");
      rm.writeStyles();
      rm.addClass("statusDonutLeftSide");
      rm.addClass("statusDonutHalfCircle");
      switch (control.getState()) {
      case "None":
        break;
      case "Success":
        rm.addClass("statusDonutHalfCircleSuccess");
        break;
      case "Warning":
        rm.addClass("statusDonutHalfCircleWarning");
        break;
      case "Error":
        rm.addClass("statusDonutHalfCircleError");
        break;
      default:
      }
      rm.writeClasses();
      rm.write(">");
      rm.write("</div>");

      rm.write("<div");
      if (percent > 50) {
        rm.addStyle("transform", "rotate(180deg)");
      } else {
        rm.addStyle("transform", "rotate(0deg)");
      }
      if (percent > 0) {
        rm.addStyle("border-width", "1em");

        if (percent <= 50) {
          rm.addStyle("border-color", "black");
        } else if (percent > 50) {
          rm.addStyle("border-color", "green");
        }
      } else if (percent === 0) {
        rm.addStyle("border-width", "0em");
        rm.addStyle("border-color", "#BDC3C7");
      }
      rm.writeStyles();
      rm.addClass("statusDonutRightSide");
      rm.addClass("statusDonutHalfCircle");
      switch (control.getState()) {
      case "None":
        break;
      case "Success":
        rm.addClass("statusDonutHalfCircleSuccess");
        break;
      case "Warning":
        rm.addClass("statusDonutHalfCircleWarning");
        break;
      case "Error":
        rm.addClass("statusDonutHalfCircleError");
        break;
      default:
      }
      rm.writeClasses();
      rm.write(">");
      rm.write("</div>");

      rm.write("</div>");

      rm.write("</div>");

      rm.write("<div");
      rm.addClass("statusDonutShadow");
      rm.writeClasses();
      rm.write(">");
      rm.write("</div>");

      rm.write("</div>");

      rm.write("<div");
      rm.addClass("statusDonutInfo");
      rm.writeClasses();
      rm.addStyle("margin-left", "1rem");
      rm.writeStyles();
      rm.write(">");

      rm.write("<h2");
      rm.addClass("statusDonutInfoTitle");

      switch (control.getState()) {
      case "Warning":
        rm.addClass("statusDonutInfoTitleWarning");
        break;
      case "Error":
        rm.addClass("statusDonutInfoTitleError");
        break;
      default:
      }

      rm.writeClasses();
      rm.write(">");
      rm.write(control.getInfoTitle() || "");
      rm.write("</h2>");

      rm.write("<div");
      rm.addStyle("margin-right", "0.8rem");
      rm.writeStyles();
      rm.write(">");

      rm.write("<span");
      rm.addClass("statusDonutInfoInner");
      rm.writeClasses();
      rm.write(">");
      rm.write(control.getInfo() || "");
      rm.write("</span>");

      rm.write("</div>");

      rm.write("</div>");

      rm.write("</div>");

      rm.write("</div>");
    }
  });
});
