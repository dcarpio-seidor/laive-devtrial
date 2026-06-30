sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/HBox",
    "sap/m/Button"
], (Controller, MessageToast, Column, Label, HBox, Button) => {
    "use strict";

    return Controller.extend("ns.laive.laivedevtrial.controller.Main", {
        onInit() {
            const oSmartTable = this.byId("LineItemsSmartTable");
            oSmartTable.attachInitialise(this._addActionColumn, this);
            oSmartTable.attachEvent("beforeRebind", this._onBeforeRebind, this);
            oSmartTable.attachInitialise(this._initFileDrop, this);
        },

        _onBeforeRebind() {
            setTimeout(this._addActionColumn.bind(this), 0);
        },

        _addActionColumn() {
            const oSmartTable = this.byId("LineItemsSmartTable");
            const oTable = oSmartTable.getTable();
            if (!oTable) {
                setTimeout(this._addActionColumn.bind(this), 200);
                return;
            }

            if (oTable.getColumns().some(c => c.getId() === "actionColumn")) return;

            const oColumn = new Column({
                id: "actionColumn",
                hAlign: "Center",
                width: "250px",
                label: new Label({ text: "Acciones" }),
                template: new HBox({
                    justifyContent: sap.m.FlexJustifyContent.SpaceEvenly,
                    alignItems: sap.m.FlexAlignItems.Center,
                    items: [
                        new Button({ text: "Agregar", type: "Transparent", press: this.onAgregar.bind(this) }),
                        new Button({ text: "Eliminar", type: "Transparent", press: this.onEliminar.bind(this) }),
                        new Button({ text: "Visualizar", type: "Transparent", press: this.onVisualizar.bind(this) })
                    ]
                })
            });

            oTable.addColumn(oColumn);
        },

        _initFileDrop() {
            if (this._bDropReady) return;

            const oSmartTable = this.byId("LineItemsSmartTable");
            const oTable = oSmartTable.getTable();
            const oTableDom = oTable && oTable.getDomRef();

            if (!oTableDom) {
                setTimeout(this._initFileDrop.bind(this), 200);
                return;
            }

            this._oTableDom = oTableDom;

            oTableDom.addEventListener("dragover", this._onDragOver.bind(this));
            oTableDom.addEventListener("dragleave", this._onDragLeave.bind(this));
            oTableDom.addEventListener("drop", this._onDrop.bind(this));

            this._bDropReady = true;
        },

        _onDragOver(oEvent) {
            oEvent.preventDefault();
            oEvent.dataTransfer.dropEffect = "copy";

            const oTr = oEvent.target.closest("tr");
            if (!oTr || !oTr.closest("tbody")) return;

            if (oTr === this._oHighlightedTr) return;

            if (this._oHighlightedTr) {
                this._oHighlightedTr.classList.remove("sapUiDnDDroppable");
            }

            oTr.classList.add("sapUiDnDDroppable");
            this._oHighlightedTr = oTr;
        },

        _onDragLeave(oEvent) {
            if (!this._oTableDom || !this._oTableDom.contains(oEvent.relatedTarget)) {
                if (this._oHighlightedTr) {
                    this._oHighlightedTr.classList.remove("sapUiDnDDroppable");
                    this._oHighlightedTr = null;
                }
            }
        },

        _onDrop(oEvent) {
            oEvent.preventDefault();

            if (this._oHighlightedTr) {
                this._oHighlightedTr.classList.remove("sapUiDnDDroppable");
                this._oHighlightedTr = null;
            }

            const oTr = oEvent.target.closest("tr");
            if (!oTr || !oTr.closest("tbody")) return;

            const oItem = sap.ui.getCore().byId(oTr.id);
            if (!oItem) return;

            const aFiles = Array.from(oEvent.dataTransfer.files || []);
            if (aFiles.length === 0) return;

            const oPdfFile = aFiles.find(f =>
                f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
            );

            if (!oPdfFile) {
                MessageToast.show("Solo se permiten archivos PDF");
                return;
            }

            this._readPdf(oPdfFile, oItem);
        },

        _readPdf(oFile, oItem) {
            const oReader = new FileReader();

            oReader.onload = (e) => {
                const aBytes = new Uint8Array(e.target.result);

                const oCtx = oItem.getBindingContext();
                const sKey = oCtx ? oCtx.getProperty("ProductID") : "?";

                this._onPdfReceived(oFile, aBytes, oItem, sKey);
            };

            oReader.onerror = () => {
                MessageToast.show("Error al leer el archivo: " + oFile.name);
            };

            oReader.readAsArrayBuffer(oFile);
        },

        _onPdfReceived(oFile, aBytes, oItem, sProductId) {
            MessageToast.show("PDF recibido: " + oFile.name + " (Producto #" + sProductId + ")");

            this.fireEvent("pdfDropped", {
                file: oFile,
                data: aBytes,
                item: oItem,
                productId: sProductId
            });
        },

        onAgregar(oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            const sProductId = oCtx ? oCtx.getProperty("ProductID") : "?";
            MessageToast.show("Agregar - Producto #" + sProductId);
        },

        onEliminar(oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            const sProductId = oCtx ? oCtx.getProperty("ProductID") : "?";
            MessageToast.show("Eliminar - Producto #" + sProductId);
        },

        onVisualizar(oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            const sProductId = oCtx ? oCtx.getProperty("ProductID") : "?";
            MessageToast.show("Visualizar - Producto #" + sProductId);
        }
    });
});