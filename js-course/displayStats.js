"use strict";

/** @namespace */
var DisplayStats = DisplayStats || {};

DisplayStats.init = function ({ autoUpdate = true } = {}) {
  DisplayStats.stats = new Stats();
  const statsElement = DisplayStats.stats.domElement;
  // element is already "position: fixed", so move it to the bottom right corner
  statsElement.style.left = "";
  statsElement.style.top = "";
  statsElement.style.bottom = 0;
  statsElement.style.right = 0;
  $("#stats").append(statsElement);

  DisplayStats.hidden = false;

  $(window).on("keyup", (event) => {
    const key = event.key.toLowerCase();
    if (key === "s") {
      if (DisplayStats.hidden) {
        DisplayStats.hidden = false;
        $("#stats").show();
      } else {
        DisplayStats.hidden = true;
        $("#stats").hide();
      }
    }
  });

  DisplayStats._autoUpdating = autoUpdate;
  if (DisplayStats._autoUpdating) {
    // start updating
    function updateStats(timestamp) {
      if (!DisplayStats.hidden) {
        DisplayStats.stats.update();
      }
      window.requestAnimationFrame(updateStats);
    }

    window.requestAnimationFrame(updateStats);
  }
};

DisplayStats.monitor = function (func) {
  if (DisplayStats._autoUpdating && !DisplayStats._monitorWarned) {
    console.warn(
      "DisplayStats is auto updating; `monitor()` will only call the given " +
        "function"
    );
    DisplayStats._monitorWarned = true;
  }
  const triggerMonitor = !DisplayStats.hidden && !DisplayStats._autoUpdating;
  if (triggerMonitor) DisplayStats.stats.begin();
  func();
  if (triggerMonitor) DisplayStats.stats.end();
};
