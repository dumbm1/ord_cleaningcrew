/**
 * ai.jsx (c)MaratShagiev m_js@bk.ru 21.10.2016.
 *
 * https://forums.adobe.com/thread/2225302
 *
 * STAFF:
 * There are around 6'000 EPS-Files.
 * They have all the same size and "corner marks" at the corners.
 * Now I am looking for a Batch Script (for Mac, AI CS5 or CC),
 * that opens one EPS-File out of a given folder, cuts off the corner marks,
 * adds the space back again - so that the old size is back and saves the file in a given folder as EPS-File,
 * changing the File-Name at the end with "-op.eps".
 *
 * The Script should run for all the EPS-Files in the given folder (in),
 * and should save them in an given folder (out).
 *
 * we will get later more of the files and need them to convert them with a Batch-Script again.
 * ***
 *
 * 1. I could not stop the script with the cancel button while saving an eps file.
 * 2. I could not stop the script with the general cancel button in the script.
 * 3. The script did not stopped after the last processed file. I had to shot down Illustrator by finder.
 * 4. One file was not processed https://www.ghc-gmbh.ch/download/iso7001-0019.eps maybe you can find out what happend here?
 *
 * todo: the script did not stopped after the last processed file (????) it's weery interesting
 *
 * todo: add correct error handling
 * todo: add check for creator of eps
 *
 * */

//@target illustrator-19

(function batchEps () {
  var inputPath    = '',
      outPath      = '',
      inputFolder  = new Folder (inputPath),
      outputFolder = new Folder (outPath);
  var w            = new Window ('dialog', 'Batch EPS'),
      folderPan    = w.add ('panel', undefined, 'Folders'),
      inGr         = folderPan.add ('group'),
      outGr        = folderPan.add ('group'),
      inFld        = inGr.add ('edittext', [0, 0, 300, 25]),
      inBtn        = inGr.add ('button', [0, 0, 100, 25], 'Input from'),
      outFld       = outGr.add ('edittext', [0, 0, 300, 25]),
      outBtn       = outGr.add ('button', [0, 0, 100, 25], 'Output to'),

      btnGr        = w.add ('group'),
      btnBatch     = btnGr.add ('button', undefined, 'Batch'),
      btnCansel    = btnGr.add ('button', undefined, 'Cancel');

  w.alignChildren = 'right';

  inBtn.onClick  = function () {
    inputFolder = Folder.selectDialog ();
    inFld.text  = inputFolder;
  }
  outBtn.onClick = function () {
    outputFolder = Folder.selectDialog ();
    outFld.text  = outputFolder;
  }

  btnBatch.onClick = function () {
    try {
      app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
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

      epsSaveOpts.cmykPostScript             = false;
      epsSaveOpts.compatibility              = Compatibility.ILLUSTRATOR15;
      epsSaveOpts.compatibleGradientPrinting = false;
      epsSaveOpts.embedAllFonts              = false;
      epsSaveOpts.embedLinkedFiles           = false;
      epsSaveOpts.flattenOuput               = OutputFlattening.PRESERVEAPPEARANCE;
      epsSaveOpts.includeDocumentThumbnails  = false;
      epsSaveOpts.overprint                  = PDFOverprint.PRESERVEPDFOVERPRINT;
      epsSaveOpts.postScript                 = EPSPostScriptLevelEnum.LEVEL2;
      epsSaveOpts.preview                    = EPSPreview.None;
      epsSaveOpts.saveMultipleArtboards      = false;

      for (var i = 0; i < inputFiles.length; i++) {
        var epsFile = inputFiles[i];
        open (epsFile);
        var epsSaveFile = new File (outputFolder + '/' + activeDocument.name.slice (0, -4) + '-op.eps');
        delCrops ();
        activeDocument.saveAs (epsSaveFile, epsSaveOpts);
        activeDocument.close (SaveOptions.DONOTSAVECHANGES);
      }
      w.close ();
    } catch (e) {
    } finally {
      app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS;
    }

  }

  w.show ();

  /**
   * LIBRARY
   * */
  function delCrops () {

    _showUnlockLays ();

    executeMenuCommand ('selectall');
    executeMenuCommand ('Fit Artboard to selected Art');

    var bnds   = activeDocument.artboards[0].artboardRect,
        doc    = activeDocument,
        indent = 4,
        rmCnt  = 0,
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
      rmCnt++;
    }

    return rmCnt;

    function _showUnlockLays () {
      var d = activeDocument,
          i;
      for (i = d.layers.length - 1; i >= 0; i--) {
        var lay     = d.layers[i];
        lay.visible = true;
        lay.locked  = false;
        executeMenuCommand ('showAll');
        executeMenuCommand ('unlockAll');
      }
    }
  }
} ());
