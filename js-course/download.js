"use strict";

/**
 * Functions for handling downloading files.
 * @namespace
 */
var Downloader = Downloader || {};

/**
 * Triggers a download on the given element.
 * @param {!Element|!jQuery} element
 * @param {?string} dataStr - Data to set before downloading.
 */
Downloader.triggerDownload = function (element, dataStr = null) {
  if (element == null) return;
  if ($.isJquery(element)) {
    if (element.length === 0) return;
    // get actual element (must be native `click()` method)
    element = element.get(0);
  }
  if (dataStr != null) {
    element.href = dataStr;
  }
  element.click();
};

/**
 * Exports and downloads the contents of the given canvas.
 * @param {?Object} options
 * @param {?Element|?jQuery} options.canvas - The canvas element to download.
 * @param {?string} options.canvasSelector - A selector to fetch the canvas if
 *     `options.canvas` not given. Default is "#canvas".
 */
Downloader.exportCanvas = function ({
  canvas = null,
  canvasSelector = "#canvas",
} = {}) {
  // get the download content
  let imageData;
  const $gifImg = $("#animated-gif");
  if ($gifImg.length > 0) {
    // save gif
    imageData = $gifImg.attr("src");
  } else {
    if (canvas == null) {
      canvas = $(canvasSelector);
      if (canvas.length === 0) {
        alert(`Canvas not found with selector: ${canvasSelector}`);
        return;
      }
    }
    if ($.isJquery(canvas)) {
      canvas = canvas.get(0);
    }
    try {
      imageData = canvas.toDataURL("image/octet-stream");
    } catch (error) {
      alert("Sorry, your browser does not support capturing an image.");
      return;
    }
  }
  Downloader.triggerDownload($("#download-link"), imageData);
};

$(() => {
  function updateDownloadFilename() {
    // update the download filename (if exists)
    const $filenameInput = $("#download-filename");
    if ($filenameInput.length === 0) return;
    $("#download-link").attr("download", $filenameInput.val());
  }

  // if exists, allow the download button to trigger a download
  $("#download-button").on("click", () => {
    updateDownloadFilename();
    Downloader.exportCanvas();
  });
  // if exists, allow pressing enter on the download filename input to trigger a
  // download
  $("#download-filename").on("keyup", (event) => {
    if (event.key === "Enter") {
      updateDownloadFilename();
      Downloader.exportCanvas();
    }
  });
});
