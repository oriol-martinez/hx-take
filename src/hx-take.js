(function() {
    var extName = 'take';
    var extAttr = 'hx-take';
    var extVersion = '0.3.0';

    function forEach(arr, func) {
        if (arr) {
            for (var i = 0; i < arr.length; i++) {
                res = func(arr[i]);
                if (res === false) return false;
            }
        }
    }

    function capitalize(str) {
        return str[0].toUpperCase() + str.slice(1);
    }

    function splitOnWhitespace(trigger) {
        return trigger.trim().split(/\s+/);
    }

    htmx.defineExtension(extName, {
        extAttr: extAttr,
        version: extVersion,
        config: {
            eventsPrefix: 'ext' + capitalize(extName),
            swappingClass: extAttr + '-swapping',
            defaultSwapMode: 'copy',
            defaultSwapTaken: 'innerHTML',
            defaultSwapTarget: 'innerHTML',
            swapStyleAliases: {
                move: '',
                replace: 'move:outer to:outer',
                copy: 'copy:inner to:inner',
                trade: 'exchange:inner to:inner',
                exchange: 'exchange:outer to:outer',
                append: 'copy:inner to:beforeend',
                prepend: 'copy:inner to:afterbegin',
            }
        },

        init: function(htmxInternalAPI) {
            this.internalAPI = htmxInternalAPI;
            htmx[extName] = this;
        },
    
        onEvent: function(name, event) {
            var elt = event.target;
    
            if (name == 'htmx:trigger' && this.internalAPI.getAttributeValue(elt, this.extAttr)) {
                this.customSwap(elt);
                return false;
            }
    
            return true;
        },

        updateScrollState: function(content, swapSpec) {
            var hx = this.internalAPI;
            var first = content[0];
            var last = content[content.length - 1];
            if (swapSpec.scroll) {
                var target = null;
                if (swapSpec.scrollTarget) {
                    target = hx.querySelectorExt(first, swapSpec.scrollTarget);
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
                    target = hx.querySelectorExt(first, targetStr);
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
        },

        isHtmxSwapStyle: function(swapStyle) {
            swapStyle = splitOnWhitespace(swapStyle)[0];

            return ([
                'innerHTML',
                'outerHTML',
                'beforebegin',
                'afterbegin',
                'beforeend',
                'afterend',
                'delete',
                'none',
            ].indexOf(swapStyle) !== -1);
        },

        getSwapStyleFromAlias: function(swapStyle) {
            swapStyle = splitOnWhitespace(swapStyle)[0];
            return (this.config.swapStyleAliases[swapStyle] || '');
        },

        getTakeInfo: function(elt) {
            var target = this.internalAPI.getTarget(elt);
            var sourceQuery = this.internalAPI.getClosestAttributeValue(elt, this.extAttr);
            var sourceElt = null;
            if (sourceQuery) var sourceElt = htmx.find(sourceQuery);

            return {
                elt: elt,
                target: target,
                source: sourceElt,
                swapSpec: this.getCustomSwapSpecification(elt),
            };
        },

        getCustomSwapSpecification: function(elt, swapInfoOverride) {
            // Modified getSwapSpecification method with new modifiers "mode:style" and "to:style"
            var hx = this.internalAPI;
            var swapInfo = swapInfoOverride ? swapInfoOverride : hx.getClosestAttributeValue(elt, 'hx-swap');
            var swapSpec = {
                'swapMode': null,
                'swapTaken': null,
                'swapStyle': hx.getInternalData(elt).boosted ? 'innerHTML' : htmx.config.defaultSwapStyle,
                'swapDelay': htmx.config.defaultSwapDelay,
                'settleDelay': htmx.config.defaultSettleDelay
            }
            if (hx.getInternalData(elt).boosted && !isAnchorLink(elt)) {
                swapSpec['show'] = 'top'
            }
            if (swapInfo) {
                var split = splitOnWhitespace(swapInfo);
                if (split.length > 0) {
                    // Check if it is an alias
                    if (split.length == 1 && this.getSwapStyleFromAlias(split[0])) {
                        return this.getCustomSwapSpecification(elt, this.getSwapStyleFromAlias(split[0]));
                    }

                    swapSpec['swapStyle'] = split[0];

                    for (var i = 0; i < split.length; i++) {
                        var modifier = split[i];

                        var self = this;
                        forEach(Object.keys(this.swapModes), function(swapMode) {
                            // Check for swap modes, if it matches set the swapSpec swapMode and swapTaken
                            if (modifier.indexOf(swapMode) === 0) {
                                if (modifier.indexOf(':') !== -1) {
                                    var swapModeSource = modifier.split(':');
                                    swapSpec['swapMode'] = swapModeSource[0];
                                    swapSpec['swapTaken'] = swapModeSource[1];
                                } else {
                                    swapSpec['swapMode'] = modifier;
                                    swapSpec['swapTaken'] = self.config.defaultSwapTaken;
                                }

                                swapSpec['swapTarget'] = self.config.defaultSwapTarget;

                                if (swapSpec['swapTaken'] == 'inner' || swapSpec['swapTaken'] == 'outer') {
                                    swapSpec['swapTaken'] += 'HTML';
                                }

                                return false;
                            }
                        });

                        if (modifier.indexOf('to:') === 0) {
                            swapSpec['swapTarget'] = modifier.substr(3);
                            
                            if (swapSpec['swapTarget'] == 'inner' || swapSpec['swapTarget'] == 'outer') {
                                swapSpec['swapTarget'] += 'HTML';
                            }
                        } else if (modifier.indexOf('swap:') === 0) {
                            swapSpec['swapDelay'] = htmx.parseInterval(modifier.substr(5));
                        } else if (modifier.indexOf('settle:') === 0) {
                            swapSpec['settleDelay'] = htmx.parseInterval(modifier.substr(7));
                        } else if (modifier.indexOf('transition:') === 0) {
                            swapSpec['transition'] = modifier.substr(11) === 'true';
                        } else if (modifier.indexOf('scroll:') === 0) {
                            var scrollSpec = modifier.substr(7);
                            var splitSpec = scrollSpec.split(':');
                            var scrollVal = splitSpec.pop();
                            var selectorVal = splitSpec.length > 0 ? splitSpec.join(':') : null;
                            swapSpec['scroll'] = scrollVal;
                            swapSpec['scrollTarget'] = selectorVal;
                        } else if (modifier.indexOf('show:') === 0) {
                            var showSpec = modifier.substr(5);
                            var splitSpec = showSpec.split(':');
                            var showVal = splitSpec.pop();
                            var selectorVal = splitSpec.length > 0 ? splitSpec.join(':') : null;
                            swapSpec['show'] = showVal;
                            swapSpec['showTarget'] = selectorVal;
                        } else if (modifier.indexOf('focus-scroll:') === 0) {
                            var focusScrollVal = modifier.substr('focus-scroll:'.length);
                            swapSpec['focusScroll'] = focusScrollVal == 'true';
                        }
                    }
                }
            }

            if (!swapSpec['swapMode']) swapSpec['swapMode'] = this.config.defaultSwapMode;
            if (!swapSpec['swapTaken']) swapSpec['swapTaken'] = this.config.defaultSwapTaken;
            if (!swapSpec['swapTarget']) swapSpec['swapTarget'] = swapSpec['swapStyle'];

            swapSpec['swapStyle'] = extName;  // Force custom swap style to trigger the customSwap method
            return swapSpec;
        },

        isCustomSwapSpecValid: function(swapSpec) {
            if (swapSpec.swapMode && Object.keys(this.swapModes).indexOf(swapSpec.swapMode) == -1) {
                return false;
            }

            if (swapSpec.swapTaken && ['innerHTML', 'outerHTML'].indexOf(swapSpec.swapTaken) == -1) {
                return false;
            }

            if (swapSpec.swapTarget && !this.isHtmxSwapStyle(swapSpec.swapTarget)) {
                return false;
            }

            return true;
        },

        customSwap: function(elt, overrideSwapSpec) {
            // Cleanup of the htmx swap flow without Ajax requests, and some additions. Here we go...
            var hx = this.internalAPI;
            var take = this.getTakeInfo(elt);
            if (take.target && take.source) {
                var target = take.target;
                var source = take.source;
            } else {
                return; 
            }

            if (!overrideSwapSpec) {
                var swapSpec = take.swapSpec;
            } else {
                var swapSpec = overrideSwapSpec;
            }

            htmx.addClass(target, htmx.config.swappingClass);
            this.addCustomSwapClasses(target, 'target', swapSpec.swapStyle);

            if (swapSpec.swapTaken == 'outerHTML') {
                var sourceStr = source.outerHTML;
            } else {
                var sourceStr = source.innerHTML;
            }

            if (!hx.triggerEvent(target, 'htmx:beforeSwap')) return;
            htmx.addClass(source, htmx.config.swappingClass);
            this.addCustomSwapClasses(source, 'source', swapSpec.swapStyle);

            // optional transition API promise callbacks
            var settleResolve = null;
            var settleReject = null;

            var self = this;
            var doSwap = function() {
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

                    // Yes, I know, but settleInfo is a convenient (and hacky) way to pass data through the swap flow.
                    var settleInfo = {tasks: [], elts: [target, source], source: source, elt: elt, swapSpec: swapSpec};
                    hx.selectAndSwap(swapSpec.swapStyle, target, elt, sourceStr, settleInfo);

                    if (selectionInfo.elt &&
                        !hx.bodyContains(selectionInfo.elt) &&
                        selectionInfo.elt.getAttribute('id')) {
                        var newActiveElt = document.getElementById(
                            selectionInfo.elt.getAttribute('id')
                        );
                        var focusOptions = { preventScroll: swapSpec.focusScroll !== undefined ? !swapSpec.focusScroll : !htmx.config.defaultFocusScroll };
                        if (newActiveElt) {
                            if (selectionInfo.start && newActiveElt.setSelectionRange) {
                                try {
                                    newActiveElt.setSelectionRange(selectionInfo.start, selectionInfo.end);
                                } catch (e) {
                                    // the setSelectionRange method is present on fields that don't support it, so just let this fail
                                }
                            }
                            newActiveElt.focus(focusOptions);
                        }
                    }
    
                    if (target) {
                        htmx.removeClass(target, htmx.config.swappingClass);
                        self.removeCustomSwapClasses(target, 'target', swapSpec.swapStyle);
                    }

                    if (source) {
                        htmx.removeClass(source, htmx.config.swappingClass);
                        self.removeCustomSwapClasses(source, 'source', swapSpec.swapStyle);
                    }
    
                    forEach(settleInfo.elts, function(settleElt) {
                        if (!settleElt) return;

                        htmx.addClass(settleElt, htmx.config.settlingClass);
                        hx.triggerEvent(settleElt, 'htmx:afterSwap');
                    });
    
                    var doSettle = function() {
                        forEach(settleInfo.tasks, function(task) {
                            task.call();
                        });
                        forEach(settleInfo.elts, function(settleElt) {
                            if (!settleElt) return;

                            if (settleElt.classList) {
                                htmx.removeClass(settleElt, htmx.config.settlingClass);
                            }
                            hx.triggerEvent(settleElt, 'htmx:afterSettle');
                        });
    
                        if (settleInfo.title) {
                            var titleElt = htmx.find('title');
                            if (titleElt) {
                                titleElt.innerHTML = settleInfo.title;
                            } else {
                                window.document.title = settleInfo.title;
                            }
                        }
                        
                        self.updateScrollState(settleInfo.elts, swapSpec);
                        
                        if (hx.settleResolve) hx.settleResolve();
                    }
    
                    if (swapSpec.settleDelay > 0) {
                        setTimeout(doSettle, swapSpec.settleDelay);
                    } else {
                        doSettle();
                    }
                } catch (e) {
                    hx.triggerErrorEvent(elt, 'htmx:swapError', sourceStr);
                    if (hx.settleReject) hx.settleReject();
                    throw e;
                }
            };
    
            var shouldTransition = htmx.config.globalViewTransitions;
            if (swapSpec.hasOwnProperty('transition')) {
                shouldTransition = swapSpec.transition;
            }
    
            if (
                shouldTransition &&
                hx.triggerEvent(elt, 'htmx:beforeTransition', null) &&
                typeof Promise !== "undefined" && document.startViewTransition
            ) {
                var settlePromise = new Promise(function (_resolve, _reject) {
                    settleResolve = _resolve;
                    settleReject = _reject;
                });
                // wrap the original doSwap() in a call to startViewTransition()
                var innerDoSwap = doSwap;
                doSwap = function() {
                    document.startViewTransition(function() {
                        innerDoSwap();
                        return settlePromise;
                    });
                }
            }
    
            if (swapSpec.swapDelay > 0) {
                setTimeout(doSwap, swapSpec.swapDelay);
            } else {
                doSwap();
            }
        },

        handleSwap: function(swapStyle, target, fragment, settleInfo) {
            if (this.isHtmxSwapStyle(swapStyle)) return false;
            if (!this.isCustomSwapSpecValid(settleInfo.swapSpec)) return true;

            var source = settleInfo.source;
            var swapSpec = settleInfo.swapSpec;
            var customSwapSpec = JSON.parse(JSON.stringify(swapSpec));  // Hmmm *frowns*

            customSwapSpec.swapDelay = 0;
            customSwapSpec.swapStyle = swapSpec.swapTarget;

            this.triggerSwapBeforeEvents(source, swapSpec.swapTaken);
            this.triggerSwapBeforeEvents(target, swapSpec.swapTarget);

            performSwap = this.swapModes[swapSpec.swapMode].before(source, target, customSwapSpec);

            if (performSwap) {
                this.customSwap(settleInfo.elt, customSwapSpec);
            }

            this.swapModes[swapSpec.swapMode].after(source, target, customSwapSpec);

            this.triggerSwapAfterEvents(target, swapSpec.swapTarget);
            this.triggerSwapAfterEvents(source, swapSpec.swapTaken);

            return true;
        },

        swapModes: {
            copy: {
                before: function(source, target, customSwapSpec) {
                    return true;
                },
                after: function(source, target, customSwapSpec) {
                    if (target.content) {
                        if (customSwapSpec.swapTarget == 'innerHTML') {
                            target.content.replaceChildren();
                        }

                        if (customSwapSpec.swapTaken == 'outerHTML') {
                            var sourceChild = [source];
                        } else {
                            var sourceChild = source.content ? source.content.childNodes : source.childNodes;
                        }

                        forEach(sourceChild, function(child) {
                            if (customSwapSpec.swapTarget == 'afterbegin') {
                                target.content.prepend(child.cloneNode(true));
                            } else {
                                target.content.append(child.cloneNode(true));
                            }
                        });
                    }
                }
            },
            exchange: {
                before: function(source, target, customSwapSpec) {
                    if (customSwapSpec.swapTaken == 'outerHTML' && customSwapSpec.swapTarget == 'outerHTML') {
                        var sourceClone = source.cloneNode(true);
                        var targetClone = target.cloneNode(true);
                        source.parentElement.replaceChild(targetClone, source);
                        target.parentElement.replaceChild(sourceClone, target);

                        return false;
                    }

                    var sourceNodes = [];
                    if (customSwapSpec.swapTaken == 'innerHTML') {
                        forEach(source.content ? source.content.childNodes : source.childNodes, function(child) {
                            sourceNodes.push(child.cloneNode(true));
                        });
                    } else {
                        var sourceNodes = [source.cloneNode(true)];
                    }

                    var targetNodes = [];
                    if (customSwapSpec.swapTarget == 'innerHTML') {
                        forEach(target.content ? target.content.childNodes : target.childNodes, function(child) {
                            targetNodes.push(child.cloneNode(true));
                        });
                    } else {
                        var targetNodes = [target.cloneNode(true)];
                    }

                    source.content ? source.content.replaceChildren() : source.replaceChildren();
                    target.content ? target.content.replaceChildren() : target.replaceChildren();

                    forEach(sourceNodes, function(child) {
                        target.content ? target.content.append(child) : target.append(child);
                    });

                    forEach(targetNodes, function(child) {
                        source.content ? source.content.append(child) : source.append(child);
                    });

                    return false;
                },
                after: function(source, target, customSwapSpec) {
                    // *crickets*
                }
            },
            move: {
                before: function(source, target, customSwapSpec) {
                    return true;
                },
                after: function(source, target, customSwapSpec) {
                    if (target.content) {
                        if (customSwapSpec.swapTarget == 'innerHTML') target.content.replaceChildren();
                        var sourceNodes = source.content ? source.content.childNodes : source.childNodes;

                        forEach(sourceNodes, function(child) {
                            if (customSwapSpec.swapTarget == 'afterbegin') {
                                target.content.prepend(child.cloneNode(true));
                            } else {
                                target.content.append(child.cloneNode(true));
                            }
                        });
                    }

                    if (customSwapSpec.swapTaken == 'outerHTML') {
                        source.remove();
                    } else {
                        source.content ? source.content.replaceChildren() : source.replaceChildren();
                    }
                }
            },
        },

        addCustomSwapClasses: function(elt, role, swapStyle) {
            htmx.addClass(elt, this.config.swappingClass);
            htmx.addClass(elt, this.config.swappingClass + '-' + role);
            if (swapStyle != extName) htmx.addClass(elt, this.config.swappingClass + '-' + swapStyle);
        },

        removeCustomSwapClasses: function(elt, role, swapStyle) {
            htmx.removeClass(elt, this.config.swappingClass);
            htmx.removeClass(elt, this.config.swappingClass + '-' + role);
            htmx.removeClass(elt, this.config.swappingClass + '-' + swapStyle);
        },
    
        triggerSwapBeforeEvents: function(elt, swapStyle) {
            if (!elt) return;
            this.internalAPI.triggerEvent(elt, this.config.eventsPrefix + 'Before');
            if (swapStyle != extName) this.internalAPI.triggerEvent(elt, this.config.eventsPrefix + 'Before' + capitalize(swapStyle));
        },
    
        triggerSwapAfterEvents: function(elt, swapStyle) {
            if (!elt) return;
            this.internalAPI.triggerEvent(elt, this.config.eventsPrefix + 'After');
            if (swapStyle != extName) this.internalAPI.triggerEvent(elt, this.config.eventsPrefix + 'After' + capitalize(swapStyle));
            htmx.process(elt);
        },
    });

    htmx.onLoad(function() {
        // Get all the elements with the extension attribute that don't have an hx-trigger and set it to click as default
        // As we're seting the hx-trigger attribute directly (as a not crazy at all person would) htmx will handle it.
        elts = htmx.findAll(
            '[hx-ext="' + extName + '"] [' + extAttr + ']:not([hx-trigger]), ' +
            '[hx-ext="' + extName + '"][' + extAttr + ']:not([hx-trigger]),' +
            '[data-hx-ext="' + extName + '"] [data-' + extAttr + ']:not([data-hx-trigger]), ' +
            '[data-hx-ext="' + extName + '"][data-' + extAttr + ']:not([data-hx-trigger])'
        );
        forEach(elts, function(elt) {
            elt.setAttribute('hx-trigger', 'click');
            htmx.process(elt);
        });
    });
})();