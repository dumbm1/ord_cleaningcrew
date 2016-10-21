/**
 * ai.jsx (c)MaratShagiev m_js@bk.ru 21.10.2016.
 *
 * https://forums.adobe.com/thread/2225302
 *
 * We have around 6'000 EPS-Files.
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
 */

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

  inBtn.onClick  = function () {
    inputFolder = Folder.selectDialog ();
    inFld.text  = inputFolder;
  }
  outBtn.onClick = function () {
    outputFolder = Folder.selectDialog ();
    outFld.text  = outputFolder;
  }

  btnBatch.onClick = function () {
    alert (inputFolder + '\nInput folder exists status: ' + inputFolder.exists + '\n' +
      outputFolder + '\nOutput folder exists status: ' + outputFolder.exists);
  }

  w.show ();
} ());
