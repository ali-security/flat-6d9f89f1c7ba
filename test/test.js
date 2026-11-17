/* globals suite test */

const assert = require('assert')
const path = require('path')
const { exec } = require('child_process')
const pkg = require('../package.json')
const flat = require('../index')

const flatten = flat.flatten
const unflatten = flat.unflatten

const primitives = {
  String: 'good morning',
  Number: 1234.99,
  Boolean: true,
  Date: new Date(),
  null: null,
  undefined: undefined
}

suite('Flatten Primitives', function () {
  Object.keys(primitives).forEach(function (key) {
    const value = primitives[key]

    test(key, function () {
      assert.deepStrictEqual(flatten({
        hello: {
          world: value
        }
      }), {
        'hello.world': value
      })
    })
  })
})

suite('Unflatten Primitives', function () {
  Object.keys(primitives).forEach(function (key) {
    const value = primitives[key]

    test(key, function () {
      assert.deepStrictEqual(unflatten({
        'hello.world': value
      }), {
        hello: {
          world: value
        }
      })
    })
  })
})

suite('Flatten', function () {
  test('Nested once', function () {
    assert.deepStrictEqual(flatten({
      hello: {
        world: 'good morning'
      }
    }), {
      'hello.world': 'good morning'
    })
  })

  test('Nested twice', function () {
    assert.deepStrictEqual(flatten({
      hello: {
        world: {
          again: 'good morning'
        }
      }
    }), {
      'hello.world.again': 'good morning'
    })
  })

  test('Multiple Keys', function () {
    assert.deepStrictEqual(flatten({
      hello: {
        lorem: {
          ipsum: 'again',
          dolor: 'sit'
        }
      },
      world: {
        lorem: {
          ipsum: 'again',
          dolor: 'sit'
        }
      }
    }), {
      'hello.lorem.ipsum': 'again',
      'hello.lorem.dolor': 'sit',
      'world.lorem.ipsum': 'again',
      'world.lorem.dolor': 'sit'
    })
  })

  test('Custom Delimiter', function () {
    assert.deepStrictEqual(flatten({
      hello: {
        world: {
          again: 'good morning'
        }
      }
    }, {
      delimiter: ':'
    }), {
      'hello:world:again': 'good morning'
    })
  })

  test('Empty Objects', function () {
    assert.deepStrictEqual(flatten({
      hello: {
        empty: {
          nested: {}
        }
      }
    }), {
      'hello.empty.nested': {}
    })
  })

  if (typeof Buffer !== 'undefined') {
    test('Buffer', function () {
      assert.deepStrictEqual(flatten({
        hello: {
          empty: {
            nested: Buffer.from('test')
          }
        }
      }), {
        'hello.empty.nested': Buffer.from('test')
      })
    })
  }

  if (typeof Uint8Array !== 'undefined') {
    test('typed arrays', function () {
      assert.deepStrictEqual(flatten({
        hello: {
          empty: {
            nested: new Uint8Array([1, 2, 3, 4])
          }
        }
      }), {
        'hello.empty.nested': new Uint8Array([1, 2, 3, 4])
      })
    })
  }

  test('Custom Depth', function () {
    assert.deepStrictEqual(flatten({
      hello: {
        world: {
          again: 'good morning'
        }
      },
      lorem: {
        ipsum: {
          dolor: 'good evening'
        }
      }
    }, {
      maxDepth: 2
    }), {
      'hello.world': {
        again: 'good morning'
      },
      'lorem.ipsum': {
        dolor: 'good evening'
      }
    })
  })

  test('Transformed Keys', function () {
    assert.deepStrictEqual(flatten({
      hello: {
        world: {
          again: 'good morning'
        }
      },
      lorem: {
        ipsum: {
          dolor: 'good evening'
        }
      }
    }, {
      transformKey: function (key) {
        return '__' + key + '__'
      }
    }), {
      '__hello__.__world__.__again__': 'good morning',
      '__lorem__.__ipsum__.__dolor__': 'good evening'
    })
  })

  test('Should keep number in the left when object', function () {
    assert.deepStrictEqual(flatten({
      hello: {
        '0200': 'world',
        '0500': 'darkness my old friend'
      }
    }), {
      'hello.0200': 'world',
      'hello.0500': 'darkness my old friend'
    })
  })
})

suite('Unflatten', function () {
  test('Nested once', function () {
    assert.deepStrictEqual({
      hello: {
        world: 'good morning'
      }
    }, unflatten({
      'hello.world': 'good morning'
    }))
  })

  test('Nested twice', function () {
    assert.deepStrictEqual({
      hello: {
        world: {
          again: 'good morning'
        }
      }
    }, unflatten({
      'hello.world.again': 'good morning'
    }))
  })

  test('Multiple Keys', function () {
    assert.deepStrictEqual({
      hello: {
        lorem: {
          ipsum: 'again',
          dolor: 'sit'
        }
      },
      world: {
        greet: 'hello',
        lorem: {
          ipsum: 'again',
          dolor: 'sit'
        }
      }
    }, unflatten({
      'hello.lorem.ipsum': 'again',
      'hello.lorem.dolor': 'sit',
      'world.lorem.ipsum': 'again',
      'world.lorem.dolor': 'sit',
      world: { greet: 'hello' }
    }))
  })

  test('nested objects do not clobber each other when a.b inserted before a', function () {
    const x = {}
    x['foo.bar'] = { t: 123 }
    x.foo = { p: 333 }
    assert.deepStrictEqual(unflatten(x), {
      foo: {
        bar: {
          t: 123
        },
        p: 333
      }
    })
  })

  test('Custom Delimiter', function () {
    assert.deepStrictEqual({
      hello: {
        world: {
          again: 'good morning'
        }
      }
    }, unflatten({
      'hello world again': 'good morning'
    }, {
      delimiter: ' '
    }))
  })

  test('Overwrite', function () {
    assert.deepStrictEqual({
      travis: {
        build: {
          dir: '/home/travis/build/kvz/environmental'
        }
      }
    }, unflatten({
      travis: 'true',
      travis_build_dir: '/home/travis/build/kvz/environmental'
    }, {
      delimiter: '_',
      overwrite: true
    }))
  })

  test('Transformed Keys', function () {
    assert.deepStrictEqual(unflatten({
      '__hello__.__world__.__again__': 'good morning',
      '__lorem__.__ipsum__.__dolor__': 'good evening'
    }, {
      transformKey: function (key) {
        return key.substring(2, key.length - 2)
      }
    }), {
      hello: {
        world: {
          again: 'good morning'
        }
      },
      lorem: {
        ipsum: {
          dolor: 'good evening'
        }
      }
    })
  })

  test('Messy', function () {
    assert.deepStrictEqual({
      hello: { world: 'again' },
      lorem: { ipsum: 'another' },
      good: {
        morning: {
          hash: {
            key: {
              nested: {
                deep: {
                  and: {
                    even: {
                      deeper: { still: 'hello' }
                    }
                  }
                }
              }
            }
          },
          again: { testing: { this: 'out' } }
        }
      }
    }, unflatten({
      'hello.world': 'again',
      'lorem.ipsum': 'another',
      'good.morning': {
        'hash.key': {
          'nested.deep': {
            'and.even.deeper.still': 'hello'
          }
        }
      },
      'good.morning.again': {
        'testing.this': 'out'
      }
    }))
  })

  suite('Overwrite + non-object values in key positions', function () {
    test('non-object keys + overwrite should be overwritten', function () {
      assert.deepStrictEqual(flat.unflatten({ a: null, 'a.b': 'c' }, { overwrite: true }), { a: { b: 'c' } })
      assert.deepStrictEqual(flat.unflatten({ a: 0, 'a.b': 'c' }, { overwrite: true }), { a: { b: 'c' } })
      assert.deepStrictEqual(flat.unflatten({ a: 1, 'a.b': 'c' }, { overwrite: true }), { a: { b: 'c' } })
      assert.deepStrictEqual(flat.unflatten({ a: '', 'a.b': 'c' }, { overwrite: true }), { a: { b: 'c' } })
    })

    test('overwrite value should not affect undefined keys', function () {
      assert.deepStrictEqual(flat.unflatten({ a: undefined, 'a.b': 'c' }, { overwrite: true }), { a: { b: 'c' } })
      assert.deepStrictEqual(flat.unflatten({ a: undefined, 'a.b': 'c' }, { overwrite: false }), { a: { b: 'c' } })
    })

    test('if no overwrite, should ignore nested values under non-object key', function () {
      assert.deepStrictEqual(flat.unflatten({ a: null, 'a.b': 'c' }), { a: null })
      assert.deepStrictEqual(flat.unflatten({ a: 0, 'a.b': 'c' }), { a: 0 })
      assert.deepStrictEqual(flat.unflatten({ a: 1, 'a.b': 'c' }), { a: 1 })
      assert.deepStrictEqual(flat.unflatten({ a: '', 'a.b': 'c' }), { a: '' })
    })
  })

  suite('.safe', function () {
    test('Should protect arrays when true', function () {
      assert.deepStrictEqual(flatten({
        hello: [
          { world: { again: 'foo' } },
          { lorem: 'ipsum' }
        ],
        another: {
          nested: [{ array: { too: 'deep' } }]
        },
        lorem: {
          ipsum: 'whoop'
        }
      }, {
        safe: true
      }), {
        hello: [
          { world: { again: 'foo' } },
          { lorem: 'ipsum' }
        ],
        'lorem.ipsum': 'whoop',
        'another.nested': [{ array: { too: 'deep' } }]
      })
    })

    test('Should not protect arrays when false', function () {
      assert.deepStrictEqual(flatten({
        hello: [
          { world: { again: 'foo' } },
          { lorem: 'ipsum' }
        ]
      }, {
        safe: false
      }), {
        'hello.0.world.again': 'foo',
        'hello.1.lorem': 'ipsum'
      })
    })

    test('Empty objects should not be removed', function () {
      assert.deepStrictEqual(unflatten({
        foo: [],
        bar: {}
      }), { foo: [], bar: {} })
    })
  })

  suite('.object', function () {
    test('Should create object instead of array when true', function () {
      const unflattened = unflatten({
        'hello.you.0': 'ipsum',
        'hello.you.1': 'lorem',
        'hello.other.world': 'foo'
      }, {
        object: true
      })
      assert.deepStrictEqual({
        hello: {
          you: {
            0: 'ipsum',
            1: 'lorem'
          },
          other: { world: 'foo' }
        }
      }, unflattened)
      assert(!Array.isArray(unflattened.hello.you))
    })

    test('Should create object instead of array when nested', function () {
      const unflattened = unflatten({
        hello: {
          'you.0': 'ipsum',
          'you.1': 'lorem',
          'other.world': 'foo'
        }
      }, {
        object: true
      })
      assert.deepStrictEqual({
        hello: {
          you: {
            0: 'ipsum',
            1: 'lorem'
          },
          other: { world: 'foo' }
        }
      }, unflattened)
      assert(!Array.isArray(unflattened.hello.you))
    })

    test('Should keep the zero in the left when object is true', function () {
      const unflattened = unflatten({
        'hello.0200': 'world',
        'hello.0500': 'darkness my old friend'
      }, {
        object: true
      })

      assert.deepStrictEqual({
        hello: {
          '0200': 'world',
          '0500': 'darkness my old friend'
        }
      }, unflattened)
    })

    test('Should not create object when false', function () {
      const unflattened = unflatten({
        'hello.you.0': 'ipsum',
        'hello.you.1': 'lorem',
        'hello.other.world': 'foo'
      }, {
        object: false
      })
      assert.deepStrictEqual({
        hello: {
          you: ['ipsum', 'lorem'],
          other: { world: 'foo' }
        }
      }, unflattened)
      assert(Array.isArray(unflattened.hello.you))
    })
  })

  suite('.arrayLimit', function () {
    test('Should not create huge sparse arrays from large numeric keys', function () {
      const unflattened = unflatten({
        'a.4294967294': 'foo'
      })
      assert(!Array.isArray(unflattened.a))
      assert.deepStrictEqual(unflattened, {
        a: { 4294967294: 'foo' }
      })
    })

    test('Should not create huge sparse arrays from large nested numeric keys', function () {
      const unflattened = unflatten({
        'a.b.4294967294.c': 'foo'
      })
      assert(!Array.isArray(unflattened.a.b))
      assert.deepStrictEqual(unflattened, {
        a: { b: { 4294967294: { c: 'foo' } } }
      })
    })

    test('Should keep the original key for large non-canonical numeric keys', function () {
      const unflattened = unflatten({
        'a.1e9': 'foo'
      })
      assert(!Array.isArray(unflattened.a))
      assert.deepStrictEqual(unflattened, {
        a: { '1e9': 'foo' }
      })
    })

    test('Should not grow an existing array to a huge length', function () {
      const unflattened = unflatten({
        'a.0': 'foo',
        'a.4294967294': 'bar'
      })
      assert(!Array.isArray(unflattened.a))
      assert.deepStrictEqual(unflattened, {
        a: { 0: 'foo', 4294967294: 'bar' }
      })
    })

    test('Should not grow an existing array to a huge length when nested', function () {
      const unflattened = unflatten({
        'a.0.b': 'foo',
        'a.4294967294.c': 'bar'
      })
      assert(!Array.isArray(unflattened.a))
      assert.deepStrictEqual(unflattened, {
        a: { 0: { b: 'foo' }, 4294967294: { c: 'bar' } }
      })
    })

    test('Should not grow an empty input array to a huge length', function () {
      const unflattened = unflatten({
        a: [],
        'a.4294967294': 'foo'
      })
      assert(!Array.isArray(unflattened.a))
      assert.deepStrictEqual(unflattened, {
        a: { 4294967294: 'foo' }
      })

      const unflattenedObject = unflatten({
        a: [],
        'a.4294967294': 'foo'
      }, {
        object: true
      })
      assert(!Array.isArray(unflattenedObject.a))
      assert.deepStrictEqual(unflattenedObject, {
        a: { 4294967294: 'foo' }
      })
    })

    test('Should keep iteration and serialization bounded', function () {
      const unflattened = unflatten({
        'a.0': 'foo',
        'a.4294967294': 'bar',
        'b.4294967294': 'baz',
        'c.1000': 'qux',
        'c.2001': 'quux',
        'c.4294967294': 'corge',
        'd.4294967294.0': 'grault'
      })
      assert(!Array.isArray(unflattened.a))
      assert(!Array.isArray(unflattened.b))
      assert(!Array.isArray(unflattened.c))
      assert(!Array.isArray(unflattened.d))
      assert.deepStrictEqual(unflattened.d, { 4294967294: ['grault'] })
      assert(JSON.stringify(unflattened).length < 1000)
    })

    test('Should not let chained keys grow an array past arrayLimit', function () {
      const unflattened = unflatten({
        'a.1000': 'foo',
        'a.2001': 'bar'
      })
      assert(!Array.isArray(unflattened.a))
      assert.deepStrictEqual(unflattened, {
        a: { 1000: 'foo', 2001: 'bar' }
      })
    })

    test('Should keep many chained keys bounded', function () {
      const target = {}
      for (let i = 1; i <= 2000; i++) {
        target['a.' + (i * 1001 - 1)] = 'x'
      }
      const unflattened = unflatten(target)
      assert(!Array.isArray(unflattened.a))
      assert.strictEqual(Object.keys(unflattened.a).length, 2000)
      assert(JSON.stringify(unflattened).length < 100000)
    })

    test('Should still unflatten large dense arrays', function () {
      const list = []
      for (let i = 0; i < 2500; i++) {
        list.push({ value: i })
      }
      const unflattened = unflatten(flatten({ list: list }))
      assert(Array.isArray(unflattened.list))
      assert.strictEqual(unflattened.list.length, 2500)
      assert.deepStrictEqual(unflattened, { list: list })
    })

    test('Should still create arrays for indices within the limit', function () {
      const unflattened = unflatten({
        'a.1000': 'foo'
      })
      assert(Array.isArray(unflattened.a))
      assert.strictEqual(unflattened.a.length, 1001)
      assert.strictEqual(unflattened.a[1000], 'foo')
    })

    test('Should respect a custom arrayLimit', function () {
      assert.deepStrictEqual(unflatten({
        'a.5': 'foo'
      }, {
        arrayLimit: 2
      }), {
        a: { 5: 'foo' }
      })

      assert.deepStrictEqual(unflatten({
        'a.0': 'foo',
        'a.4': 'bar'
      }, {
        arrayLimit: 2
      }), {
        a: { 0: 'foo', 4: 'bar' }
      })

      const unflattened = unflatten({
        'a.4000': 'foo'
      }, {
        arrayLimit: 5000
      })
      assert(Array.isArray(unflattened.a))
      assert.strictEqual(unflattened.a.length, 4001)
    })
  })

  if (typeof Buffer !== 'undefined') {
    test('Buffer', function () {
      assert.deepStrictEqual(unflatten({
        'hello.empty.nested': Buffer.from('test')
      }), {
        hello: {
          empty: {
            nested: Buffer.from('test')
          }
        }
      })
    })
  }

  if (typeof Uint8Array !== 'undefined') {
    test('typed arrays', function () {
      assert.deepStrictEqual(unflatten({
        'hello.empty.nested': new Uint8Array([1, 2, 3, 4])
      }), {
        hello: {
          empty: {
            nested: new Uint8Array([1, 2, 3, 4])
          }
        }
      })
    })
  }

  test('should not pollute prototype', function () {
    unflatten({
      '__proto__.polluted': true
    })
    unflatten({
      'prefix.__proto__.polluted': true
    })
    unflatten({
      'prefix.0.__proto__.polluted': true
    })

    assert.notStrictEqual({}.polluted, true)
  })
})

suite('Arrays', function () {
  test('Should be able to flatten arrays properly', function () {
    assert.deepStrictEqual({
      'a.0': 'foo',
      'a.1': 'bar'
    }, flatten({
      a: ['foo', 'bar']
    }))
  })

  test('Should be able to revert and reverse array serialization via unflatten', function () {
    assert.deepStrictEqual({
      a: ['foo', 'bar']
    }, unflatten({
      'a.0': 'foo',
      'a.1': 'bar'
    }))
  })

  test('Array typed objects should be restored by unflatten', function () {
    assert.strictEqual(
      Object.prototype.toString.call(['foo', 'bar'])
      , Object.prototype.toString.call(unflatten({
        'a.0': 'foo',
        'a.1': 'bar'
      }).a)
    )
  })

  test('Do not include keys with numbers inside them', function () {
    assert.deepStrictEqual(unflatten({
      '1key.2_key': 'ok'
    }), {
      '1key': {
        '2_key': 'ok'
      }
    })
  })
})

suite('Order of Keys', function () {
  test('Order of keys should not be changed after round trip flatten/unflatten', function () {
    const obj = {
      b: 1,
      abc: {
        c: [{
          d: 1,
          bca: 1,
          a: 1
        }]
      },
      a: 1
    }
    const result = unflatten(
      flatten(obj)
    )

    assert.deepStrictEqual(Object.keys(obj), Object.keys(result))
    assert.deepStrictEqual(Object.keys(obj.abc), Object.keys(result.abc))
    assert.deepStrictEqual(Object.keys(obj.abc.c[0]), Object.keys(result.abc.c[0]))
  })
})

suite('CLI', function () {
  test('can take filename', function (done) {
    const cli = path.resolve(__dirname, '..', pkg.bin)
    const pkgJSON = path.resolve(__dirname, '..', 'package.json')
    exec(`${cli} ${pkgJSON}`, (err, stdout, stderr) => {
      assert.ifError(err)
      assert.strictEqual(stdout.trim(), JSON.stringify(flatten(pkg), null, 2))
      done()
    })
  })

  test('exits with usage if no file', function (done) {
    const cli = path.resolve(__dirname, '..', pkg.bin)
    const pkgJSON = path.resolve(__dirname, '..', 'package.json')
    exec(`${cli} ${pkgJSON}`, (err, stdout, stderr) => {
      assert.ifError(err)
      assert.strictEqual(stdout.trim(), JSON.stringify(flatten(pkg), null, 2))
      done()
    })
  })

  test('can take piped file', function (done) {
    const cli = path.resolve(__dirname, '..', pkg.bin)
    const pkgJSON = path.resolve(__dirname, '..', 'package.json')
    exec(`cat ${pkgJSON} | ${cli}`, (err, stdout, stderr) => {
      assert.ifError(err)
      assert.strictEqual(stdout.trim(), JSON.stringify(flatten(pkg), null, 2))
      done()
    })
  })
})
