Pete.DD = (function () {
    var i = 0,
        dropZones = {},
        len,
        // The cloned dom element.
        dragProxy,
        // The original dom element that has been selected to be dragged.
        sourceEl,
        // The zone target (an element id) where the dragged element will be dropped.
        dropZoneTarget;

    function add(v, o) {
        var elems = [],
            doc = Pete.Element.get(document),
            body = document.body,
            registered = false,
            ev, subscribe;

        if (!registered) {
            doc.on('mouseup', onNodeDrop);
        }

        if (!(v instanceof Array)) {
            if (v.elements && v.elements.length > 0) {
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
                sourceEl = Pete.compose(Pete.Element, {
                    dom: target,
                    id: 'Pete_sourceEl'
                });

                dom = Pete.getDom(this);
                sourceEl.ddOwner = dom.id || dom._pete.ownerId;

                dragProxy = getDragProxy({
                    // Clone the target node and any children.
                    dom: target.cloneNode(true)
                });

                // Concatenate b/c we don't want to overwrite any class that may already be bound to it.
                dragProxy.addClass('Pete_dragging');
                body.appendChild(dragProxy.dom);

                document.onmousemove = function (e) {
                    e = e || window.event;

                    dragProxy.setStyle({
                        display: 'block',
                        top: Pete.util.getY(e) + 20 + 'px',
                        left: Pete.util.getX(e) + 10 + 'px'
                    });
                };
            }

            // Cancel out any text selections.
            body.focus();

            // Prevent text selection in IE.
            document.onselectstart = function () {
                return false;
            };

            e.preventDefault();
        });

        v.on('mouseover', function (e) {
            var dom, id;

            if (dragProxy) {
                dom = Pete.getDom(this);
                id = dom.id || dom._pete.ownerId;

                if (sourceEl.ddOwner !== id) {
                    dropZoneTarget = id;
                    Pete.Element.fly(dragProxy).addClass('Pete_overDropZone');
                }
            }
        });

        // NOTE: It's very important to listen to this event so onNodeDrop knows when it can remove
        // the cloned node and when to remove the class when the node is over a no-drop area.
        v.on('mouseout', function (e) {
            if (dragProxy) {
                dropZoneTarget = null;
                Pete.Element.fly(dragProxy).removeClass('Pete_overDropZone');
            }
        });

        registered = true;
    }

    function getDragProxy(config) {
        if (!dragProxy) {
            dragProxy = Pete.compose(Pete.Element, config);
        } else {
            dragProxy.dom = config.dom;
        }

        return dragProxy;
    }

    function onNodeDrop(e) {
        var body = document.body,
            o;

        if (!dragProxy) {
            return;
        }

        // If dropZoneTarget is not null (from a no-drop area) or within the same drop zone.
        if (dropZoneTarget && dropZoneTarget.indexOf(sourceEl.ddOwner) === -1) {
            //zoneTarget = Pete.getDom(dropZoneTarget);
            zoneTarget = Pete.Element.get(dropZoneTarget, true);

            o = dropZones[dropZoneTarget];

            if (o) {
                if (o.id !== sourceEl.ddOwner) {
                    // Drop the node in the drop zone if developer-provided callback doesn't cancel the behavior.
                    if (o.fire('beforenodedrop') !== false) {
                        // Remove the cloned node from the dom...
                        body.removeChild(dragProxy.dom);
                        // ...and re-append the original in the new drop zone.
                        zoneTarget.appendChild(sourceEl.dom);
                        // Swap out the previous zone owner for the new one.
                        sourceEl.ddOwner = o.id;

                        if (o.sort) {
                            sort(dropZoneTarget);
                        }

                        // sourceEl has already been snapped to the zone and now needs to have its original styles
                        // added back to it (unless dropped in another zone that needs to also be snapped to the zone).
                        if (sourceEl.dom._pete && sourceEl.dom._pete.snapped && !o.snapToZone) {
                            sourceEl.setStyle(sourceEl.dom._pete.originalStyles);
                            sourceEl.dom._pete.snapped = false;
                        } // Only snap to zone if it hasn't already been snapped.
                        else if (/*!sourceEl.dom._pete.snapped && */o.snapToZone) {
                            snapToZone(sourceEl);
                        }

                        // NOTE: If it's already been snapped to zone and is dropped into another snapped zone, don't do
                        // anything above b/c it's already been snapped and has its original styles bound to itself.
                    } else {
                        body.removeChild(dragProxy.dom);
                    }
                }

                o.fire('afternodedrop');
            }
        } else {
            // Remove the cloned node from the dom...
            body.removeChild(dragProxy.dom);
        }

        // ...and remove the property so the check in the beginning of this method tcob.
        dragProxy = document.onmousemove = document.onselectstart = null;
    }

    function snapToZone(sourceEl) {
        var getStyle = Pete.util.getStyle,
            dom = sourceEl.dom,
            style = {
                borderTopColor: getStyle(dom, 'border-top-color'),
                borderTopStyle: getStyle(dom, 'border-top-style'),
                borderTopWidth: getStyle(dom, 'border-top-width'),

                borderRightColor: getStyle(dom, 'border-right-color'),
                borderRightStyle: getStyle(dom, 'border-right-style'),
                borderRightWidth: getStyle(dom, 'border-right-width'),

                borderBottomColor: getStyle(dom, 'border-bottom-color'),
                borderBottomStyle: getStyle(dom, 'border-bottom-style'),
                borderBottomWidth: getStyle(dom, 'border-bottom-width'),

                borderLeftColor: getStyle(dom, 'border-left-color'),
                borderLeftStyle: getStyle(dom, 'border-left-style'),
                borderLeftWidth: getStyle(dom, 'border-left-width'),

                marginTop: getStyle(dom, 'margin-top'),
                marginRight: getStyle(dom, 'margin-right'),
                marginBottom: getStyle(dom, 'margin-bottom'),
                marginLeft: getStyle(dom, 'margin-left')
            };

        dom._pete.snapped = true;
        dom.style.border = dom.style.margin = 0;
        dom._pete.originalStyles = style;
    }

    // Sort the drop zone's sortable elements after drop (NOTE that the sort is dependent upon a developer
    // provided property called 'sortOrder').
    function sort(sDropZone) {
        // Get all child nodes within the drop zone that have a 'sortOrder' property.
        var arr = Pete.makeArray(Pete.getDom(sDropZone).childNodes).filter(function (v) {
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
        initDD: function (v, o) {
            return add(v, o || {});
        },
        getDropZones: function () {
            return dropZones;
        }
    };
}());

