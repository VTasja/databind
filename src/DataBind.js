/**
 * DEVELOPED BY
 * NADAV GREENBERG (grnadav)
 * grnadav@gmail.com
 *
 * WORKS WITH:
 * IE 9+, FF 4+, SF 5+, WebKit, CH 7+, OP 12+
 *
 * FORK:
 * https://github.com/grnadav/databind.git
 */

"use strict";
(function (factory) {

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals
        window.DataBind = factory();
    }

})(function () {

    var listenersHash = {};

    /**
     * Key property to look for on the elements for a key to bind to
     * @type {string}
     */
    var KEY_PROP = 'data-key';

    /**
     * Test if element is a jQuery element
     * @private
     * @param el - element to test
     * @return {boolean} jquery element or not
     */
    function isJQueryEl(el) {
        return (el && window.jQuery && el instanceof window.jQuery);
    }

    /**
     * Get a simple DomElement from a possibly jQuery wrapped element
     * @private
     * @param el - DomElement\jQueryDomElement to get the simple one from
     * @returns DomElement simple
     */
    function getBareDomElement(el) {
        if (isJQueryEl(el)) return el[0];
        return el;
    }

    /**
     * Debug util that prints info of given element to console
     * @private
     * @param ev - DomElement to print info for
     */
    function changeHandler(ev) {
        console.log('#' + this.id + ' ev:' + ev.type + ' new val:' + value(this));
    }

    /**
     * Get\Set value for an element
     * @private
     * @param el - DomElement to get\set value of
     * @param newVal - Optional - new value to set on the el.
     * @returns (new) value of the element
     */
    function value(el, newVal) {
        if (!el) return undefined;
        var isSetter = (newVal !== undefined);
        if (['checkbox', 'radio'].indexOf(el.type) >= 0) {
            if (isSetter) {
                el.checked = !!newVal;
            }
            return el.checked;
        }
        if (['text', 'textarea', 'select-one'].indexOf(el.type) >= 0) {
            if (isSetter) {
                el.value = newVal;
            }
            return el.value;
        }

        if (['select-multiple'].indexOf(el.type) >= 0) {
            if (isSetter) {
                if (!isArray(newVal)) {
                    newVal = [newVal];
                }
            }
            var result = [];
            var options = el && el.options;
            var opt;

            for (var i = 0, iLen = options.length; i < iLen; i++) {
                opt = options[i];

                if (isSetter) {
                    if (newVal.indexOf(opt.value) > -1) {
                        opt.selected = true;
                    } else {
                        opt.selected = false;
                    }
                }

                if (opt.selected) {
                    result.push(opt.value || opt.text);
                }
            }
            return result;
        }

        // else assume non-input element
        if (isSetter) {
            el.innerText = newVal;
        }
        return el.innerText;
    }

    /**
     * General purpose util that tells if a given input is an Array
     * @private
     * @param val - value to examine
     * @returns {boolean} array or not
     */
    function isArray(val) {
        return ( Object.prototype.toString.call(val) === '[object Array]' );
    }

    /**
     * Get the event name that the element fires then it changes value
     * @private
     * @param el DomElement to get event name for
     * @returns {string} - event name
     */
    function getEventNameForEl(el) {
        if (['checkbox', 'radio', 'select-one', 'select-multiple'].indexOf(el.type) >= 0) {
            return 'change';
        }
        if (['text', 'textarea'].indexOf(el.type) >= 0) {
            return 'input';
        }
    }

    /**
     * Get a unique hash key for an Object or fetch previously given one to it
     * @private
     * @param el - DomElement to give hashkey to
     * @returns String - hash key of this element
     */
    function getOrGenElHashkey(el) {
        if (!el.hashkey) {
            el.hashkey = Date.now() + Math.floor(Math.random() * 100000);
        }

        return el.hashkey;
    }

    /**
     * Listen to value changes on given element and invoke given function
     * @private
     * @param el - DomElement to listen to
     * @param fn - Function to invoke if value changes on the el
     */
    function listen(el, fn) {
        if (!el || !fn) return;

        var hashkey = getOrGenElHashkey(el);
        // save the listener in listeners has for later removal
        listenersHash[hashkey] = listenersHash[hashkey] || [];
        // prevent double listening on same fn on same obj
        if (listenersHash[hashkey].indexOf(fn) > -1) return;
        // we're safe to add this handler
        listenersHash[hashkey].push(fn);

        var evName = getEventNameForEl(el);
        el.addEventListener(evName, fn, false);
    }

    /**
     * Unlisten to dom changes of a given function, previously listened to
     * @private
     * @param el - DomElement to unlisten
     * @param fn - Function to unlisten to
     */
    function unlistenOne(el, fn) {
        // check if this fn was ever listened to
        var hashkey = getOrGenElHashkey(el);
        var idx = listenersHash[hashkey].indexOf(fn);
        if (!listenersHash[hashkey] || idx === -1) return;
        // remove fn from the hash
        listenersHash[hashkey].splice(idx, 1);

        var evName = getEventNameForEl(el);
        el.removeEventListener(evName, fn, false);
    }

    /**
     * Unlisten to DOM changes
     * @private
     * @param el - DomElement to unbind from dom
     */
    function unlisten(el) {
        var hashkey = getOrGenElHashkey(el);
        var listeners = listenersHash[hashkey];
        if (!el || !listeners) return;
        var listenersClone = listeners.concat();
        var i, len = listenersClone.length;
        for (i = 0; i < len; i++) {
            unlistenOne(el, listenersClone[i]);
        }
    }

    /**
     * Check if a key exists in the model object
     * @private
     * @param model - Obejct - data model to test
     * @param key - key to test, can be deep key (e.g. a.b.c)
     * @returns {boolean} - exists or not
     */
    function keyExists(model, key) {
        var splitKey = key.split('.');
        var modelDepth = model;
        var i;

        for (i = 0; i < splitKey.length; i++) {
            if (!modelDepth.hasOwnProperty(splitKey[i])) return false;
            modelDepth = modelDepth[ splitKey[i] ];
        }
        return true;
    }

    /**
     * Get the value of a deep key from a model
     * @private
     * @param model - Obejct - Data model
     * @param key - String - key to fetch. can be deep key (e.g. a.b.c)
     * @returns The value of the given key on the model
     */
    function getModelDeepKey(model, key) {
        var splitKey = key.split('.');
        var modelDepth = model;
        var i;

        for (i = 0; i < splitKey.length - 1; i++) {
            modelDepth = modelDepth[ splitKey[i] ];
        }
        return modelDepth;
    }

    /**
     * Get\Set a value for a given key on the model
     * @private
     * @param model - Object data model
     * @param key - String - key on the model. can be deep key (e.g. a.b.c)
     * @param newVal - Optional Any - new value to set for the key
     * @returns The (new) value of the given key on the model
     */
    function modelValue(model, key, newVal) {
        var splitKey = key.split('.');
        var deepModel = getModelDeepKey(model, key);
        if (newVal !== undefined) {
            deepModel[splitKey[ splitKey.length - 1 ]] = newVal;
        }
        return deepModel[splitKey[ splitKey.length - 1 ]];
    }

    /**
     * Bind a Dom element so when it's value changes it will change the given model's key's value
     * @private
     * @param el - DomElement to bind (listen to changes on)
     * @param deepModel - Object data model to update when dom's value change
     * @param deepKey - String key on model to update
     */
    function bindDom(el, deepModel, deepKey) {
        // listen to elem changes -> on change set model with new value
        var fn = (function (el, deepModel, deepKey, modelValueFn, valueFn) {
            return function (ev) {
                var newVal = valueFn(this);
                modelValueFn(deepModel, deepKey, newVal);
            };
        })(el, deepModel, deepKey, modelValue, value);
        listen(el, fn);
        // listen again, just to print it out
        // TODO remove this debug calls
        listen(el, changeHandler);
    }

    /**
     * Unbind an element from dom binding, so it won't notify on value changes on the Dom element
     * Unbinds all previously attached functions
     * @private
     * @param el - DomElement to unbind
     */
    function unbindDom(el) {
        unlisten(el);
    }

    /**
     * Bind a model and key to an element, so when the model changes, the value of the key will too
     * @private
     * @param el - DomElement - elem to set the value when changes
     * @param deepModel - Object - Data model to bind to
     * @param deepKey - String - Key to bind to
     */
    function bindModel(el, deepModel, deepKey) {
        // watch model's key -> on change set el's new value
        var fn = (function (el, deepModel, deepKey, valueFn) {
            return function (key, setOrGet, newVal, oldVal) {
                valueFn(el, newVal);
            }
        })(el, deepModel, deepKey, value);
        WatchJS.watch(deepModel, deepKey, fn);
    }

    /**
     * Unbind all previous functions between the model and key
     * @private
     * @param deepModel - Object - Data model to unbind from
     * @param deepKey - String - Key to unbind
     */
    function unbindModel(deepModel, deepKey) {
        // TODO not use internal impl of watch.js - deepModel.watchers[deepKey]
        var watchers = deepModel.watchers[deepKey];
        var i;
        for (i = 0; i < watchers.length; i++) {
            WatchJS.unwatch(deepModel, deepKey, watchers[i]);
        }
    }

    /**
     * Get the key from the element
     * @private
     * @param el - DomElement to extract from
     * @returns {string} - key or null if not found
     */
    function getDatasetKey(el) {
        if (!el) return;
        return el.getAttribute(KEY_PROP);
    }

    /**
     * Bind and Unbind have common config objects, with same defaults, get those from cfg provided
     * @private
     * @param cfg - Object - base config provided
     * @returns {dom: Boolean, model: Object, children: Boolean}
     */
    function getBindUnbindConfigDefaults(cfg) {
        cfg = cfg || {};
        cfg = {
            dom: (cfg.dom !== undefined) ? cfg.dom : true,
            model: (cfg.model !== undefined) ? cfg.model : true,
            children: (cfg.children !== undefined) ? cfg.children : true
        };
        return cfg;
    }


    /**
     * Get common values need both to binding and unbinding
     * @private
     * @param el - DomElement being inspected
     * @param model - Object data model being inspected
     * @returns Object {
     *              key:        String  - key of elem. to bind to model
     *              deepKey:    String  - if key is deep (e.g. k.x.f) then return deepest part (f)
     *              deepModel:  Object  - return the deepest path of the object where deepKey is an attribute
     *              keyExists:  Boolean - Does elem. contain the key attribute
     *          }
     */
    function getCommonBindingProps(el, model) {
        if (!el || !model) return {};

        // extract model's key to watch from el's data-key
        var key = getDatasetKey(el);
        if (!key) return {};
        // make sure the key is defined in the model
        var isKeyExists = keyExists(model, key);
        var deepModel = getModelDeepKey(model, key);
        var deepKey = key.split('.');
        deepKey = deepKey[ deepKey.length - 1 ];

        return {
            key: key,
            deepKey: deepKey,
            deepModel: deepModel,
            keyExists: isKeyExists
        }
    }


    /**
     * Bind a single elem. to the model
     * @private
     * @param el - DomElement to bind
     * @param model - Model to bind to
     * @param cfg - Object {
     *                  dom:        Boolean - bind the DOM to the model, default true
     *                  model:      Boolean - bind the Model to the DOM, default true
     *              }
     */
    function bindSingleEl(el, model, cfg) {
        if (!el || !model) return;

        var props = getCommonBindingProps(el, model);
        if (!props.keyExists) return;

        // update elem from model
        var modelVal = modelValue(model, props.key);
        value(el, modelVal);

        if (cfg.dom) {
            bindDom(el, props.deepModel, props.deepKey);
        }

        if (cfg.model) {
            bindModel(el, props.deepModel, props.deepKey);
        }
    }

    /**
     * Unbind a single elem. from the model
     * @private
     * @param el - DomElement to unbind
     * @param model - Model to unbind from
     * @param cfg - Object {
     *                  dom:        Boolean - bind the DOM to the model, default true
     *                  model:      Boolean - bind the Model to the DOM, default true
     *              }
     */
    function unbindSingleEl(el, model, cfg) {
        if (!el || !model) return;

        var props = getCommonBindingProps(el, model);
        if (!props.keyExists) return;

        if (cfg.dom) {
            unbindDom(el);
        }

        if (cfg.model) {
            unbindModel(props.deepModel, props.deepKey);
        }
    }


    /**
     * Get list of elements that needs to be bound\unbound
     * @private
     * @param el - head elem.
     * @param cfg - Object {
     *                  children:   Boolean - Bind all children in el's tree, default true
     *              }
     * @returns {Array} - List of elems.
     */
    function getElsToBindUnbind(el, cfg) {
        var res = [el], children, i;
        // if cfg.children traverse el's tree and bind all children that have the key
        if (cfg.children) {
            children = el.getElementsByTagName('*');
            // doing concat like this: elsToBind = res.concat( el.getElementsByTagName('*') );
            // does not work. it concats an empty NodeList array item
            for (i = 0; i < children.length; i++) {
                res.push(children[i]);
            }
        }

        return res;
    }


    // **************************** PUBLIC METHODS **************************** //

    /**
     * Bind element(s) who declare data-key to the model's key
     * @public
     * @param el - DomElement to bind
     * @param model - Object data model
     * @param cfg - Object {
     *                  dom:        Boolean - bind the DOM to the model, default true
     *                  model:      Boolean - bind the Model to the DOM, default true
     *                  children:   Boolean - Bind all children in el's tree, default true
     *              }
     */
    function bind(el, model, cfg) {
        if (!el || !model) return;

        // safe jQuery stripping
        var simpleEl = getBareDomElement(el);
        if (simpleEl !== el) {
            arguments[0] = simpleEl;
            return bind.apply(this, arguments);
        }

        cfg = getBindUnbindConfigDefaults(cfg);

        var elsToBind = getElsToBindUnbind(el, cfg);
        var i;

        for (i = 0; i < elsToBind.length; i++) {
            bindSingleEl(elsToBind[i], model, {
                dom: cfg.dom,
                model: cfg.model
            });
        }
    }

    /**
     * UnBind element(s) who declare data-key to the model's key
     * @public
     * @param el - DomElement to unbind
     * @param model - Object data model
     * @param cfg - Object {
     *                  dom:        Boolean - unbind the DOM to the model, default true
     *                  model:      Boolean - unbind the Model to the DOM, default true
     *                  children:   Boolean - UnBind all children in el's tree, default true
     *              }
     */
    function unbind(el, model, cfg) {
        if (!el || !model) return;

        // safe jQuery stripping
        var simpleEl = getBareDomElement(el);
        if (simpleEl !== el) {
            arguments[0] = simpleEl;
            return unbind.apply(this, arguments);
        }

        cfg = getBindUnbindConfigDefaults(cfg);

        var elsToBind = getElsToBindUnbind(el, cfg);
        var i;

        for (i = 0; i < elsToBind.length; i++) {
            unbindSingleEl(elsToBind[i], model, {
                dom: cfg.dom,
                model: cfg.model
            });
        }
    }

    return {
        bind: bind,
        unbind: unbind
    };
});
