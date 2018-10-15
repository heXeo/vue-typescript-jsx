/* eslint-disable no-underscore-dangle */
const TOPLEVEL_KEYS = [
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
]

const NESTABLE_PREFIXES = ['domProps', 'on', 'nativeOn', 'hook']
const DIRECTIVE_PREFIX = 'v-'
const XLINK_PREFIX = 'xlink'
const PASSIVE_SUFFIX = '-passive'

function startsWith(haystack: string, needle: string): boolean {
  return haystack.slice(0, needle.length) === needle
}

function endsWith(haystack: string, needle: string): boolean {
  return haystack.slice(-needle.length) === needle
}

function isTop(key: string): boolean {
  return TOPLEVEL_KEYS.includes(key)
}

function isNestable(key: string): string | null {
  return (
    NESTABLE_PREFIXES.find((prefix) => {
      return startsWith(key, prefix)
    }) || null
  )
}

function isDirective(key: string): boolean {
  return startsWith(key, DIRECTIVE_PREFIX)
}

function isXLink(key: string): boolean {
  return startsWith(key, XLINK_PREFIX)
}

function classifyKeys(props: any): any {
  return Object.keys(props).reduce(
    (acc, key) => {
      if (isTop(key)) {
        acc.top.push(key)
      } else if (isNestable(key)) {
        acc.nestable.push(key)
      } else if (isDirective(key)) {
        acc.directive.push(key)
      } else if (isXLink(key)) {
        acc.xlink.push(key)
      } else {
        acc.attribute.push(key)
      }
      return acc
    },
    {top: [], nestable: [], directive: [], xlink: [], attribute: []}
  )
}

function processTopLevel(props: any, keys: string[], output: any = {}): any {
  return keys.reduce((acc: any, key) => {
    acc[key] = props[key]
    return acc
  }, output)
}

function parseNestableKey(key: string): any {
  const prefix = isNestable(key)
  let suffix = key.slice(prefix.length)
  const firstChar = suffix.charAt(0).toLowerCase()
  const rest = suffix.slice(1)
  suffix = firstChar === '-' ? rest : `${firstChar}${rest}`

  if (prefix === 'on' && endsWith(suffix, PASSIVE_SUFFIX)) {
    suffix = `&${suffix.slice(0, PASSIVE_SUFFIX.length)}`
  }

  return {topKey: prefix, key: suffix}
}

function processNestable(props: any, keys: string[], output: any = {}): any {
  return keys.reduce((acc: any, rawKey) => {
    const {topKey, key} = parseNestableKey(rawKey)
    acc[topKey] = acc[topKey] || {}
    acc[topKey][key] = props[rawKey]
    return acc
  }, output)
}

function processDirectives(props: any, keys: string[], output: any = {}): any {
  return keys.reduce((acc: any, key) => {
    const name = key.slice(DIRECTIVE_PREFIX.length)
    output.directives = output.directives || []
    output.directives.push({
      name: name,
      value: props[key],
    })
    return acc
  }, output)
}

function processXLinks(props: any, keys: string[], output: any = {}): any {
  return keys.reduce((acc: any, key) => {
    const attr = key.slice(XLINK_PREFIX.length).toLowerCase()
    const xlink = `xlink:${attr}`
    acc.attrs = acc.attrs || {}
    acc.attrs[xlink] = props[key]
    return acc
  }, output)
}

function processAttributes(props: any, keys: string[], output: any = {}): any {
  return keys.reduce((acc: any, key) => {
    acc.attrs = acc.attrs || {}
    acc.attrs[key] = props[key]
    return acc
  }, output)
}

const acceptValue = ['input', 'textarea', 'option', 'select']
function mustUseDomProps(tag: string, type: string, attr: string): boolean {
  return (
    (attr === 'value' && acceptValue.includes(tag) && type !== 'button') ||
    (attr === 'selected' && tag === 'option') ||
    (attr === 'checked' && tag === 'input') ||
    (attr === 'muted' && tag === 'video')
  )
}

function getVNodeData(tag: string, data: any): any {
  const props = Object.keys(data).reduce((acc: any, key) => {
    const value = data[key]
    const type = data['type']
    if (mustUseDomProps(tag, type, key)) {
      acc[`domProps-${key}`] = value
    } else {
      acc[key] = value
    }
    return acc
  }, {})

  const keys = classifyKeys(props)

  let output = processTopLevel(props, keys.top)
  output = processNestable(props, keys.nestable, output)
  output = processDirectives(props, keys.directive, output)
  output = processXLinks(props, keys.xlink, output)
  output = processAttributes(props, keys.attribute, output)

  return output
}

function createElement(
  $createElement: any,
  tag: string,
  data: any,
  children: any[]
): any {
  if (!data) {
    return $createElement(tag, data, children)
  }

  const options = getVNodeData(tag, data)
  return $createElement(tag, options, children)
}

export function install(Vue: any): void {
  const _render = Vue.prototype._render
  Vue.prototype._render = function() {
    if (!this._tsx) {
      this._tsx = true

      const $createElement = this.$createElement
      this.$createElement = (tag: string, data: any, ...children: any[]) => {
        return createElement(
          $createElement,
          tag,
          data,
          children.length ? children : undefined
        )
      }
    }

    return _render.call(this)
  }
}

export default {
  install,
}
