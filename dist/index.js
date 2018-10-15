"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-underscore-dangle */
var TOPLEVEL_KEYS = [
    // vue
    'attrs',
    'class',
    'directives',
    'domProps',
    'hook',
    'keepAlive',
    'key',
    'nativeOn',
    'on',
    'props',
    'ref',
    'refInFor',
    'scopedSlot',
    'show',
    'slot',
    'staticClass',
    'staticStyle',
    'style',
    'transition',
    // vue-router
    'registerRouteInstance',
    'routerView',
    'routerViewDepth',
];
var NESTABLE_PREFIXES = ['domProps', 'on', 'nativeOn', 'hook'];
var DIRECTIVE_PREFIX = 'v-';
var XLINK_PREFIX = 'xlink';
var PASSIVE_SUFFIX = '-passive';
function startsWith(haystack, needle) {
    return haystack.slice(0, needle.length) === needle;
}
function endsWith(haystack, needle) {
    return haystack.slice(-needle.length) === needle;
}
function isTop(key) {
    return TOPLEVEL_KEYS.includes(key);
}
function isNestable(key) {
    return (NESTABLE_PREFIXES.find(function (prefix) {
        return startsWith(key, prefix);
    }) || null);
}
function isDirective(key) {
    return startsWith(key, DIRECTIVE_PREFIX);
}
function isXLink(key) {
    return startsWith(key, XLINK_PREFIX);
}
function classifyKeys(props) {
    return Object.keys(props).reduce(function (acc, key) {
        if (isTop(key)) {
            acc.top.push(key);
        }
        else if (isNestable(key)) {
            acc.nestable.push(key);
        }
        else if (isDirective(key)) {
            acc.directive.push(key);
        }
        else if (isXLink(key)) {
            acc.xlink.push(key);
        }
        else {
            acc.attribute.push(key);
        }
        return acc;
    }, { top: [], nestable: [], directive: [], xlink: [], attribute: [] });
}
function processTopLevel(props, keys, output) {
    if (output === void 0) { output = {}; }
    return keys.reduce(function (acc, key) {
        acc[key] = props[key];
        return acc;
    }, output);
}
function parseNestableKey(key) {
    var prefix = isNestable(key);
    var suffix = key.slice(prefix.length);
    var firstChar = suffix.charAt(0).toLowerCase();
    var rest = suffix.slice(1);
    suffix = firstChar === '-' ? rest : "" + firstChar + rest;
    if (prefix === 'on' && endsWith(suffix, PASSIVE_SUFFIX)) {
        suffix = "&" + suffix.slice(0, PASSIVE_SUFFIX.length);
    }
    return { topKey: prefix, key: suffix };
}
function processNestable(props, keys, output) {
    if (output === void 0) { output = {}; }
    return keys.reduce(function (acc, rawKey) {
        var _a = parseNestableKey(rawKey), topKey = _a.topKey, key = _a.key;
        acc[topKey] = acc[topKey] || {};
        acc[topKey][key] = props[rawKey];
        return acc;
    }, output);
}
function processDirectives(props, keys, output) {
    if (output === void 0) { output = {}; }
    return keys.reduce(function (acc, key) {
        var name = key.slice(DIRECTIVE_PREFIX.length);
        output.directives = output.directives || [];
        output.directives.push({
            name: name,
            value: props[key],
        });
        return acc;
    }, output);
}
function processXLinks(props, keys, output) {
    if (output === void 0) { output = {}; }
    return keys.reduce(function (acc, key) {
        var attr = key.slice(XLINK_PREFIX.length).toLowerCase();
        var xlink = "xlink:" + attr;
        acc.attrs = acc.attrs || {};
        acc.attrs[xlink] = props[key];
        return acc;
    }, output);
}
function processAttributes(props, keys, output) {
    if (output === void 0) { output = {}; }
    return keys.reduce(function (acc, key) {
        acc.attrs = acc.attrs || {};
        acc.attrs[key] = props[key];
        return acc;
    }, output);
}
var acceptValue = ['input', 'textarea', 'option', 'select'];
function mustUseDomProps(tag, type, attr) {
    return ((attr === 'value' && acceptValue.includes(tag) && type !== 'button') ||
        (attr === 'selected' && tag === 'option') ||
        (attr === 'checked' && tag === 'input') ||
        (attr === 'muted' && tag === 'video'));
}
function getVNodeData(tag, data) {
    var props = Object.keys(data).reduce(function (acc, key) {
        var value = data[key];
        var type = data['type'];
        if (mustUseDomProps(tag, type, key)) {
            acc["domProps-" + key] = value;
        }
        else {
            acc[key] = value;
        }
        return acc;
    }, {});
    var keys = classifyKeys(props);
    var output = processTopLevel(props, keys.top);
    output = processNestable(props, keys.nestable, output);
    output = processDirectives(props, keys.directive, output);
    output = processXLinks(props, keys.xlink, output);
    output = processAttributes(props, keys.attribute, output);
    return output;
}
function createElement($createElement, tag, data, children) {
    if (!data) {
        return $createElement(tag, data, children);
    }
    var options = getVNodeData(tag, data);
    return $createElement(tag, options, children);
}
function install(Vue) {
    var _render = Vue.prototype._render;
    Vue.prototype._render = function () {
        if (!this._tsx) {
            this._tsx = true;
            var $createElement_1 = this.$createElement;
            this.$createElement = function (tag, data) {
                var children = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    children[_i - 2] = arguments[_i];
                }
                return createElement($createElement_1, tag, data, children.length ? children : undefined);
            };
        }
        return _render.call(this);
    };
}
exports.install = install;
exports.default = {
    install: install,
};
//# sourceMappingURL=index.js.map