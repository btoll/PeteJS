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

    function add(v, o) {
        var elems = [],
          ev, subscribe;

        if (!(v instanceof Array)) {
            if (v.elements.length > 0) {
                elems = v.elements;
            } else {
                elems = [Pete.Element.get(v, true)];
            }

            elems.forEach(function (elem) {
                var zone = Pete.Element.get(elem);
                dropZones[zone.id] = zone;

                // Let the Observer know what events can be subscribed to.
                zone.subscriberEvents([
                  'beforenodedrop',
                  'afternodedrop'
                ]);

                if (o.subscribe) {
                    subscribe = o.subscribe;

                    for (ev in subscribe) {
                        if (subscribe.hasOwnProperty(ev)) {
                            // W/o registering the event it can't be subscribed to.
                            zone.subscribe(ev, subscribe[ev]);
                        }
                    }
                }

                zone.sort = o.sort || false;
                zone.snapToZone = o.snapToZone || false;
            });
        } else {
            dropZones.push(Pete.Element.get(v));
        }

        v.on('mousedown', function (e) {
            var target = e.target,
                dom;

            target = (target.className.indexOf('Pete_draggable') !== -1) ?
                target :
                Pete.dom.find(target, '.Pete_draggable');

            if (target) {
                dom = Pete.getDom(this);
                target.owner = dom.id || dom._pete.ownerId;

                // Clone the target node and any children.
                dragSource = target.cloneNode(true);
                sourceElement = target;

                // Concatenate b/c we don't want to overwrite any class that may already be bound to it.
                Pete.Element.fly(dragSource).addClass('Pete_dragging');
                document.body.appendChild(dragSource);

                document.onmousemove = function (e) {
                    e = e || window.event;

                    Pete.Element.fly(dragSource).setStyle({
                        display: 'block',
                        top: Pete.util.getY(e) + 20 + 'px',
                        left: Pete.util.getX(e) + 10 + 'px'
                    });
                };
            }

            // Cancel out any text selections.
            document.body.focus();

            // Prevent text selection in IE.
            document.onselectstart = function () {
                return false;
            };

            e.preventDefault();
        });

        v.on('mouseover', function (e) {
            var dom, id;

            if (dragSource) {
                dom = Pete.getDom(this);
                id = dom.id || dom._pete.ownerId;

                if (sourceElement.owner !== id) {
                    dropZoneTarget = id;
                    Pete.Element.fly(dragSource).addClass('Pete_overDropZone');
                }
            }
        });

        // NOTE: It's very important to listen to this event so onNodeDrop knows when it can remove
        // the cloned node and when to remove the class when the node is over a no-drop area.
        v.on('mouseout', function (e) {
            if (dragSource) {
                dropZoneTarget = null;
                Pete.Element.fly(dragSource).removeClass('Pete_overDropZone');
            }
        });
    }

    function onNodeDrop(e) {
        var o;

        if (!dragSource) {
            return;
        }

        // If dropZoneTarget is not null (from a no-drop area) or within the same drop zone.
        if (dropZoneTarget && dropZoneTarget.indexOf(sourceElement.owner) === -1) {
            //zoneTarget = $(dropZoneTarget);
            zoneTarget = Pete.Element.get(dropZoneTarget, true);

            o = Pete.ux.DropZoneManager.getDropZones()[dropZoneTarget];

            if (o) {
                if (o.id !== sourceElement.owner) {
                    // Drop the node in the drop zone if developer-provided callback doesn't cancel the behavior.
                    if (o.fire('beforenodedrop') !== false) {
                        // Remove the cloned node from the dom...
                        document.body.removeChild(dragSource);
                        // ...and re-append the original in the new drop zone.
                        zoneTarget.appendChild(sourceElement);
                        // Swap out the previous zone owner for the new one.
                        sourceElement.owner = o.id;

                        if (o.sort) {
                            sort(dropZoneTarget);
                        }

                        // sourceElement has already been snapped to the zone and now needs to have its original styles
                        // added back to it (unless dropped in another zone that needs to also be snapped to the zone).
                        if (sourceElement.snapped && !o.snapToZone) {
                            Pete.Element.fly(sourceElement).setStyle(sourceElement.originalStyles);
                            sourceElement.snapped = false;
                        } // Only snap to zone if it hasn't already been snapped.
                        else if (!sourceElement.snapped && o.snapToZone) {
                            snapToZone(sourceElement);
                        }

                        // NOTE: If it's already been snapped to zone and is dropped into another snapped zone, don't do
                        // anything above b/c it's already been snapped and has its original styles bound to itself.
                    } else {
                        document.body.removeChild(dragSource);
                    }
                }

                o.fire('afternodedrop');
            }
        } else {
            // Remove the cloned node from the dom...
            document.body.removeChild(dragSource);
        }

        // ...and remove the property so the check in the beginning of this method tcob.
        dragSource = document.onmousemove = document.onselectstart = null;
    }

    function snapToZone(sourceElement) {
        var getStyle = Pete.util.getStyle,
            style = {
                borderTopColor: getStyle(sourceElement, 'border-top-color'),
                borderTopStyle: getStyle(sourceElement, 'border-top-style'),
                borderTopWidth: getStyle(sourceElement, 'border-top-width'),

                borderRightColor: getStyle(sourceElement, 'border-right-color'),
                borderRightStyle: getStyle(sourceElement, 'border-right-style'),
                borderRightWidth: getStyle(sourceElement, 'border-right-width'),

                borderBottomColor: getStyle(sourceElement, 'border-bottom-color'),
                borderBottomStyle: getStyle(sourceElement, 'border-bottom-style'),
                borderBottomWidth: getStyle(sourceElement, 'border-bottom-width'),

                borderLeftColor: getStyle(sourceElement, 'border-left-color'),
                borderLeftStyle: getStyle(sourceElement, 'border-left-style'),
                borderLeftWidth: getStyle(sourceElement, 'border-left-width'),

                marginTop: getStyle(sourceElement, 'margin-top'),
                marginRight: getStyle(sourceElement, 'margin-right'),
                marginBottom: getStyle(sourceElement, 'margin-bottom'),
                marginLeft: getStyle(sourceElement, 'margin-left')
            };

        sourceElement.snapped = true;
        sourceElement.style.border = sourceElement.style.margin = 0;
        sourceElement.originalStyles = style;
    }

    // Sort the drop zone's sortable elements after drop (NOTE that the sort is dependent upon a developer
    // provided property called 'sortOrder').
    function sort(sDropZone) {
        // Get all child nodes within the drop zone that have a 'sortOrder' property.
        var arr = Pete.makeArray($(sDropZone).childNodes).filter(function (v) {
            // Should there be a better check?
            return (typeof v.sortOrder === 'number');
        }),
        frag = document.createDocumentFragment(),
        oDropZone = Pete.Element.get(sDropZone);

        // Sort all nodes in this drop zone by their sort order property.
        arr.sort(function (a, b) {
            return a.sortOrder - b.sortOrder;
        });

        // Remove all the nodes...
        oDropZone.remove(true);

        // ...and readd them to the document fragment.
        arr.forEach(function (v) {
            frag.appendChild(v);
        });

        oDropZone.append(frag);
    }

    return {
        add: function (v, o) {
            return add(v, o || {});
        },
        getDropZones: function () {
            return dropZones;
        },
        onMouseUp: function (e) {
            return onNodeDrop.call(this, e);
        }
    };
}());

