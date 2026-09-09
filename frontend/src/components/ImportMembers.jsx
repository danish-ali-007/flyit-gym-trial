import { useState } from "react";
import api from "../services/api";
import "./ImportMembers.css";

const ImportMembers = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [importSummary, setImportSummary] =
    useState(null);

  const [skippedRows, setSkippedRows] =
    useState([]);

  if (!isOpen) {
    return null;
  }

  const resetState = () => {
    setFile(null);
    setMessage("");
    setErrorMessage("");
    setImportSummary(null);
    setSkippedRows([]);
  };

  const handleClose = () => {
    if (importing) {
      return;
    }

    resetState();
    onClose();
  };

  const handleFileChange = (e) => {
    const selectedFile =
      e.target.files?.[0];

    setMessage("");
    setErrorMessage("");
    setImportSummary(null);
    setSkippedRows([]);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const fileName =
      selectedFile.name.toLowerCase();

    const validFile =
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls");

    if (!validFile) {
      setFile(null);

      setErrorMessage(
        "Please select an Excel .xlsx or .xls file."
      );

      e.target.value = "";

      return;
    }

    const maxFileSize =
      5 * 1024 * 1024;

    if (
      selectedFile.size >
      maxFileSize
    ) {
      setFile(null);

      setErrorMessage(
        "File size cannot exceed 5 MB."
      );

      e.target.value = "";

      return;
    }

    setFile(selectedFile);
  };

  const handleImport = async () => {
    if (!file) {
      setErrorMessage(
        "Please select an Excel file first."
      );

      return;
    }

    try {
      setImporting(true);

      setMessage("");
      setErrorMessage("");
      setImportSummary(null);
      setSkippedRows([]);

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await api.post(
          "/import/members",
          formData
        );

      const summary =
        response.data.summary || null;

      const skipped =
        response.data.skippedRows || [];

      setImportSummary(summary);

      setSkippedRows(skipped);

      setMessage(
        response.data.message ||
          "Member import completed."
      );

      if (onImportSuccess) {
        await onImportSuccess();
      }

      setFile(null);
    } catch (error) {
      console.error(
        "Import Members Error:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to import members."
      );

      setImportSummary(null);

      setSkippedRows(
        error.response?.data
          ?.skippedRows || []
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="import-modal-overlay"
      onClick={handleClose}
    >
      <div
        className="import-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* =========================
            HEADER
        ========================= */}

        <div className="import-modal-header">

          <div>

            <h2>
              Import Members
            </h2>

            <p>
              Upload an Excel or Google Sheet
              exported Excel file
            </p>

          </div>


          <button
            type="button"
            className="import-close-btn"
            onClick={handleClose}
            disabled={importing}
          >
            ×
          </button>

        </div>


        {/* =========================
            INFO
        ========================= */}

        <div className="import-info-box">

          <strong>
            Supported File Types
          </strong>

          <p>
            Excel .xlsx and .xls
          </p>

          <p>
            Maximum file size: 5 MB
          </p>

          <p>
            For Google Sheets, download the
            sheet as Microsoft Excel (.xlsx)
            and upload it here.
          </p>

        </div>


        {/* =========================
            FILE SELECT
        ========================= */}

        <div className="import-file-area">

          <label
            className="import-file-label"
            htmlFor="member-import-file"
          >
            Choose Excel File
          </label>

          <input
            id="member-import-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={
              handleFileChange
            }
            disabled={importing}
          />

          <p>
            Select your member Excel file
          </p>

        </div>


        {/* =========================
            SELECTED FILE
        ========================= */}

        {file && (
          <div className="selected-import-file">

            <span>
              Selected File
            </span>

            <strong>
              {file.name}
            </strong>

          </div>
        )}


        {/* =========================
            ERROR
        ========================= */}

        {errorMessage && (
          <div className="import-error">
            {errorMessage}
          </div>
        )}


        {/* =========================
            SUCCESS MESSAGE
        ========================= */}

        {message && (
          <div className="import-success">
            {message}
          </div>
        )}


        {/* =========================
            IMPORT SUMMARY
        ========================= */}

        {importSummary && (
          <div className="import-summary">

            <div className="import-summary-item">

              <span>
                Total Rows
              </span>

              <strong>
                {importSummary.totalRows ?? 0}
              </strong>

            </div>


            <div className="import-summary-item success">

              <span>
                Imported
              </span>

              <strong>
                {importSummary.imported ?? 0}
              </strong>

            </div>


            <div className="import-summary-item skipped">

              <span>
                Skipped
              </span>

              <strong>
                {importSummary.skipped ?? 0}
              </strong>

            </div>

          </div>
        )}


        {/* =========================
            SKIPPED ROWS
        ========================= */}

        {skippedRows.length > 0 && (
          <div className="import-row-errors">

            <h3>
              Skipped Rows
            </h3>

            <div className="import-errors-list">

              {skippedRows.map(
                (row, index) => (

                  <div
                    className="import-row-error-item"
                    key={`${row.row}-${index}`}
                  >

                    <strong>
                      Row {row.row || "-"}
                    </strong>

                    {row.name && (
                      <span>
                        Name: {row.name}
                      </span>
                    )}

                    {row.phone && (
                      <span>
                        Phone: {row.phone}
                      </span>
                    )}

                    <span>
                      Reason:{" "}
                      {row.reason ||
                        "Unable to import this row"}
                    </span>

                  </div>

                )
              )}

            </div>

          </div>
        )}


        {/* =========================
            ACTIONS
        ========================= */}

        <div className="import-modal-actions">

          <button
            type="button"
            className="import-cancel-btn"
            onClick={handleClose}
            disabled={importing}
          >
            Close
          </button>


          <button
            type="button"
            className="import-submit-btn"
            onClick={handleImport}
            disabled={
              importing || !file
            }
          >
            {importing
              ? "Importing..."
              : "Import Members"}
          </button>

        </div>

      </div>
    </div>
  );
};

export default ImportMembers;