"use strict";

assert(Assignment, "`page.js` requires `assignment.js`");

/**
 * Settings for the HTML page.
 * @namespace
 */
var Page = Page || {
  TITLE: null,

  WRITEUP_FILENAME: "js-student/writeup.yaml",
  // The cached contents of the writeup file.
  parsedWriteup: null,
};

Page.readWriteupFile = function () {
  if (Page.parsedWriteup == null) {
    try {
      Page.parsedWriteup = {
        writeup: Parser.parseYamlFile(Page.WRITEUP_FILENAME),
      };
    } catch (error) {
      console.error(error);
      Page.parsedWriteup = { error };
    }
  }
  return Page.parsedWriteup;
};

$(() => {
  const MDASH = " &mdash; ";

  const assignmentNum = `COS426 Assignment ${Assignment.ASSIGNMENT_NUM}`;
  let title;
  if (Page.TITLE == null) {
    title = Assignment.ASSIGNMENT_NAME;
  } else {
    title = [Assignment.ASSIGNMENT_NAME, Page.TITLE].join(MDASH);
  }

  // if a <title> element already exists, it will take precedence because this
  // is being added after
  $(document.head).append(
    $("<title>").html([assignmentNum, title].join(MDASH))
  );

  // set the title text on the page
  $("#title").html(
    [`<div class="assignment">${assignmentNum}</div>`, title].join("")
  );

  // set student info in page
  const $studentDiv = $("#student");

  function setStudentInfoError(error) {
    $studentDiv.text(`Error: Could not get student info: ${error}`);
  }

  function setStudentInfo(parsed) {
    if (parsed.error) {
      setStudentInfoError(parsed.error);
      return;
    }
    const studentWriteup = parsed.writeup;

    const studentInfo = studentWriteup.student;
    if (studentInfo == null) {
      setStudentInfoError("Missing `student` section");
      return;
    }

    const name = studentInfo.name;
    const netid = studentInfo.netid;
    $studentDiv.text(`${name ?? "MISSING NAME"} <${netid ?? "MISSING NETID"}>`);
  }

  if ($studentDiv.length > 0) {
    setStudentInfo(Page.readWriteupFile());
  }
});
