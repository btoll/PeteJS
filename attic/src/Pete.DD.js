(function () {
    'use strict';

    // TODO: Leaks!
    //
    // Notes
    //
    // initDD   = el can be both drag and drop zone
    // dragZone = el can only be a dragzone, it cannot accept drops
    // dropZone = el can only be a dropzone, it cannot initiate drags
    //
    // If a dragCls is not explicitly defined then any dom element can be a drag target.

    Pete.DD = (function () {
        var dragZones = {},
            dropZones = {},
            // The cloned dom element.
            dragProxy,
            // The original dom element that has been selected to be dragged.
            sourceEl,
            // The zone target (an element id) where the dragged element will be dropped.
            dropZoneTarget;

        function add(v, cfg) {
            var me = this,
                els = [],
                data = cfg.data,
                ev, subscribe;

            if (!(v instanceof Array)) {
                if (v.elements && v.elements.length > 0) {
                    els = v.elements;
                } else {
                    els = [Pete.get(v, true)];
                }

                els.forEach(function (dom) {
                    var zone = Pete.get(dom),
                        el = Pete.get(dom);

                    // Let the Observer know what events can be subscribed to.
                    zone.subscriberEvents([
                        'beforenodedrop',
                        'afternodedrop'
                    ]);

                    if (data.subscribe) {
                        subscribe = data.subscribe;

                        for (ev in subscribe) {
                            if (subscribe.hasOwnProperty(ev)) {
                                // W/o registering the event it can't be subscribed to.
                                zone.subscribe(ev, subscribe[ev]);
                            }
                        }
                    }

                    Pete.mixin(zone, data);
                    addToZone(cfg.type, zone);

                    el.on('mousedown', onMouseDown, el, me);
                    el.on('mouseover', onMouseOver, el, me);
                    el.on('mouseout', onMouseOut, el, me);
                });
            } else {
                dropZones.push(Pete.get(v));
            }
        }

        function addToZone(type, el){
            var id = el.id;

            switch (type) {
                case 'drag':
                    dragZones[id] = el;
                    break;

                case 'drop':
                    dropZones[id] = el;
                    break;

                default:
                    dragZones[id] = dropZones[id] = el;
            }
        }

        function getDragProxy(config) {
            if (!dragProxy) {
                dragProxy = Pete.compose(Pete.Element, config);
            } else {
                Pete.mixin(dragProxy, config);
            }

            return dragProxy;
        }

        function getSourceEl(config) {
            if (!sourceEl) {
                sourceEl = Pete.compose(Pete.Element, Pete.mixin({
                    id: 'Pete_sourceEl'
                }, config));
            } else {
                Pete.mixin(sourceEl, config);
            }

            return sourceEl;
        }

        function onMouseDown(e, dd) {
            var dom = this.dom,
                target = e.target,
                ownerId = dom._pete.ownerId,
                dragZone = dragZones[ownerId],
                doc = Pete.get(document),
                body = document.body,
                // `dd` is the current DD object.
                dragCls = dd.dragCls;

            // Only continue if the ownerId is a participating dragZone.
            if (dragZone) {
                // If the target doesn't have the class do an ancestor search upwards.
                if (!Pete.get(target).hasClass(dragCls)) {
                    target = Pete.dom.find(target, '.' + dragCls);
                }

                if (target) {
                    sourceEl = getSourceEl({
                        dom: target,
                        ddOwner: ownerId
                    });

                    dragProxy = getDragProxy({
                        // Clone the target node and any children.
                        dom: target.cloneNode(true)
                    });

                    // Concatenate b/c we don't want to overwrite any class that may already be bound to it.
                    dragProxy.addClass('Pete_dragging');
                    body.appendChild(dragProxy.dom);

                    doc.on('mousemove', onMouseMove);
                }

                // Cancel out any text selections.
                body.focus();

                // TODO: if (Pete.isIE) ...
                doc.on('selectstart', onSelectStart);
            }

            e.preventDefault();
        }

        function onMouseMove(e) {
            e = e || window.event;

            if (dragProxy) {
                dragProxy.setStyle({
                    display: 'block',
                    // top: Pete.util.getY(e) + 20 + 'px',
                    // left: Pete.util.getX(e) + 10 + 'px'
                    top: Pete.util.getY(e) + 'px',
                    left: Pete.util.getX(e) + 'px'
                });
            }
        }

        // NOTE: It's very important to listen to this event so onNodeDrop knows when it can remove
        // the cloned node and when to remove the class when the node is over a no-drop area.
        function onMouseOut() {
            if (dragProxy) {
                dropZoneTarget = null;
                Pete.fly(dragProxy).removeClass('Pete_overDropZone');
            }
        }

        function onMouseOver(e) {
            var dom = e.target,
                ownerId;

            if (dragProxy) {
                ownerId = dom._pete.ownerId;

                // Only continue if the ownerId is a participating dropZone.
                if (sourceEl.ddOwner !== ownerId && dropZones[ownerId]) {
                    dropZoneTarget = ownerId;
                    Pete.fly(dragProxy).addClass('Pete_overDropZone');
                }
            }
        }

        function onNodeDrop() {
            var doc = Pete.get(document),
                body = document.body,
                zoneTarget, o, el;

            if (!dragProxy) {
                return;
            }

            // If dropZoneTarget is not null (from a no-drop area) or within the same drop zone.
            if (dropZoneTarget && dropZoneTarget.indexOf(sourceEl.ddOwner) === -1) {
                // zoneTarget = Pete.getDom(dropZoneTarget);
                zoneTarget = Pete.get(dropZoneTarget, true);
                o = dropZones[dropZoneTarget];

                if (o) {
                    if (o.id !== sourceEl.ddOwner) {
                        // Drop the node in the drop zone if developer-provided callback doesn't cancel the behavior.
                        if (o.fire('beforenodedrop') !== false) {
                            // TODO
                            el = o.dropProxy ? dragProxy : sourceEl;

                            // Remove the cloned node from the dom...
                            body.removeChild(dragProxy.dom);
                            // ...and re-append the original in the new drop zone.
                            zoneTarget.appendChild(el.dom);

                            // Swap out the previous zone owner for the new one.
                            sourceEl.ddOwner = o.id;

                            if (o.sort) {
                                sort(dropZoneTarget);
                            }

                            // NOTE: If it's already been snapped to zone and is dropped into another snapped zone, don't do
                            // anything above b/c it's already been snapped and has its original styles bound to itself.
                        } else {
                            body.removeChild(dragProxy.dom);
                        }
                    }

                    // `this` is the current DD object.
                    o.fire('afternodedrop', this);
                }
            } else {
                // Remove the cloned node from the dom...
                body.removeChild(dragProxy.dom);
            }

            // ...and remove the property so the check in the beginning of this method tcob.
            dragProxy = null;

            // TODO: if (Pete.isIE) ...
            doc.un('selectstart', onSelectStart);
            doc.un('mousemove', onMouseMove);
        }

        // Prevent text selection in IE.
        function onSelectStart() {
            return false;
        }

        // Sort the drop zone's sortable elements after drop (NOTE that the sort is dependent upon a developer
        // provided property called 'sortOrder').
        function sort(dropZone) {
            // Get all child nodes within the drop zone that have a 'sortOrder' property.
            var arr = Pete.makeArray(Pete.getDom(dropZone).childNodes).filter(function (v) {
                // Should there be a better check?
                return (typeof v.sortOrder === 'number');
            }),
                frag = document.createDocumentFragment(),
                dz = Pete.get(dropZone);

            // Sort all nodes in this drop zone by their sort order property.
            arr.sort(function (a, b) {
                return a.sortOrder - b.sortOrder;
            });

            // Remove all the nodes...
            dz.remove(true);

            // ...and readd them to the document fragment.
            arr.forEach(function (v) {
                frag.appendChild(v);
            });

            dz.append(frag);
        }

        return {
            $compose: function () {
                // Only register the global 'mouseup' event once.
                if (!Pete.DD._eventRegistered) {
                    Pete.get(document).on('mouseup', onNodeDrop, this);
                    Pete.DD._eventRegistered = true;
                }
            },

            _eventRegistered: false,

            dragZone: function (el, o) {
                return add.call(this, el, {
                    type: 'drag',
                    data: o || {}
                });
            },

            dropZone: function (el, o) {
                return add.call(this, el, {
                    type: 'drop',
                    data: o || {}
                });
            },

            getDropZones: function () {
                return dropZones;
            },

            initDD: function (el, o) {
                return add.call(this, el, {
                    type: 'DD',
                    data: o || {}
                });
            }
        };
    }());
}());

