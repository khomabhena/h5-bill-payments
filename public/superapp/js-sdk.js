!(function (e, n) {
  if ('object' == typeof exports && 'object' == typeof module) module.exports = n()
  else if ('function' == typeof define && define.amd) define([], n)
  else {
    var t = n()
    for (var r in t) ('object' == typeof exports ? exports : e)[r] = t[r]
  }
})(self, function () {
  return (function () {
    var e = {
        473: function (e, n, t) {
          var r = t(835)
          ;(e.exports = function (e, n, t) {
            return (
              (n = r(n)) in e
                ? Object.defineProperty(e, n, { value: t, enumerable: !0, configurable: !0, writable: !0 })
                : (e[n] = t),
              e
            )
          }),
            (e.exports.__esModule = !0),
            (e.exports.default = e.exports)
        },
        405: function (e, n, t) {
          var r = t(473)
          function o(e, n) {
            var t = Object.keys(e)
            if (Object.getOwnPropertySymbols) {
              var r = Object.getOwnPropertySymbols(e)
              n &&
                (r = r.filter(function (n) {
                  return Object.getOwnPropertyDescriptor(e, n).enumerable
                })),
                t.push.apply(t, r)
            }
            return t
          }
          ;(e.exports = function (e) {
            for (var n = 1; n < arguments.length; n++) {
              var t = null != arguments[n] ? arguments[n] : {}
              n % 2
                ? o(Object(t), !0).forEach(function (n) {
                    r(e, n, t[n])
                  })
                : Object.getOwnPropertyDescriptors
                  ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
                  : o(Object(t)).forEach(function (n) {
                      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(t, n))
                    })
            }
            return e
          }),
            (e.exports.__esModule = !0),
            (e.exports.default = e.exports)
        },
        437: function (e, n, t) {
          var r = t(206).default
          ;(e.exports = function (e, n) {
            if ('object' != r(e) || !e) return e
            var t = e[Symbol.toPrimitive]
            if (void 0 !== t) {
              var o = t.call(e, n || 'default')
              if ('object' != r(o)) return o
              throw new TypeError('@@toPrimitive must return a primitive value.')
            }
            return ('string' === n ? String : Number)(e)
          }),
            (e.exports.__esModule = !0),
            (e.exports.default = e.exports)
        },
        835: function (e, n, t) {
          var r = t(206).default,
            o = t(437)
          ;(e.exports = function (e) {
            var n = o(e, 'string')
            return 'symbol' == r(n) ? n : String(n)
          }),
            (e.exports.__esModule = !0),
            (e.exports.default = e.exports)
        },
        206: function (e) {
          function n(t) {
            return (
              (e.exports = n =
                'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                  ? function (e) {
                      return typeof e
                    }
                  : function (e) {
                      return e && 'function' == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype
                        ? 'symbol'
                        : typeof e
                    }),
              (e.exports.__esModule = !0),
              (e.exports.default = e.exports),
              n(t)
            )
          }
          ;(e.exports = n), (e.exports.__esModule = !0), (e.exports.default = e.exports)
        }
      },
      n = {}
    function t(r) {
      var o = n[r]
      if (void 0 !== o) return o.exports
      var i = (n[r] = { exports: {} })
      return e[r](i, i.exports, t), i.exports
    }
    ;(t.n = function (e) {
      var n =
        e && e.__esModule
          ? function () {
              return e.default
            }
          : function () {
              return e
            }
      return t.d(n, { a: n }), n
    }),
      (t.d = function (e, n) {
        for (var r in n) t.o(n, r) && !t.o(e, r) && Object.defineProperty(e, r, { enumerable: !0, get: n[r] })
      }),
      (t.o = function (e, n) {
        return Object.prototype.hasOwnProperty.call(e, n)
      }),
      (t.r = function (e) {
        'undefined' != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
          Object.defineProperty(e, '__esModule', { value: !0 })
      })
    var r = {}
    return (
      (function () {
        'use strict'
        t.r(r),
          t.d(r, {
            default: function () {
              return M
            }
          })
        var e = {}
        t.r(e),
          t.d(e, {
            checkJsApi: function () {
              return v
            },
            close: function () {
              return b
            },
            getDeviceInfo: function () {
              return P
            },
            open: function () {
              return g
            },
            openOutApp: function () {
              return y
            },
            registerNativeEvent: function () {
              return x
            },
            scanQRCode: function () {
              return w
            },
            setHeader: function () {
              return h
            },
            share: function () {
              return m
            },
            unRegisterNativeEvent: function () {
              return O
            }
          })
        var n = {}
        t.r(n),
          t.d(n, {
            getAuthToken: function () {
              return A
            },
            getDeviceId: function () {
              return _
            },
            getLocation: function () {
              return C
            },
            getPhoneContact: function () {
              return N
            },
            openMap: function () {
              return j
            },
            payOrder: function () {
              return k
            },
            verifyCredential: function () {
              return S
            }
          })
        var o = t(405),
          i = t.n(o),
          u = 1e3,
          c = { code: '1001', msg: 'Call to jsapi timed out' },
          a = { code: '1002', msg: 'Unsupported Environmen' },
          f = navigator.userAgent,
          s = function () {
            return (f.includes('Customer') || f.includes('Partner')) && !!window.AppNativeJsBridge
          }
        function l(e, n) {
          return (
            console.log('call js api '.concat(e)),
            new Promise(function (t, r) {
              if (!s()) return r(a)
              var o = 'Callback' + window.AppNativeJsBridgeCallback.callbackId++
              window.AppNativeJsBridgeCallback.callback[o] = function (n) {
                delete window.AppNativeJsBridgeCallback.callback[o],
                  console.log('call js api '.concat(e, ' result'), n),
                  (n = JSON.parse(n)).code && '0' === n.code ? t(n.data) : r(n)
              }
              var i = { api: e, data: null != n ? n : {}, callback: o },
                u = JSON.stringify(i)
              window.AppNativeJsBridge && window.AppNativeJsBridge.postMessage(u)
            })
          )
        }
        var p = 'onNativeEventTrigger_'
        function d(e, n) {
          return function (t) {
            var r, o
            return Promise.race([
              e(t),
              ((r = null == t ? void 0 : t.timeout),
              (o = r || n),
              new Promise(function (e, n) {
                setTimeout(function () {
                  return n(c)
                }, o)
              }))
            ])
          }
        }
        function v(e) {
          return new Promise(function (n, t) {
            l('checkJsApi', e)
              .then(function (e) {
                n(e)
              })
              .catch(function (e) {
                t(e)
              })
          })
        }
        function b() {
          return l('close', {})
        }
        function g(e) {
          return l('open', e)
        }
        function y(e) {
          return l('openOutApp', e)
        }
        function m(e) {
          l('updateAppMessageShareData', e)
        }
        function w() {
          return new Promise(function (e, n) {
            l('scanQRCode', {})
              .then(function (n) {
                e(n)
              })
              .catch(function (e) {
                n(e)
              })
          })
        }
        function h(e) {
          return l('setHeader', e)
        }
        function x(e, n) {
          var t,
            r,
            o = p + e.event
          return (
            (window.AppNativeJsBridgeCallback.callback[o] = function (e) {
              console.log('nativeEvent订阅触发'.concat(o, ' result '), e), n && n(JSON.parse(e))
            }),
            l('registerNativeEvent', {
              event: e.event,
              isBlock: null !== (t = e.isBlock) && void 0 !== t && t,
              isDisposable: null !== (r = e.isDisposable) && void 0 !== r && r,
              trigger: o
            })
          )
        }
        function O(e) {
          var n = p + e.event
          return (window.AppNativeJsBridgeCallback.callback[n] = function (e) {}), l('unRegisterNativeEvent', e)
        }
        var P = d(function () {
          return new Promise(function (e, n) {
            l('getDeviceInfo', {})
              .then(function (n) {
                e(n)
              })
              .catch(function (e) {
                n(e)
              })
          })
        }, u)
        function j(e) {
          return l('openLocation', e)
        }
        function k(e) {
          return new Promise(function (n, t) {
            l('payOrder', e)
              .then(function (e) {
                n(e)
              })
              .catch(function (e) {
                t(e)
              })
          })
        }
        function S(e) {
          return new Promise(function (n, t) {
            l('verifyCredential', e)
              .then(function (e) {
                n(e)
              })
              .catch(function (e) {
                t(e)
              })
          })
        }
        function N() {
          return new Promise(function (e, n) {
            l('getPhoneContact', {})
              .then(function (n) {
                e(n)
              })
              .catch(function (e) {
                n(e)
              })
          })
        }
        var A = d(function (e) {
            return new Promise(function (n, t) {
              l('getAuthToken', e)
                .then(function (e) {
                  n(e)
                })
                .catch(function (e) {
                  t(e)
                })
            })
          }, u),
          _ = d(function (e) {
            return new Promise(function (n, t) {
              l('getDeviceId', e)
                .then(function (e) {
                  n(e)
                })
                .catch(function (e) {
                  t(e)
                })
            })
          }, u),
          C = d(function () {
            return new Promise(function (e, n) {
              l('getLocation', {})
                .then(function (n) {
                  e(n)
                })
                .catch(function (e) {
                  n(e)
                })
            })
          }, u)
        window.AppNativeJsBridgeCallback = { eventListeners: new Map(), callbackId: 0, handleId: 0, callback: {} }
        var J = i()(i()({}, e), n)
        window.payment = J
        var M = J
      })(),
      r
    )
  })()
})

