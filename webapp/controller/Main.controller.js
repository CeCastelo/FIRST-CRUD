sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/Text",
    "sap/ui/core/ID",
    "sap/ui/core/Fragment",
    "sap/ui/base/Object",
    "sap/m/Dialog",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    Controller,
    Filter,
    FilterOperator,
    JSONModel,
    MessageToast,
    Text,
    ID,
    Fragment,
    Object,
    Dialog
  ) {
    "use strict";
    let arrayid = [1, 2];
    let lastID = "";
    let oTable;
    let oData;
    return Controller.extend("crudteste.controller.Main", {
      onInit: function () {
        if (!this.oModel) {
          this.oModel = new JSONModel();
          this.getView().setModel(this.oModel);
        }

        oTable = [
          {
            ID: "1",
            Name: "Cesar Castelo",
            Address: "rua x",
            CPF: "43970127840",
            Turno: "Manha",
            Date: "12/12/2022",
            Ativo: "Sim",
          },
          {
            ID: "2",
            Name: "Matheus ",
            Address: "rua y",
            CPF: "4222222222",
            Turno: "tarde",
            Date: "12/12/2022",
            Ativo: "Não",
          },
        ];
        this.oModel.setProperty("/Jobs", oTable);
      },

      onReload: function (oEvent) {
        window.location.reload();
      },

      onPressNew: function () {
        let TableId, oTable, Lastrecord;
        TableId = "jobs_table";
        oTable = this.byId(TableId);
        const oJobs = this.oModel.getProperty("/Jobs");
        this.oHistoric = oJobs;
        Lastrecord = oJobs[oJobs.length - 1];
        lastID = (parseFloat(Lastrecord.ID) + 1).toString();

        this.onCreateEditDialog("N", false, TableId);
        this.oModel.setProperty("/ID", lastID);
      },

      onEdit: function (oEvent) {
        const rowSelected = this.onSelectRow(oEvent);
        this.SaveMode = "E";
        this.oHistoric = {
          ID: rowSelected.ID,
          Name: rowSelected.Name,
          Address: rowSelected.Address,
          CPF: rowSelected.CPF,
          Turno: rowSelected.Turno,
          Date: rowSelected.Date,
          Ativo: rowSelected.Ativo,
        };
        this.onCreateEditDialog(this.SaveMode, rowSelected);
        this.oModel.setProperty("/ID", false);
      },

      onCreateEditDialog: function (action, rowSelected, tableSelect) {
        const oModelDialog = new sap.ui.model.json.JSONModel();
        const selectgrid = tableSelect;

        this.oDialog = new sap.ui.xmlfragment(`crudteste.view.Dialog`, this);
        this.getView().addDependent(this.oDialog);

        if (action === "N") {
          this.oModel.setProperty("/NewOrEdit", "Novo Cadastro");
          const lasID = this.oModel.getProperty("/ID");
          const initialData = { ID: lastID };
          oModelDialog.setData(initialData);
          this.oDialog.setModel(oModelDialog, "form");
          this.oDialog.open();
        } else {
          const resourceText = this.getResourceBundle()
            .getText("editRecord")
            .replace("&Person", rowSelected.Name);
          oModelDialog.setData(rowSelected);
          this.oModel.setProperty("/NewOrEdit", resourceText);
          this.oDialog.setModel(oModelDialog, "form");
          this.oDialog.open();
        }
      },

      getResourceBundle: function () {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },

      onCancelEdit: function () {
        const RowIndex = this.oHistoric.ID - 1;
        let oModel = this.oModel.getProperty("/Jobs");
        oModel[RowIndex] = this.oHistoric;
        this.oModel.setProperty("/Jobs", oModel);

        this.oDialog.close();

        arrayid.pop();
        lastID = arrayid[arrayid.length - 1];
        this.oModel.setProperty("/lastID", lastID);
      },

      onSave: function () {
        const inputs = sap.ui.getCore().byId("fragmentForm").getContent();
        const isValid = this.onCheckRequiredInputs(inputs, "form");

        if (!isValid) {
        } else {
          oData = this.oDialog.getModel("form").getData(); // Os dados do fragment são passados para a variavel

          oTable.push(oData);
          this.oModel.setProperty("/Jobs", oTable);

          this.oDialog.close();
        }
      },

      onDeleteFrag: function () {
        let oJobs = this.oModel.getProperty("/Jobs");
        oJobs.splice(this.SelectedRow, 1);
        this.oModel.setProperty("/Jobs", oJobs);
        this.oDialog.close();
      },
      onSelectRow: function (oEvent) {
        const oTable = this.byId("jobs_table");
        const index = oEvent.getParameters().row.getIndex();
        const sPath = oTable.getContextByIndex(index).sPath;
        const rowSelected = this.oModel.getProperty(sPath);
        this.SelectedRow = index;
        return rowSelected;
      },

      onDelete: function (oEvent) {
        const rowSelected = this.onSelectRow(oEvent);
        this.oDialog = new sap.ui.xmlfragment(`crudteste.view.Delete`, this);
        this.oDialog.open();
      },

      onCancelFrag: function () {
        this.oDialog.close();
      },
      onAfterClose: function () {
        this.oDialog.destroy();
      },

      filterGlobally: function (oEvent) {
        const tableColumns = this.byId("jobs_table").getColumns();
        const sQuery = oEvent.getParameters().newValue;
        let filterList = [];
        for (let index = 0; index < tableColumns.length; index++) {
          filterList.push(
            new Filter(
              tableColumns[index].getFilterProperty(),
              tableColumns[index].getDefaultFilterOperator(),
              sQuery
            )
          );
        }
        this._oGlobalFilter = null;
        if (typeof sQuery !== "undefined" && sQuery !== null) {
          this._oGlobalFilter = new Filter(filterList, false);
          this._filter();
        }
      },
      _filter: function () {
        const oFilter = this._oGlobalFilter;
        this.byId("jobs_table")
          .getBinding("rows")
          .filter(oFilter, "Application");
      },

      onCheckRequiredInputs: function (inputs, type) {
        let isValid = true;
        let countToFocus = 0;
        inputs.forEach(
          function (input) {
            const sInput =
              type == "form"
                ? input.getId().toLowerCase().includes("hbox")
                  ? input.getItems()[0]
                  : input
                : input.getControl().getId().toLowerCase().includes("hbox")
                ? input.getControl().getItems()[0]
                : input.getControl();
            const isComboBox = sInput
              .getMetadata()
              .getName()
              .toLowerCase()
              .includes("combobox");
            const isSelect = sInput
              .getMetadata()
              .getName()
              .toLowerCase()
              .includes("select");
            if (isSelect) {
              if (!sInput.getSelectedKey()) {
                sInput.setValueState("Error");
                sInput.setValueStateText("Campo Obrigatório");
                countToFocus += 1;
                countToFocus <= 1 ? sInput.focus() : "";
                isValid = false;
              } else {
                sInput.setValueState("None");
                sInput.setValueStateText("");
              }
            } else {
              if (sInput.getRequired()) {
                if (isComboBox) {
                  if (!sInput.getSelectedKey()) {
                    sInput.setValueState("Error");
                    sInput.setValueStateText("Campo Obrigatório");
                    sInput.setValue("");
                    countToFocus += 1;
                    countToFocus <= 1 ? sInput.focus() : "";
                    isValid = false;
                  } else {
                    sInput.setValueState("None");
                  }
                } else {
                  if (!sInput.getValue().trim()) {
                    sInput.setValueState("Error");
                    sInput.setValueStateText("Campo Obrigatório");
                    countToFocus += 1;
                    countToFocus <= 1 ? sInput.focus() : "";
                    isValid = false;
                  } else {
                    sInput.setValueState("None");
                  }
                }
              }
            }
          }.bind(this)
        );
        return isValid;
      },
    });
  }
);
