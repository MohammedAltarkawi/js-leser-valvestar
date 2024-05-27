sap.ui.define([], function () {
    "use strict";

    return {
        _findCharacteristic: function (data) {
            if (!data) {
                return [];
            }
            var groupings = data.groupings.results;
            var characteristics = data.characteristics.results;
            for (var key in groupings) {
                this._findCharacteristic(groupings[key]).forEach(function (characteristic) {
                    characteristics.push(characteristic);
                });
            }
            return characteristics;
        },

        setNextButtonVisible: function (sizingViewType, characteristicGroup) {
            var characteristics = this._findCharacteristic(characteristicGroup);
            var characteristic = characteristics.find(function (char) {
                return char.OBLIGATORY === "X";
            });

            if (!characteristic) {
                return true;
            }

            return false;
        },

        getRequiredCharacteristics: function (characteristicGroup) {
            var characteristics = this._findCharacteristic(characteristicGroup);
            var requiredCharacteristics = [];
            for (var key in characteristics) {
                var currentChar = characteristics[key];
                if (currentChar.OBLIGATORY === "X") {
                    var push = requiredCharacteristics.find(function (char) {
                        return char.ATNAM === currentChar.ATNAM;
                    });
                    if (!push) {
                        requiredCharacteristics.push(currentChar);
                    }
                }
            }
            return requiredCharacteristics;
        },

        getMessageBoxVisibleByState: function (state) {
            if (state !== "E") {
                return false;
            }
            return true;
        },

        getStateChartProgressBySelectionProducts: function (selectionProducts) {
            var materialsCount = selectionProducts.length;
            if (materialsCount > 100) {
                var progress = 25;
            } else if (materialsCount <= 100 && materialsCount > 50) {
                progress = 50;
            } else if (materialsCount <= 50 && materialsCount > 1) {
                progress = 75;
            } else if (materialsCount === 1) {
                progress = 100;
            }
            return progress || 0;
        },

        getStateChartInfoTitle: function (selectionProducts, currentConfiguration, state) {
            var materialsCount = selectionProducts.length;
            var infoTitle = this.globalFunction.getText("inProgress");
            if (materialsCount > 100) {
                infoTitle = this.globalFunction.getText("inProgress");
            } else if (materialsCount <= 100 && materialsCount > 50) {
                infoTitle = this.globalFunction.getText("inProgress");
            } else if (materialsCount <= 50 && materialsCount > 1) {
                infoTitle = this.globalFunction.getText("completed");
            } else if (materialsCount === 1) {
                infoTitle = this.globalFunction.getText("completed");
            }
            if (!currentConfiguration || currentConfiguration.length === 0) {
                infoTitle = this.globalFunction.getText("inProgress");
            }
            if (state === "E") {
                infoTitle = this.globalFunction.getText("onHold");
            }
            return infoTitle;
        },

        getStateChartInfo: function (selectionProducts, currentConfiguration, state) {
            var materialsCount = selectionProducts.length;
            var info = this.globalFunction.getText("msgMoreThan100");
            if (materialsCount > 100) {
                info = this.globalFunction.getText("msgMoreThan100");
            } else if (materialsCount <= 100 && materialsCount > 50) {
                info = this.globalFunction.getText("msgTooLessProds");
            } else if (materialsCount === 50) {
                info = this.globalFunction.getText("msgTenProds");
            } else if (materialsCount < 50 && materialsCount > 1) {
                info = this.globalFunction.getText("msgLessThan10");
            } else if (materialsCount === 1) {
                info = this.globalFunction.getText("msgBestProd");
            } else if (materialsCount < 1) {
                info = this.globalFunction.getText("msgNoProdFound");
            }
            if (!currentConfiguration || currentConfiguration.length === 0) {
                info = this.globalFunction.getText("msgJustStarted");
            }
            if (state === "E") {
                info = this.globalFunction.getText("msgConfigInconsistent");
            }
            return info;
        },

        getStateChartState: function (state) {
            switch (state) {
                case "None":
                    return "None";
                case "Done" || "Success":
                    return "Success";
                case "E" || "error":
                    return "Error";
                case "F":
                    return "None";
                default:
                    return "None";
            }
        },

        getButtonStateBySelectionProducts: function (selectionProducts) {
            if (this.globalFunction.applicationDataModelRead("/state") === "E") {
                return false;
            }
            var materialsCount = selectionProducts.length;
            if (materialsCount > 50 || materialsCount < 1) {
                return false;
            }

            return true;
        },

        showHelpButtonByInfoText: function (infoText) {
            if (infoText && infoText !== "") {
                return true;
            }

            return false;
        },

        showPlaceholderByDisplayType: function (displayType, value) {
            if (displayType === "P" || displayType === "P") {
                return value;
            }
            return "";
        },

        setRequiredByState: function (obligatory) {
            if (obligatory !== "X") {
                return false;
            }
            return true;
        },

        showHelpButtonBySelectedValue: function (values) {
            var selectedValue = values.find(function (value) {
                return value.IS_SELECTED === "X";
            });
            if (!selectedValue || selectedValue.INFO === "") {
                return false;
            }
            return true;
        },

        getPanelCount: function (groupData) {
            var groups = this.globalFunction.applicationDataModelRead("/characteristicCategories")[1].characteristicGroups.results;
            for (var key in groups) {
                if (groups[key].GRUPPE !== groupData.GRUPPE) {
                    continue;
                }
                var step = parseFloat(key) + 1;
                return this.globalFunction.getText("step") + " " + step + " " + this.globalFunction.getText("of") + " " + groups.length;
            }

            return "";
        },

        getSelectionButtonInfo: function (selectionProducts, currentConfiguration) {
            var materialsCount = selectionProducts.length;
            var info = this.globalFunction.getText("msgTooManyProds");
            if (materialsCount > 50) {
                info = this.globalFunction.getText("msgTooManyProds");
            } else if (materialsCount === 50) {
                info = this.globalFunction.getText("msg10ProdsFounds");
            } else if (materialsCount < 50 && materialsCount > 1) {
                info = this.globalFunction.getText("msgLessThan10");
            } else if (materialsCount < 1) {
                info = this.globalFunction.getText("notSpecified");
            } else if (materialsCount === 1) {
                info = this.globalFunction.getText("msg1ProdsFounds");
            }
            if ((!currentConfiguration || currentConfiguration.length === 0) && materialsCount < 1) {
                //change this part to also look for the active route. If we are on the configuration screen, do not change the text.
                info = this.globalFunction.getText("notSpecified");
            }
            return info;
        },

        getMessageCount: function (messages) {
            if (!messages) {
                return "";
            }
            return messages.length + " " + (messages.length > 1 ? this.globalFunction.getText("errorMessages") : this.globalFunction.getText("error"));
        },

        getMessageText: function (data) {
            if (!data) {
                return "";
            }

            if (data.ATNAM === "") {
                var text = data.MSG;
            }

            return text;
        },

        getMessageTextHidden: function (data) {
            if (!data) {
                return false;
            }

            if (data.ATNAM === "") {
                return true;
            } else {
                return false;
            }
        },

        getMessageLinkHidden: function (data) {
            if (!data) {
                return false;
            }

            if (data.ATNAM !== "") {
                return true;
            } else {
                return false;
            }
        },

        getMessageLinkText: function (data) {
            if (!data) {
                return "";
            }

            if (data.ATNAM !== "") {
                var text = data.MSG;
            }

            return text;
        },

        getAtnam: function (data) {
            if (!data) {
                return "";
            }
            return data.ATNAM;
        },

        getEnabledByProductCount: function (selectionProducts) {
            var materialsCount = selectionProducts.length;
            if (materialsCount > 50 || materialsCount < 1) {
                return "false";
            }

            return "true";
        },

        getInfoHelpButtonVisible: function (val) {
            if (val.INFO) {
                return true;
            } else {
                return false;
            }
        },

        getIsHeaderCstic: function (cstic) {
            var section = cstic.UISECTION;
            if (section === "HEADER") {
                return true;
            }

            return false;
        },

        getIsFooterCstic: function (cstic) {
            var section = cstic.UISECTION;
            if (section === "FOOTER") {
                return true;
            }

            return false;
        },

        setCharacteristicNoDisplay: function (noDisplay) {
            return noDisplay !== "X" ? true : false;
        },

        setCharacteristicNoInput: function (noInput) {
            return noInput !== "X" ? true : false;
        },

        /* getConfigPanelCount: function (groupData) {
            var groups = this.globalFunction.applicationDataModelRead('/characteristicGroups');
            for (var key in groups) {
                if (groups[key].GRUPPE !== groupData.GRUPPE) {
                    continue;
                }
                var step = parseFloat(key) + 1;
                return this.globalFunction.getText('step') + ' ' + step + ' ' + this.globalFunction.getText('of') + ' ' + groups.length;
            }

            return '';
        },
        getPanelCountVisible: function (sizingViewType) {
            switch (sizingViewType) {
                case '01':
                    return true;
                case '02':
                    return false;
                default:
                    return true;
            }
        }, */
        getIsDetailCstic: function (cstic) {
            var section = cstic.UISECTION;
            if (section === "DETAIL") {
                return true;
            }

            return false;
        }
        /* setPanelExpandableByViewType: function (sizingViewType) {
            switch (sizingViewType) {
                case '01':
                    return false;
                case '02':
                    return true;
                default:
                    return true;
            }
        }, */
        /* getSelectedKeyBySelectedProperty: function (values) {
            var key = values.find(function (value) {
                return value.IS_SELECTED === 'X';
            });
            if (!key) {
                return null;
            }
            return key.ATWRT;
        }, */
        /*  checkManditoryFieldsIsAvailable: function (characteristicGroups) {
            function findCharacteristic(data) {
                if (!data) {
                    return [];
                }
                var groupings = data.groupings && data.groupings.result ? data.groupings.results : [];
                var characteristics = data.characteristics && data.characteristics.results ? data.characteristics.results : [];
                for (var key in groupings) {
                    findCharacteristic(groupings[key]).forEach(function (characteristic) {
                        characteristics.push(characteristic);
                    });
                }
                return characteristics;
            }

            var characteristics = [];
            for (var key in characteristicGroups) {
                findCharacteristic(characteristicGroups[key]).forEach(function (characteristic) {
                    characteristics.push(characteristic);
                });
            }

            var characteristic = characteristics.find(function (char) {
                return char.OBLIGATORY === 'X';
            });

            if (!characteristic) {
                return false;
            }
            return true;
        }, */
    };
});
