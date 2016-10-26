/**
 * Adobe Illustrator CS6+ ExtendScript (c)MaratShagiev m_js@bk.ru 26.10.2016
 * */
//@target illustrator
(function batchEps () {
  var inputPath    = '',
      outPath      = '',
      inputFolder  = new Folder (inputPath),
      outputFolder = new Folder (outPath);

  var w         = new Window ('dialog', 'Batch EPS'),
      folderPan = w.add ('panel', undefined, 'Folders'),
      inGr      = folderPan.add ('group'),
      outGr     = folderPan.add ('group'),
      inFld     = inGr.add ('edittext', [0, 0, 300, 25]),
      inBtn     = inGr.add ('button', [0, 0, 100, 25], 'Input from'),
      outFld    = outGr.add ('edittext', [0, 0, 300, 25]),
      outBtn    = outGr.add ('button', [0, 0, 100, 25], 'Output to'),
      btnGr     = w.add ('group'),
      btnBatch  = btnGr.add ('button', undefined, 'Batch'),
      btnCansel = btnGr.add ('button', undefined, 'Cancel');

  w.alignChildren = 'right';

  inBtn.onClick = function () {
    inputFolder = Folder.selectDialog ();
    inFld.text  = inputFolder;
  }

  outBtn.onClick = function () {
    outputFolder = Folder.selectDialog ();
    outFld.text  = outputFolder;
  }

  btnBatch.onClick = function () {
    batch ();
    w.close ();
  }

  w.show ();

  /**
   * LIBRARY
   * */
  function batch () {
    var userInteractLevelStore = app.userInteractionLevel;
    app.userInteractionLevel   = UserInteractionLevel.DONTDISPLAYALERTS;

    if (!inputFolder.exists) {
      alert ('Incorrect input folder');
      return;
    }
    if (!outputFolder.exists) {
      alert ('Incorrect output folder');
      return;
    }

    var inputFiles  = inputFolder.getFiles ("*.eps");
    var epsSaveOpts = new EPSSaveOptions ();
    modEpsSaveOpts (epsSaveOpts);

    for (var i = 0; i < inputFiles.length; i++) {
      var rmCount;

      try { // try-catch needed when found DCS EPS file, that can't be opened
        var epsFile = inputFiles[i];
        app.open (epsFile);
        var abRect = activeDocument.artboards[0].artboardRect;
        showAndUnlock ();
        executeMenuCommand ('selectall');
        executeMenuCommand ('Fit Artboard to selected Art');
        var epsSaveFile = new File (outputFolder + '/' + activeDocument.name.slice (0, -4) + '-op.eps');
        rmCount         = delCrops ();
        if (rmCount < 4) {
          activeDocument.artboards[0].artboardRect = abRect;
          executeMenuCommand('delelectall');
          continue;
        }
        activeDocument.saveAs (epsSaveFile, epsSaveOpts);
        activeDocument.close (SaveOptions.DONOTSAVECHANGES);
      } catch (e) {
      }
    }

    app.userInteractionLevel = userInteractLevelStore;
  }

  function delCrops () {
    var rmCount = 0;
    try {
      var bnds   = activeDocument.artboards[0].artboardRect,
          doc    = activeDocument,
          indent = 4,
          left, top, right, bott,
          i, j;

      left  = bnds[0] + indent;
      top   = bnds[1] - indent;
      right = bnds[2] - indent;
      bott  = bnds[3] + indent;

      nextPth: for (i = doc.pathItems.length - 1; i >= 0; i--) {
        var pth = doc.pathItems[i];
        if (pth.selected == false) continue;
        if (pth.closed) continue;
        if (pth.pathPoints.length > 4) continue;
        for (j = 0; j < pth.pathPoints.length; j++) {
          var pnt = pth.pathPoints[j];
          var x   = pnt.anchor[0];
          var y   = pnt.anchor[1];
          if (x <= left || x >= right || y >= top || y <= bott) {
            continue;
          } else {
            continue nextPth;
          }
        }
        pth.remove ();
        rmCount++;
      }
    } catch (e) {
    }
    return rmCount;
  }

  function modEpsSaveOpts (epsSaveOpts) {
    epsSaveOpts.cmykPostScript             = false;
    epsSaveOpts.compatibility              = Compatibility.ILLUSTRATOR10;
    epsSaveOpts.compatibleGradientPrinting = false;
    epsSaveOpts.embedAllFonts              = false;
    epsSaveOpts.embedLinkedFiles           = false;
    epsSaveOpts.flattenOuput               = OutputFlattening.PRESERVEAPPEARANCE;
    epsSaveOpts.includeDocumentThumbnails  = false;
    epsSaveOpts.overprint                  = PDFOverprint.PRESERVEPDFOVERPRINT;
    epsSaveOpts.postScript                 = EPSPostScriptLevelEnum.LEVEL2;
    epsSaveOpts.preview                    = EPSPreview.None;
    epsSaveOpts.saveMultipleArtboards      = false;
  }

  function showAndUnlock () {
    try {
      var d = activeDocument,
          i;
      for (i = 0; i < d.layers.length; i++) {
        var lay     = d.layers[i];
        lay.visible = true;
        lay.locked  = false;
        executeMenuCommand ('showAll');
        executeMenuCommand ('unlockAll');
      }
    } catch (e) {
      return false;
    }
    return true;
  }
} ());
