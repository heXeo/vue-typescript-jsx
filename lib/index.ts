/* eslint-disable no-underscore-dangle */
import {merge} from 'lodash'

const isTopLevelKey = [
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

const isNestableKey = /^(domProps|on|nativeOn|hook)([\-_A-Z])/
const isDirectiveKey = /^v-/
const isXlinkKey = /^xlink([A-Z])/

function classifyKeys(keys: string[]) {
  return keys.reduce(
    (acc, key) => {
      if (isTopLevelKey.indexOf(key) !== -1) {
        acc.top.push(key)
      } else if (key.match(isNestableKey) !== null) {
        acc.nestable.push(key)
      } else if (key.match(isDirectiveKey) !== null) {
        acc.directive.push(key)
      } else if (key.match(isXlinkKey) !== null) {
        acc.xlink.push(key)
      } else {
        acc.attribute.push(key)
      }

      return acc
    },
    {top: [], nestable: [], directive: [], xlink: [], attribute: []}
  )
}

function getTopLevel(props: any, keys: string[]) {
  return keys.reduce((acc: any, key) => {
    acc[key] = props[key]
    return acc
  }, {})
}

function getNestableTopLevelKeyAndKey(key: string) {
  const matches = key.match(isNestableKey)

  const prefix = matches[1]
  let suffix = key.replace(isNestableKey, (_, _$1, $2) => {
    return $2 === '-' ? '' : $2.toLowerCase()
  })

  if (prefix === 'on') {
    // TODO: with .endsWith
    const passiveMatches = suffix.match(/^(.+)-passive/)
    if (passiveMatches) {
      suffix = `&${passiveMatches[1]}`
    }
  }

  return {topLevelKey: prefix, key: suffix}
}

function getNestable(props: any, keys: string[]) {
  return keys.reduce((acc: any, key) => {
    const keys = getNestableTopLevelKeyAndKey(key)

    if (keys === null) {
      return acc
    }

    acc[keys.topLevelKey] = acc[keys.topLevelKey] || {}
    acc[keys.topLevelKey][keys.key] = props[key]

    return acc
  }, {})
}

function getDirectives(props: any, keys: string[]) {
  const directives = keys.reduce((acc: any, key) => {
    const name = key.replace(isDirectiveKey, '')
    acc.push({
      name: name,
      value: props[key],
    })
    return acc
  }, [])

  return {directives: directives}
}

function getXLinks(props: any, keys: string[]) {
  const xlinks = keys.reduce((acc: any, key) => {
    const xlinkKey = key.replace(isXlinkKey, (_m, p1) => {
      return `xlink:${p1.toLowerCase()}`
    })
    acc[xlinkKey] = props[key]
    return acc
  }, {})

  return {attrs: xlinks}
}

function getAttributes(props: any, keys: string[]) {
  const attributes = keys.reduce((acc: any, key) => {
    acc[key] = props[key]
    return acc
  }, {})

  return {attrs: attributes}
}

const acceptValue = ['input', 'textarea', 'option', 'select']
function mustUseDomProps(tag: string, type: string, attr: string) {
  return (
    (attr === 'value' && acceptValue.includes(tag) && type !== 'button') ||
    (attr === 'selected' && tag === 'option') ||
    (attr === 'checked' && tag === 'input') ||
    (attr === 'muted' && tag === 'video')
  )
}

function getVNodeData(tag: string, data: any) {
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

  let keys = Object.keys(props)
  const classifiedKeys = classifyKeys(keys)

  const topLevel = getTopLevel(props, classifiedKeys.top)
  const nestable = getNestable(props, classifiedKeys.nestable)
  const directives = getDirectives(props, classifiedKeys.directive)
  const xlinks = getXLinks(props, classifiedKeys.xlink)
  const attributes = getAttributes(props, classifiedKeys.attribute)

  return merge({}, topLevel, nestable, directives, xlinks, attributes)
}

function createElement(
  $createElement: any,
  tag: string,
  data: any,
  children: any[]
) {
  if (!data) {
    return $createElement(tag, data, children)
  }

  const options = getVNodeData(tag, data)
  return $createElement(tag, options, children)
}

export function install(Vue: any) {
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
