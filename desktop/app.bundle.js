const jn = (e, t) => e === t, Dn = Symbol("solid-track"), zt = {
  equals: jn
};
let mn = kn;
const dt = 1, Tt = 2, yn = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var je = null;
let qt = null, Pn = null, Ae = null, We = null, it = null, Dt = 0;
function Et(e, t) {
  const n = Ae, r = je, i = e.length === 0, l = t === void 0 ? r : t, a = i ? yn : {
    owned: null,
    cleanups: null,
    context: l ? l.context : null,
    owner: l
  }, s = i ? e : () => e(() => ct(() => bt(a)));
  je = a, Ae = null;
  try {
    return kt(s, !0);
  } finally {
    Ae = n, je = r;
  }
}
function C(e, t) {
  t = t ? Object.assign({}, zt, t) : zt;
  const n = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: t.equals || void 0
  }, r = (i) => (typeof i == "function" && (i = i(n.value)), $n(n, i));
  return [wn.bind(n), r];
}
function K(e, t, n) {
  const r = Kt(e, t, !1, dt);
  $t(r);
}
function vt(e, t, n) {
  mn = Rn;
  const r = Kt(e, t, !1, dt);
  r.user = !0, it ? it.push(r) : $t(r);
}
function Ze(e, t, n) {
  n = n ? Object.assign({}, zt, n) : zt;
  const r = Kt(e, t, !0, 0);
  return r.observers = null, r.observerSlots = null, r.comparator = n.equals || void 0, $t(r), wn.bind(r);
}
function ct(e) {
  if (Ae === null) return e();
  const t = Ae;
  Ae = null;
  try {
    return e();
  } finally {
    Ae = t;
  }
}
function Pt(e) {
  vt(() => ct(e));
}
function bn(e) {
  return je === null || (je.cleanups === null ? je.cleanups = [e] : je.cleanups.push(e)), e;
}
function wn() {
  if (this.sources && this.state)
    if (this.state === dt) $t(this);
    else {
      const e = We;
      We = null, kt(() => Lt(this), !1), We = e;
    }
  if (Ae) {
    const e = this.observers;
    if (!e || e[e.length - 1] !== Ae) {
      const t = e ? e.length : 0;
      Ae.sources ? (Ae.sources.push(this), Ae.sourceSlots.push(t)) : (Ae.sources = [this], Ae.sourceSlots = [t]), e ? (e.push(Ae), this.observerSlots.push(Ae.sources.length - 1)) : (this.observers = [Ae], this.observerSlots = [Ae.sources.length - 1]);
    }
  }
  return this.value;
}
function $n(e, t, n) {
  let r = e.value;
  return (!e.comparator || !e.comparator(r, t)) && (e.value = t, e.observers && e.observers.length && kt(() => {
    for (let i = 0; i < e.observers.length; i += 1) {
      const l = e.observers[i], a = qt && qt.running;
      a && qt.disposed.has(l), (a ? !l.tState : !l.state) && (l.pure ? We.push(l) : it.push(l), l.observers && _n(l)), a || (l.state = dt);
    }
    if (We.length > 1e6)
      throw We = [], new Error();
  }, !1)), t;
}
function $t(e) {
  if (!e.fn) return;
  bt(e);
  const t = Dt;
  In(e, e.value, t);
}
function In(e, t, n) {
  let r;
  const i = je, l = Ae;
  Ae = je = e;
  try {
    r = e.fn(t);
  } catch (a) {
    return e.pure && (e.state = dt, e.owned && e.owned.forEach(bt), e.owned = null), e.updatedAt = n + 1, Sn(a);
  } finally {
    Ae = l, je = i;
  }
  (!e.updatedAt || e.updatedAt <= n) && (e.updatedAt != null && "observers" in e ? $n(e, r) : e.value = r, e.updatedAt = n);
}
function Kt(e, t, n, r = dt, i) {
  const l = {
    fn: e,
    state: r,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: t,
    owner: je,
    context: je ? je.context : null,
    pure: n
  };
  return je === null || je !== yn && (je.owned ? je.owned.push(l) : je.owned = [l]), l;
}
function Ot(e) {
  if (e.state === 0) return;
  if (e.state === Tt) return Lt(e);
  if (e.suspense && ct(e.suspense.inFallback)) return e.suspense.effects.push(e);
  const t = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < Dt); )
    e.state && t.push(e);
  for (let n = t.length - 1; n >= 0; n--)
    if (e = t[n], e.state === dt)
      $t(e);
    else if (e.state === Tt) {
      const r = We;
      We = null, kt(() => Lt(e, t[0]), !1), We = r;
    }
}
function kt(e, t) {
  if (We) return e();
  let n = !1;
  t || (We = []), it ? n = !0 : it = [], Dt++;
  try {
    const r = e();
    return Mn(n), r;
  } catch (r) {
    n || (it = null), We = null, Sn(r);
  }
}
function Mn(e) {
  if (We && (kn(We), We = null), e) return;
  const t = it;
  it = null, t.length && kt(() => mn(t), !1);
}
function kn(e) {
  for (let t = 0; t < e.length; t++) Ot(e[t]);
}
function Rn(e) {
  let t, n = 0;
  for (t = 0; t < e.length; t++) {
    const r = e[t];
    r.user ? e[n++] = r : Ot(r);
  }
  for (t = 0; t < n; t++) Ot(e[t]);
}
function Lt(e, t) {
  e.state = 0;
  for (let n = 0; n < e.sources.length; n += 1) {
    const r = e.sources[n];
    if (r.sources) {
      const i = r.state;
      i === dt ? r !== t && (!r.updatedAt || r.updatedAt < Dt) && Ot(r) : i === Tt && Lt(r, t);
    }
  }
}
function _n(e) {
  for (let t = 0; t < e.observers.length; t += 1) {
    const n = e.observers[t];
    n.state || (n.state = Tt, n.pure ? We.push(n) : it.push(n), n.observers && _n(n));
  }
}
function bt(e) {
  let t;
  if (e.sources)
    for (; e.sources.length; ) {
      const n = e.sources.pop(), r = e.sourceSlots.pop(), i = n.observers;
      if (i && i.length) {
        const l = i.pop(), a = n.observerSlots.pop();
        r < i.length && (l.sourceSlots[a] = r, i[r] = l, n.observerSlots[r] = a);
      }
    }
  if (e.tOwned) {
    for (t = e.tOwned.length - 1; t >= 0; t--) bt(e.tOwned[t]);
    delete e.tOwned;
  }
  if (e.owned) {
    for (t = e.owned.length - 1; t >= 0; t--) bt(e.owned[t]);
    e.owned = null;
  }
  if (e.cleanups) {
    for (t = e.cleanups.length - 1; t >= 0; t--) e.cleanups[t]();
    e.cleanups = null;
  }
  e.state = 0;
}
function Nn(e) {
  return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
    cause: e
  });
}
function Sn(e, t = je) {
  throw Nn(e);
}
const Fn = Symbol("fallback");
function nn(e) {
  for (let t = 0; t < e.length; t++) e[t]();
}
function Wn(e, t, n = {}) {
  let r = [], i = [], l = [], a = 0, s = t.length > 1 ? [] : null;
  return bn(() => nn(l)), () => {
    let v = e() || [], $ = v.length, b, u;
    return v[Dn], ct(() => {
      let P, Y, I, L, S, p, A, U, re;
      if ($ === 0)
        a !== 0 && (nn(l), l = [], r = [], i = [], a = 0, s && (s = [])), n.fallback && (r = [Fn], i[0] = Et((Ee) => (l[0] = Ee, n.fallback())), a = 1);
      else if (a === 0) {
        for (i = new Array($), u = 0; u < $; u++)
          r[u] = v[u], i[u] = Et(E);
        a = $;
      } else {
        for (I = new Array($), L = new Array($), s && (S = new Array($)), p = 0, A = Math.min(a, $); p < A && r[p] === v[p]; p++) ;
        for (A = a - 1, U = $ - 1; A >= p && U >= p && r[A] === v[U]; A--, U--)
          I[U] = i[A], L[U] = l[A], s && (S[U] = s[A]);
        for (P = /* @__PURE__ */ new Map(), Y = new Array(U + 1), u = U; u >= p; u--)
          re = v[u], b = P.get(re), Y[u] = b === void 0 ? -1 : b, P.set(re, u);
        for (b = p; b <= A; b++)
          re = r[b], u = P.get(re), u !== void 0 && u !== -1 ? (I[u] = i[b], L[u] = l[b], s && (S[u] = s[b]), u = Y[u], P.set(re, u)) : l[b]();
        for (u = p; u < $; u++)
          u in I ? (i[u] = I[u], l[u] = L[u], s && (s[u] = S[u], s[u](u))) : i[u] = Et(E);
        i = i.slice(0, a = $), r = v.slice(0);
      }
      return i;
    });
    function E(P) {
      if (l[u] = P, s) {
        const [Y, I] = C(u);
        return s[u] = I, t(v[u], Y);
      }
      return t(v[u]);
    }
  };
}
function f(e, t) {
  return ct(() => e(t || {}));
}
const qn = (e) => `Stale read from <${e}>.`;
function Re(e) {
  const t = "fallback" in e && {
    fallback: () => e.fallback
  };
  return Ze(Wn(() => e.each, e.children, t || void 0));
}
function R(e) {
  const t = e.keyed, n = Ze(() => e.when, void 0, void 0), r = t ? n : Ze(n, void 0, {
    equals: (i, l) => !i == !l
  });
  return Ze(() => {
    const i = r();
    if (i) {
      const l = e.children;
      return typeof l == "function" && l.length > 0 ? ct(() => l(t ? i : () => {
        if (!ct(r)) throw qn("Show");
        return n();
      })) : l;
    }
    return e.fallback;
  }, void 0, void 0);
}
const Le = (e) => Ze(() => e());
function Bn(e, t, n) {
  let r = n.length, i = t.length, l = r, a = 0, s = 0, v = t[i - 1].nextSibling, $ = null;
  for (; a < i || s < l; ) {
    if (t[a] === n[s]) {
      a++, s++;
      continue;
    }
    for (; t[i - 1] === n[l - 1]; )
      i--, l--;
    if (i === a) {
      const b = l < r ? s ? n[s - 1].nextSibling : n[l - s] : v;
      for (; s < l; ) e.insertBefore(n[s++], b);
    } else if (l === s)
      for (; a < i; )
        (!$ || !$.has(t[a])) && t[a].remove(), a++;
    else if (t[a] === n[l - 1] && n[s] === t[i - 1]) {
      const b = t[--i].nextSibling;
      e.insertBefore(n[s++], t[a++].nextSibling), e.insertBefore(n[--l], b), t[i] = n[l];
    } else {
      if (!$) {
        $ = /* @__PURE__ */ new Map();
        let u = s;
        for (; u < l; ) $.set(n[u], u++);
      }
      const b = $.get(t[a]);
      if (b != null)
        if (s < b && b < l) {
          let u = a, E = 1, P;
          for (; ++u < i && u < l && !((P = $.get(t[u])) == null || P !== b + E); )
            E++;
          if (E > b - s) {
            const Y = t[a];
            for (; s < b; ) e.insertBefore(n[s++], Y);
          } else e.replaceChild(n[s++], t[a++]);
        } else a++;
      else t[a++].remove();
    }
  }
}
const rn = "_$DX_DELEGATE";
function Hn(e, t, n, r = {}) {
  let i;
  return Et((l) => {
    i = l, t === document ? e() : c(t, e(), t.firstChild ? null : void 0, n);
  }, r.owner), () => {
    i(), t.textContent = "";
  };
}
function y(e, t, n, r) {
  let i;
  const l = () => {
    const s = document.createElement("template");
    return s.innerHTML = e, s.content.firstChild;
  }, a = () => (i || (i = l())).cloneNode(!0);
  return a.cloneNode = a, a;
}
function pt(e, t = window.document) {
  const n = t[rn] || (t[rn] = /* @__PURE__ */ new Set());
  for (let r = 0, i = e.length; r < i; r++) {
    const l = e[r];
    n.has(l) || (n.add(l), t.addEventListener(l, Kn));
  }
}
function et(e, t, n) {
  n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
}
function wt(e, t, n, r) {
  Array.isArray(n) ? (e[`$$${t}`] = n[0], e[`$$${t}Data`] = n[1]) : e[`$$${t}`] = n;
}
function xe(e, t, n) {
  if (!t) return n ? et(e, "style") : t;
  const r = e.style;
  if (typeof t == "string") return r.cssText = t;
  typeof n == "string" && (r.cssText = n = void 0), n || (n = {}), t || (t = {});
  let i, l;
  for (l in n)
    t[l] == null && r.removeProperty(l), delete n[l];
  for (l in t)
    i = t[l], i !== n[l] && (r.setProperty(l, i), n[l] = i);
  return n;
}
function ee(e, t, n) {
  n != null ? e.style.setProperty(t, n) : e.style.removeProperty(t);
}
function ot(e, t, n) {
  return ct(() => e(t, n));
}
function c(e, t, n, r) {
  if (n !== void 0 && !r && (r = []), typeof t != "function") return jt(e, t, r, n);
  K((i) => jt(e, t(), i, n), r);
}
function Kn(e) {
  let t = e.target;
  const n = `$$${e.type}`, r = e.target, i = e.currentTarget, l = (v) => Object.defineProperty(e, "target", {
    configurable: !0,
    value: v
  }), a = () => {
    const v = t[n];
    if (v && !t.disabled) {
      const $ = t[`${n}Data`];
      if ($ !== void 0 ? v.call(t, $, e) : v.call(t, e), e.cancelBubble) return;
    }
    return t.host && typeof t.host != "string" && !t.host._$host && t.contains(e.target) && l(t.host), !0;
  }, s = () => {
    for (; a() && (t = t._$host || t.parentNode || t.host); ) ;
  };
  if (Object.defineProperty(e, "currentTarget", {
    configurable: !0,
    get() {
      return t || document;
    }
  }), e.composedPath) {
    const v = e.composedPath();
    l(v[0]);
    for (let $ = 0; $ < v.length - 2 && (t = v[$], !!a()); $++) {
      if (t._$host) {
        t = t._$host, s();
        break;
      }
      if (t.parentNode === i)
        break;
    }
  } else s();
  l(r);
}
function jt(e, t, n, r, i) {
  for (; typeof n == "function"; ) n = n();
  if (t === n) return n;
  const l = typeof t, a = r !== void 0;
  if (e = a && n[0] && n[0].parentNode || e, l === "string" || l === "number") {
    if (l === "number" && (t = t.toString(), t === n))
      return n;
    if (a) {
      let s = n[0];
      s && s.nodeType === 3 ? s.data !== t && (s.data = t) : s = document.createTextNode(t), n = xt(e, n, r, s);
    } else
      n !== "" && typeof n == "string" ? n = e.firstChild.data = t : n = e.textContent = t;
  } else if (t == null || l === "boolean")
    n = xt(e, n, r);
  else {
    if (l === "function")
      return K(() => {
        let s = t();
        for (; typeof s == "function"; ) s = s();
        n = jt(e, s, n, r);
      }), () => n;
    if (Array.isArray(t)) {
      const s = [], v = n && Array.isArray(n);
      if (Ht(s, t, n, i))
        return K(() => n = jt(e, s, n, r, !0)), () => n;
      if (s.length === 0) {
        if (n = xt(e, n, r), a) return n;
      } else v ? n.length === 0 ? on(e, s, r) : Bn(e, n, s) : (n && xt(e), on(e, s));
      n = s;
    } else if (t.nodeType) {
      if (Array.isArray(n)) {
        if (a) return n = xt(e, n, r, t);
        xt(e, n, null, t);
      } else n == null || n === "" || !e.firstChild ? e.appendChild(t) : e.replaceChild(t, e.firstChild);
      n = t;
    }
  }
  return n;
}
function Ht(e, t, n, r) {
  let i = !1;
  for (let l = 0, a = t.length; l < a; l++) {
    let s = t[l], v = n && n[e.length], $;
    if (!(s == null || s === !0 || s === !1)) if (($ = typeof s) == "object" && s.nodeType)
      e.push(s);
    else if (Array.isArray(s))
      i = Ht(e, s, v) || i;
    else if ($ === "function")
      if (r) {
        for (; typeof s == "function"; ) s = s();
        i = Ht(e, Array.isArray(s) ? s : [s], Array.isArray(v) ? v : [v]) || i;
      } else
        e.push(s), i = !0;
    else {
      const b = String(s);
      v && v.nodeType === 3 && v.data === b ? e.push(v) : e.push(document.createTextNode(b));
    }
  }
  return i;
}
function on(e, t, n = null) {
  for (let r = 0, i = t.length; r < i; r++) e.insertBefore(t[r], n);
}
function xt(e, t, n, r) {
  if (n === void 0) return e.textContent = "";
  const i = r || document.createTextNode("");
  if (t.length) {
    let l = !1;
    for (let a = t.length - 1; a >= 0; a--) {
      const s = t[a];
      if (i !== s) {
        const v = s.parentNode === e;
        !l && !a ? v ? e.replaceChild(i, s) : e.insertBefore(i, n) : v && s.remove();
      } else l = !0;
    }
  } else e.insertBefore(i, n);
  return [i];
}
const Cn = "yola-code.files", An = "yola-code.workspace", Un = {
  "README.md": `# Bienvenido a YOLA Code

El editor nativo de YOLA — mejor que Cursor, mejor que Codex,
mejor que Antigravity: vive en un OS cuyo kernel es el agente.

## Lo que puedes hacer
- Ctrl+P — paleta de comandos
- Ctrl+F — buscar en el archivo
- Ctrl+S — guardar (workspace real vía api.os.files)
- ✨ Mejorar con YOLA — selecciona código y pídele al agente
- ☰ — cambiar de workspace (ruta real en tu máquina)

## ¿Workspace real o local?
Sin daemon: editas aquí (localStorage). Con daemon + permiso
files: editas tu código REAL en disco.
`,
  "ideas.md": `# Ideas

- [ ] Syntax highlighting ✓ (ya)
- [ ] Tabs múltiples ✓ (ya)
- [ ] Explorador de workspace real ✓ (ya)
- [ ] Paleta de comandos ✓ (ya)
- [ ] Agente integrado que edita el archivo por ti
- [ ] Terminal dentro de la app
`
};
function ln() {
  try {
    const e = localStorage.getItem(Cn);
    if (e) return JSON.parse(e);
  } catch {
  }
  return { ...Un };
}
function Yn(e) {
  try {
    localStorage.setItem(Cn, JSON.stringify(e));
  } catch {
  }
}
function Jn() {
  try {
    return localStorage.getItem(An) || "";
  } catch {
    return "";
  }
}
function sn(e) {
  try {
    localStorage.setItem(An, e);
  } catch {
  }
}
function Vn(e) {
  return !!(e?.os?.files && e?.os?.daemonUrl);
}
function Gn(e) {
  const t = `${e}/api/v1`, n = (r) => {
    const i = new URLSearchParams();
    for (const [l, a] of Object.entries(r))
      a != null && a !== "" && i.set(l, a);
    return i.size ? "?" + i.toString() : "";
  };
  return {
    list: async (r = "", i = "") => {
      const l = await fetch(`${t}/files${n({ directory: r, path: i })}`);
      if (!l.ok) throw new Error(`files HTTP ${l.status}`);
      const a = await l.json();
      if (Array.isArray(a)) return a;
      if (Array.isArray(a?.entries)) return a.entries;
      throw new Error("files: formato de respuesta inesperado");
    },
    read: async (r) => {
      const i = await fetch(`${t}/files/content${n({ path: r })}`);
      if (!i.ok) throw new Error(`files/content HTTP ${i.status}`);
      return (await i.json()).content;
    },
    write: async (r, i) => {
      const l = await fetch(`${t}/files/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: r, content: i })
      });
      if (!l.ok) throw new Error(`files/write HTTP ${l.status}`);
    },
    create: async (r, i = "file") => {
      const l = await fetch(`${t}/files/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: r, type: i })
      });
      if (!l.ok) throw new Error(`files/create HTTP ${l.status}`);
    },
    remove: async (r) => {
      const i = await fetch(`${t}/files/delete${n({ path: r })}`, { method: "DELETE" });
      if (!i.ok) throw new Error(`files/delete HTTP ${i.status}`);
    },
    status: async (r) => {
      const i = await fetch(`${t}/files/status${n({ path: r })}`);
      if (!i.ok) throw new Error(`files/status HTTP ${i.status}`);
      return i.json();
    }
  };
}
function Zn(e) {
  return String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Qn(e) {
  let t = "";
  for (e++; e > 0; )
    e--, t = String.fromCharCode(97 + e % 26) + t, e = Math.floor(e / 26);
  return t;
}
const an = {
  js: [
    [/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "c"],
    [/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "s"],
    [/\b(const|let|var|function|return|if|else|for|while|import|export|from|new|class|extends|async|await|try|catch|throw|switch|case|break|default|typeof|instanceof)\b/g, "k"],
    [/\b(?:true|false|null|undefined|NaN)\b/g, "k"],
    [/\b\d+(?:\.\d+)?\b/g, "n"],
    [/[A-Za-z_$][\w$]*(?=\s*\()/g, "f"]
  ],
  json: [
    [/"(?:[^"\\\n]|\\.)*"/g, "s"],
    [/\b(?:true|false|null)\b/g, "k"],
    [/-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, "n"]
  ],
  md: [
    [/^#{1,6} .*$/gm, "k"],
    [/^>.*$/gm, "c"],
    [/\*\*[^*]+\*\*|__[^_]+__/g, "k"],
    [/`[^`]+`/g, "s"],
    [/\[[^\]]+\]\([^)]+\)/g, "f"]
  ],
  css: [
    [/\/\*[\s\S]*?\*\//g, "c"],
    [/#[0-9a-fA-F]{3,8}\b/g, "n"],
    [/[a-z-]+(?=\s*:)/g, "f"],
    [/(?:--)?[a-zA-Z-]+(?=\s*:)/g, "p"],
    [/\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|fr|deg)\b/g, "n"]
  ],
  html: [
    [/&lt;!--[\s\S]*?--&gt;/g, "c"],
    [/&lt;\/?[a-zA-Z][\w-]*/g, "k"],
    [/[a-zA-Z-]+(?==\"|=')/g, "p"],
    [/"[^"]*"/g, "s"]
  ],
  python: [
    [/#[^\n]*/g, "c"],
    [/'''[\s\S]*?'''|"""(?:[^"\\]|\\.)*?"""|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "s"],
    [/\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|with|lambda|yield|pass|break|continue|None|True|False|and|or|not|in|is)\b/g, "k"],
    [/\b\d+(?:\.\d+)?\b/g, "n"],
    [/[A-Za-z_]\w*(?=\s*\()/g, "f"]
  ],
  shell: [
    [/#[^\n]*/g, "c"],
    [/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`]*`/g, "s"],
    [/\b(cd|ls|cat|grep|npm|bun|git|echo|export|mkdir|rm|cp|mv|node|sudo|curl|wget|pnpm|yarn)\b/g, "k"],
    [/\b\d+(?:\.\d+)?\b/g, "n"]
  ],
  txt: []
}, Xn = {
  js: "js",
  jsx: "js",
  mjs: "js",
  cjs: "js",
  ts: "js",
  tsx: "js",
  json: "json",
  md: "md",
  markdown: "md",
  css: "css",
  scss: "css",
  html: "html",
  htm: "html",
  py: "python",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  ps1: "shell"
};
function Bt(e) {
  const t = String(e || "").split(".").pop().toLowerCase();
  return Xn[t] || "txt";
}
function er(e, t) {
  const n = an[t] || an.txt;
  let r = Zn(e);
  if (!n.length) return r;
  const i = [];
  for (const [l, a] of n)
    r = r.replace(l, (s) => (i.push(`<span class="yk-${a}">${s}</span>`), `\0${Qn(i.length - 1)}\0`));
  return r.replace(/\u0000([a-z]+)\u0000/g, (l, a) => {
    let s = 0;
    for (const v of a) s = s * 26 + (v.charCodeAt(0) - 96);
    return i[s - 1];
  });
}
const tr = (e) => /[a-zA-Z0-9_$]/.test(e), nr = {
  js: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "import", "export", "from", "default", "class", "new", "this", "async", "await", "try", "catch", "finally", "throw", "typeof", "instanceof", "null", "undefined", "true", "false", "switch", "case", "break", "continue", "delete", "in", "of", "yield", "static", "extends", "super", "require", "module"],
  jsx: ["const", "let", "function", "return", "import", "export", "default", "class", "new", "this", "async", "await", "null", "undefined", "true", "false", "style", "className", "onClick", "children", "props", "state", "useState", "useEffect"],
  ts: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "import", "export", "from", "default", "interface", "type", "class", "new", "this", "async", "await", "null", "undefined", "true", "false", "switch", "case", "break", "continue", "enum", "implements", "extends", "readonly", "private", "public", "protected", "static", "unknown", "never", "any", "string", "number", "boolean"],
  tsx: ["const", "let", "function", "return", "import", "export", "default", "interface", "type", "class", "new", "this", "async", "await", "null", "undefined", "true", "false", "style", "className", "onClick", "children", "props", "useState", "useEffect"],
  rs: ["fn", "let", "mut", "const", "struct", "enum", "impl", "trait", "use", "mod", "pub", "crate", "self", "match", "if", "else", "loop", "while", "for", "return", "async", "await", "move", "ref", "type", "dyn", "where", "unsafe", "true", "false", "None", "Some", "Ok", "Err", "String", "Vec", "Result", "Option"],
  py: ["def", "class", "return", "if", "elif", "else", "for", "while", "import", "from", "as", "with", "try", "except", "finally", "raise", "lambda", "None", "True", "False", "and", "or", "not", "is", "in", "pass", "break", "continue", "global", "self", "yield", "async", "await", "print", "len", "range", "list", "dict", "set"],
  sh: ["if", "then", "else", "elif", "fi", "for", "while", "do", "done", "case", "esac", "function", "return", "exit", "echo", "export", "local", "read", "cd", "ls", "mkdir", "rm", "cp", "mv", "grep", "sed", "awk", "sudo", "source", "true", "false"],
  css: ["color", "background", "display", "flex", "margin", "padding", "width", "height", "font", "font-size", "font-family", "font-weight", "border", "border-radius", "position", "absolute", "relative", "fixed", "top", "right", "bottom", "left", "overflow", "z-index", "opacity", "cursor", "gap", "align-items", "justify-content", "flex-direction", "transition", "transform", "box-shadow", "text-align", "text-decoration", "line-height", "white-space"],
  html: ["div", "span", "p", "a", "img", "ul", "ol", "li", "table", "tr", "td", "th", "form", "input", "button", "textarea", "select", "option", "header", "footer", "nav", "section", "article", "main", "aside", "class", "id", "style", "href", "src", "alt", "type", "name", "value", "placeholder", "disabled", "lang"],
  yml: ["name", "version", "description", "author", "icon", "category", "entry", "checksum", "permissions", "repo", "singleton", "true", "false", "null", "on", "off"],
  yaml: ["name", "version", "description", "author", "icon", "category", "entry", "checksum", "permissions", "repo", "singleton", "true", "false", "null", "on", "off"],
  toml: ["name", "version", "edition", "description", "features", "default", "dependencies", "path", "optional", "true", "false", "package", "bin", "lib"],
  json: ['"id"', '"name"', '"version"', '"author"', '"entry"', '"checksum"', '"permissions"', '"repo"', '"description"', '"true"', '"false"', '"null"']
}, rr = {
  js: "//",
  jsx: "//",
  ts: "//",
  tsx: "//",
  rs: "//",
  css: "//",
  py: "#",
  sh: "#",
  yml: "#",
  yaml: "#",
  toml: "#",
  html: "<!--",
  md: "<!--"
};
function ir(e) {
  return rr[e] || "";
}
function or(e) {
  const t = /* @__PURE__ */ new Map(), n = /[a-zA-Z_$][a-zA-Z0-9_$]{2,}/g;
  let r;
  for (; r = n.exec(e); ) {
    const i = r[0].toLowerCase();
    t.set(i, (t.get(i) || 0) + 1);
  }
  return t;
}
function lr(e, t, n) {
  if (!e || /^\d+$/.test(e)) return [];
  const r = e.toLowerCase(), i = [], l = /* @__PURE__ */ new Set(), a = [...n.entries()].filter(([s]) => s.startsWith(r) && s !== r).sort((s, v) => v[1] - s[1]).slice(0, 8);
  for (const [s] of a)
    i.push(s), l.add(s);
  for (const s of nr[t] || [])
    s.toLowerCase().startsWith(r) && !l.has(s) && (i.push(s), l.add(s));
  return i.slice(0, 12);
}
function sr(e, t) {
  if (!t) return { text: e, commented: e.trim().startsWith("//") };
  const n = e.split(`
`), r = (l) => {
    const a = l.trim();
    return t === "<!--" ? a.startsWith("<!--") && a.endsWith("-->") : a.startsWith(t);
  };
  return n.every(r) ? { text: n.map((a) => t === "<!--" ? a.replace(/^\s*<!--\s?/, "").replace(/\s?-->$/, "") : a.replace(new RegExp(`^(\\s*)${ar(t)}\\s?`), (s, v) => v)).join(`
`), commented: !1 } : { text: n.map((l) => t === "<!--" ? `${l.match(/^\s*/)[0]}<!-- ${l.trim()} -->` : l.replace(/^(\s*)/, (a, s) => `${s}${t} `)).join(`
`), commented: !0 };
}
function ar(e) {
  return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var cr = /* @__PURE__ */ y('<div style="position:absolute;top:4px;right:8px;zIndex:5;pointer-events:none;font-size:9.5px;color:var(--warning);background:color-mix(in srgb, var(--warning) 10%, transparent);padding:1px 7px;border-radius:8px;font-family:var(--font)">archivo grande — resaltado desactivado'), dr = /* @__PURE__ */ y('<div style="position:absolute;zIndex:10;min-width:180px;max-width:280px;left:12px;background:var(--bg-window);border:1px solid var(--border-window);border-radius:8px;box-shadow:var(--shadow);padding:4px;font-family:ui-monospace, Consolas, monospace;font-size:11.5px;max-height:220px;overflow:auto">'), ur = /* @__PURE__ */ y(`<div style=position:relative;flex:1;overflow:hidden;background:var(--bg-desktop);display:flex><style>
        .yk-k { color: var(--syntax-keyword); } .yk-s { color: var(--syntax-string); }
        .yk-c { color: var(--syntax-comment); font-style: italic; }
        .yk-n { color: var(--syntax-number); } .yk-f { color: var(--syntax-function); }
        .yk-p { color: var(--syntax-punct); }
      </style><div style="width:44px;flex-shrink:0;overflow:hidden;position:relative;background:var(--bg-window-header);border-right:1px solid var(--border-window);user-select:none"><div style=position:absolute;top:0;left:0;right:0><div></div><div></div></div></div><div style=position:relative;flex:1;overflow:hidden><div style="position:absolute;left:0;right:0;height:20px;pointer-events:none;background:color-mix(in srgb, var(--accent) 7%, transparent);zIndex:0"></div><pre aria-hidden=true style="position:absolute;inset:0;margin:0;overflow:hidden;color:var(--text-primary);pointer-events:none;zIndex:1;padding:10px 12px"></pre><textarea style="position:absolute;inset:0;border:none;outline:none;resize:none;background:transparent;color:transparent;caret-color:var(--text-primary);zIndex:2;padding:10px 12px">`), fr = /* @__PURE__ */ y('<div style="height:20px;line-height:20px;font-size:11px;paddingRight:7px;text-align:right;font-family:ui-monospace, Consolas, monospace">'), pr = /* @__PURE__ */ y('<div style="padding:3px 8px;border-radius:4px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">');
const cn = {
  "font-family": "ui-monospace, Consolas, monospace",
  "font-size": "12.5px",
  "line-height": "1.6",
  "white-space": "pre-wrap",
  "word-break": "break-all"
}, yt = 20, dn = 10, gr = 200;
function hr(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function xr(e) {
  const t = e.content.length > 1e5, n = Ze(() => t ? hr(e.content) : er(e.content, e.lang)), r = Ze(() => e.content.split(`
`).length), i = Ze(() => or(e.content.length > 12e4 ? e.content.slice(0, 12e4) : e.content));
  let l, a;
  const [s, v] = C(0), [$, b] = C({
    line: 1,
    col: 1
  }), [u, E] = C(null);
  let P = [], Y = [];
  function I() {
    const d = a;
    d && (P.push({
      v: d.value,
      s: d.selectionStart,
      e: d.selectionEnd
    }), P.length > gr && P.shift(), Y = []);
  }
  function L(d) {
    const w = a;
    w && (w.value = d.v, w.setSelectionRange(d.s, d.e), e.onChange(d.v), A(w), E(null));
  }
  function S() {
    const d = a;
    d && P.length && (Y.push({
      v: d.value,
      s: d.selectionStart,
      e: d.selectionEnd
    }), L(P.pop()));
  }
  function p() {
    const d = a;
    d && Y.length && (P.push({
      v: d.value,
      s: d.selectionStart,
      e: d.selectionEnd
    }), L(Y.pop()));
  }
  function A(d) {
    const w = d.selectionStart, T = e.content.slice(0, w).split(`
`), z = {
      line: T.length,
      col: T[T.length - 1].length + 1
    };
    b(z), e.onCursor?.(z.line, z.col), e.onSelection?.(d.selectionStart !== d.selectionEnd);
  }
  function U(d) {
    l && (l.scrollTop = d.target.scrollTop, l.scrollLeft = d.target.scrollLeft), v(d.target.scrollTop);
  }
  function re(d, w, _, T) {
    I(), d.value = w, d.setSelectionRange(_, T), e.onChange(w), A(d);
  }
  function Ee(d) {
    const w = d.target, _ = w.selectionStart, T = w.selectionEnd, z = w.value;
    if (_ === T) {
      if (!z.length) return;
      const ae = z.lastIndexOf(`
`, _ - 1) + 1;
      let oe = z.indexOf(`
`, _);
      oe === -1 && (oe = z.length);
      const $e = z.slice(ae, oe), pe = oe < z.length || !z.endsWith(`
`) ? `
` : "", ce = z.slice(0, oe) + pe + $e + z.slice(oe), qe = oe + pe.length + $e.length;
      re(w, ce, qe, qe);
    } else {
      const ae = z.slice(_, T);
      re(w, z.slice(0, T) + ae + z.slice(T), T, T + ae.length);
    }
  }
  function ve(d) {
    const w = d.target, _ = w.selectionStart, T = w.selectionEnd, z = w.value, ae = ir(e.lang), oe = z.lastIndexOf(`
`, _ - 1) + 1;
    let $e = z.indexOf(`
`, T);
    $e === -1 && ($e = z.length);
    const pe = z.slice(oe, $e), ce = sr(pe, ae);
    re(w, z.slice(0, oe) + ce.text + z.slice($e), oe, oe + ce.text.length);
  }
  function ie(d, w) {
    const _ = d.target, T = _.selectionStart, z = _.value;
    if (!z.length) return;
    const ae = z.lastIndexOf(`
`, T - 1) + 1;
    let oe = z.indexOf(`
`, T);
    oe === -1 && (oe = z.length);
    const $e = oe < z.length ? oe + 1 : oe;
    if (w < 0) {
      if (ae === 0) return;
      const pe = z.lastIndexOf(`
`, ae - 2) + 1, ce = z.slice(0, pe) + z.slice(ae, $e) + z.slice(pe, ae) + z.slice($e), qe = pe + ($e - ae) + (T - ae);
      re(_, ce, qe, qe);
    } else {
      if ($e >= z.length) return;
      const pe = $e;
      let ce = z.indexOf(`
`, pe + 1);
      ce === -1 ? ce = z.length : ce += 1;
      const qe = z.slice(0, ae) + z.slice(pe, ce) + z.slice(ae, $e) + z.slice(ce), M = ae + (ce - pe) + (T - ae);
      re(_, qe, M, M);
    }
  }
  function F(d) {
    const w = d.selectionStart, _ = d.value;
    let T = w - 1;
    for (; T >= 0 && tr(_[T]); ) T--;
    const z = _.slice(T + 1, w);
    if (z.length < 1) {
      E(null);
      return;
    }
    const ae = lr(z, e.lang, i());
    if (!ae.length) {
      E(null);
      return;
    }
    E({
      start: T + 1,
      items: ae,
      idx: 0
    });
  }
  function q() {
    const d = u();
    if (!d) return;
    const w = a, _ = w.value, T = d.items[d.idx], z = d.start + T.length;
    re(w, _.slice(0, d.start) + T + _.slice(w.selectionStart), z, z), E(null);
  }
  function Q(d) {
    const w = d.ctrlKey || d.metaKey;
    if (w && d.key === "s") {
      d.preventDefault(), e.onSave?.();
      return;
    }
    if (w && !d.shiftKey && d.key === "z") {
      d.preventDefault(), S();
      return;
    }
    if (w && d.shiftKey && d.key === "Z") {
      d.preventDefault(), p();
      return;
    }
    if (w && !d.shiftKey && d.key === "y") {
      d.preventDefault(), p();
      return;
    }
    if (u()) {
      if (d.key === "Enter" || d.key === "Tab") {
        d.preventDefault(), q();
        return;
      }
      if (d.key === "ArrowDown") {
        d.preventDefault(), E((_) => _ && {
          ..._,
          idx: (_.idx + 1) % _.items.length
        });
        return;
      }
      if (d.key === "ArrowUp") {
        d.preventDefault(), E((_) => _ && {
          ..._,
          idx: (_.idx - 1 + _.items.length) % _.items.length
        });
        return;
      }
      if (d.key === "Escape") {
        d.preventDefault(), E(null);
        return;
      }
    }
    if (w && d.key === "d") {
      d.preventDefault(), Ee(d);
      return;
    }
    if (w && d.key === "/") {
      d.preventDefault(), ve(d);
      return;
    }
    if (d.altKey && d.key === "ArrowUp") {
      d.preventDefault(), ie(d, -1);
      return;
    }
    if (d.altKey && d.key === "ArrowDown") {
      d.preventDefault(), ie(d, 1);
      return;
    }
    if (d.key === "Tab" && !w) {
      d.preventDefault();
      const _ = d.target, T = _.selectionStart, z = _.value;
      re(_, z.slice(0, T) + "  " + z.slice(_.selectionEnd), T + 2, T + 2);
    }
  }
  Pt(() => {
    a && a.value !== e.content && (a.value = e.content, e.onTa?.(a), A(a));
  });
  const m = () => Math.max(0, Math.floor(s() / yt) - 8), X = () => 48, B = Ze(() => {
    const d = r(), w = Math.min(m(), d), _ = Math.min(w + X(), d);
    return {
      start: w,
      end: _,
      n: d
    };
  });
  return (() => {
    var d = ur(), w = d.firstChild, _ = w.nextSibling, T = _.firstChild, z = T.firstChild, ae = z.nextSibling, oe = _.nextSibling, $e = oe.firstChild, pe = $e.nextSibling, ce = pe.nextSibling;
    c(T, f(Re, {
      get each() {
        return Array.from({
          length: B().end - B().start
        }, (M, ze) => B().start + ze + 1);
      },
      children: (M) => (() => {
        var ze = fr();
        return c(ze, M), K((_e) => {
          var De = M === $().line ? "var(--accent)" : "var(--text-secondary)", Pe = M === $().line ? 700 : 400, j = M === $().line ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent";
          return De !== _e.e && ee(ze, "color", _e.e = De), Pe !== _e.t && ee(ze, "font-weight", _e.t = Pe), j !== _e.a && ee(ze, "background", _e.a = j), _e;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        }), ze;
      })()
    }), ae), c(oe, f(R, {
      when: t,
      get children() {
        return cr();
      }
    }), $e);
    var qe = l;
    return typeof qe == "function" ? ot(qe, pe) : l = pe, ce.addEventListener("blur", () => setTimeout(() => E(null), 150)), ce.addEventListener("select", (M) => {
      A(M.target), F(M.target);
    }), ce.$$keyup = (M) => A(M.target), ce.$$keydown = Q, ce.addEventListener("scroll", U), ce.$$beforeinput = () => I(), ce.$$input = (M) => {
      e.onChange(M.target.value), A(M.target), F(M.target);
    }, ot((M) => {
      a = M, M && !M.dataset.initialized && (M.value = e.content, M.dataset.initialized = "1", e.onTa?.(M));
    }, ce), et(ce, "spellcheck", !1), c(oe, f(R, {
      get when() {
        return u();
      },
      get children() {
        var M = dr();
        return M.$$mousedown = (ze) => ze.preventDefault(), c(M, f(Re, {
          get each() {
            return u().items;
          },
          children: (ze, _e) => (() => {
            var De = pr();
            return De.$$click = () => {
              const Pe = u();
              Pe && (E({
                ...Pe,
                idx: _e()
              }), q());
            }, c(De, ze), K((Pe) => {
              var j = _e() === u().idx ? "var(--text-primary)" : "var(--text-secondary)", J = _e() === u().idx ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "transparent";
              return j !== Pe.e && ee(De, "color", Pe.e = j), J !== Pe.t && ee(De, "background", Pe.t = J), Pe;
            }, {
              e: void 0,
              t: void 0
            }), De;
          })()
        })), K((ze) => ee(M, "top", `${Math.min($().line * yt + dn - s(), 120)}px`)), M;
      }
    }), null), K((M) => {
      var ze = `${B().start * yt}px`, _e = `${(B().n - B().end) * yt}px`, De = `${($().line - 1) * yt + dn - s()}px`, Pe = {
        ...cn
      }, j = n(), J = {
        ...cn
      };
      return ze !== M.e && ee(z, "height", M.e = ze), _e !== M.t && ee(ae, "height", M.t = _e), De !== M.a && ee($e, "top", M.a = De), M.o = xe(pe, Pe, M.o), j !== M.i && (pe.innerHTML = M.i = j), M.n = xe(ce, J, M.n), M;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0
    }), d;
  })();
}
pt(["input", "beforeinput", "keydown", "keyup", "mousedown", "click"]);
var vr = /* @__PURE__ */ y("<div style=font-size:11px;color:var(--text-muted)>Cargando…"), mr = /* @__PURE__ */ y("<div style=font-size:10.5px;color:var(--danger)>⛔ "), yr = /* @__PURE__ */ y("<div style=font-size:11px;color:var(--text-muted);opacity:0.7>Vacío"), br = /* @__PURE__ */ y("<div><div style=display:flex;align-items:center;gap:4px;cursor:pointer;border-radius:4px;font-size:11px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap><span></span><span>"), wr = /* @__PURE__ */ y('<div style="padding:4px 6px;border-bottom:1px solid var(--border-window)"><input class=yola-input placeholder="Buscar archivo por nombre…"style="width:100%;padding:4px 7px;border:1px solid var(--border-window);border-radius:5px;background:var(--bg-desktop);color:var(--text-primary);outline:none;font-size:11px;font-family:var(--font);box-sizing:border-box">'), $r = /* @__PURE__ */ y("<div style=padding:8px;font-size:10.5px;color:var(--danger)>⛔ "), kr = /* @__PURE__ */ y("<div style=padding:8px;font-size:11px;color:var(--text-muted)>Buscando…"), _r = /* @__PURE__ */ y("<div tabindex=0 style=position:fixed;inset:0;zIndex:50>"), Sr = /* @__PURE__ */ y('<div tabindex=-1 style="position:fixed;zIndex:51;background:var(--bg-window);border:1px solid var(--border-window);border-radius:8px;box-shadow:var(--shadow);padding:4px;min-width:150px;font-size:11px;font-family:var(--font)">'), Cr = /* @__PURE__ */ y('<div style=display:flex;flex-direction:column;height:100%><div style="padding:5px 8px;font-size:10.5px;color:var(--text-secondary);border-bottom:1px solid var(--border-window);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace"></div><div style="flex:1;overflow-y:auto;padding:4px 0 8px">'), Ar = /* @__PURE__ */ y('<div style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:3px 8px 3px 6px;border-radius:4px;font-size:11px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-primary)"><span>📄</span><span></span><span style=color:var(--text-muted);font-size:10px;margin-left:auto;overflow:hidden;text-overflow:ellipsis>'), Er = /* @__PURE__ */ y("<div style=padding:8px;font-size:11px;color:var(--text-muted)>Sin archivos con «<!>»"), zr = /* @__PURE__ */ y('<div style="padding:12px 8px;font-size:11px;color:var(--text-muted)">Sin workspace. Usa ☰ para abrir uno.'), Tr = /* @__PURE__ */ y('<div style="padding:5px 10px;border-radius:5px;cursor:pointer;white-space:nowrap">');
function Or(e) {
  const [t, n] = C({}), [r, i] = C(null), [l, a] = C(null);
  let s = null, v = null;
  const [$, b] = C(""), [u, E] = C(null), [P, Y] = C(!1), [I, L] = C("");
  let S = null, p = null;
  async function A(F) {
    n((q) => ({
      ...q,
      [F]: null
    }));
    try {
      const q = await e.filesApi.list(e.workspace, F === "/" ? "" : F), Q = Array.isArray(q) ? q : [];
      n((m) => ({
        ...m,
        [F]: {
          loaded: !0,
          entries: Q
        }
      }));
    } catch (q) {
      n((Q) => ({
        ...Q,
        [F]: {
          loaded: !0,
          entries: [],
          error: q.message
        }
      }));
    }
  }
  async function U(F) {
    if (!F) {
      E(null), Y(!1), L("");
      return;
    }
    Y(!0), p && p.abort();
    const q = new AbortController();
    p = q;
    const Q = [], m = F.toLowerCase();
    let X = "";
    async function B(d, w) {
      if (q.signal.aborted || w > 6) return;
      let _;
      try {
        _ = await e.filesApi.list(e.workspace, d === "/" ? "" : d);
      } catch (T) {
        X = T.message;
        return;
      }
      for (const T of _) {
        if (q.signal.aborted) return;
        if (T.type === "dir") await B(T.path, w + 1);
        else if ((T.name || "").toLowerCase().includes(m) && (Q.push({
          path: T.path,
          absolute: T.absolute || T.path,
          name: T.name
        }), Q.length >= 100))
          return;
      }
    }
    await B("/", 0), q.signal.aborted || (E(Q), Y(!1), L(X));
  }
  const [re, Ee] = C(0);
  vt(() => {
    l() && v && v.focus();
  }), vt(() => {
    const F = e.workspace, q = e.refresh || 0;
    (F !== r() || q !== re()) && (i(F), Ee(q), n({}), b(""), E(null), F && A("/"));
  });
  function ve(F) {
    if (t()[F]?.loaded) {
      n((q) => {
        const Q = {
          ...q
        };
        return delete Q[F], Q;
      });
      return;
    }
    A(F);
  }
  function ie(F, q) {
    const Q = t()[F];
    return Q === null ? (() => {
      var m = vr();
      return ee(m, "padding", `${4 + q * 14}px 8px`), m;
    })() : Q?.error ? (() => {
      var m = mr();
      return m.firstChild, ee(m, "padding", `${4 + q * 14}px 8px`), c(m, () => Q.error, null), K(() => et(m, "title", Q.error)), m;
    })() : Q?.entries?.length ? f(Re, {
      get each() {
        return Q.entries;
      },
      children: (m) => (() => {
        var X = br(), B = X.firstChild, d = B.firstChild, w = d.nextSibling;
        return B.$$contextmenu = (_) => {
          _.preventDefault(), _.stopPropagation(), a({
            x: _.clientX,
            y: _.clientY,
            item: m
          });
        }, B.$$click = () => m.type === "dir" ? ve(m.path) : e.onOpenFile?.(m.absolute || m.path), ee(B, "padding", `3px 8px 3px ${6 + q * 14}px`), c(d, () => m.type === "dir" ? "📁" : "📄"), c(w, () => m.name), c(X, f(R, {
          get when() {
            return Le(() => m.type === "dir")() && t()[m.path]?.loaded;
          },
          get children() {
            return ie(m.path, q + 1);
          }
        }), null), K((_) => ee(B, "color", m.type === "dir" ? "var(--text-secondary)" : "var(--text-primary)")), X;
      })()
    }) : (() => {
      var m = yr();
      return ee(m, "padding", `${4 + q * 14}px 8px`), m;
    })();
  }
  return (() => {
    var F = Cr(), q = F.firstChild, Q = q.nextSibling;
    return c(q, () => e.workspace || "sin workspace"), c(F, f(R, {
      get when() {
        return e.workspace;
      },
      get children() {
        var m = wr(), X = m.firstChild;
        return X.$$input = (B) => {
          b(B.target.value), clearTimeout(S), S = setTimeout(() => U(B.target.value.trim()), 280);
        }, K(() => X.value = $()), m;
      }
    }), Q), c(Q, f(R, {
      get when() {
        return Le(() => !!$())() && u() !== null;
      },
      get children() {
        return [f(R, {
          get when() {
            return I();
          },
          get children() {
            var m = $r();
            return m.firstChild, c(m, I, null), m;
          }
        }), f(R, {
          get when() {
            return P();
          },
          get fallback() {
            return Le(() => !!u().length)() ? f(Re, {
              get each() {
                return u();
              },
              children: (m) => (() => {
                var X = Ar(), B = X.firstChild, d = B.nextSibling, w = d.nextSibling;
                return X.$$click = () => e.onOpenFile?.(m.absolute), c(d, () => m.name), c(w, () => m.path), X;
              })()
            }) : (() => {
              var m = Er(), X = m.firstChild, B = X.nextSibling;
              return B.nextSibling, c(m, $, B), m;
            })();
          },
          get children() {
            return kr();
          }
        })];
      }
    }), null), c(Q, f(R, {
      get when() {
        return !$() || u() === null;
      },
      get children() {
        return f(R, {
          get when() {
            return e.workspace;
          },
          get fallback() {
            return zr();
          },
          get children() {
            return ie("/", 0);
          }
        });
      }
    }), null), c(F, f(R, {
      get when() {
        return l();
      },
      get children() {
        return [(() => {
          var m = _r(), X = v;
          return typeof X == "function" ? ot(X, m) : v = m, m.$$keydown = (B) => {
            B.key === "Escape" && a(null);
          }, m.$$contextmenu = (B) => {
            B.preventDefault(), a(null);
          }, m.$$click = () => a(null), m;
        })(), (() => {
          var m = Sr();
          m.$$keydown = (B) => {
            B.key === "Escape" && a(null);
          };
          var X = s;
          return typeof X == "function" ? ot(X, m) : s = m, c(m, f(At, {
            label: "➕ Nuevo archivo aquí",
            onClick: () => {
              e.onAction?.("new-file", l().item), a(null);
            }
          }), null), c(m, f(At, {
            label: "📁 Nueva carpeta aquí",
            onClick: () => {
              e.onAction?.("new-folder", l().item), a(null);
            }
          }), null), c(m, f(At, {
            label: "✏️ Renombrar",
            onClick: () => {
              e.onAction?.("rename", l().item), a(null);
            }
          }), null), c(m, f(At, {
            label: "🗑️ Eliminar",
            danger: !0,
            onClick: () => {
              e.onAction?.("delete", l().item), a(null);
            }
          }), null), K((B) => {
            var d = `${Math.min(l().x, window.innerWidth - 170)}px`, w = `${Math.min(l().y, window.innerHeight - 150)}px`;
            return d !== B.e && ee(m, "left", B.e = d), w !== B.t && ee(m, "top", B.t = w), B;
          }, {
            e: void 0,
            t: void 0
          }), m;
        })()];
      }
    }), null), K(() => et(q, "title", e.workspace)), F;
  })();
}
function At(e) {
  return (() => {
    var t = Tr();
    return t.$$mouseout = (n) => {
      n.currentTarget.style.background = "transparent";
    }, t.$$mouseover = (n) => {
      n.currentTarget.style.background = "var(--bg-window-header)";
    }, wt(t, "click", e.onClick), c(t, () => e.label), K((n) => ee(t, "color", e.danger ? "var(--danger)" : "var(--text-primary)")), t;
  })();
}
pt(["click", "contextmenu", "input", "keydown", "mouseover", "mouseout"]);
var Lr = /* @__PURE__ */ y("<div style=padding:12px;font-size:11px;color:var(--text-muted);text-align:center>"), jr = /* @__PURE__ */ y('<div style=position:absolute;inset:0;zIndex:30;background:var(--bg-overlay);display:flex;align-items:flex-start;justify-content:center;paddingTop:60px><div style="width:440px;max-width:90%;background:var(--bg-window);border:1px solid var(--border-window);border-radius:10px;box-shadow:var(--shadow);overflow:hidden"><input class=yola-input style="width:100%;box-sizing:border-box;padding:10px 12px;border:none;border-bottom:1px solid var(--border-window);background:var(--bg-window);color:var(--text-primary);outline:none;font-size:13px;font-family:var(--font)"><div style=max-height:300px;overflow-y:auto;padding:4px>'), Dr = /* @__PURE__ */ y("<span style=margin-left:auto;font-size:10px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px>"), Pr = /* @__PURE__ */ y('<div style="padding:6px 10px;border-radius:6px;cursor:pointer;display:flex;gap:8px;align-items:center;font-size:12px"><span style=flex-shrink:0></span><span style=overflow:hidden;text-overflow:ellipsis;white-space:nowrap>');
function Ir(e, t) {
  e = e.toLowerCase(), t = t.toLowerCase();
  let n = 0;
  for (const r of t)
    if (r === e[n] && n++, n === e.length) return !0;
  return n === e.length;
}
function Mr(e) {
  const [t, n] = C(""), [r, i] = C(0);
  let l;
  vt(() => {
    e.open && (i(0), setTimeout(() => l?.focus(), 10));
  });
  const a = () => e.mode === "files", s = Ze(() => {
    const b = t().trim();
    if (a()) {
      const u = e.files || [];
      if (!b) {
        const P = e.recent || [], Y = new Set(P.map((L) => L.path)), I = u.filter((L) => !Y.has(L.path));
        return [...P, ...I].slice(0, 30);
      }
      return u.filter((P) => Ir(b, P.name + "/" + (P.path.split("/").pop() || ""))).slice(0, 30);
    }
    return b ? e.commands.filter((u) => u.label.toLowerCase().includes(b.toLowerCase())).slice(0, 30) : e.commands;
  });
  function v(b) {
    e.onClose?.(), a() ? e.onOpenFile?.(b) : b.run();
  }
  function $(b) {
    if (b.key === "Escape") {
      e.onClose?.();
      return;
    }
    if (b.key === "Enter") {
      const u = s();
      u[r()] && v(u[r()]);
      return;
    }
    if (b.key === "ArrowDown") {
      b.preventDefault(), i((u) => Math.min(u + 1, s().length - 1));
      return;
    }
    if (b.key === "ArrowUp") {
      b.preventDefault(), i((u) => Math.max(u - 1, 0));
      return;
    }
  }
  return f(R, {
    get when() {
      return e.open;
    },
    get children() {
      var b = jr(), u = b.firstChild, E = u.firstChild, P = E.nextSibling;
      E.$$keydown = $, E.$$input = (I) => {
        n(I.target.value), i(0);
      };
      var Y = l;
      return typeof Y == "function" ? ot(Y, E) : l = E, c(P, f(Re, {
        get each() {
          return s();
        },
        children: (I, L) => (() => {
          var S = Pr(), p = S.firstChild, A = p.nextSibling;
          return S.$$mousemove = () => i(L()), S.$$click = () => v(I), c(p, (() => {
            var U = Le(() => !!a());
            return () => U() ? "📄" : I.icon || "•";
          })()), c(A, (() => {
            var U = Le(() => !!a());
            return () => U() ? I.name || I.path.split("/").pop() : I.label;
          })()), c(S, f(R, {
            get when() {
              return Le(() => !!a())() && I.path;
            },
            get children() {
              var U = Dr();
              return c(U, () => I.path.replace(/^.*[\\/]/, "")), U;
            }
          }), null), K((U) => ee(S, "background", L() === r() ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "transparent")), S;
        })()
      }), null), c(P, f(R, {
        get when() {
          return !s().length;
        },
        get children() {
          var I = Lr();
          return c(I, () => a() ? "Sin archivos que coincidan" : "Sin comandos que coincidan"), I;
        }
      }), null), K(() => et(E, "placeholder", a() ? "Archivo…" : "Comando…")), K(() => E.value = t()), b;
    }
  });
}
pt(["input", "keydown", "click", "mousemove"]);
var Rr = /* @__PURE__ */ y("<div style=padding:8px;font-size:10.5px;color:var(--danger)>⛔ "), Nr = /* @__PURE__ */ y("<div style=padding:12px;font-size:11px;color:var(--text-muted);text-align:center>Buscando…"), Fr = /* @__PURE__ */ y("<div style=padding:12px;font-size:11px;color:var(--text-muted);text-align:center>Sin resultados para «<!>»"), Wr = /* @__PURE__ */ y('<div style=position:absolute;inset:0;zIndex:20;background:var(--bg-overlay);display:flex;align-items:flex-start;justify-content:center;paddingTop:40px><div style="width:600px;max-width:92%;background:var(--bg-window);border:1px solid var(--border-window);border-radius:10px;box-shadow:var(--shadow);overflow:hidden;display:flex;flex-direction:column"><div style=display:flex;gap:6px;padding:8px;align-items:center><span style=font-size:12px>🔍</span><input class=yola-input placeholder="Buscar en todos los archivos del workspace…"style="flex:1;padding:6px 10px;border:1px solid var(--border-window);border-radius:6px;background:var(--bg-desktop);color:var(--text-primary);outline:none;font-family:var(--font);font-size:12px"><button>Buscar</button><button aria-label="Cerrar búsqueda">✕</button></div><div style="max-height:340px;overflow-y:auto;padding:4px 6px 8px">'), qr = /* @__PURE__ */ y('<div style=margin-bottom:4px><div style="padding:4px 8px;font-size:11px;font-weight:600;color:var(--accent);font-family:monospace;cursor:pointer;display:flex;gap:6px;align-items:center;border-radius:5px"><span>📄</span><span style=overflow:hidden;text-overflow:ellipsis;white-space:nowrap></span><span style=color:var(--text-muted);font-weight:400;font-size:10px> match'), Br = /* @__PURE__ */ y('<div style="padding:3px 8px 3px 22px;border-radius:5px;cursor:pointer;font-size:11px;font-family:monospace;display:flex;gap:8px"><span style=color:var(--text-muted);flex-shrink:0></span><span style=color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap>');
function Hr(e) {
  const [t, n] = C(null), [r, i] = C(!1), [l, a] = C("");
  let s = null;
  async function v() {
    const b = e.query().trim();
    if (!b || !e.workspace || !e.filesApi) return;
    i(!0), a(""), n([]), s && s.abort();
    const u = new AbortController();
    s = u;
    const E = /* @__PURE__ */ new Map(), P = b.toLowerCase();
    let Y = "";
    async function I(L, S) {
      if (u.signal.aborted || S > 6) return;
      let p;
      try {
        p = await e.filesApi.list(e.workspace, L === "/" ? "" : L);
      } catch (A) {
        Y || (Y = A.message);
        return;
      }
      for (const A of p) {
        if (u.signal.aborted) return;
        if (A.type === "dir")
          await I(A.path, S + 1);
        else {
          const U = A.name || "";
          if (!/\.(js|jsx|ts|tsx|css|html|md|json|py|sh|rs|toml|txt|yml|yaml)$/i.test(U)) continue;
          try {
            const re = await e.filesApi.read(A.absolute || A.path), Ee = String(re).split(`
`);
            let ve = null;
            for (let ie = 0; ie < Ee.length && !(Ee[ie].toLowerCase().includes(P) && (ve || (ve = {
              path: A.absolute || A.path,
              name: U,
              lines: []
            }, E.set(ve.path, ve)), ve.lines.push({
              line: ie + 1,
              text: Ee[ie].trim().slice(0, 120)
            }), ve.lines.length >= 50)); ie++)
              ;
            if (E.size >= 20) return;
          } catch {
          }
        }
      }
    }
    await I("/", 0), u.signal.aborted || (n([...E.values()]), a(Y), i(!1));
  }
  let $ = null;
  return f(R, {
    get when() {
      return e.open;
    },
    get children() {
      var b = Wr(), u = b.firstChild, E = u.firstChild, P = E.firstChild, Y = P.nextSibling, I = Y.nextSibling, L = I.nextSibling, S = E.nextSibling;
      return wt(b, "click", e.onClose), u.$$click = (p) => p.stopPropagation(), Y.$$keydown = (p) => {
        p.key === "Enter" && v(), p.key === "Escape" && e.onClose();
      }, Y.$$input = (p) => {
        e.onQuery(p.target.value), clearTimeout($), $ = setTimeout(() => {
          e.open && v();
        }, 350);
      }, I.$$click = v, wt(L, "click", e.onClose), c(S, f(R, {
        get when() {
          return l();
        },
        get children() {
          var p = Rr();
          return p.firstChild, c(p, l, null), p;
        }
      }), null), c(S, f(R, {
        get when() {
          return r();
        },
        get children() {
          return Nr();
        }
      }), null), c(S, f(R, {
        get when() {
          return Le(() => !r() && t() !== null)() && !t().length;
        },
        get children() {
          var p = Fr(), A = p.firstChild, U = A.nextSibling;
          return U.nextSibling, c(p, () => e.query(), U), p;
        }
      }), null), c(S, f(Re, {
        get each() {
          return t();
        },
        children: (p) => (() => {
          var A = qr(), U = A.firstChild, re = U.firstChild, Ee = re.nextSibling, ve = Ee.nextSibling, ie = ve.firstChild;
          return U.$$click = () => e.onOpenFile?.(p.path, p.lines[0]?.line || 1), c(Ee, () => p.name), c(ve, () => p.lines.length, ie), c(ve, () => p.lines.length === 1 ? "" : "es", null), c(A, f(Re, {
            get each() {
              return p.lines;
            },
            children: (F) => (() => {
              var q = Br(), Q = q.firstChild, m = Q.nextSibling;
              return q.$$click = () => e.onOpenFile?.(p.path, F.line), c(Q, () => F.line), c(m, () => F.text), q;
            })()
          }), null), A;
        })()
      }), null), K((p) => {
        var A = un, U = un;
        return p.e = xe(I, A, p.e), p.t = xe(L, U, p.t), p;
      }, {
        e: void 0,
        t: void 0
      }), K(() => Y.value = e.query()), b;
    }
  });
}
const un = {
  padding: "5px 10px",
  "min-height": "26px",
  cursor: "pointer",
  border: "1px solid var(--border-window)",
  "border-radius": "6px",
  background: "transparent",
  color: "var(--text-primary)",
  "font-size": "11px",
  "font-family": "var(--font)"
};
pt(["click", "input", "keydown"]);
function Kr(e) {
  const t = e.trim();
  if (!t.startsWith("data: ")) return null;
  const n = t.slice(6);
  if (n === "[DONE]") return { done: !0 };
  try {
    return { event: JSON.parse(n) };
  } catch {
    return null;
  }
}
function fn(e) {
  const t = e.match(/```([\w+-]*)[ \t]*\n?([\s\S]*?)```/);
  return t ? { lang: t[1] || "", code: t[2].replace(/\n$/, "") } : null;
}
function Ur(e) {
  return {
    baseUrl: e,
    async createSession(t = {}) {
      const n = await fetch(`${e}/api/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "yola-chat",
          model: "deepseek-v4-flash-free",
          provider: "opencode",
          ...t
        })
      });
      if (!n.ok) {
        let r = "";
        try {
          r = await n.text();
        } catch {
        }
        throw new Error(`sessions HTTP ${n.status}: ${r}`);
      }
      return n.json();
    },
    async listSessions() {
      const t = await fetch(`${e}/api/v1/sessions`);
      if (!t.ok) throw new Error(`sessions HTTP ${t.status}`);
      return t.json();
    },
    async deleteSession(t) {
      const n = await fetch(`${e}/api/v1/sessions/${encodeURIComponent(t)}`, { method: "DELETE" });
      if (!n.ok) throw new Error(`sessions DELETE HTTP ${n.status}`);
    },
    /// Envía un prompt y emite el stream en vivo.
    /// callbacks: { onToken(text), onToolCall(ev), onToolResult(ev), onDone(), onError(err), signal }
    async sendPrompt(t, n, { onToken: r, onToolCall: i, onToolResult: l, onDone: a, onError: s, signal: v } = {}) {
      let $;
      try {
        $ = await fetch(`${e}/api/v1/sessions/${encodeURIComponent(t)}/prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: n }),
          signal: v
        });
      } catch (P) {
        if (P.name === "AbortError") {
          a?.();
          return;
        }
        s?.(P);
        return;
      }
      if (!$.ok) {
        let P = "";
        try {
          P = await $.text();
        } catch {
        }
        s?.(new Error(`prompt HTTP ${$.status}: ${P}`));
        return;
      }
      const b = $.body?.getReader();
      if (!b) {
        s?.(new Error("sin stream de lectura"));
        return;
      }
      const u = new TextDecoder();
      let E = "";
      try {
        for (; ; ) {
          const { value: P, done: Y } = await b.read();
          if (Y) break;
          E += u.decode(P, { stream: !0 });
          const I = E.split(`
`);
          E = I.pop() || "";
          for (const L of I) {
            const S = Kr(L);
            if (!S) continue;
            if (S.done) {
              a?.();
              return;
            }
            const p = S.event;
            p.type === "token" || p.type === "reasoning" ? r?.(p.text) : p.type === "tool_call" ? i?.(p) : p.type === "tool_result" ? l?.(p) : p.type === "error" && s?.(new Error(p.text || "error del agente"));
          }
        }
        a?.();
      } catch (P) {
        P.name === "AbortError" ? a?.() : s?.(P);
      }
    }
  };
}
function Yr(e) {
  if (!e) return [];
  const t = [];
  for (const n of e.split(`
`)) {
    const r = n.match(/^\s*(?:[-*]?\s*)?(?:\[([ xX])\]\s*|([☐□○])\s*|([☑✓✔])\s*)(.+)$/);
    if (r) {
      const i = r[1] ? r[1].toLowerCase() === "x" : !!r[3], l = (r[2] || r[3], (r[4] || "").trim());
      t.push({ title: l, done: i });
    } else {
      const i = n.match(/^\s*[-*]\s+(.+)$/);
      i && t.length === 0 && t.push({ title: i[1].trim(), done: !1 });
    }
  }
  return t;
}
function Jr(e, t) {
  const n = e ? String(e).split(`
`) : [], r = t ? String(t).split(`
`) : [], i = [], l = Math.max(n.length, r.length);
  for (let s = 0; s < l; s++)
    s < n.length && s < r.length ? (i.push(n[s] === r[s] ? { type: " ", text: n[s] } : { type: "-", text: n[s] }), n[s] !== r[s] && i.push({ type: "+", text: r[s] })) : s < n.length ? i.push({ type: "-", text: n[s] }) : i.push({ type: "+", text: r[s] });
  if (i.length > 40) {
    const s = i.slice(0, 18), v = i.slice(-18);
    return [...s, { type: "…", text: `… ${i.length - 36} líneas más …` }, ...v];
  }
  return i;
}
function Vr(e) {
  return !!e && /^(write|edit|apply_patch|patch|create)$/i.test(e);
}
function Gr(e) {
  return !e || typeof e != "object" ? null : e.path || e.file || null;
}
var Zr = /* @__PURE__ */ y('<span style="font-size:9.5px;color:var(--accent);background:color-mix(in srgb, var(--accent) 14%, transparent);padding:1px 6px;border-radius:8px">#yola-code'), Qr = /* @__PURE__ */ y('<div style="display:flex;gap:4px;padding:4px 6px;border-bottom:1px solid var(--border-window);flex-shrink:0;overflow-x:auto;flex-wrap:wrap">'), Xr = /* @__PURE__ */ y('<div style="margin-bottom:8px;border-radius:8px;border:1px solid color-mix(in srgb, var(--accent) 30%, var(--border-window));padding:7px;background:color-mix(in srgb, var(--accent) 5%, transparent)"><div style=font-size:10px;font-weight:700;color:var(--accent);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.4px>📋 Plan propuesto</div><div style=display:flex;flex-direction:column;gap:3px></div><button class=yola-btn style="margin-top:6px;width:100%;color:var(--success);border:1px solid color-mix(in srgb, var(--success) 45%, transparent);background:color-mix(in srgb, var(--success) 12%, transparent)">✅ Aprobar y ejecutar'), ei = /* @__PURE__ */ y('<div style="margin-bottom:8px;border-radius:8px;border:1px solid color-mix(in srgb, var(--warning) 30%, var(--border-window));padding:7px;background:color-mix(in srgb, var(--warning) 4%, transparent)"><div style=font-size:10px;font-weight:700;color:var(--warning);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.4px>🩹 Cambios del agente (<!>)</div><div style=display:flex;flex-direction:column;gap:5px>'), ti = /* @__PURE__ */ y('<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:16px 4px;line-height:1.6">Pídele al agente que edite tu código.<br><span style=font-size:10px>Contexto automático del archivo activo.<br>Con una selección, puedes pedir «mejora esto».'), ni = /* @__PURE__ */ y("<div style=font-size:10.5px;color:var(--danger);padding:4px>"), ri = /* @__PURE__ */ y('<div style="font-size:10.5px;color:var(--success);padding:0 2px 4px">'), ii = /* @__PURE__ */ y('<div style="display:flex;align-items:center;gap:5px;padding:3px 8px;margin-bottom:5px;border-radius:7px;font-size:10px;color:var(--accent);background:color-mix(in srgb, var(--accent) 10%, transparent);border:1px solid color-mix(in srgb, var(--accent) 30%, transparent)"><span>📎 selección adjunta</span><span style=color:var(--text-secondary)>(<!> caracteres)</span><div style=flex:1></div><span title="Quitar selección del prompt"style=cursor:pointer;font-size:10.5px;color:var(--text-secondary)>✕'), oi = /* @__PURE__ */ y("<button class=yola-btn title=Detener>⏹ Detener"), li = /* @__PURE__ */ y('<div style="width:300px;flex-shrink:0;border-left:1px solid var(--border-window);background:var(--bg-window);display:flex;flex-direction:column;min-height:0;font-family:var(--font)"><div style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-bottom:1px solid var(--border-window);flex-shrink:0"><span style=font-size:13px>✨</span><span style=font-weight:600;font-size:12px>YOLA</span><div style="display:flex;gap:2px;border-radius:7px;border:1px solid var(--border-window);padding:1px"><button title="Chat conversacional">💬</button><button title="Modo plan: propone → apruebas → ejecuta con diffs">📋</button></div><div style=flex:1></div><button class=yola-btn title="Nueva sesión">➕</button><button class=yola-btn title="Cerrar panel (Ctrl+J)">✕</button></div><div style=flex:1;overflow:auto;padding:8px;min-height:0></div><div style="border-top:1px solid var(--border-window);padding:6px;flex-shrink:0"><textarea class=yola-input placeholder="Pregúntale al agente… (Enter envía, Shift+Enter salto)"rows=3 style="width:100%;box-sizing:border-box;padding:6px 8px;resize:vertical;border:1px solid var(--border-window);border-radius:7px;background:var(--bg-desktop);color:var(--text-primary);outline:none;font-size:11.5px;font-family:var(--font);min-height:48px"></textarea><div style=display:flex;align-items:center;gap:8px;margin-top:5px><label style=font-size:10px;color:var(--text-muted);display:flex;align-items:center;gap:4px;cursor:pointer><input type=checkbox style=accent-color:var(--accent)>contexto del archivo</label><div style=flex:1></div><button class=yola-btn style="color:var(--text-primary);background:color-mix(in srgb, var(--accent) 20%, transparent);border:1px solid color-mix(in srgb, var(--accent) 45%, transparent)">Enviar'), si = /* @__PURE__ */ y("<span style=font-size:10px;color:var(--accent);margin-left:6px>(reemplaza la selección)"), ai = /* @__PURE__ */ y("<span style=font-size:10px;color:var(--warning);margin-left:6px>(reemplaza TODO el archivo)"), ci = /* @__PURE__ */ y('<div style=position:absolute;inset:0;zIndex:60;background:var(--bg-overlay);display:flex;align-items:center;justify-content:center><div style="width:560px;max-width:92%;background:var(--bg-window);border:1px solid var(--border-window);border-radius:10px;box-shadow:var(--shadow);padding:12px;display:flex;flex-direction:column;gap:8px"><div style=font-size:12.5px;font-weight:600>Aplicar cambio a </div><div style=display:flex;gap:8px;min-height:180px;max-height:300px><div style=flex:1;min-width:0><div style=font-size:10px;color:var(--text-muted);margin-bottom:3px>Antes</div><pre style="margin:0;padding:7px;border-radius:6px;font-size:10.5px;line-height:1.5;background:var(--bg-desktop);color:var(--text-secondary);overflow:auto;max-height:270px;font-family:ui-monospace, Consolas, monospace;white-space:pre-wrap;word-break:break-all"></pre></div><div style=flex:1;min-width:0><div style=font-size:10px;color:var(--success);margin-bottom:3px>Después</div><pre style="margin:0;padding:7px;border-radius:6px;font-size:10.5px;line-height:1.5;background:color-mix(in srgb, var(--success) 6%, var(--bg-desktop));color:var(--text-primary);overflow:auto;max-height:270px;font-family:ui-monospace, Consolas, monospace;white-space:pre-wrap;word-break:break-all"></pre></div></div><div style=display:flex;gap:6px;justify-content:flex-end><button>Cancelar</button><button>💾 '), di = /* @__PURE__ */ y('<div style="padding:2px 7px;border-radius:8px;cursor:pointer;font-size:9.5px;font-family:monospace;white-space:nowrap;border:1px solid var(--border-window)"> '), ui = /* @__PURE__ */ y("<div style=display:flex;gap:6px;align-items:center;font-size:10.5px><span></span><span>"), fi = /* @__PURE__ */ y('<div style="border:1px solid var(--border-window);border-radius:6px;overflow:hidden"><div style="display:flex;align-items:center;gap:6px;padding:3px 7px;background:var(--bg-window-header);font-size:10px;font-family:monospace"><span>✏️</span><span style=overflow:hidden;text-overflow:ellipsis;white-space:nowrap></span><div style=flex:1></div><button title="Restaurar el contenido anterior"style="padding:1px 7px;font-size:9.5px;color:var(--danger);border:1px solid color-mix(in srgb, var(--danger) 40%, transparent)">↩ Revertir</button></div><div style="max-height:90px;overflow:auto;padding:4px 7px;font-size:9.5px;line-height:1.45;font-family:monospace;white-space:pre-wrap;word-break:break-all">'), pi = /* @__PURE__ */ y("<div>"), gi = /* @__PURE__ */ y("<span style=color:var(--text-muted)>Pensando…"), hi = /* @__PURE__ */ y("<span style=color:var(--text-muted)>▍"), xi = /* @__PURE__ */ y("<div style=display:flex;flex-direction:column;gap:3px;margin-top:4px>"), vi = /* @__PURE__ */ y('<button class=yola-btn style="margin-top:4px;color:var(--success);border:1px solid color-mix(in srgb, var(--success) 40%, transparent)">💾 Aplicar al archivo…'), mi = /* @__PURE__ */ y('<div style=margin-bottom:8px><div style="padding:7px 9px;border-radius:9px;font-size:11.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word;border:1px solid var(--border-window)">'), yi = /* @__PURE__ */ y("<span style=color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px>"), bi = /* @__PURE__ */ y('<div style="display:flex;align-items:center;gap:6px;font-size:10px;padding:3px 7px;border-radius:6px;border:1px solid var(--border-window);font-family:ui-monospace, Consolas, monospace"><span></span><span style=font-weight:600></span><span style=margin-left:auto;font-size:9px>');
const pn = "yola-code";
function wi(e) {
  const t = e.api?.os?.daemonUrl || "http://localhost:7779", n = Ur(t), [r, i] = C("chat"), [l, a] = C([]), [s, v] = C([]), $ = /* @__PURE__ */ new Map(), [b, u] = C([]), [E, P] = C(localStorage.getItem("yola-code-session") || ""), [Y, I] = C([]), [L, S] = C(""), [p, A] = C(!0), [U, re] = C(!1), [Ee, ve] = C(""), [ie, F] = C(null), [q, Q] = C(!1), [m, X] = C(null), [B, d] = C([]);
  let w, _ = null;
  async function T() {
    try {
      const j = await n.listSessions(), J = Array.isArray(j) ? j : [];
      u(J);
      const le = E();
      if (le && !J.some((H) => H.id === le)) {
        const H = J.find((ye) => ye.tag === pn);
        P(H?.id || J[J.length - 1]?.id || ""), localStorage.setItem("yola-code-session", H?.id || "");
      }
    } catch (j) {
      ve(`Sin daemon: ${j.message}`);
    }
  }
  Pt(() => {
    e.open && T();
  }), vt(() => {
    e.open && (T(), setTimeout(() => w?.focus(), 60));
  }), vt(() => {
    const j = e.prefill;
    j && (S(j), A(!0), X({
      size: j.length
    }), e.onPrefillConsumed?.(), setTimeout(() => w?.focus(), 60));
  });
  function z() {
    X(null), S("");
  }
  async function ae(j) {
    if (e.filesApi)
      try {
        await e.filesApi.write(j.path, j.before), v((J) => J.filter((le) => le.id !== j.id)), De("↩ Cambio revertido");
      } catch (J) {
        De(`⛔ ${J.message}`);
      }
  }
  function oe(j) {
    P(j), localStorage.setItem("yola-code-session", j);
  }
  function $e() {
    const j = e.getActiveFile?.();
    if (!j) return "";
    const J = e.getSelection?.(), le = J && J.s !== J.e, H = le ? j.content.slice(J.s, J.e) : j.content;
    return `

— ${le ? "selección" : "archivo"}: ${j.name} —
${H}`;
  }
  async function pe(j, J = {}) {
    const le = j.trim();
    if (!le || q()) return;
    Q(!0), ve("");
    let H = le;
    J.asPlan ? H = `Actúa como planificador. Propón un plan claro como checklist markdown (- [ ] ítems), uno por cambio. NO ejecutes nada todavía.

Tarea: ` + le : J.approve && (H = "El plan fue aprobado. Ejecútalo ahora completo, marcando cada ítem del checklist al terminarlo. Usa tus herramientas."), p() && !J.approve && (H = H + $e());
    let ye = E();
    try {
      if (!ye) {
        const W = await n.createSession({
          tag: pn
        });
        if (ye = W?.id || W?.session?.id, !ye) throw new Error("el daemon no devolvió id de sesión");
        P(ye), localStorage.setItem("yola-code-session", ye), T();
      }
      I((W) => [...W, {
        role: "user",
        text: le
      }]), I((W) => [...W, {
        role: "agent",
        text: "",
        pending: !0
      }]), d([]), S(""), re(!0), _ = new AbortController(), await n.sendPrompt(ye, H, {
        signal: _.signal,
        onToken: (W) => {
          I((de) => {
            const te = de.length - 1;
            return de.map((V, He) => He === te ? {
              ...V,
              text: V.text + W
            } : V);
          });
        },
        onToolCall: (W) => {
          if (d((de) => [...de, {
            id: W.id,
            name: W.name || "tool",
            args: W.arguments,
            status: "run"
          }]), Vr(W.name) && e.filesApi) {
            const de = Gr(W.arguments);
            de && e.filesApi.read(de).then((te) => $.set(W.id, {
              path: de,
              before: te
            })).catch(() => {
            });
          }
        },
        onToolResult: (W) => {
          d((te) => te.map((V) => V.id === W.id ? {
            ...V,
            status: W.success ? "ok" : "err",
            duration: W.duration_ms
          } : V));
          const de = $.get(W.id);
          de && W.success !== !1 && e.filesApi && ($.delete(W.id), e.filesApi.read(de.path).then((te) => {
            te !== de.before && v((V) => [...V, {
              id: W.id,
              path: de.path,
              before: de.before,
              after: te
            }]);
          }).catch(() => {
          }));
        },
        onError: (W) => {
          ve(W.message), I((de) => de.map((te, V) => V === de.length - 1 ? {
            ...te,
            pending: !1,
            text: te.text ? `${te.text}

⛔ ${W.message}` : `⛔ ${W.message}`
          } : te)), re(!1), Q(!1);
        },
        onDone: () => {
          const W = Y(), de = W[W.length - 1]?.text || "";
          I((te) => te.map((V, He) => He === te.length - 1 ? {
            ...V,
            pending: !1
          } : V)), re(!1), Q(!1), r() === "plan" && de && a(Yr(de));
        }
      });
    } catch (W) {
      ve(W.message), Q(!1), re(!1);
    }
  }
  function ce() {
    _?.abort(), re(!1), Q(!1);
  }
  function qe(j) {
    const J = e.getActiveFile?.();
    if (!J) return;
    const le = e.getSelection?.(), H = le && le.s !== le.e, ye = fn(j.text);
    if (!ye) return;
    const W = H ? J.content.slice(le.s, le.e) : J.content;
    F({
      original: W,
      proposed: ye.code,
      lang: ye.lang,
      hasSelection: H,
      file: J.name,
      sel: H ? {
        s: le.s,
        e: le.e
      } : null,
      path: J.path
    });
  }
  function M() {
    F(null);
  }
  const [ze, _e] = C("");
  function De(j) {
    _e(j), setTimeout(() => _e(""), 2200);
  }
  function Pe() {
    const j = ie();
    j && (e.onApplyToActive?.(j.proposed, j.sel), F(null), De("✨ Cambio aplicado al archivo"));
  }
  return f(R, {
    get when() {
      return e.open;
    },
    get children() {
      return [(() => {
        var j = li(), J = j.firstChild, le = J.firstChild, H = le.nextSibling, ye = H.nextSibling, W = ye.firstChild, de = W.nextSibling, te = ye.nextSibling, V = te.nextSibling, He = V.nextSibling, me = J.nextSibling, Ne = me.nextSibling, Ie = Ne.firstChild, Ve = Ie.nextSibling, gt = Ve.firstChild, ut = gt.firstChild, lt = gt.nextSibling, ft = lt.nextSibling;
        W.$$click = () => i("chat"), de.$$click = () => i("plan"), c(J, f(R, {
          get when() {
            return E();
          },
          get children() {
            return Zr();
          }
        }), te), V.$$click = () => {
          oe(""), I([]);
        }, wt(He, "click", e.onClose), c(j, f(R, {
          get when() {
            return b().length > 1;
          },
          get children() {
            var k = Qr();
            return c(k, f(Re, {
              get each() {
                return b().slice(-6).reverse();
              },
              children: (ue) => (() => {
                var se = di(), fe = se.firstChild;
                return se.$$click = () => oe(ue.id), c(se, () => ue.tag || "general", fe), c(se, () => ue.id === E() ? "●" : "", null), K((N) => {
                  var ge = ue.id === E() ? "color-mix(in srgb, var(--accent) 22%, transparent)" : "var(--bg-window-header)", ke = ue.id === E() ? "var(--accent)" : "var(--text-secondary)", Ke = `Sesión ${ue.id?.slice(0, 8)}`;
                  return ge !== N.e && ee(se, "background", N.e = ge), ke !== N.t && ee(se, "color", N.t = ke), Ke !== N.a && et(se, "title", N.a = Ke), N;
                }, {
                  e: void 0,
                  t: void 0,
                  a: void 0
                }), se;
              })()
            })), k;
          }
        }), me), c(me, f(R, {
          get when() {
            return Le(() => r() === "plan")() && l().length;
          },
          get children() {
            var k = Xr(), ue = k.firstChild, se = ue.nextSibling, fe = se.nextSibling;
            return c(se, f(Re, {
              get each() {
                return l();
              },
              children: (N, ge) => (() => {
                var ke = ui(), Ke = ke.firstChild, Ue = Ke.nextSibling;
                return c(Ke, () => N.done ? "☑" : "☐"), c(Ue, () => N.title), K((Se) => {
                  var tt = N.done ? "var(--text-muted)" : "var(--text-primary)", Qe = N.done ? "line-through" : "none";
                  return tt !== Se.e && ee(ke, "color", Se.e = tt), Qe !== Se.t && ee(Ue, "text-decoration", Se.t = Qe), Se;
                }, {
                  e: void 0,
                  t: void 0
                }), ke;
              })()
            })), fe.$$click = () => pe("", {
              approve: !0
            }), K((N) => {
              var ge = q(), ke = {
                ...rt
              };
              return ge !== N.e && (fe.disabled = N.e = ge), N.t = xe(fe, ke, N.t), N;
            }, {
              e: void 0,
              t: void 0
            }), k;
          }
        }), null), c(me, f(R, {
          get when() {
            return s().length;
          },
          get children() {
            var k = ei(), ue = k.firstChild, se = ue.firstChild, fe = se.nextSibling;
            fe.nextSibling;
            var N = ue.nextSibling;
            return c(ue, () => s().length, fe), c(N, f(Re, {
              get each() {
                return s();
              },
              children: (ge) => (() => {
                var ke = fi(), Ke = ke.firstChild, Ue = Ke.firstChild, Se = Ue.nextSibling, tt = Se.nextSibling, Qe = tt.nextSibling, _t = Ke.nextSibling;
                return c(Se, () => ge.path), Qe.$$click = () => ae(ge), c(_t, f(Re, {
                  get each() {
                    return Jr(ge.before, ge.after);
                  },
                  children: (Xe) => (() => {
                    var st = pi();
                    return c(st, (() => {
                      var St = Le(() => Xe.type === "…");
                      return () => St() ? Xe.text : `${Xe.type} ${Xe.text}`;
                    })()), K((St) => ee(st, "color", Xe.type === "+" ? "var(--success)" : Xe.type === "-" ? "var(--danger)" : "var(--text-muted)")), st;
                  })()
                })), K((Xe) => xe(Qe, {
                  ...rt
                }, Xe)), ke;
              })()
            })), k;
          }
        }), null), c(me, f(R, {
          get when() {
            return !Y().length;
          },
          get children() {
            var k = ti(), ue = k.firstChild, se = ue.nextSibling;
            return se.nextSibling, k;
          }
        }), null), c(me, f(Re, {
          get each() {
            return Y();
          },
          children: (k) => (() => {
            var ue = mi(), se = ue.firstChild;
            return c(se, f(R, {
              get when() {
                return Le(() => !!(k.role === "agent" && k.pending))() && !k.text;
              },
              get children() {
                return gi();
              }
            }), null), c(se, () => k.text, null), c(se, f(R, {
              get when() {
                return Le(() => !!(k.role === "agent" && k.pending))() && k.text;
              },
              get children() {
                return hi();
              }
            }), null), c(ue, f(R, {
              get when() {
                return Le(() => k.role === "agent")() && B().length;
              },
              get children() {
                var fe = xi();
                return c(fe, f(Re, {
                  get each() {
                    return B();
                  },
                  children: (N) => (() => {
                    var ge = bi(), ke = ge.firstChild, Ke = ke.nextSibling, Ue = Ke.nextSibling;
                    return c(ke, () => $i(N.name)), c(Ke, () => N.name), c(ge, f(R, {
                      get when() {
                        return Le(() => !!N.args)() && typeof N.args == "object";
                      },
                      get children() {
                        var Se = yi();
                        return c(Se, () => ki(N.args)), K(() => et(Se, "title", JSON.stringify(N.args))), Se;
                      }
                    }), Ue), c(Ue, (() => {
                      var Se = Le(() => N.status === "run");
                      return () => Se() ? "⏳" : Le(() => N.status === "ok")() ? `✓${N.duration ? ` ${N.duration}ms` : ""}` : "✗";
                    })()), K((Se) => {
                      var tt = N.status === "run" ? "color-mix(in srgb, var(--warning) 8%, transparent)" : N.status === "ok" ? "color-mix(in srgb, var(--success) 8%, transparent)" : "color-mix(in srgb, var(--danger) 8%, transparent)", Qe = N.status === "run" ? "var(--warning)" : N.status === "ok" ? "var(--success)" : "var(--danger)";
                      return tt !== Se.e && ee(ge, "background", Se.e = tt), Qe !== Se.t && ee(ge, "color", Se.t = Qe), Se;
                    }, {
                      e: void 0,
                      t: void 0
                    }), ge;
                  })()
                })), fe;
              }
            }), null), c(ue, f(R, {
              get when() {
                return Le(() => !!(k.role === "agent" && !k.pending && fn(k.text)))() && e.getActiveFile?.();
              },
              get children() {
                var fe = vi();
                return fe.$$click = () => qe(k), K((N) => xe(fe, {
                  ...rt
                }, N)), fe;
              }
            }), null), K((fe) => {
              var N = k.role === "user" ? "var(--font)" : "ui-monospace, Consolas, monospace", ge = k.role === "user" ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--bg-window-header)";
              return N !== fe.e && ee(se, "font-family", fe.e = N), ge !== fe.t && ee(se, "background", fe.t = ge), fe;
            }, {
              e: void 0,
              t: void 0
            }), ue;
          })()
        }), null), c(me, f(R, {
          get when() {
            return Ee();
          },
          get children() {
            var k = ni();
            return c(k, Ee), k;
          }
        }), null), c(Ne, f(R, {
          get when() {
            return ze();
          },
          get children() {
            var k = ri();
            return c(k, ze), k;
          }
        }), Ie), c(Ne, f(R, {
          get when() {
            return m();
          },
          get children() {
            var k = ii(), ue = k.firstChild, se = ue.nextSibling, fe = se.firstChild, N = fe.nextSibling;
            N.nextSibling;
            var ge = se.nextSibling, ke = ge.nextSibling;
            return c(se, () => m().size, N), ke.$$click = z, k;
          }
        }), Ie), Ie.$$keydown = (k) => {
          k.key === "Enter" && !k.shiftKey && (k.preventDefault(), pe("", r() === "plan" ? {
            asPlan: !0
          } : {})), k.key === "Escape" && e.onClose();
        }, Ie.$$input = (k) => S(k.target.value);
        var ht = w;
        return typeof ht == "function" ? ot(ht, Ie) : w = Ie, ut.addEventListener("change", (k) => A(k.target.checked)), c(Ve, f(R, {
          get when() {
            return U();
          },
          get children() {
            var k = oi();
            return k.$$click = ce, K((ue) => xe(k, rt, ue)), k;
          }
        }), ft), ft.$$click = () => pe("", r() === "plan" ? {
          asPlan: !0
        } : {}), K((k) => {
          var ue = {
            ...gn,
            color: r() === "chat" ? "var(--text-primary)" : "var(--text-muted)",
            background: r() === "chat" ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "transparent"
          }, se = {
            ...gn,
            color: r() === "plan" ? "var(--text-primary)" : "var(--text-muted)",
            background: r() === "plan" ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "transparent"
          }, fe = rt, N = rt, ge = q() || !L().trim(), ke = {
            ...rt,
            opacity: q() || !L().trim() ? 0.5 : 1
          };
          return k.e = xe(W, ue, k.e), k.t = xe(de, se, k.t), k.a = xe(V, fe, k.a), k.o = xe(He, N, k.o), ge !== k.i && (ft.disabled = k.i = ge), k.n = xe(ft, ke, k.n), k;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0,
          i: void 0,
          n: void 0
        }), K(() => Ie.value = L()), K(() => ut.checked = p()), j;
      })(), f(R, {
        get when() {
          return ie();
        },
        get children() {
          var j = ci(), J = j.firstChild, le = J.firstChild;
          le.firstChild;
          var H = le.nextSibling, ye = H.firstChild, W = ye.firstChild, de = W.nextSibling, te = ye.nextSibling, V = te.firstChild, He = V.nextSibling, me = H.nextSibling, Ne = me.firstChild, Ie = Ne.nextSibling;
          return Ie.firstChild, j.$$click = M, J.$$click = (Ve) => Ve.stopPropagation(), c(le, () => ie().file, null), c(le, f(R, {
            get when() {
              return ie().hasSelection;
            },
            get children() {
              return si();
            }
          }), null), c(le, f(R, {
            get when() {
              return !ie().hasSelection;
            },
            get children() {
              return ai();
            }
          }), null), c(de, () => ie().original.slice(0, 4e3), null), c(de, () => ie().original.length > 4e3 ? `
… (truncado)` : "", null), c(He, () => ie().proposed.slice(0, 4e3), null), c(He, () => ie().proposed.length > 4e3 ? `
… (truncado)` : "", null), Ne.$$click = M, Ie.$$click = Pe, c(Ie, () => ie().hasSelection ? "Escribir en disco" : "Sobrescribir TODO el archivo", null), K((Ve) => {
            var gt = rt, ut = {
              ...rt,
              color: ie().hasSelection ? "var(--success)" : "var(--warning)",
              border: `1px solid color-mix(in srgb, ${ie().hasSelection ? "var(--success)" : "var(--warning)"} 45%, transparent)`,
              background: `color-mix(in srgb, ${ie().hasSelection ? "var(--success)" : "var(--warning)"} 12%, transparent)`
            };
            return Ve.e = xe(Ne, gt, Ve.e), Ve.t = xe(Ie, ut, Ve.t), Ve;
          }, {
            e: void 0,
            t: void 0
          }), j;
        }
      })];
    }
  });
}
const rt = {
  padding: "3px 9px",
  "min-height": "24px",
  cursor: "pointer",
  border: "1px solid var(--border-window)",
  "border-radius": "6px",
  background: "transparent",
  color: "var(--text-primary)",
  "font-size": "10.5px",
  "font-family": "var(--font)"
}, gn = {
  padding: "2px 7px",
  cursor: "pointer",
  border: "none",
  background: "transparent",
  "font-size": "11px",
  "font-family": "var(--font)",
  "border-radius": "5px"
};
function $i(e) {
  return e ? e.includes("bash") || e.includes("shell") || e.includes("term") ? "💻" : e.includes("read") || e.includes("view") ? "📖" : e.includes("write") || e.includes("edit") || e.includes("patch") ? "✏️" : e.includes("glob") || e.includes("grep") || e.includes("search") || e.includes("find") ? "🔍" : e.includes("fetch") || e.includes("web") || e.includes("browser") ? "🌐" : e.includes("memory") ? "🧠" : e.includes("skill") ? "📚" : e.includes("todo") ? "✅" : "🛠" : "🛠";
}
function ki(e) {
  if (!e || typeof e != "object") return "";
  const t = e.path || e.file || e.query || e.command || e.name || "";
  return String(t).slice(0, 60);
}
pt(["click", "input", "keydown"]);
var _i = /* @__PURE__ */ y("<div style=color:var(--text-muted);font-size:10.5px>Ejecuta comandos en <!> — build, tests, git… (↑↓ historial)"), Si = /* @__PURE__ */ y("<span style=font-size:10px;color:var(--warning)>ejecutando…"), Ci = /* @__PURE__ */ y('<div style="height:180px;flex-shrink:0;display:flex;flex-direction:column;border-top:1px solid var(--border-window);background:var(--bg-desktop);font-family:ui-monospace, Consolas, monospace;font-size:11px"><div style="display:flex;align-items:center;gap:6px;padding:3px 8px;background:var(--bg-window-header);flex-shrink:0"><span style=font-size:11px>⌨️</span><span style=font-size:10.5px;color:var(--text-secondary)>Terminal</span><span style=font-size:9.5px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px></span><div style=flex:1></div><span style=font-size:9.5px;color:var(--text-muted)>Ctrl+L limpia</span><button title=Limpiar>🧹</button><button title="Cerrar terminal (Ctrl+`)">✕</button></div><div style="flex:1;overflow:auto;padding:4px 8px;line-height:1.5;white-space:pre-wrap;word-break:break-all"></div><div style="display:flex;align-items:center;gap:6px;padding:4px 8px;flex-shrink:0"><span style=color:var(--success)>❯</span><input placeholder="escribe un comando…"style="flex:1;background:transparent;border:none;outline:none;color:var(--text-primary);font-family:ui-monospace, Consolas, monospace;font-size:11px">'), Ai = /* @__PURE__ */ y("<div>");
function Ei(e) {
  const [t, n] = C([]), [r, i] = C(""), [l, a] = C(!1), [s, v] = C([]), [$, b] = C(-1);
  let u, E;
  Pt(() => u?.focus());
  function P() {
    E && (E.scrollTop = E.scrollHeight);
  }
  async function Y() {
    const L = r().trim();
    if (!(!L || l())) {
      n((S) => [...S, {
        kind: "in",
        text: `❯ ${L}`
      }]), v((S) => [L, ...S.filter((p) => p !== L)].slice(0, 50)), b(-1), i(""), a(!0);
      try {
        const S = await fetch(`${e.daemonUrl}/api/v1/terminal/exec`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            command: L,
            cwd: e.cwd || void 0
          })
        });
        if (!S.ok) {
          const A = await S.text().catch(() => "");
          throw S.status === 404 ? new Error("El daemon no expone /terminal/exec — recompílalo (cargo build --bin yola-daemon)") : new Error(`HTTP ${S.status}: ${A.slice(0, 200)}`);
        }
        const p = await S.json();
        p.stdout && n((A) => [...A, {
          kind: "out",
          text: p.stdout.replace(/\n$/, "")
        }]), p.stderr && n((A) => [...A, {
          kind: "err",
          text: p.stderr.replace(/\n$/, "")
        }]), !p.stdout && !p.stderr && n((A) => [...A, {
          kind: "sys",
          text: "(sin salida)"
        }]), n((A) => [...A, {
          kind: "sys",
          text: `— exit ${p.exit_code ?? "?"} · ${p.duration_ms}ms · ${p.cwd}`
        }]);
      } catch (S) {
        n((p) => [...p, {
          kind: "err",
          text: `⛔ ${S.message}`
        }]);
      }
      a(!1), setTimeout(P, 30);
    }
  }
  function I(L) {
    if (L.key === "Enter") {
      L.preventDefault(), Y();
      return;
    }
    if (L.key === "Escape") {
      L.preventDefault(), e.onClose();
      return;
    }
    if (L.key === "ArrowUp") {
      L.preventDefault();
      const S = s();
      if (!S.length) return;
      const p = Math.min($() + 1, S.length - 1);
      b(p), i(S[p]);
      return;
    }
    if (L.key === "ArrowDown") {
      L.preventDefault();
      const S = $() - 1;
      S < 0 ? (b(-1), i("")) : (b(S), i(s()[S]));
      return;
    }
    L.key === "l" && L.ctrlKey && (L.preventDefault(), n([]));
  }
  return (() => {
    var L = Ci(), S = L.firstChild, p = S.firstChild, A = p.nextSibling, U = A.nextSibling, re = U.nextSibling, Ee = re.nextSibling, ve = Ee.nextSibling, ie = ve.nextSibling, F = S.nextSibling, q = F.nextSibling, Q = q.firstChild, m = Q.nextSibling;
    c(U, () => e.cwd || "sin workspace"), ve.$$click = () => n([]), wt(ie, "click", e.onClose);
    var X = E;
    typeof X == "function" ? ot(X, F) : E = F, c(F, f(R, {
      get when() {
        return !t().length;
      },
      get children() {
        var d = _i(), w = d.firstChild, _ = w.nextSibling;
        return _.nextSibling, c(d, () => e.cwd || "tu máquina", _), d;
      }
    }), null), c(F, f(Re, {
      get each() {
        return t();
      },
      children: (d) => (() => {
        var w = Ai();
        return c(w, () => d.text), K((_) => ee(w, "color", d.kind === "err" ? "var(--danger)" : d.kind === "sys" ? "var(--text-muted)" : d.kind === "in" ? "var(--accent)" : "var(--text-primary)")), w;
      })()
    }), null), m.$$keydown = I, m.$$input = (d) => i(d.target.value);
    var B = u;
    return typeof B == "function" ? ot(B, m) : u = m, c(q, f(R, {
      get when() {
        return l();
      },
      get children() {
        return Si();
      }
    }), null), K((d) => {
      var w = e.cwd, _ = hn, T = hn;
      return w !== d.e && et(U, "title", d.e = w), d.t = xe(ve, _, d.t), d.a = xe(ie, T, d.a), d;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    }), K(() => m.value = r()), L;
  })();
}
const hn = {
  padding: "2px 7px",
  cursor: "pointer",
  border: "1px solid var(--border-window)",
  "border-radius": "5px",
  background: "transparent",
  color: "var(--text-secondary)",
  "font-size": "10.5px",
  "font-family": "var(--font)"
};
pt(["click", "input", "keydown"]);
const En = "yola-code.workspaces";
function zi() {
  try {
    const e = localStorage.getItem(En), t = JSON.parse(e);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}
function Ti(e) {
  try {
    localStorage.setItem(En, JSON.stringify(e));
  } catch {
  }
}
async function Oi(e) {
  if (!e) return [];
  try {
    const t = await fetch(`${e}/api/v1/workspaces`);
    if (!t.ok) return [];
    const n = await t.json();
    return (Array.isArray(n) ? n : []).filter((r) => r?.root).map((r) => ({
      id: r.id || "os-ws",
      root: String(r.root),
      name: r.metadata?.name || "",
      source: "os"
    }));
  } catch {
    return [];
  }
}
function Li(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const l of t) n.set(xn(l.root), { ...l });
  let r = 0;
  for (const l of e) {
    const a = xn(l.root);
    n.has(a) ? n.get(a).source !== "os" && n.set(a, { ...l, addedAt: n.get(a).addedAt || Date.now() }) : (r++, n.set(a, { ...l, addedAt: Date.now() }));
  }
  return { merged: [...n.values()].sort((l, a) => l.source === "os" != (a.source === "os") ? l.source === "os" ? -1 : 1 : (a.addedAt || 0) - (l.addedAt || 0)), added: r };
}
function xn(e) {
  return String(e || "").replace(/[\\/]+$/, "").toLowerCase();
}
function ji(e) {
  return e.name || e.root.split(/[\\/]/).pop() || e.root;
}
var Di = /* @__PURE__ */ y("<div style=position:fixed;inset:0;zIndex:45>"), Pi = /* @__PURE__ */ y('<div style="position:absolute;top:100%;right:0;zIndex:46;margin-top:4px;background:var(--bg-window);border:1px solid var(--border-window);border-radius:8px;box-shadow:var(--shadow);padding:4px;min-width:240px;max-width:320px;max-height:280px;overflow:auto;font-size:11px;font-family:var(--font)"><div style="padding:4px 8px;font-size:9.5px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px">Workspaces (<!>)</div><div style="padding:3px;border-top:1px solid var(--border-window);margin-top:4px"><div style="padding:6px 8px;border-radius:5px;cursor:pointer;color:var(--text-secondary)">☰ Abrir otra ruta…'), Ii = /* @__PURE__ */ y('<div style=position:relative><button class=yola-btn title="Cambiar de workspace (detectados del OS + locales)"aria-label="Cambiar de workspace">📂 '), Mi = /* @__PURE__ */ y("<span style=font-size:10.5px;color:var(--text-secondary)>"), Ri = /* @__PURE__ */ y('<span style="font-size:11px;color:var(--text-muted);padding:4px 8px">'), Ni = /* @__PURE__ */ y('<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;border-top:1px solid var(--border-window);flex-shrink:0;background:var(--bg-window-header)"><span style=font-size:11px>🔍</span><input class=yola-input placeholder="Buscar en el archivo…"style="flex:1;padding:4px 8px;border:1px solid var(--border-window);border-radius:4px;background:var(--bg-desktop);color:var(--text-primary);outline:none;font-size:11px;font-family:var(--font)"><span style=font-size:10.5px;color:var(--text-muted)></span><button aria-label=Siguiente>↓</button><button aria-label=Anterior>↑</button><button aria-label="Cerrar búsqueda">✕'), vn = /* @__PURE__ */ y("<span>"), Fi = /* @__PURE__ */ y("<span> líneas · <!> palabras"), Wi = /* @__PURE__ */ y("<span>Ln <!>, Col "), qi = /* @__PURE__ */ y('<div style=position:absolute;inset:0;zIndex:40;background:var(--bg-overlay);display:flex;align-items:flex-start;justify-content:center;paddingTop:50px><div style="width:440px;max-width:92%;background:var(--bg-window);border:1px solid var(--border-window);border-radius:10px;box-shadow:var(--shadow);padding:14px;font-size:12px;display:flex;flex-direction:column;gap:6px;max-height:70vh;overflow-y:auto"><div style=font-weight:600;margin-bottom:4px>Atajos de teclado</div><div style=font-size:10.5px;color:var(--text-muted);margin-top:2px>Escribe y el editor sugiere palabras del archivo (Enter acepta, ↑↓ navega).</div><div style=font-weight:600;margin-top:10px;margin-bottom:4px>Explorer (clic derecho)</div><div style=font-size:11px;color:var(--text-secondary)>Nuevo archivo · Nueva carpeta · Renombrar · Eliminar</div><div style=font-weight:600;margin-top:10px;margin-bottom:4px>Agente (panel derecho)</div><div style=font-size:11px;color:var(--text-secondary)>Selecciona código y pulsa ✨ (o Ctrl+J y escribe). El contexto del archivo activo viaja solo. Cuando el agente responda con código, usa «💾 Aplicar al archivo» para ver el preview y escribir en disco. Las sesiones se comparten con el Chat del OS (tag #yola-code).</div><button style=margin-top:10px;alignSelf:flex-end>Cerrar'), Bi = /* @__PURE__ */ y("<pre style=position:absolute;inset:0;zIndex:30;margin:0;padding:14px;background:var(--bg-desktop);color:var(--text-primary);overflow:auto;font-size:11px;line-height:1.5;font-family:monospace>"), Hi = /* @__PURE__ */ y('<button style="position:absolute;top:10px;right:10px;zIndex:31;padding:5px 12px;border:1px solid var(--border-window);border-radius:5px;background:var(--bg-window);color:var(--text-primary);cursor:pointer;font-family:var(--font)">✕ Cerrar'), Ki = /* @__PURE__ */ y(`<div tabindex=0 style=display:flex;flex-direction:column;height:100%;background:var(--bg-window);color:var(--text-primary);font-family:var(--font);font-size:13px;position:relative;outline:none><style>
          .yola-input:focus { outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent) !important; outline-offset: -1px; }
          .yola-btn:hover { background: color-mix(in srgb, var(--accent) 10%, transparent); }
          .yola-btn:active { transform: translateY(1px); }
        </style><div style="display:flex;align-items:center;gap:8px;padding:5px 10px;border-bottom:1px solid var(--border-window);flex-shrink:0;flex-wrap:wrap"><span style=font-size:15px>🧑‍💻</span><span style=font-weight:600>YOLA Code</span><span style="font-size:9.5px;padding:1px 7px;border-radius:8px"></span><span style=font-size:10.5px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px></span><div style=flex:1></div><button class=yola-btn title="Paleta de comandos (Ctrl+Shift+P)"aria-label="Paleta de comandos">☰</button><button class=yola-btn title="Conversar con YOLA (Ctrl+J)"aria-label="Conversar con YOLA">💬</button><button aria-label="Mejorar selección con YOLA">✨</button><button class=yola-btn title="Ver manifest"aria-label="Ver manifest">📜</button></div><div style=display:flex;flex:1;overflow:hidden><div style="width:190px;flex-shrink:0;border-right:1px solid var(--border-window);background:var(--bg-window-header);display:flex;flex-direction:column"></div><div style=flex:1;display:flex;flex-direction:column;min-width:0><div style="display:flex;align-items:center;gap:2px;padding:4px 6px 0;border-bottom:1px solid var(--border-window);flex-shrink:0;flex-wrap:wrap;min-height:30px"></div><div style="display:flex;gap:12px;padding:3px 12px;font-size:10.5px;color:var(--text-muted);border-top:1px solid var(--border-window);flex-shrink:0;align-items:center"><span style=margin-left:auto>Solid + Vite · v0.7.0</span><button title="Atajos (F1)"aria-label="Atajos de teclado">❓`), Ui = /* @__PURE__ */ y('<div style="padding:6px 8px;border-radius:5px;cursor:pointer;display:flex;gap:7px;align-items:center"><span>📁</span><span style=overflow:hidden;text-overflow:ellipsis;white-space:nowrap></span><span style=margin-left:auto;font-size:9px;color:var(--text-muted);flex-shrink:0>'), Yi = /* @__PURE__ */ y("<div style=padding:8px;font-size:11px;color:var(--text-muted)><div style=margin-bottom:6px>Archivos locales:"), Ji = /* @__PURE__ */ y('<div style="padding:4px 6px;cursor:pointer;border-radius:4px;font-family:monospace;font-size:11px">📄 '), Vi = /* @__PURE__ */ y('<div style="display:flex;align-items:center;gap:5px;cursor:pointer;padding:4px 8px;border-radius:5px 5px 0 0;font-size:11px;font-family:monospace;max-width:160px;border-bottom:none"><span style=overflow:hidden;text-overflow:ellipsis;white-space:nowrap></span><span>●</span><span style=color:var(--text-muted);font-size:10px;cursor:pointer>✕'), Gi = /* @__PURE__ */ y("<div style=flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px;flex-direction:column;gap:8px><div style=font-size:32px;opacity:0.6>🧑‍💻</div><div>El editor nativo de YOLA</div><div style=font-size:11px;opacity:0.7>Ctrl+P para comandos · "), Zi = /* @__PURE__ */ y('<div style=display:flex;justify-content:space-between;align-items:center><span></span><span style="font-family:monospace;font-size:10.5px;padding:1px 7px;border:1px solid var(--border-window);border-radius:5px;color:var(--text-secondary);background:var(--bg-window-header)">');
function Qi(e) {
  return function() {
    const n = Vn(e), r = n ? Gn(e.os.daemonUrl) : null, [i, l] = C(Jn()), [a, s] = C([]), [v, $] = C(-1), [b, u] = C(!1), [E, P] = C("commands"), [Y, I] = C([]), [L, S] = C(!1), [p, A] = C(""), [U, re] = C(0), [Ee, ve] = C(""), [ie, F] = C(!1), [q, Q] = C(""), [m, X] = C(!1), [B, d] = C(""), [w, _] = C(null), [T, z] = C(!1), [ae, oe] = C(!1), [$e, pe] = C(!1), [ce, qe] = C(""), [M, ze] = C([]), [_e, De] = C([]), [Pe, j] = C(!1), [J, le] = C(!1);
    let H = null, ye = null, W = null;
    function de(o) {
      const g = o.target?.tagName;
      g !== "INPUT" && g !== "TEXTAREA" && g !== "BUTTON" && g !== "SELECT" && g !== "A" && W?.focus();
    }
    function te() {
      H?.focus();
    }
    const V = Ze(() => a()[v()] || null), He = Ze(() => {
      const o = p().toLowerCase().trim(), g = V()?.content || "";
      if (!o) return [];
      const h = [];
      let O = g.toLowerCase().indexOf(o);
      for (; O !== -1; )
        h.push(O), O = g.toLowerCase().indexOf(o, O + o.length);
      return h;
    });
    Pt(() => {
      Ve();
    }), bn(() => {
      ye && clearTimeout(ye), Ie();
    });
    function me(o) {
      ve(o), setTimeout(() => ve(""), 2500);
    }
    function Ne(o) {
      me(`⛔ ${o}`);
      try {
        e.os.notify?.(o, "error", 3500);
      } catch {
      }
    }
    function Ie() {
      const o = a().filter((g) => g.local);
      if (o.length) {
        const g = {};
        for (const h of o) g[h.path] = h.content;
        Yn(g);
      }
    }
    async function Ve() {
      const o = zi();
      let g = o;
      if (n && e?.os?.daemonUrl)
        try {
          const h = await Oi(e.os.daemonUrl), O = Li(h, o);
          g = O.merged, O.added && me(`📂 ${O.added} workspace${O.added > 1 ? "s" : ""} del OS detectado${O.added > 1 ? "s" : ""}`);
        } catch {
        }
      De(g), Ti(g);
    }
    function gt(o) {
      if (a().find((h) => h.dirty) && !confirm("Cambiar de workspace cerrará los archivos abiertos. ¿Continuar?")) {
        j(!1);
        return;
      }
      s([]), $(-1), l(o), sn(o), j(!1), me("☰ Workspace: " + o);
    }
    function ut() {
      const o = prompt("Ruta del workspace (carpeta en tu máquina):", i() || "");
      o !== null && (l(o.trim()), sn(o.trim()), me("☰ Workspace: " + (o.trim() || "sin workspace")));
    }
    async function lt(o, g, h) {
      const O = a().findIndex((G) => G.path === o);
      if (O !== -1) {
        $(O), h && ft(h);
        return;
      }
      try {
        const G = await r.read(o);
        k({
          path: o,
          name: g || o.split("/").pop() || o,
          lang: Bt(g || o),
          content: G,
          dirty: !1,
          local: !1
        }), ze((he) => [{
          path: o,
          name: g || o.split("/").pop() || o
        }, ...he.filter((Ce) => Ce.path !== o)].slice(0, 8)), h && setTimeout(() => ft(h), 50);
      } catch (G) {
        e.os.notify?.(`No se pudo abrir: ${G.message}`);
      }
    }
    function ft(o) {
      if (!H) return;
      const g = V();
      if (!g) return;
      const h = g.content.split(`
`).slice(0, o - 1).join(`
`).length, O = h + (g.content.split(`
`)[o - 1]?.length || 0);
      H.focus(), H.setSelectionRange(h, O);
    }
    function ht(o) {
      const g = ln()[o] || "";
      k({
        path: o,
        name: o,
        lang: Bt(o),
        content: g,
        dirty: !1,
        local: !0
      });
    }
    function k(o) {
      const g = [...a(), o];
      s(g), $(g.length - 1);
    }
    function ue(o) {
      const g = a()[o];
      if (!(g?.dirty && !confirm(`«${g.name}» tiene cambios sin guardar. ¿Cerrar de todas formas?`)))
        if (s((h) => h.filter((O, G) => G !== o)), v() === o) {
          const h = a().length - 1;
          $(o > 0 ? Math.min(o - 1, h - 1) : h > 0 ? 0 : -1);
        } else v() > o && $(v() - 1);
    }
    function se(o) {
      const g = v();
      if (g === -1) return;
      const h = a()[g];
      s((O) => O.map((G, he) => he === g ? {
        ...G,
        content: o,
        dirty: !0
      } : G)), ye && clearTimeout(ye), ye = setTimeout(() => {
        h.local && (Ie(), me("● Guardando…"));
      }, 800);
    }
    async function fe() {
      const o = V();
      if (o) {
        if (o.local) {
          Ie(), s((g) => g.map((h, O) => O === v() ? {
            ...h,
            dirty: !1
          } : h)), me("✓ Guardado");
          return;
        }
        try {
          await r.write(o.path, o.content), s((g) => g.map((h, O) => O === v() ? {
            ...h,
            dirty: !1
          } : h)), me("✓ Guardado en disco");
        } catch (g) {
          Ne(`Error al guardar: ${g.message}`);
        }
      }
    }
    async function N() {
      const o = prompt("Nuevo archivo (ruta relativa al workspace):", "nuevo.md");
      if (!o) return;
      if (!n) {
        ht(o);
        return;
      }
      const g = i() ? `${i().replace(/\/+$/, "")}/${o}` : o;
      try {
        await r.create(g, "file"), await lt(g, o), me(`➕ ${o}`);
      } catch (h) {
        Ne(`Error: ${h.message}`);
      }
    }
    const [ge, ke] = C(0);
    function Ke(o) {
      if (o.type === "dir") return o.path;
      const g = o.path.split("/");
      return g.pop(), g.join("/");
    }
    function Ue(o) {
      return i() ? `${i().replace(/\/+$/, "")}/${o.replace(/^\/+/, "")}` : o;
    }
    async function Se(o) {
      if (!i()) {
        me("Abre un workspace primero");
        return;
      }
      const g = Ke(o), h = prompt("Nuevo archivo:", "nuevo.md");
      if (!h) return;
      const O = g ? `${g}/${h}` : h;
      try {
        await r.create(Ue(O), "file"), ke((G) => G + 1), await lt(Ue(O), h), me(`➕ ${h}`);
      } catch (G) {
        Ne(`Error: ${G.message}`);
      }
    }
    async function tt(o) {
      if (!i()) {
        me("Abre un workspace primero");
        return;
      }
      const g = Ke(o), h = prompt("Nueva carpeta:", "nueva-carpeta");
      if (!h) return;
      const O = g ? `${g}/${h}` : h;
      try {
        await r.create(Ue(O), "dir"), ke((G) => G + 1), me(`📁 ${h}`);
      } catch (G) {
        Ne(`Error: ${G.message}`);
      }
    }
    async function Qe(o, g, h, O) {
      const G = await r.list(i(), o);
      for (const he of G) {
        const Ce = `${o}/${he.name}`, Oe = `${g}/${he.name}`, be = `${h}/${he.name}`, Me = `${O}/${he.name}`;
        he.type === "dir" ? (await r.create(Me, "dir"), await Qe(Ce, Oe, be, Me), await r.remove(be)) : (await r.create(Me, "file"), await r.write(Me, await r.read(be)), await r.remove(be));
      }
    }
    async function _t(o) {
      const g = o.path.split("/"), h = g[g.length - 1], O = prompt("Nuevo nombre:", h);
      if (!O || O === h) return;
      const G = o.path, he = [...g.slice(0, -1), O].join("/"), Ce = o.absolute || Ue(G), Oe = Ue(he);
      try {
        if (o.type === "file") {
          const be = await r.read(Ce);
          await r.create(Oe, "file"), await r.write(Oe, be), await r.remove(Ce), s((Me) => Me.map((nt) => nt.path === Ce ? {
            ...nt,
            path: Oe,
            name: O
          } : nt));
        } else
          await r.create(Oe, "dir"), await Qe(G, he, Ce, Oe), await r.remove(Ce), s((be) => be.map((Me) => Me.path.startsWith(Ce) ? {
            ...Me,
            path: Oe + Me.path.slice(Ce.length)
          } : Me));
        ke((be) => be + 1), me(`✏ï¸ ${h} → ${O}`);
      } catch (be) {
        Ne(`Error al renombrar: ${be.message}`);
      }
    }
    async function Xe(o) {
      if (!confirm(`¿Eliminar «${o.name}»${o.type === "dir" ? " y todo su contenido" : ""}?`)) return;
      const h = o.absolute || Ue(o.path);
      try {
        await r.remove(h), s((O) => O.filter((G) => !G.path.startsWith(h))), ke((O) => O + 1), me(`🗑ï¸ ${o.name}`);
      } catch (O) {
        Ne(`Error al eliminar: ${O.message}`);
      }
    }
    function st(o) {
      if (!o && $e()) {
        pe(!1), H?.focus();
        return;
      }
      if (pe(!0), o && H && H.selectionStart !== H.selectionEnd) {
        const g = V();
        g && qe(g.content.slice(H.selectionStart, H.selectionEnd));
      }
    }
    async function St(o, g) {
      const h = V();
      if (!h) return;
      const O = h.content, G = g || (H ? {
        s: H.selectionStart,
        e: H.selectionEnd
      } : null), he = G && G.s !== G.e ? O.slice(0, G.s) + o + O.slice(G.e) : o;
      if (h.local)
        s((Ce) => Ce.map((Oe, be) => be === v() ? {
          ...Oe,
          content: he,
          dirty: !1
        } : Oe)), me("✨ Cambio aplicado");
      else
        try {
          await r.write(h.path, he), s((Ce) => Ce.map((Oe, be) => be === v() ? {
            ...Oe,
            content: he,
            dirty: !1
          } : Oe)), me("✨ Cambio aplicado en disco");
        } catch (Ce) {
          s((Oe) => Oe.map((be, Me) => Me === v() ? {
            ...be,
            content: O,
            dirty: !0
          } : be)), Ne(`Error al guardar: ${Ce.message}`);
        }
    }
    function Ut() {
      try {
        const g = (e.os.getApps ? e.os.getApps() : []).find((h) => h.id === "yola-code");
        Q(JSON.stringify(g?.manifest || {
          id: "yola-code"
        }, null, 2)), F(!0);
      } catch (o) {
        Ne(`Error: ${o.message}`);
      }
    }
    function It(o = 1) {
      const g = He();
      if (!g.length) return;
      re((G) => (G + o + g.length) % g.length);
      const h = He()[U()], O = p();
      H && h !== void 0 && (H.focus(), H.setSelectionRange(h, h + O.length));
    }
    async function zn() {
      if (!n || !i()) {
        I([]);
        return;
      }
      const o = [], g = async (h, O) => {
        if (O > 5) return;
        let G;
        try {
          G = await r.list(i(), h === "/" ? "" : h);
        } catch {
          return;
        }
        for (const he of G)
          he.type === "dir" ? await g(he.path, O + 1) : o.push({
            path: he.absolute || he.path,
            name: he.name
          });
      };
      try {
        await g("/", 0);
      } catch {
      }
      I(o.slice(0, 500));
    }
    function Mt(o) {
      if (b() && E() === o) {
        u(!1), H?.focus();
        return;
      }
      P(o), u(!0), o === "files" && zn();
    }
    const Tn = () => [{
      id: "open-ws",
      label: "Abrir workspace…",
      icon: "☰",
      run: ut
    }, {
      id: "new",
      label: "Nuevo archivo…",
      icon: "➕",
      run: N
    }, {
      id: "save",
      label: "Guardar (Ctrl+S)",
      icon: "💾",
      run: fe
    }, {
      id: "find",
      label: "Buscar en archivo (Ctrl+F)",
      icon: "🔍",
      run: () => {
        S(!0), A(""), re(0);
      }
    }, {
      id: "ws-find",
      label: "Buscar en workspace (Ctrl+Shift+F)",
      icon: "🔎",
      run: () => {
        X(!0), d("");
      }
    }, {
      id: "rename-active",
      label: "Renombrar archivo activo…",
      icon: "✏ï¸",
      run: () => {
        const o = V();
        o && !o.local && _t({
          path: o.path.replace(i() + "/", ""),
          name: o.name,
          type: "file",
          absolute: o.path
        });
      }
    }, {
      id: "delete-active",
      label: "Eliminar archivo activo…",
      icon: "🗑ï¸",
      run: () => {
        const o = V();
        o && !o.local && Xe({
          path: o.path.replace(i() + "/", ""),
          name: o.name,
          type: "file",
          absolute: o.path
        });
      }
    }, {
      id: "ask",
      label: "Preguntar a YOLA",
      icon: "💬",
      run: () => st(!1)
    }, {
      id: "improve",
      label: "Mejorar selección con YOLA",
      icon: "✨",
      run: () => st(!0)
    }, {
      id: "help",
      label: "Atajos de teclado (F1)",
      icon: "❓",
      run: () => oe(!0)
    }, {
      id: "manifest",
      label: "Ver manifest",
      icon: "📜",
      run: Ut
    }, ...M().length ? M().map((o) => ({
      id: "recent-" + o.path,
      label: `🕘 ${o.name}`,
      icon: "🕘",
      run: () => lt(o.path, o.name)
    })) : [], ...n ? [] : [{
      id: "local",
      label: "Modo local: abre archivo demo…",
      icon: "📦",
      run: () => ht("README.md")
    }]];
    function On(o) {
      const g = o.ctrlKey || o.metaKey;
      if (g && o.shiftKey && (o.key === "P" || o.key === "p")) {
        o.preventDefault(), Mt("commands");
        return;
      }
      if (g && !o.shiftKey && o.key === "p") {
        o.preventDefault(), Mt("files");
        return;
      }
      if (g && o.key === "f") {
        o.preventDefault(), S((h) => !h), re(0);
        return;
      }
      if (g && o.key === "j") {
        o.preventDefault(), pe((h) => !h);
        return;
      }
      if (g && o.key === "`") {
        o.preventDefault(), le((h) => !h);
        return;
      }
      if (g && o.key === "w") {
        o.preventDefault(), v() !== -1 && ue(v());
        return;
      }
      if (g && o.key === "Tab") {
        o.preventDefault();
        const h = a().length;
        h > 1 && $((O) => o.shiftKey ? (O - 1 + h) % h : (O + 1) % h);
        return;
      }
      if (g && o.shiftKey && (o.key === "F" || o.key === "f")) {
        o.preventDefault(), X((h) => !h), d("");
        return;
      }
      if (o.key === "F1") {
        o.preventDefault(), oe((h) => !h);
        return;
      }
      o.key === "Escape" && (b() ? (u(!1), te()) : L() ? (S(!1), te()) : ie() ? (F(!1), te()) : m() ? (X(!1), te()) : ae() && (oe(!1), te()));
    }
    const at = {
      padding: "4px 10px",
      border: "1px solid var(--border-window)",
      "border-radius": "5px",
      background: "transparent",
      color: "var(--text-primary)",
      cursor: "pointer",
      "font-size": "11px",
      "font-family": "var(--font)",
      "min-height": "26px"
    }, Rt = {
      ...at,
      border: "1px solid var(--accent)",
      color: "var(--accent)"
    };
    return (() => {
      var o = Ki(), g = o.firstChild, h = g.nextSibling, O = h.firstChild, G = O.nextSibling, he = G.nextSibling, Ce = he.nextSibling, Oe = Ce.nextSibling, be = Oe.nextSibling, Me = be.nextSibling, nt = Me.nextSibling, Yt = nt.nextSibling, Jt = h.nextSibling, Vt = Jt.firstChild, Nt = Vt.nextSibling, Ft = Nt.firstChild, Ct = Ft.nextSibling, Gt = Ct.firstChild, Zt = Gt.nextSibling;
      o.$$keydown = On, o.$$mousedown = de;
      var Qt = W;
      return typeof Qt == "function" ? ot(Qt, o) : W = o, ee(he, "background", n ? "color-mix(in srgb, var(--success) 15%, transparent)" : "color-mix(in srgb, var(--warning) 15%, transparent)"), ee(he, "color", n ? "var(--success)" : "var(--warning)"), c(he, n ? "workspace real" : "modo local"), c(Ce, () => i() || "sin workspace"), c(h, f(R, {
        get when() {
          return _e().length;
        },
        get children() {
          var x = Ii(), D = x.firstChild;
          return D.firstChild, D.$$click = () => j((Z) => !Z), c(D, () => _e().length, null), c(x, f(R, {
            get when() {
              return Pe();
            },
            get children() {
              return [(() => {
                var Z = Di();
                return Z.$$click = () => j(!1), Z;
              })(), (() => {
                var Z = Pi(), ne = Z.firstChild, Je = ne.firstChild, Ge = Je.nextSibling;
                Ge.nextSibling;
                var Te = ne.nextSibling, we = Te.firstChild;
                return c(ne, () => _e().length, Ge), c(Z, f(Re, {
                  get each() {
                    return _e();
                  },
                  children: (Be) => (() => {
                    var Ye = Ui(), Wt = Ye.firstChild, Xt = Wt.nextSibling, Ln = Xt.nextSibling;
                    return Ye.$$click = () => gt(Be.root), c(Xt, () => ji(Be)), c(Ln, () => Be.source === "os" ? "OS" : "local"), K((mt) => {
                      var en = i() === Be.root ? "var(--accent)" : "var(--text-primary)", tn = i() === Be.root ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent";
                      return en !== mt.e && ee(Ye, "color", mt.e = en), tn !== mt.t && ee(Ye, "background", mt.t = tn), mt;
                    }, {
                      e: void 0,
                      t: void 0
                    }), Ye;
                  })()
                }), Te), we.$$click = () => {
                  j(!1), ut();
                }, Z;
              })()];
            }
          }), null), K((Z) => xe(D, at, Z)), x;
        }
      }), Oe), c(h, f(R, {
        get when() {
          return Ee();
        },
        get children() {
          var x = Mi();
          return c(x, Ee), x;
        }
      }), be), be.$$click = () => Mt("commands"), Me.$$click = () => st(!1), nt.$$click = () => st(!0), Yt.$$click = Ut, c(Vt, n ? f(Or, {
        filesApi: r,
        get workspace() {
          return i();
        },
        get refresh() {
          return ge();
        },
        onOpenFile: (x) => lt(x, x.split("/").pop()),
        onAction: (x, D) => {
          x === "new-file" ? Se(D) : x === "new-folder" ? tt(D) : x === "rename" ? _t(D) : x === "delete" && Xe(D);
        }
      }) : (() => {
        var x = Yi();
        return x.firstChild, c(x, f(Re, {
          get each() {
            return Object.keys(ln());
          },
          children: (D) => (() => {
            var Z = Ji();
            return Z.firstChild, Z.$$click = () => ht(D), c(Z, D, null), Z;
          })()
        }), null), x;
      })()), c(Ft, f(Re, {
        get each() {
          return a();
        },
        children: (x, D) => (() => {
          var Z = Vi(), ne = Z.firstChild, Je = ne.nextSibling, Ge = Je.nextSibling;
          return Z.$$click = () => $(D()), c(ne, () => x.name), Ge.$$click = (Te) => {
            Te.stopPropagation(), ue(D());
          }, K((Te) => {
            var we = D() === v() ? "var(--bg-desktop)" : "transparent", Be = D() === v() ? "1px solid var(--border-window)" : "1px solid transparent", Ye = x.dirty ? "var(--warning)" : "transparent";
            return we !== Te.e && ee(Z, "background", Te.e = we), Be !== Te.t && ee(Z, "border", Te.t = Be), Ye !== Te.a && ee(Je, "color", Te.a = Ye), Te;
          }, {
            e: void 0,
            t: void 0,
            a: void 0
          }), Z;
        })()
      }), null), c(Ft, f(R, {
        get when() {
          return !a().length;
        },
        get children() {
          var x = Ri();
          return c(x, n ? "Abre un archivo del workspace" : "Abre un archivo local"), x;
        }
      }), null), c(Nt, f(R, {
        get when() {
          return V();
        },
        get fallback() {
          return (() => {
            var x = Gi(), D = x.firstChild, Z = D.nextSibling, ne = Z.nextSibling;
            return ne.firstChild, c(ne, n ? "explora el workspace a la izquierda" : "abre un archivo local", null), x;
          })();
        },
        get children() {
          return f(xr, {
            get content() {
              return V().content;
            },
            get lang() {
              return V().lang;
            },
            onChange: se,
            onSave: fe,
            onTa: (x) => {
              H = x;
            },
            onCursor: (x, D) => _({
              line: x,
              col: D
            }),
            onSelection: z
          });
        }
      }), Ct), c(Nt, f(R, {
        get when() {
          return Le(() => !!L())() && V();
        },
        get children() {
          var x = Ni(), D = x.firstChild, Z = D.nextSibling, ne = Z.nextSibling, Je = ne.nextSibling, Ge = Je.nextSibling, Te = Ge.nextSibling;
          return Z.$$keydown = (we) => {
            we.key === "Enter" && It(we.shiftKey ? -1 : 1), we.key === "Escape" && S(!1);
          }, Z.$$input = (we) => {
            A(we.target.value), re(0);
          }, c(ne, (() => {
            var we = Le(() => !!He().length);
            return () => we() ? `${U() + 1}/${He().length}` : "—";
          })()), Je.$$click = () => It(1), Ge.$$click = () => It(-1), Te.$$click = () => S(!1), K((we) => {
            var Be = at, Ye = at, Wt = at;
            return we.e = xe(Je, Be, we.e), we.t = xe(Ge, Ye, we.t), we.a = xe(Te, Wt, we.a), we;
          }, {
            e: void 0,
            t: void 0,
            a: void 0
          }), K(() => Z.value = p()), x;
        }
      }), Ct), c(Ct, f(R, {
        get when() {
          return V();
        },
        get children() {
          return [(() => {
            var x = vn();
            return c(x, () => V().name), x;
          })(), (() => {
            var x = vn();
            return c(x, () => Bt(V().name)), x;
          })(), (() => {
            var x = Fi(), D = x.firstChild, Z = D.nextSibling;
            return Z.nextSibling, c(x, () => V().content.split(`
`).length, D), c(x, (() => {
              var ne = Le(() => !!V().content.trim());
              return () => ne() ? V().content.trim().split(/\s+/).length : 0;
            })(), Z), x;
          })(), f(R, {
            get when() {
              return w();
            },
            get children() {
              var x = Wi(), D = x.firstChild, Z = D.nextSibling;
              return Z.nextSibling, c(x, () => w().line, Z), c(x, () => w().col, null), x;
            }
          })];
        }
      }), Gt), Zt.$$click = () => oe((x) => !x), c(Jt, f(wi, {
        api: e,
        get open() {
          return $e();
        },
        onClose: () => {
          pe(!1), te();
        },
        getActiveFile: () => V(),
        getSelection: () => H ? {
          s: H.selectionStart,
          e: H.selectionEnd
        } : null,
        onApplyToActive: St,
        get prefill() {
          return ce();
        },
        onPrefillConsumed: () => qe(""),
        filesApi: r
      }), null), c(o, f(R, {
        get when() {
          return J();
        },
        get children() {
          return f(Ei, {
            get daemonUrl() {
              return n ? e.os.daemonUrl : null;
            },
            get cwd() {
              return i() || void 0;
            },
            onClose: () => {
              le(!1), te();
            }
          });
        }
      }), null), c(o, f(Mr, {
        get open() {
          return b();
        },
        get mode() {
          return E();
        },
        get commands() {
          return Tn();
        },
        get files() {
          return Y();
        },
        get recent() {
          return M();
        },
        onClose: () => {
          u(!1), te();
        },
        onOpenFile: (x) => {
          lt(x.path, x.name);
        }
      }), null), c(o, f(R, {
        when: n,
        get children() {
          return f(Hr, {
            get open() {
              return m();
            },
            filesApi: r,
            get workspace() {
              return i();
            },
            query: B,
            onQuery: d,
            onClose: () => {
              X(!1), te();
            },
            onOpenFile: (x, D) => {
              X(!1), lt(x, x.split("/").pop(), D);
            }
          });
        }
      }), null), c(o, f(R, {
        get when() {
          return ae();
        },
        get children() {
          var x = qi(), D = x.firstChild, Z = D.firstChild, ne = Z.nextSibling, Je = ne.nextSibling, Ge = Je.nextSibling, Te = Ge.nextSibling, we = Te.nextSibling, Be = we.nextSibling;
          return x.$$click = () => {
            oe(!1), te();
          }, D.$$click = (Ye) => Ye.stopPropagation(), c(D, f(Fe, {
            keys: "Ctrl+P",
            label: "Abrir archivo (fuzzy)"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+Shift+P",
            label: "Paleta de comandos"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+F",
            label: "Buscar en archivo"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+Shift+F",
            label: "Buscar en el workspace"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+S",
            label: "Guardar archivo"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+Z / Ctrl+Shift+Z",
            label: "Deshacer / Rehacer"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+D",
            label: "Duplicar línea o selección"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+/",
            label: "Comentar / descomentar"
          }), ne), c(D, f(Fe, {
            keys: "Alt+↑ ↓",
            label: "Mover línea"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+W",
            label: "Cerrar pestaña"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+Tab",
            label: "Siguiente pestaña"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+J",
            label: "Panel del agente"
          }), ne), c(D, f(Fe, {
            keys: "Ctrl+`",
            label: "Terminal (build, tests, git)"
          }), ne), c(D, f(Fe, {
            keys: "Tab",
            label: "Indentar (2 espacios)"
          }), ne), c(D, f(Fe, {
            keys: "Esc",
            label: "Cerrar panel"
          }), ne), c(D, f(Fe, {
            keys: "F1",
            label: "Este panel"
          }), ne), Be.$$click = () => {
            oe(!1), te();
          }, K((Ye) => xe(Be, {
            ...Rt
          }, Ye)), x;
        }
      }), null), c(o, f(R, {
        get when() {
          return ie();
        },
        get children() {
          return [(() => {
            var x = Bi();
            return c(x, q), x;
          })(), (() => {
            var x = Hi();
            return x.$$click = () => {
              F(!1), te();
            }, x;
          })()];
        }
      }), null), K((x) => {
        var D = i(), Z = Rt, ne = at, Je = !T(), Ge = {
          ...Rt,
          opacity: T() ? 1 : 0.4,
          cursor: T() ? "pointer" : "not-allowed"
        }, Te = T() ? "Mejorar la selección con YOLA" : "Selecciona código para mejorarlo", we = at, Be = at;
        return D !== x.e && et(Ce, "title", x.e = D), x.t = xe(be, Z, x.t), x.a = xe(Me, ne, x.a), Je !== x.o && (nt.disabled = x.o = Je), x.i = xe(nt, Ge, x.i), Te !== x.n && et(nt, "title", x.n = Te), x.s = xe(Yt, we, x.s), x.h = xe(Zt, Be, x.h), x;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0,
        i: void 0,
        n: void 0,
        s: void 0,
        h: void 0
      }), o;
    })();
  };
}
function Fe(e) {
  return (() => {
    var t = Zi(), n = t.firstChild, r = n.nextSibling;
    return c(n, () => e.label), c(r, () => e.keys), t;
  })();
}
pt(["mousedown", "keydown", "click", "input"]);
function Xi(e, t) {
  const n = Qi(e);
  Hn(() => f(n, {}), t);
}
export {
  Qi as createApp,
  Xi as mount
};
