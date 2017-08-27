# vue-typescript-jsx

## Usage

tsconfig.json

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
  }
}
```

```typescript
import Vue from 'vue'
import VueTSX from 'vue-typescript-jsx'

Vue.use(VueTSX)

...
```

## Limitations

### Spread/Merge props

Spread and merge of props are not supported by typescript compiler.

```typescript
<div class="a" {...{class: 'b'}} />
```

This will not result in

```typescript
{
  class: {
    a: true,
    b: true
  }
}
```

but in

```typescript
{
  class: 'b'
}
```

### input, textarea, options, select literal values

Literal values will be passed to `domProps-value`.

```typescript
<input value="some value" />
```

will generate the following in the VDOM Data

```typescript
{
  domProps: {
    value: 'some value'
  }
}
```

### h auto-injection

There is no `h` auto-injection, you should provide it.

```typescript
render(h: Vue.CreateElement) {
  return <div />
}
```

```typescript
get value() {
  const h = this.$createElement
  return <div />
}
```
