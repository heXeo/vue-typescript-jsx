"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-underscore-dangle */
var merge = require('lodash.merge');
var isTopLevelKey = [
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
var isNestableKey = /^(domProps|on|nativeOn|hook)([\-_A-Z])/;
var isDirectiveKey = /^v-/;
var isXlinkKey = /^xlink([A-Z])/;
function classifyKeys(keys) {
    return keys.reduce(function (acc, key) {
        if (isTopLevelKey.indexOf(key) !== -1) {
            acc.top.push(key);
        }
        else if (key.match(isNestableKey) !== null) {
            acc.nestable.push(key);
        }
        else if (key.match(isDirectiveKey) !== null) {
            acc.directive.push(key);
        }
        else if (key.match(isXlinkKey) !== null) {
            acc.xlink.push(key);
        }
        else {
            acc.attribute.push(key);
        }
        return acc;
    }, { top: [], nestable: [], directive: [], xlink: [], attribute: [] });
}
function getTopLevel(props, keys) {
    return keys.reduce(function (acc, key) {
        acc[key] = props[key];
        return acc;
    }, {});
}
function getNestableTopLevelKeyAndKey(key) {
    var matches = key.match(isNestableKey);
    var prefix = matches[1];
    var suffix = key.replace(isNestableKey, function (_, _$1, $2) {
        return $2 === '-' ? '' : $2.toLowerCase();
    });
    if (prefix === 'on') {
        // TODO: with .endsWith
        var passiveMatches = suffix.match(/^(.+)-passive/);
        if (passiveMatches) {
            suffix = "&" + passiveMatches[1];
        }
    }
    return { topLevelKey: prefix, key: suffix };
}
function getNestable(props, keys) {
    return keys.reduce(function (acc, key) {
        var keys = getNestableTopLevelKeyAndKey(key);
        if (keys === null) {
            return acc;
        }
        acc[keys.topLevelKey] = acc[keys.topLevelKey] || {};
        acc[keys.topLevelKey][keys.key] = props[key];
        return acc;
    }, {});
}
function getDirectives(props, keys) {
    var directives = keys.reduce(function (acc, key) {
        var name = key.replace(isDirectiveKey, '');
        acc.push({
            name: name,
            value: props[key],
        });
        return acc;
    }, []);
    return { directives: directives };
}
function getXLinks(props, keys) {
    var xlinks = keys.reduce(function (acc, key) {
        var xlinkKey = key.replace(isXlinkKey, function (_m, p1) {
            return "xlink:" + p1.toLowerCase();
        });
        acc[xlinkKey] = props[key];
        return acc;
    }, {});
    return { attrs: xlinks };
}
function getAttributes(props, keys) {
    var attributes = keys.reduce(function (acc, key) {
        acc[key] = props[key];
        return acc;
    }, {});
    return { attrs: attributes };
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
    var keys = Object.keys(props);
    var classifiedKeys = classifyKeys(keys);
    var topLevel = getTopLevel(props, classifiedKeys.top);
    var nestable = getNestable(props, classifiedKeys.nestable);
    var directives = getDirectives(props, classifiedKeys.directive);
    var xlinks = getXLinks(props, classifiedKeys.xlink);
    var attributes = getAttributes(props, classifiedKeys.attribute);
    return merge({}, topLevel, nestable, directives, xlinks, attributes);
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