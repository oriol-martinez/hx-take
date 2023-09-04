htmx.defineExtension('tpl', {
    tplAttr: 'hx-tpl',
    init: function(htmxInternalAPI) {
        this.internalAPI = htmxInternalAPI;

        this.forEach = function forEach(arr, func) {
            if (arr) {
                for (var i = 0; i < arr.length; i++) {
                    func(arr[i]);
                }
            }
        }
        this.updateScrollState = function(content, swapSpec) {
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
        };
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
            var target = hx.getTarget(elt);
            var swapSpec = hx.getSwapSpecification(elt);
            target.classList.add(htmx.config.swappingClass);

            var templateQuery = hx.getClosestAttributeValue(elt, this.tplAttr);
            if (!templateQuery) return;
            var templateElt = htmx.find(templateQuery);
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
                    
                    var settleInfo = hx.makeSettleInfo(target);
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

                    self.forEach(settleInfo.elts, function(settleElt) {
                        if (settleElt.classList) {
                            settleElt.classList.add(htmx.config.settlingClass);
                        }
                        hx.triggerEvent(settleElt, 'htmx:afterSwap');
                    });

                    var doSettle = function () {
                        self.forEach(settleInfo.tasks, function (task) {
                            task.call();
                        });
                        self.forEach(settleInfo.elts, function (settleElt) {
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

                        self.updateScrollState(settleInfo.elts, swapSpec);
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
                )
            } else {
                doSwap(this);
            }
        }

        return true;
    }
});