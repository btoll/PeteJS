Pete.ux = {};

Pete.mixin(Pete.EventManager = (function () {
    var fn = function (dom, type, fn) {
        Pete.Element.get(dom).on(type, fn);
    };

    return {
        register: fn
    };
}()), Pete.Observer);

Pete.EventManager.register(document, 'mouseup', function (e) {
    Pete.ux.DropZoneManager.onMouseUp(e);
});

Pete.ux.DropZoneManager = (function () {
    var i = 0,
        len,
        dropZones = {},
        // The cloned dom element.
        dragSource,
        // The original dom element that has been selected to be dragged.
        sourceElement,
        // The zone target (an element id) where the dragged element will be dropped.
        dropZoneTarget;

  function fnAdd(v, o) {
    var aElems = [],
      sEvent,
      oSubscribe;

    if (!(v instanceof Array)) {
      //if (v instanceof Pete.Composite) {
      if (v.elements.length > 0) {
        aElems = v.elements;
      } else {
        aElems = [Pete.Element.get(v, true)];
      }
      aElems.forEach(function (oElem) {
        var oZone = dropZones[oElem.id] = oElem;

        // Each zone mixes in its own Observer functionality.
        Pete.mixin(oZone, Pete.Observer);
        oZone.subscriberEvents([
          'beforenodedrop',
          'afternodedrop'
        ]); //let the Observer know what events can be subscribed to;

        if (o.subscribe) {
          oSubscribe = o.subscribe;
          for (sEvent in oSubscribe) {
            if (oSubscribe.hasOwnProperty(sEvent)) {
              oZone.subscriberEvents(sEvent); //w/o registering the event it can't be subscribed to;
              oZone.subscribe(sEvent, oSubscribe[sEvent]);
            }
          }
        }

        oElem.sort = o.sort || false;
        oElem.snapToZone = o.snapToZone || false;
      });
    } else {
      dropZones.push(Pete.Element.get(v));
    }

    v.on("mousedown", function (e) {
      var target = e.target;

      target = target.className.indexOf("Pete_draggable") !== -1 ? target : Pete.dom.find(target, ".Pete_draggable");
      if (target) {
        target.owner = this.id;
        dragSource = target.cloneNode(true); //clone the target node and any children;
        sourceElement = target;
        Pete.Element.fly(dragSource).addClass("Pete_dragging"); //concatenate b/c we don't want to overwrite any class that may already be bound to it;
        document.body.appendChild(dragSource);

        document.onmousemove = function (e) {
          e = e || window.event;
          Pete.Element.fly(dragSource).setStyle({
            display: "block",
            top: Pete.util.getY(e) + 20 + "px",
            left: Pete.util.getX(e) + 10 + "px"
          });
        };
      }
      document.body.focus(); //cancel out any text selections;
      document.onselectstart = function () { return false; }; //prevent text selection in ie;
      e.preventDefault();
    });

    v.on("mouseover", function (e) {
      if (dragSource) {
        if (sourceElement.owner !== this.id) {
          dropZoneTarget = this.id;
          Pete.Element.fly(dragSource).addClass("Pete_overDropZone");
        }
      }
    });

    //NOTE it's very important to listen to this event so fnOnNodeDrop knows when it can remove the cloned node and when to remove the class when the node is over a no-drop area;
    v.on("mouseout", function (e) {
      if (dragSource) {
        dropZoneTarget = null;
        Pete.Element.fly(dragSource).removeClass("Pete_overDropZone");
      }
    });
  }

  function fnOnNodeDrop(e) {
    if (!dragSource) {
      return;
    }

    var o;

    if (dropZoneTarget && dropZoneTarget.indexOf(sourceElement.owner) === -1) { //if dropZoneTarget is not null (from a no-drop area) or within the same drop zone;
      oZoneTarget = $(dropZoneTarget);

      o = Pete.ux.DropZoneManager.getDropZones()[dropZoneTarget];
      if (o) {
        if (o.id !== sourceElement.owner) {
          if (o.fire("beforenodedrop") !== false) { //drop the node in the drop zone if developer-provided callback doesn't cancel the behavior;
            document.body.removeChild(dragSource); //remove the cloned node from the dom...;
            $(dropZoneTarget).appendChild(sourceElement); //...and re-append the original in the new drop zone;
            sourceElement.owner = o.id; //swap out the previous zone owner for the new one;

            if (o.sort) {
              fnSort(dropZoneTarget);
            }

            if (sourceElement.snapped && !o.snapToZone) { //sourceElement has already been snapped to the zone and now needs to have its original styles added back to it (unless dropped in another zone that needs to also be snapped to the zone);
              Pete.Element.fly(sourceElement).setStyle(sourceElement.originalStyles);
              sourceElement.snapped = false;
            } else if (!sourceElement.snapped && o.snapToZone) { //only snap to zone if it hasn't already been snapped;
              fnSnapToZone(sourceElement);
            }
            //NOTE if it's already been snapped to zone and is dropped into another snapped zone, don't do anything above b/c it's already been snapped and has its original styles bound to itself;
          } else {
            document.body.removeChild(dragSource);
          }
        }
        o.fire('afternodedrop');
      }
    } else {
      document.body.removeChild(dragSource); //remove the cloned node from the dom...;
    }

    dragSource = null; //...and remove the property so the check in the beginning of this method tcob;
    document.onmousemove = null;
    document.onselectstart = null;
  }

  function fnSnapToZone(sourceElement) {
    var fnGetStyle = Pete.util.getStyle,
      oStyle = {
        borderTopColor: fnGetStyle(sourceElement, 'border-top-color'),
        borderTopStyle: fnGetStyle(sourceElement, 'border-top-style'),
        borderTopWidth: fnGetStyle(sourceElement, 'border-top-width'),

        borderRightColor: fnGetStyle(sourceElement, 'border-right-color'),
        borderRightStyle: fnGetStyle(sourceElement, 'border-right-style'),
        borderRightWidth: fnGetStyle(sourceElement, 'border-right-width'),

        borderBottomColor: fnGetStyle(sourceElement, 'border-bottom-color'),
        borderBottomStyle: fnGetStyle(sourceElement, 'border-bottom-style'),
        borderBottomWidth: fnGetStyle(sourceElement, 'border-bottom-width'),

        borderLeftColor: fnGetStyle(sourceElement, 'border-left-color'),
        borderLeftStyle: fnGetStyle(sourceElement, 'border-left-style'),
        borderLeftWidth: fnGetStyle(sourceElement, 'border-left-width'),

        marginTop: fnGetStyle(sourceElement, 'margin-top'),
        marginRight: fnGetStyle(sourceElement, 'margin-right'),
        marginBottom: fnGetStyle(sourceElement, 'margin-bottom'),
        marginLeft: fnGetStyle(sourceElement, 'margin-left')
      };

    sourceElement.snapped = true;
    sourceElement.style.border = sourceElement.style.margin = 0;
    sourceElement.originalStyles = oStyle;
  }

  //sort the drop zone's sortable elements after drop (NOTE that the sort is dependent upon a developer provided property called "sortOrder");
  function fnSort(sDropZone) {
    var arr = Pete.makeArray($(sDropZone).childNodes).filter(function (v) { //get all child nodes within the drop zone that have a "sortOrder" property;
      return (typeof v.sortOrder === "number"); //should there be a better check?;
    }),
    oFrag = document.createDocumentFragment(),
    oDropZone = Pete.Element.get(sDropZone);

    arr.sort(function (a, b) { //sort all nodes in this drop zone by their sort order property;
      return a.sortOrder - b.sortOrder;
    });

    oDropZone.remove(true); //remove all the nodes...;

    arr.forEach(function (v) { //...and readd them to the document fragment;
      oFrag.appendChild(v);
    });
    oDropZone.append(oFrag); //only append once!;
  }

  return {
    add: function (v, o) {
      o = o || {};
      return fnAdd(v, o);
    },
    getDropZones: function () {
      return dropZones;
    },
    onMouseUp: function (e) {
      return fnOnNodeDrop.call(this, e);
    }
  };

}());

