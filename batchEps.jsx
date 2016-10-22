/**
 * ai.jsx (c)MaratShagiev m_js@bk.ru 21.10.2016.
 *
 * https://forums.adobe.com/thread/2225302
 *
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
 */

/**
 * algorithm of delCrops()
 * select all then get bounds then deselect
 * loop over open paths that haves < 5 path points
 * * loop over path points
 * * * delete all paths that points out of (bounds - 2pt)
 * */

//@target illustrator-19

(function batchEps() {
  var inputPath    = '',
      outPath      = '',
      inputFolder  = new Folder(inputPath),
      outputFolder = new Folder(outPath);

  var w         = new Window('dialog', 'Batch EPS'),
      folderPan = w.add('panel', undefined, 'Folders'),
      inGr      = folderPan.add('group'),
      outGr     = folderPan.add('group'),
      inFld     = inGr.add('edittext', [0, 0, 300, 25]),
      inBtn     = inGr.add('button', [0, 0, 100, 25], 'Input from'),
      outFld    = outGr.add('edittext', [0, 0, 300, 25]),
      outBtn    = outGr.add('button', [0, 0, 100, 25], 'Output to'),

      btnGr     = w.add('group'),
      btnBatch  = btnGr.add('button', undefined, 'Batch'),
      btnCansel = btnGr.add('button', undefined, 'Cancel');

  w.alignChildren = 'right';

  inBtn.onClick  = function() {
    inputFolder = Folder.selectDialog();
    inFld.text  = inputFolder;
  }
  outBtn.onClick = function() {
    outputFolder = Folder.selectDialog();
    outFld.text  = outputFolder;
  }

  btnBatch.onClick = function() {
    if (!inputFolder.exists) {
      alert('Incorrect input folder');
      return;
    }
    if (!outputFolder.exists) {
      alert('Incorrect output folder');
      return;
    }
    var inputFiles  = inputFolder.getFiles("*.eps");
    var epsSaveOpts = new EPSSaveOptions();

    epsSaveOpts.cmykPostScript             = false;
    epsSaveOpts.compatibility              = Compatibility.ILLUSTRATOR10;
    epsSaveOpts.compatibleGradientPrinting = false;
    epsSaveOpts.embedAllFonts              = false;
    epsSaveOpts.embedAllFonts              = false;
    epsSaveOpts.flattenOuput               = OutputFlattening.PRESERVEAPPEARANCE;
    epsSaveOpts.includeDocumentThumbnails  = false;
    epsSaveOpts.overprint                  = PDFOverprint.PRESERVEPDFOVERPRINT;
    epsSaveOpts.postScript                 = EPSPostScriptLevelEnum.LEVEL2;
    epsSaveOpts.preview                    = EPSPreview.None;
    epsSaveOpts.saveMultipleArtboards      = false;

    for (var i = 0; i < inputFiles.length; i++) {
      var epsFile = inputFiles[i];
      open(epsFile);
      var epsSaveFile = new File(outputFolder + '/' + activeDocument.name + '-op.eps');
      delCrops();
      activeDocument.saveAs(epsSaveFile, epsSaveOpts);
      activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    }
    w.close();
  }

  w.show();

  /**
   * LIBRARY
   * */
  function delCrops() {
    executeMenuCommand('selectall');

    var bnds   = _getSelBnds(selection),
        doc    = activeDocument,
        indent = 4,
        rmCnt  = 0,
        left, top, right, bott,
        i, j;

    left  = bnds[0][0] + indent;
    top   = bnds[0][1] - indent;
    right = bnds[0][2] - indent;
    bott  = bnds[0][3] + indent;

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
      pth.remove();
      rmCnt++;
    }

    _delEmptyLays();
    _delHideLays();

    return rmCnt;

    /**
     * get selection.bounds:  [left, top, right, bottom]
     * calculate wdth, hght по bounds
     *
     * @param [Object/Collection]
     * @return {Array} [ bounds, wdth, hght ]
     */
    function _getSelBnds(sel) {

      if (!arguments.length) {
        throw new Error('The function GetSelBndsExtend_v2 does not gotten an arguments');
      }
      if (arguments.length > 1) {
        throw new Error('The function GetSelBndsExtend_v2 expected one argument');
      }
      if (arguments[0] === null) {
        throw new Error('The function GetSelBndsExtend_v2 has gotten a "null"');
      }
      if (typeof arguments[0] != 'object') {
        throw new Error('The function GetSelBndsExtend_v2 has unexpected argument');
      }

      var bnds, wdth, hght,
          elL, elT, elR, elB;

      try {
        bnds = _getBounds(sel, []);
      } catch (e) {
        '_getBounds error\n' + 'line: ' + e.line + '\nmessage: ' + e.message;
      }
      try {
        wdth = _calcElemW(bnds);
      } catch (e) {
        '_calcElemW error\n' + 'line: ' + e.line + '\nmessage: ' + e.message;
      }
      try {
        hght = _calcElemH(bnds);
      } catch (e) {
        '_calcElemH error\n' + 'line: ' + e.line + '\nmessage: ' + e.message;
      }

      return [bnds, wdth, hght];

      /**
       * LIB
       * */
      function _getBounds(pile, bnds) {
        if (pile.typename == 'PathItem' || pile.typename == 'CompoundPathItem') {
          return pile.geometricBounds;
        }
        for (var j = 0; j < pile.length; j++) {
          var el = pile [j];
          if (el.typename != 'GroupItem') { // anything axcept a group
            if (bnds == '') {
              bnds = el.geometricBounds;
              continue;
            }
            bnds = _compareBounds(el, bnds);
          }
          if (el.typename == 'GroupItem' && el.clipped) { // clipped group => search a mask
            var groupPaths = el.pathItems;
            for (var i = 0; i < groupPaths.length; i++) {
              if (groupPaths[i].clipping) {
                if (bnds == '') {
                  bnds = groupPaths[i].geometricBounds;
                  continue;
                }
                bnds = _compareBounds(groupPaths[i], bnds);
              }
            }
          }
          if (el.typename == 'GroupItem' && !el.clipped && !el.groupItems) { // group havn't groups and mask
            if (bnds == '') {
              bnds = el.geometricBounds;
              continue;
            }
            bnds = _compareBounds(el.geometricBounds, bnds);
          }
          if (el.typename == 'GroupItem' && !el.clipped && el.groupItems) { // masks NO, groups YES => recurs
            bnds = _getBounds(el.pageItems, bnds);
            continue;
          }
        }
        return bnds;
      }

      function _compareBounds(elem, bndsToCompare) {
        var elemBounds = elem.geometricBounds;
        return [Math.min(elemBounds[0], bndsToCompare[0]),
          Math.max(elemBounds[1], bndsToCompare[1]),
          Math.max(elemBounds[2], bndsToCompare[2]),
          Math.min(elemBounds[3], bndsToCompare[3])];
      }

      function _calcElemW(bnds) {
        var elemWidth = 0,
            left      = bnds[0],
            right     = bnds[2];
        (left <= 0 && right <= 0) || (left >= 0 && right >= 0) ? elemWidth = Math.abs(left - right) : '';
        left <= 0 && right >= 0 ? elemWidth = Math.abs(left) + right : '';
        return elemWidth;
      }

      function _calcElemH(bnds) {
        var elemHeight = 0,
            top        = bnds[1],
            bottom     = bnds[3];
        (top <= 0 && bottom <= 0) || (top >= 0 && bottom >= 0) ? elemHeight = Math.abs(top - bottom) : '';
        top >= 0 && bottom <= 0 ? elemHeight = top + Math.abs(bottom) : '';
        return elemHeight;
      }
    }

    function _delHideLays() {
      var d = activeDocument,
          i;
      for (i = d.layers.length - 1; i >= 0; i--) {
        var lay = d.layers[i];
        if (lay.visible) continue;
        lay.visible = true;
        lay.locked  = false;
        lay.remove();
      }
    }

    /**
     * recirsively remove empty layers and sublayers
     */
    function _delEmptyLays() {

      for (var i = 0; i < activeDocument.layers.length; i++) {
        var lay = activeDocument.layers[i];
        if (_hasSubs(lay)) {
          _delSubs(lay);
        }
        // NOTE: trying to remove the only existing layer will lead to its renaming to <layer>
        if (_isEmpty(lay) && activeDocument.layers.length > 1) {
          lay.locked == true ? lay.locked = false : '';
          lay.visible == false ? lay.visible = true : '';
          lay.remove();
          i--;
        }
      }

      /**
       * recursively remove sublayer
       * @param {Object} lay - object of Layer class
       * @return {Object} lay - object of Layer class
       */
      function _delSubs(lay) {
        for (var i = 0; i < lay.layers.length; i++) {
          var thisSubLay = _getSubs(lay)[i];

          if (_isEmpty(thisSubLay)) {
            thisSubLay.locked == true ? thisSubLay.locked = false : '';
            thisSubLay.visible == false ? thisSubLay.visible = true : '';
            thisSubLay.remove();
            i--;
          }

          if (_hasSubs(thisSubLay)) {
            var parent = _delSubs(thisSubLay);
            if (_isEmpty(parent)) {
              thisSubLay.locked == true ? thisSubLay.locked = false : '';
              thisSubLay.visible == false ? thisSubLay.visible = true : '';
              thisSubLay.remove();
              i--;
            }
          }
        }
        return lay;
      }

      /**
       * @param  {Object} lay - object of Layer class
       * @return {Boolean} true, if has sublayers
       */
      function _hasSubs(lay) {
        try {
          return (lay.layers.length > 0);
        } catch (e) {
          return false;
        }
      }

      /**
       * if layer contained object of classes PageItem or Layer
       * @param  {Object} lay - object of Layer class
       * @return {Boolean} true, if layer is empty
       */
      function _isEmpty(lay) {
        try {
          return lay.pageItems.length == 0 && lay.layers.length == 0;
        } catch (e) {
          return false;
        }
      }

      /**
       * get sublayers collection from current layer
       * @param  {Object} lay - object of Layer class
       * @return {Object/Boolean} - collection of Layers or false
       */
      function _getSubs(lay) {
        try {
          return lay.layers;
        } catch (e) {
          return false;
        }
      }
    }
  }
}());
