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

  /**
   * LIBRARY
   * */

  /**
   * взять selection.bounds:  [left, top, right, bottom]
   * вычислить width, height по bounds
   *
   * @param [Object/Collection]
   * @return {Array} [ bounds, width, height ]  Границы, ширина, высота
   */
  function getSelBoundsExtend ( selectElems ) {

    var bounds = _getBounds ( selectElems, [] ),
        width  = _calcElemWidthByBounds ( bounds ),
        height = _calcElemHeightByBounds ( bounds );

// рекурсивный поиск максимально раздвинутых границ
    function _getBounds ( collection, bounds ) {
// если передана не коллекция а 1 контур
      if ( collection.typename == 'PathItem' || collection.typename == 'CompoundPathItem' ) {
        return collection.geometricBounds;
      }

      for ( var j = 0; j < collection.length; j++ ) {

        var el = collection [ j ];

        if ( el.typename != 'GroupItem' ) { // любой pageItem кроме группы
          if ( bounds == '' ) {
            bounds = el.geometricBounds;

            continue;
          }
          bounds = _compareBounds ( el, bounds );

        }

        if ( el.typename == 'GroupItem' && el.clipped ) { // группа с маской => ищем маску
          var groupPaths = el.pathItems;

          for ( var i = 0; i < groupPaths.length; i++ ) {
            if ( groupPaths[ i ].clipping ) {
              if ( bounds == '' ) {
                bounds = groupPaths[ i ].geometricBounds;

                continue;
              }
              bounds = _compareBounds ( groupPaths[ i ], bounds );

            }
          }
        }

        if ( el.typename == 'GroupItem' && !el.clipped && !el.groupItems ) { // группа без маски и без групп
          if ( bounds == '' ) {
            bounds = el.geometricBounds;

            continue;
          }
          bounds = _compareBounds ( el.geometricBounds, bounds );

        }

        if ( el.typename == 'GroupItem' && !el.clipped && el.groupItems ) { // группа без маски, но с группами => рекурсия
          bounds = _getBounds ( el.pageItems, bounds );

          continue;
        }
      }
      return bounds;
    }

// сравнить и вернуть самые широкие geometricBounds
    function _compareBounds ( elem, boundsToCompare ) {

      var elemBounds = elem.geometricBounds;

      return [
        Math.min(elemBounds[0], boundsToCompare[0]),
        Math.max(elemBounds[1],boundsToCompare[1]),
        Math.max(elemBounds[2],boundsToCompare[2]),
        Math.min(elemBounds[3],boundsToCompare[3])
      ]
    }

// высчитать ширину элемента по его левой и правой границе
    function _calcElemWidthByBounds ( bounds ) {
      var elemWidth = 0,
          left      = bounds[ 0 ],
          right     = bounds[ 2 ];

      (left <= 0 && right <= 0) || (left >= 0 && right >= 0) ? elemWidth = Math.abs ( left - right ) : '';
      left <= 0 && right >= 0 ? elemWidth = Math.abs ( left ) + right : '';

      return elemWidth;
    }

// высчитать высоту элемента по его верхней и нижней границе
    function _calcElemHeightByBounds ( bounds ) {
      var elemHeight = 0,
          top        = bounds[ 1 ],
          bottom     = bounds[ 3 ];

      (top <= 0 && bottom <= 0) || (top >= 0 && bottom >= 0) ? elemHeight = Math.abs ( top - bottom ) : '';
      top >= 0 && bottom <= 0 ? elemHeight = top + Math.abs ( bottom ) : '';
      return elemHeight;
    }

    return [ bounds, width, height ];
  }
} ());
