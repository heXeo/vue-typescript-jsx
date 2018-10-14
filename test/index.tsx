import {expect} from 'chai'
import Vue, {CreateElement} from 'vue'
import VueTSX from '../lib'

Vue.use(VueTSX)

// helpers

function render(render: any) {
  const v: any = new Vue({
    render,
  })
  return v._render() // eslint-disable-line no-underscore-dangle
}

function createComponentInstanceForVnode(vnode: any) {
  const opts = vnode.componentOptions
  return new opts.Ctor({
    _isComponent: true,
    parent: opts.parent,
    propsData: opts.propsData,
    _componentTag: opts.tag,
    _parentVnode: vnode,
    _parentListeners: opts.listeners,
    _renderChildren: opts.children,
  })
}

describe('vue-tsx', () => {
  it('should contain text', () => {
    const vnode = render((h: CreateElement) => <div>test</div>)
    expect(vnode.tag).to.equal('div')
    expect(vnode.children[0].text).to.equal('test')
  })

  it('should bind text', () => {
    const text = 'foo'
    const vnode = render((h: CreateElement) => <div>{text}</div>)
    expect(vnode.tag).to.equal('div')
    expect(vnode.children[0].text).to.equal('foo')
  })

  it('should extract attrs', () => {
    const vnode = render((h: CreateElement) => <div id="hi" dir="ltr" />)
    expect(vnode.data.attrs.id).to.equal('hi')
    expect(vnode.data.attrs.dir).to.equal('ltr')
  })

  it('should bind attr', () => {
    const id = 'foo'
    const vnode = render((h: CreateElement) => <div id={id} />)
    expect(vnode.data.attrs.id).to.equal('foo')
  })

  it('should omit children argument if possible', () => {
    const vnode = render((h: CreateElement) => <div />)
    const children = vnode.children
    expect(children).to.equal(undefined)
  })

  it('should handle top-level special attrs', () => {
    const vnode = render((h: CreateElement) => (
      <div class="foo" style="bar" key="key" ref="ref" refInFor slot="slot" />
    ))
    expect(vnode.data.class).to.equal('foo')
    expect(vnode.data.style).to.equal('bar')
    expect(vnode.data.key).to.equal('key')
    expect(vnode.data.ref).to.equal('ref')
    expect(vnode.data.refInFor).to.be.true
    expect(vnode.data.slot).to.equal('slot')
  })

  it('should handle nested properties', () => {
    const noop = (_: any) => _
    const vnode = render((h: CreateElement) => (
      <div
        on-click={noop}
        on-kebab-case={noop}
        domProps-innerHTML="<p>hi</p>"
        hook-insert={noop}
      />
    ))
    expect(vnode.data.on.click).to.equal(noop)
    expect(vnode.data.on['kebab-case']).to.equal(noop)
    expect(vnode.data.domProps.innerHTML).to.equal('<p>hi</p>')
    expect(vnode.data.hook.insert).to.equal(noop)
  })

  it('should handle nested properties (camelCase)', () => {
    const noop = (_: any) => _
    const vnode = render((h: CreateElement) => (
      <div
        onClick={noop}
        onCamelCase={noop}
        domPropsInnerHTML="<p>hi</p>"
        hookInsert={noop}
      />
    ))
    expect(vnode.data.on.click).to.equal(noop)
    expect(vnode.data.on.camelCase).to.equal(noop)
    expect(vnode.data.domProps.innerHTML).to.equal('<p>hi</p>')
    expect(vnode.data.hook.insert).to.equal(noop)
  })

  it('should support data attributes', () => {
    const vnode = render((h: CreateElement) => <div data-id="1" />)
    expect(vnode.data.attrs['data-id']).to.equal('1')
  })

  it('should handle identifier tag name as components', () => {
    const Test: any = {}
    const vnode = render((h: CreateElement) => <Test />)
    expect(vnode.tag).to.contain('vue-component')
  })

  it('should work for components with children', () => {
    const Test: any = {}
    const vnode = render((h: CreateElement) => (
      <Test>
        <div>hi</div>
      </Test>
    ))
    const children = vnode.componentOptions.children
    expect(children[0].tag).to.equal('div')
  })

  it('should bind things in thunk with correct this context', () => {
    const Test: any = {
      render(this: Vue, h: CreateElement) {
        return <div>{this.$slots.default}</div>
      },
    }
    const context = {test: 'foo'}
    const vnode = render(
        function(this: any, h: CreateElement) {
          return <Test>{this.test}</Test>
        }.bind(context)
    )
    const vm = createComponentInstanceForVnode(vnode)
    const childVnode = vm._render() // eslint-disable-line no-underscore-dangle
    expect(childVnode.tag).to.equal('div')
    expect(childVnode.children[0].text).to.equal('foo')
  })

  it('spread (single object expression)', () => {
    const props = {
      innerHTML: 2,
    }
    const vnode = render((h: CreateElement) => <div {...{props}} />)
    expect(vnode.data.props.innerHTML).to.equal(2)
  })

  // Skip this test since JSX has already been processed by typescript
  // If typescript is not doing it, there is nothing we can do about it
  it.skip('spread (mixed)', () => {
    const calls: any[] = []
    const data = {
      attrs: {
        id: 'hehe',
      },
      on: {
        click: function() {
          calls.push(1)
        },
      },
      props: {
        innerHTML: 2,
      },
      hook: {
        insert: function() {
          calls.push(3)
        },
      },
      class: ['a', 'b'],
    }
    const vnode = render((h: CreateElement) => (
      <div
        href="huhu"
        {...data}
        class={{c: true}}
        on-click={() => calls.push(2)}
        hook-insert={() => calls.push(4)}
      />
    ))

    expect(vnode.data.attrs.id).to.equal('hehe')
    expect(vnode.data.attrs.href).to.equal('huhu')
    expect(vnode.data.props.innerHTML).to.equal(2)
    expect(vnode.data.class).to.deep.equal(['a', 'b', {c: true}])
    // merge handlers properly for on
    vnode.data.on.click()
    expect(calls).to.deep.equal([1, 2])
    // merge hooks properly
    vnode.data.hook.insert()
    expect(calls).to.deep.equal([1, 2, 3, 4])
  })

  it('custom directives', () => {
    const vnode = render((h: CreateElement) => (
      <div v-test={123} v-other={234} />
    ))

    expect(vnode.data.directives.length).to.equal(2)
    expect(vnode.data.directives[0]).to.deep.equal({
      name: 'test',
      value: 123,
    })
    expect(vnode.data.directives[1]).to.deep.equal({
      name: 'other',
      value: 234,
    })
  })

  it('xlink:href', () => {
    const vnode = render((h: CreateElement) => <use xlinkHref={'#name'} />)

    expect(vnode.data.attrs['xlink:href']).to.equal('#name')
  })

  // Skip this test since JSX has already been processed by typescript
  // If typescript is not doing it, there is nothing we can do about it
  it.skip('merge class', () => {
    const vnode = render((h: CreateElement) => (
      <div class="a" {...{class: 'b'}} />
    ))

    expect(vnode.data.class).to.deep.equal({a: true, b: true})
  })

  // Skip this test since we have no way to differenciate
  // literal from jsx expression
  it.skip('should handle special attrs properties', () => {
    const vnode = render((h: CreateElement) => <input value="value" />)
    expect(vnode.data.attrs.value).to.equal('value')
  })

  it('should handle special attrs properties (button)', () => {
    const vnode = render((h: CreateElement) => (
      <input type="button" value="value" />
    ))
    expect(vnode.data.attrs.value).to.equal('value')
  })

  it('should handle special domProps properties', () => {
    const vnode = render((h: CreateElement) => (
      <input value={'some jsx expression'} />
    ))
    expect(vnode.data.domProps.value).to.equal('some jsx expression')
  })
})
