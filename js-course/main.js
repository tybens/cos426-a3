"use strict";

$(() => {
  // get rid of the scrollbars
  document.documentElement.style.overflow = "hidden"; // firefox, chrome
  document.body.scroll = "no"; // ie

  const urlArgs = Parser.getUrlArgs();

  const width = urlArgs.width || window.innerWidth;
  const height = urlArgs.height || window.innerHeight;
  const animated = "animated" in urlArgs;
  const debug = urlArgs.debug || false;

  Scene.setSceneName(urlArgs.scene ?? "default");

  Raytracer.init(width, height, animated, debug);
  Scene.setUniforms();

  Raytracer.animate();

  // add display stats
  DisplayStats.init();
});

// handle keyboard actions
$(window).on("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (key === "i") {
    // download current screen image when "i" is pressed
    Raytracer.saveSnapshot();
  }
});
