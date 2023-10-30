"use strict";

assert(Assignment, "`writeup.js` requires `assignment.js`");

/**
 * Settings for the writeup.
 * @namespace
 */
var Writeup = Writeup || {};
Writeup.COLLABORATION_LINK ??= "https://www.cs.princeton.edu/~cos426";

$(() => {
  function showError(error) {
    $("#error").text(error).show();
  }

  function parseWriteup(parsed) {
    if (parsed.error) {
      showError(parsed.error);
      return;
    }
    const studentWriteup = parsed.writeup;

    const lateDaysUsed = studentWriteup.late_days_used;
    if (lateDaysUsed) {
      // if has a value or nonzero
      $("#student").after($("<div>").text(`Late days used: ${lateDaysUsed}`));
    }

    const netids = studentWriteup.collaboration;
    if (netids != null) {
      // could collaborate on this assignment
      $("#collaboration").append(
        $("<hr>"),
        $("<h3>").text("Collaboration"),
        $("<div>").append(
          netids.length === 0
            ? "I completed the assignment by myself"
            : [
                "I collaborated with:",
                netids
                  .map((netid) => `<code>&lt;${netid}&gt;</code>`)
                  .join(", "),
              ].join(" "),
          ". I understand the course collaboration policies are listed ",
          $("<a>", { href: Writeup.COLLABORATION_LINK, target: "_blank" }).text(
            "here"
          ),
          "."
        )
      );
    }

    const NOT_IMPLEMENTED_YET_LABEL = "(required but not implemented yet)";

    const studentFeatures = {};
    for (const feature of studentWriteup.features) {
      const name = feature.feature;
      if (name == null) continue;
      if (studentFeatures[name] != null) {
        showError(`Repeated feature name: ${name}`);
        return;
      }
      studentFeatures[name] = feature;
    }

    const $featuresListDiv = $("#features-list");
    $featuresListDiv.append($("<hr>"), "Features implemented:");
    const $featuresList = $("<ul>").appendTo($featuresListDiv);
    $featuresListDiv.append(
      $("<div>").html(
        "Only features marked with <code>implemented: true</code> will show " +
          "up here and be graded."
      )
    );
    const $features = $("#features-descriptions");
    for (const feature of Assignment.FEATURES) {
      const name = feature.name;
      const points = feature.points.toFixed(1);
      const linkName = encodeURI(name.replace(/ /g, "+"));

      const studentFeature = studentFeatures[name] ?? {};
      studentFeature.implemented ??= false;
      studentFeature.description_html ??= [
        "(Your description of your implementation of",
        name,
        "goes here...)",
      ].join(" ");
      studentFeature.results ??= [];

      // populate features list
      let featureLink;
      let unimplementedText = "";
      if (studentFeature.implemented) {
        featureLink = $("<a>", { href: `#${linkName}` }).text(name);
      } else {
        // if not implemented at all, even if required, strike it out
        featureLink = $("<span>", { class: "not-implemented" }).text(name);
        if (feature.required) {
          unimplementedText = " " + NOT_IMPLEMENTED_YET_LABEL;
        }
      }
      const asterisk = feature.required ? "*" : "";
      $featuresList.append(
        $("<li>").append(
          `(${points})${asterisk} `,
          featureLink,
          unimplementedText
        )
      );

      if (!studentFeature.implemented) {
        // don't create the feature section
        continue;
      }

      // populate features description
      const $featureDiv = $("<div>");
      $featureDiv.append(
        // header
        $("<div>").append(
          $("<a>", { name: linkName }),
          $("<hr>"),
          $("<h2>", { class: "feature-title" }).text(name + asterisk),
          $("<hr>")
        ),
        // description
        $("<div>").html(studentFeature.description_html.trim())
      );
      // results
      const resultDivs = studentFeature.results.flatMap((result) => {
        const href = result.link?.trim();
        const pictureSrc = result.picture?.trim();
        const videoSrc = result.video?.trim();
        const caption = result.caption_html?.trim();
        if (href == null || (pictureSrc == null && videoSrc == null)) return [];
        let linkText = href;
        for (const prefix of ["batch.html?", "index.html?"]) {
          // remove a prefix from the front of the link if possible
          if (linkText.startsWith(prefix)) {
            linkText = linkText.slice(prefix.length);
            break;
          }
        }
        const $caption = caption == null ? "" : $("<div>").html(caption);
        let $media;
        if (pictureSrc != null) {
          $media = $("<img>", { src: pictureSrc });
        } else {
          // `videoSrc` is not null
          $media = $("<video>", {
            autoplay: true,
            controls: true,
            loop: true,
          }).append($("<source>", { type: "video/webm", src: videoSrc }));
        }
        return [
          $("<div>").append(
            $("<a>", { href, target: "_blank" }).text(linkText),
            $media,
            $caption
          ),
        ];
      });
      if (resultDivs.length > 0) {
        $featureDiv.append(
          $("<div>", { class: "writeup-results" }).append(
            $("<h3>").text("Results"),
            resultDivs
          )
        );
      }
      $features.append($featureDiv);
    }

    const aiTools = studentWriteup.ai_code_tools;
    if (aiTools) {
      $("#feedback").append(
        $("<hr>"),
        $("<h3>").text("AI Coding Tools"),
        $("<div>").text(aiTools)
      );
    }

    const feedback = studentWriteup.feedback;
    if (feedback) {
      $("#feedback").append(
        $("<hr>"),
        $("<h3>").text("Student Feedback"),
        $("<div>").text(feedback)
      );
    }
  }

  // read file and handle errors
  parseWriteup(Page.readWriteupFile());
});
