(function() {
    function forEach(arr, func) {
        if (arr) {
            for (var i = 0; i < arr.length; i++) {
                func(arr[i]);
            }
        }
    }

    function updateScrollState(content, swapSpec) {
        var first = content[0];
        var last = content[content.length - 1];
        if (swapSpec.scroll) {
            var target = null;
            if (swapSpec.scrollTarget) {
                target = querySelectorExt(first, swapSpec.scrollTarget);
            }
            if (swapSpec.scroll === "top" && (first || target)) {
                target = target || first;
                target.scrollTop = 0;
            }
            if (swapSpec.scroll === "bottom" && (last || target)) {
                target = target || last;
                target.scrollTop = target.scrollHeight;
            }
        }
        if (swapSpec.show) {
            var target = null;
            if (swapSpec.showTarget) {
                var targetStr = swapSpec.showTarget;
                if (swapSpec.showTarget === "window") {
                    targetStr = "body";
                }
                target = querySelectorExt(first, targetStr);
            }
            if (swapSpec.show === "top" && (first || target)) {
                target = target || first;
                target.scrollIntoView({block:'start', behavior: htmx.config.scrollBehavior});
            }
            if (swapSpec.show === "bottom" && (last || target)) {
                target = target || last;
                target.scrollIntoView({block:'end', behavior: htmx.config.scrollBehavior});
            }
        }
    }

    function triggerEventOnChildren(hx, elt, eventName, detail) {
        if (detail == null) {
            detail = {};
        }

        detail['elt'] = elt;

        forEach(elt.children, function(child) {
            hx.triggerEvent(child, eventName, detail);
        });
    }

    htmx.defineExtension('tpl', {
        tplAttr: 'hx-tpl',
        version: '0.2.0',
    
        tplSwap: function(elt) {
            // Reimplementation of the htmx swap flow without Ajax requests. Here we go...
            var hx = this.internalAPI;
            var target = hx.getTarget(elt);
            var swapSpec = hx.getSwapSpecification(elt);
            target.classList.add(htmx.config.swappingClass);
    
            var sourceQuery = hx.getClosestAttributeValue(elt, this.tplAttr);
            if (!sourceQuery) return;
            var templateElt = htmx.find(sourceQuery);
            if (!templateElt) return;
            var templateStr = templateElt.innerHTML;
            if (!hx.triggerEvent(target, 'htmx:beforeSwap')) return;
    
            var historyUpdate = {};
            var pushUrl = hx.getClosestAttributeValue(elt, "hx-push-url");
            var replaceUrl = hx.getClosestAttributeValue(elt, "hx-replace-url");
            var saveType = null;
            var path = null;
    
            if (pushUrl) {
                saveType = "push";
                path = pushUrl;
            } else if (replaceUrl) {
                saveType = "replace";
                path = replaceUrl;
            }
    
            if (path && path !== 'false') {
                historyUpdate = {
                    type: saveType,
                    path: path
                }
            }
    
            if (historyUpdate.type) {
                hx.saveCurrentPageToHistory();
            }
    
            // optional transition API promise callbacks
            var settleResolve = null;
            var settleReject = null;

    
            var doSwap = function(self) {
                try {
                    var activeElt = document.activeElement;
                    var selectionInfo = {};
                    try {
                        selectionInfo = {
                            elt: activeElt,
                            // @ts-ignore
                            start: activeElt ? activeElt.selectionStart : null,
                            // @ts-ignore
                            end: activeElt ? activeElt.selectionEnd : null
                        };
                    } catch (e) {
                        // safari issue - see https://github.com/microsoft/playwright/issues/5894
                    }

                    var settleInfo = {tasks: [], elts: [target], source: templateElt};
                    hx.selectAndSwap(swapSpec.swapStyle, target, elt, templateStr, settleInfo);
                    
                    if (selectionInfo.elt &&
                        !hx.bodyContains(selectionInfo.elt) &&
                        selectionInfo.elt.getAttribute('id')) {
                        var newActiveElt = document.getElementById(
                            selectionInfo.elt.getAttribute('id')
                        );
                        var focusOptions = { preventScroll: swapSpec.focusScroll !== undefined ? !swapSpec.focusScroll : !htmx.config.defaultFocusScroll };
                        if (newActiveElt) {
                            // @ts-ignore
                            if (selectionInfo.start && newActiveElt.setSelectionRange) {
                                // @ts-ignore
                                try {
                                    newActiveElt.setSelectionRange(selectionInfo.start, selectionInfo.end);
                                } catch (e) {
                                    // the setSelectionRange method is present on fields that don't support it, so just let this fail
                                }
                            }
                            newActiveElt.focus(focusOptions);
                        }
                    }
    
                    target.classList.remove(htmx.config.swappingClass);
    
                    forEach(settleInfo.elts, function(settleElt) {
                        if (settleElt.classList) {
                            settleElt.classList.add(htmx.config.settlingClass);
                        }
                        hx.triggerEvent(settleElt, 'htmx:afterSwap');
                    });
    
                    var doSettle = function () {
                        forEach(settleInfo.tasks, function (task) {
                            task.call();
                        });
                        forEach(settleInfo.elts, function (settleElt) {
                            if (settleElt.classList) {
                                settleElt.classList.remove(htmx.config.settlingClass);
                            }
                            hx.triggerEvent(settleElt, 'htmx:afterSettle');
                        });
    
                        // if we need to save history, do so
                        if (historyUpdate.type) {
                            if (historyUpdate.type === "push") {
                                hx.pushUrlIntoHistory(historyUpdate.path);
                                hx.triggerEvent(hx.getDocument().body, 'htmx:pushedIntoHistory', {path: historyUpdate.path});
                            } else {
                                hx.replaceUrlInHistory(historyUpdate.path);
                                hx.triggerEvent(getDocument().body, 'htmx:replacedInHistory', {path: historyUpdate.path});
                            }
                        }
    
                        if (settleInfo.title) {
                            var titleElt = htmx.find("title");
                            if(titleElt) {
                                titleElt.innerHTML = settleInfo.title;
                            } else {
                                window.document.title = settleInfo.title;
                            }
                        }
    
                        updateScrollState(settleInfo.elts, swapSpec);
                        
                        if (hx.settleResolve) hx.settleResolve();
                    }
    
                    if (swapSpec.settleDelay > 0) {
                        setTimeout(doSettle, swapSpec.settleDelay)
                    } else {
                        hx.doSettle();
                    }
                } catch (e) {
                    hx.triggerErrorEvent(elt, 'htmx:swapError', templateStr);
                    if (hx.settleReject) hx.settleReject();
                    throw e;
                }
            };
    
            var shouldTransition = htmx.config.globalViewTransitions;
            if (swapSpec.hasOwnProperty('transition')){
                shouldTransition = swapSpec.transition;
            }
    
            if (
                shouldTransition &&
                hx.triggerEvent(elt, 'htmx:beforeTransition', responseInfo) &&
                typeof Promise !== "undefined" && document.startViewTransition
            ) {
                var settlePromise = new Promise(function (_resolve, _reject) {
                    settleResolve = _resolve;
                    settleReject = _reject;
                });
                // wrap the original doSwap() in a call to startViewTransition()
                var innerDoSwap = doSwap;
                doSwap = function(self) {
                    document.startViewTransition(function () {
                        innerDoSwap(self);
                        return settlePromise;
                    });
                }
            }
    
            if (swapSpec.swapDelay > 0) {
                setTimeout(
                    function() { doSwap(this); }, 
                    swapSpec.swapDelay
                );
            } else {
                doSwap(this);
            }
        },
    
        tplSwapStyles: {
            move: function(source, target) {
                target.innerHTML = source.innerHTML;
                source.innerHTML = '';
            },
            replace: function(source, target) {
                target.outerHTML = source.outerHTML;
            },
            trade: function(source, target) {
                var traded = source.innerHTML;
                source.innerHTML = target.innerHTML;
                target.innerHTML = traded;
            },
            exchange: function(source, target) {
                var exchanged = source.outerHTML;
                source.outerHTML = target.outerHTML;
                target.outerHTML = exchanged;
            }
        },
    
        handleSwapBeforeEvents: function(elt, swapStyle) {
            var hx = this.internalAPI;
            var capitalizedSwapStyle = swapStyle[0].toUpperCase() + swapStyle.slice(1);
            hx.triggerEvent(elt, 'extTplBefore');
            triggerEventOnChildren(hx, elt, 'extTplBefore');
            hx.triggerEvent(elt, 'extTplBefore' + capitalizedSwapStyle);
            triggerEventOnChildren(hx, elt, 'extTplBefore' + capitalizedSwapStyle);
        },
    
        handleSwapAfterEvents: function(elt, swapStyle) {
            var hx = this.internalAPI;
            var capitalizedSwapStyle = swapStyle[0].toUpperCase() + swapStyle.slice(1);
            hx.triggerEvent(elt, 'extTplAfter' + capitalizedSwapStyle);
            hx.triggerEvent(elt, 'extTplAfter');
            htmx.process(elt);
            triggerEventOnChildren(hx, elt, 'extTplAfter' + capitalizedSwapStyle);
            triggerEventOnChildren(hx, elt, 'extTplAfter');
        },
    
        init: function(htmxInternalAPI) {
            this.internalAPI = htmxInternalAPI;
        },
    
        onEvent: function(name, event) {
            var hx = this.internalAPI;
            var elt = event.target;
    
            if (
                name == 'htmx:beforeProcessNode' &&
                hx.getAttributeValue(elt, this.tplAttr) &&
                !hx.hasAttribute(elt, 'hx-trigger')
            ) {
                elt.setAttribute('hx-trigger', 'click');
                var target = hx.getTarget(elt);
                target.setAttribute('hx-ext', 'tpl');
                return true;
            } else if (
                name == 'htmx:trigger' &&
                hx.getAttributeValue(elt, this.tplAttr)
            ) {
                return this.tplSwap(elt);
            }
    
            return true;
        },
    
        handleSwap: function(swapStyle, target, fragment, settleInfo) {
            if (Object.keys(this.tplSwapStyles).indexOf(swapStyle) == -1) return false;
    
            var source = settleInfo.source;
    
            this.handleSwapBeforeEvents(source, swapStyle);
            if (swapStyle == 'trade' || swapStyle == 'exchange') this.handleSwapAfterEvents(target, swapStyle);

            this.tplSwapStyles[swapStyle](source, target);

            this.handleSwapAfterEvents(target, swapStyle);
            if (swapStyle == 'trade' || swapStyle == 'exchange') this.handleSwapAfterEvents(source, swapStyle);
    
            return true;
        }
    });
})();