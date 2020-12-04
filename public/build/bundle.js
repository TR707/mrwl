
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Header.svelte generated by Svelte v3.29.4 */

    const file = "src/components/Header.svelte";

    function create_fragment(ctx) {
    	let header;
    	let div2;
    	let div1;
    	let div0;
    	let h1;

    	const block = {
    		c: function create() {
    			header = element("header");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "MR White Label";
    			attr_dev(h1, "class", "svelte-1p9v5dw");
    			add_location(h1, file, 4, 10, 102);
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file, 3, 8, 70);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file, 2, 6, 44);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file, 1, 4, 14);
    			add_location(header, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/shared/Button.svelte generated by Svelte v3.29.4 */

    const file$1 = "src/shared/Button.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let button;
    	let button_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*type*/ ctx[0]) + " svelte-1jsysp6"));
    			toggle_class(button, "flat", /*flat*/ ctx[1]);
    			toggle_class(button, "inverse", /*inverse*/ ctx[2]);
    			add_location(button, file$1, 9, 8, 196);
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$1, 8, 6, 166);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$1, 7, 4, 142);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$1, 6, 0, 114);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, button);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*type*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*type*/ ctx[0]) + " svelte-1jsysp6"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty & /*type, flat*/ 3) {
    				toggle_class(button, "flat", /*flat*/ ctx[1]);
    			}

    			if (dirty & /*type, inverse*/ 5) {
    				toggle_class(button, "inverse", /*inverse*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { type = "primary" } = $$props;
    	let { flat = false } = $$props;
    	let { inverse = false } = $$props;
    	const writable_props = ["type", "flat", "inverse"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("flat" in $$props) $$invalidate(1, flat = $$props.flat);
    		if ("inverse" in $$props) $$invalidate(2, inverse = $$props.inverse);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ type, flat, inverse });

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("flat" in $$props) $$invalidate(1, flat = $$props.flat);
    		if ("inverse" in $$props) $$invalidate(2, inverse = $$props.inverse);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, flat, inverse, $$scope, slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { type: 0, flat: 1, inverse: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flat() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flat(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inverse() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inverse(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Sugerencias.svelte generated by Svelte v3.29.4 */

    const { console: console_1 } = globals;
    const file$2 = "src/components/Sugerencias.svelte";

    // (56:28) <Button type="secondary" flat={true} >
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Enviar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(56:28) <Button type=\\\"secondary\\\" flat={true} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let br0;
    	let t0;
    	let p0;
    	let t2;
    	let div3;
    	let div2;
    	let form;
    	let div1;
    	let label;
    	let t3;
    	let input;
    	let t4;
    	let div0;
    	let t5_value = /*errors*/ ctx[1].propuesta + "";
    	let t5;
    	let t6;
    	let button;
    	let t7;
    	let br1;
    	let t8;
    	let p1;
    	let current;
    	let mounted;
    	let dispose;

    	button = new Button({
    			props: {
    				type: "secondary",
    				flat: true,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			br0 = element("br");
    			t0 = space();
    			p0 = element("p");
    			p0.textContent = "Sugiere el género, sello o artista que te gustaría que \n                protagonizara alguna referencia de MR White Label:";
    			t2 = space();
    			div3 = element("div");
    			div2 = element("div");
    			form = element("form");
    			div1 = element("div");
    			label = element("label");
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			div0 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			create_component(button.$$.fragment);
    			t7 = space();
    			br1 = element("br");
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "(Algunas ideas: Carl Craig, Drexciya, Electroclash, Ellen Allien, François Kevorkian, \n    Giorgio Moroder, Helena Hauff, Dj Hell, International Deejay Gigolo Records, \n    Ivan Smagghe, Jeff Mills, Masters At Work, Robert Hood, Soma Records, Sven Väth, \n    TR-808, TR-909, etc...)";
    			add_location(br0, file$2, 44, 12, 1305);
    			add_location(p0, file$2, 45, 12, 1322);
    			attr_dev(label, "for", "propuesta");
    			attr_dev(label, "class", "svelte-zvtvex");
    			add_location(label, file$2, 51, 32, 1684);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "sugiere");
    			add_location(input, file$2, 52, 40, 1756);
    			attr_dev(div0, "class", "error svelte-zvtvex");
    			add_location(div0, file$2, 53, 32, 1898);
    			attr_dev(div1, "class", "form-field svelte-zvtvex");
    			add_location(div1, file$2, 50, 28, 1627);
    			attr_dev(form, "class", "svelte-zvtvex");
    			add_location(form, file$2, 49, 24, 1558);
    			attr_dev(div2, "class", "col s12");
    			add_location(div2, file$2, 48, 20, 1512);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$2, 47, 16, 1468);
    			add_location(br1, file$2, 58, 10, 2119);
    			add_location(p1, file$2, 60, 0, 2125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, form);
    			append_dev(form, div1);
    			append_dev(div1, label);
    			append_dev(div1, t3);
    			append_dev(div1, input);
    			set_input_value(input, /*fields*/ ctx[0].propuesta);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, t5);
    			append_dev(form, t6);
    			mount_component(button, form, null);
    			append_dev(div3, t7);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p1, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keyup", /*verificaFormatoPropuesta*/ ctx[2], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(form, "submit", prevent_default(/*enviar*/ ctx[3]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fields*/ 1 && input.value !== /*fields*/ ctx[0].propuesta) {
    				set_input_value(input, /*fields*/ ctx[0].propuesta);
    			}

    			if ((!current || dirty & /*errors*/ 2) && t5_value !== (t5_value = /*errors*/ ctx[1].propuesta + "")) set_data_dev(t5, t5_value);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div3);
    			destroy_component(button);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const suggestURL = "https://radiant-bastion-49480.herokuapp.com/suggest/";

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sugerencias", slots, []);
    	let fields = { propuesta: "" };
    	let errors = { propuesta: "" };
    	let valid = false;
    	let dispatch = createEventDispatcher();

    	const verificaFormatoPropuesta = () => {
    		valid = true;

    		if (fields.propuesta.trim().length < 1) {
    			valid = false;
    			$$invalidate(1, errors.propuesta = "Escriba su propuesta", errors);
    		} else if (fields.propuesta.trim().length > 15) {
    			valid = false;
    			$$invalidate(1, errors.propuesta = "Máximo 20 caracteres", errors);
    		} else {
    			$$invalidate(1, errors.propuesta = "", errors);
    		}
    	};

    	function enviar() {
    		if (valid) {
    			console.log("Enviando");
    			var data = new FormData();
    			data.append("propuesta", fields.propuesta);
    			var requestOptions = { method: "POST", body: data };
    			fetch(suggestURL, requestOptions).then(res => window.alert("Gracias!")).catch(res => window.alert("Algo salio mal"));
    		} else {
    			$$invalidate(1, errors.propuesta = "Formato incorrecto", errors);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Sugerencias> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		fields.propuesta = this.value;
    		$$invalidate(0, fields);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Button,
    		fields,
    		errors,
    		valid,
    		dispatch,
    		suggestURL,
    		verificaFormatoPropuesta,
    		enviar
    	});

    	$$self.$inject_state = $$props => {
    		if ("fields" in $$props) $$invalidate(0, fields = $$props.fields);
    		if ("errors" in $$props) $$invalidate(1, errors = $$props.errors);
    		if ("valid" in $$props) valid = $$props.valid;
    		if ("dispatch" in $$props) dispatch = $$props.dispatch;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [fields, errors, verificaFormatoPropuesta, enviar, input_input_handler];
    }

    class Sugerencias extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sugerencias",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Subscribe.svelte generated by Svelte v3.29.4 */

    const { console: console_1$1 } = globals;
    const file$3 = "src/components/Subscribe.svelte";

    // (52:16) <Button type="secondary" flat={true} >
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Enviar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(52:16) <Button type=\\\"secondary\\\" flat={true} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div4;
    	let div3;
    	let div2;
    	let br0;
    	let br1;
    	let t0;
    	let p;
    	let t2;
    	let form;
    	let div1;
    	let label;
    	let t3;
    	let input;
    	let t4;
    	let div0;
    	let t5_value = /*errors*/ ctx[1].email + "";
    	let t5;
    	let t6;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	button = new Button({
    			props: {
    				type: "secondary",
    				flat: true,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			br0 = element("br");
    			br1 = element("br");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Si deseas ser el primero en conocer la publicación del próximo\n                MR White Label, indica tu email y recibirás el aviso:";
    			t2 = space();
    			form = element("form");
    			div1 = element("div");
    			label = element("label");
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			div0 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			create_component(button.$$.fragment);
    			add_location(br0, file$3, 42, 25, 1306);
    			add_location(br1, file$3, 42, 29, 1310);
    			add_location(p, file$3, 43, 12, 1327);
    			attr_dev(label, "for", "email");
    			attr_dev(label, "class", "svelte-zvtvex");
    			add_location(label, file$3, 47, 20, 1581);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "email");
    			attr_dev(input, "id", "email");
    			add_location(input, file$3, 48, 20, 1629);
    			attr_dev(div0, "class", "error svelte-zvtvex");
    			add_location(div0, file$3, 49, 20, 1760);
    			attr_dev(div1, "class", "form-field svelte-zvtvex");
    			add_location(div1, file$3, 46, 16, 1536);
    			attr_dev(form, "class", "svelte-zvtvex");
    			add_location(form, file$3, 45, 12, 1479);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$3, 42, 8, 1289);
    			attr_dev(div3, "class", "col s12");
    			add_location(div3, file$3, 41, 4, 1259);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$3, 40, 0, 1237);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, br0);
    			append_dev(div2, br1);
    			append_dev(div2, t0);
    			append_dev(div2, p);
    			append_dev(div2, t2);
    			append_dev(div2, form);
    			append_dev(form, div1);
    			append_dev(div1, label);
    			append_dev(div1, t3);
    			append_dev(div1, input);
    			set_input_value(input, /*fields*/ ctx[0].email);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, t5);
    			append_dev(form, t6);
    			mount_component(button, form, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keyup", /*verificaFormatoEmail*/ ctx[2], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(form, "submit", prevent_default(/*enviar*/ ctx[3]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fields*/ 1 && input.value !== /*fields*/ ctx[0].email) {
    				set_input_value(input, /*fields*/ ctx[0].email);
    			}

    			if ((!current || dirty & /*errors*/ 2) && t5_value !== (t5_value = /*errors*/ ctx[1].email + "")) set_data_dev(t5, t5_value);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const subscribeURL = "https://radiant-bastion-49480.herokuapp.com/subscribe/";

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Subscribe", slots, []);
    	let fields = { email: "" };
    	let errors = { email: "" };
    	let valid = false;
    	let dispatch = createEventDispatcher();

    	const verificaFormatoEmail = () => {
    		var regexp = new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);

    		if (!regexp.test(fields.email)) {
    			valid = false;
    			$$invalidate(1, errors.email = "introduzca un formato correcto", errors);
    		} else {
    			$$invalidate(1, errors.email = "", errors);
    			valid = true;
    		}
    	};

    	function enviar() {
    		if (valid) {
    			console.log("Enviando");
    			var data = new FormData();
    			data.append("email", fields.email);
    			var requestOptions = { method: "POST", body: data };
    			fetch(subscribeURL, requestOptions).then(res => window.alert("Gracias!")).catch(res => window.alert("Algo salio mal"));
    		} else {
    			$$invalidate(1, errors.email = "Formato incorrecto", errors);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Subscribe> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		fields.email = this.value;
    		$$invalidate(0, fields);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Button,
    		fields,
    		errors,
    		valid,
    		dispatch,
    		subscribeURL,
    		verificaFormatoEmail,
    		enviar
    	});

    	$$self.$inject_state = $$props => {
    		if ("fields" in $$props) $$invalidate(0, fields = $$props.fields);
    		if ("errors" in $$props) $$invalidate(1, errors = $$props.errors);
    		if ("valid" in $$props) valid = $$props.valid;
    		if ("dispatch" in $$props) dispatch = $$props.dispatch;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [fields, errors, verificaFormatoEmail, enviar, input_input_handler];
    }

    class Subscribe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Subscribe",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Ferrari.svelte generated by Svelte v3.29.4 */
    const file$4 = "src/components/Ferrari.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let img;
    	let img_src_value;
    	let br0;
    	let t0;
    	let br1;
    	let t1;
    	let h3;
    	let br2;
    	let t3;
    	let br3;
    	let br4;
    	let t4;
    	let p;
    	let t5;
    	let br5;
    	let br6;
    	let t6;
    	let br7;

    	const block = {
    		c: function create() {
    			section = element("section");
    			img = element("img");
    			br0 = element("br");
    			t0 = space();
    			br1 = element("br");
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "R&S Records, el Ferrari de doce pulgadas";
    			br2 = element("br");
    			t3 = text("\n            (MRWL_01)");
    			br3 = element("br");
    			br4 = element("br");
    			t4 = space();
    			p = element("p");
    			t5 = text("A finales de los 80, unos misteriosos y fantásticos doce pulgadas estampados \n            con el logo de la marca de automóviles Ferrari comienzan a poblar las estanterías \n            de las mejores tiendas de discos de importación.");
    			br5 = element("br");
    			br6 = element("br");
    			t6 = text("\n            R&S Records se convertirá en el sello favorito de miles de ravers europeos, \n            y la leyenda del sello belga no hará más que crecer y crecer: \n            Public Relation, Aphex Twin, Cisco Ferreira, Derrick May, Jaydee, Capricorn, \n            Model 500, Kenny Larkin, Carl Craig, Joey Beltram... \n            El cénit de la electrónica mundial.");
    			br7 = element("br");
    			if (img.src !== (img_src_value = "/img/r&s.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "portada R&S Records");
    			attr_dev(img, "class", "ferrari svelte-m67yun");
    			add_location(img, file$4, 6, 8, 141);
    			add_location(br0, file$4, 6, 74, 207);
    			add_location(br1, file$4, 7, 8, 220);
    			attr_dev(h3, "class", "blue");
    			add_location(h3, file$4, 8, 8, 233);
    			add_location(br2, file$4, 8, 70, 295);
    			add_location(section, file$4, 5, 0, 122);
    			add_location(br3, file$4, 10, 21, 336);
    			add_location(br4, file$4, 10, 25, 340);
    			add_location(br5, file$4, 13, 60, 597);
    			add_location(br6, file$4, 13, 64, 601);
    			add_location(br7, file$4, 18, 47, 973);
    			add_location(p, file$4, 11, 12, 361);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, img);
    			append_dev(section, br0);
    			append_dev(section, t0);
    			append_dev(section, br1);
    			append_dev(section, t1);
    			append_dev(section, h3);
    			append_dev(section, br2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, br4, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t5);
    			append_dev(p, br5);
    			append_dev(p, br6);
    			append_dev(p, t6);
    			append_dev(p, br7);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(br4);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Ferrari", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Ferrari> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ createEventDispatcher, Button });
    	return [];
    }

    class Ferrari extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ferrari",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Andrew.svelte generated by Svelte v3.29.4 */
    const file$5 = "src/components/Andrew.svelte";

    function create_fragment$5(ctx) {
    	let section;
    	let img;
    	let img_src_value;
    	let br0;
    	let t0;
    	let h3;
    	let br1;
    	let t2;
    	let br2;
    	let br3;
    	let t3;
    	let p;
    	let t4;
    	let br4;
    	let br5;
    	let t5;
    	let br6;
    	let t6;
    	let br7;
    	let t7;
    	let br8;
    	let br9;
    	let t8;
    	let br10;
    	let t9;
    	let br11;
    	let t10;
    	let br12;
    	let br13;
    	let t11;
    	let br14;
    	let t12;
    	let br15;
    	let t13;
    	let br16;
    	let br17;
    	let t14;
    	let br18;
    	let t15;
    	let br19;
    	let t16;
    	let br20;
    	let br21;
    	let t17;
    	let br22;
    	let t18;
    	let br23;
    	let t19;
    	let br24;
    	let br25;
    	let t20;
    	let br26;
    	let br27;
    	let t21;
    	let br28;

    	const block = {
    		c: function create() {
    			section = element("section");
    			img = element("img");
    			br0 = element("br");
    			t0 = space();
    			h3 = element("h3");
    			h3.textContent = "Andrew Weatherall, la quintaesencia de la electrónica";
    			br1 = element("br");
    			t2 = text("\n      (MRWL_02)");
    			br2 = element("br");
    			br3 = element("br");
    			t3 = space();
    			p = element("p");
    			t4 = text("Andrew Weatherall (1963-2020): The Guv´nor. Lord Sabre. The Chairman.");
    			br4 = element("br");
    			br5 = element("br");
    			t5 = text("\n      Boy´s Own. The Sabres Of Paradise. Two Lone Swordsmen.");
    			br6 = element("br");
    			t6 = text("\n      Acid. Post-Punk. Spacy Disco.");
    			br7 = element("br");
    			t7 = text("\n      Cosmic. House. Techno.");
    			br8 = element("br");
    			br9 = element("br");
    			t8 = text("\n      Electro. Ambient. Dub.");
    			br10 = element("br");
    			t9 = text("\n      Remixer. Productor. DJ.");
    			br11 = element("br");
    			t10 = text("\n      Screamadelica. Dexter. Weekender.");
    			br12 = element("br");
    			br13 = element("br");
    			t11 = text("\n      The Asphodells. The Woodleigh Research Facility. Dayglo Maradona.");
    			br14 = element("br");
    			t12 = text("\n      Lino Squares. Lords Of Afford. Rude Solo.");
    			br15 = element("br");
    			t13 = text("\n      Wrong Meeting. A Love From Outer Space. Turntables & Machines.");
    			br16 = element("br");
    			br17 = element("br");
    			t14 = text("\n      The Haywire Sessions. 6 Mix. Music´s Not For Everyone.");
    			br18 = element("br");
    			t15 = text("\n      Bohemio. Agudo. Sarcástico.");
    			br19 = element("br");
    			t16 = text("\n      100 bpms. 120 bpms. 140 bpms.");
    			br20 = element("br");
    			br21 = element("br");
    			t17 = text("\n      El alquimista techno-punk.");
    			br22 = element("br");
    			t18 = text("\n      El genio atemporal.");
    			br23 = element("br");
    			t19 = text("\n      El rebelde que ignoraba las reglas.");
    			br24 = element("br");
    			br25 = element("br");
    			t20 = text("\n      La quintaesencia de la electrónica: Andrew Weatherall.");
    			br26 = element("br");
    			br27 = element("br");
    			t21 = text("\n      «Andrew no seguía las modas. Pinchaba lo que quería pinchar, hacía lo que quería hacer \n      y producía con la gente con la que quería producir. \n      Creo que esa es la razón por la que era tan respetado» -Paul Oakenfold-.");
    			br28 = element("br");
    			if (img.src !== (img_src_value = "/img/Andrew.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "portada Andrew Weatherall");
    			attr_dev(img, "class", "andy svelte-15qoxd");
    			add_location(img, file$5, 6, 3, 133);
    			add_location(br0, file$5, 6, 75, 205);
    			attr_dev(h3, "class", "blue");
    			add_location(h3, file$5, 7, 3, 213);
    			add_location(br1, file$5, 7, 78, 288);
    			add_location(br2, file$5, 8, 15, 308);
    			add_location(br3, file$5, 8, 19, 312);
    			add_location(section, file$5, 5, 0, 120);
    			add_location(br4, file$5, 11, 75, 404);
    			add_location(br5, file$5, 11, 79, 408);
    			add_location(br6, file$5, 12, 60, 473);
    			add_location(br7, file$5, 13, 35, 513);
    			add_location(br8, file$5, 14, 28, 546);
    			add_location(br9, file$5, 14, 32, 550);
    			add_location(br10, file$5, 15, 28, 583);
    			add_location(br11, file$5, 16, 29, 617);
    			add_location(br12, file$5, 17, 39, 661);
    			add_location(br13, file$5, 17, 43, 665);
    			add_location(br14, file$5, 18, 71, 741);
    			add_location(br15, file$5, 19, 47, 793);
    			add_location(br16, file$5, 20, 68, 866);
    			add_location(br17, file$5, 20, 72, 870);
    			add_location(br18, file$5, 21, 60, 935);
    			add_location(br19, file$5, 22, 33, 973);
    			add_location(br20, file$5, 23, 35, 1013);
    			add_location(br21, file$5, 23, 39, 1017);
    			add_location(br22, file$5, 24, 32, 1054);
    			add_location(br23, file$5, 25, 25, 1084);
    			add_location(br24, file$5, 26, 41, 1130);
    			add_location(br25, file$5, 26, 45, 1134);
    			add_location(br26, file$5, 27, 60, 1199);
    			add_location(br27, file$5, 27, 64, 1203);
    			add_location(p, file$5, 11, 3, 332);
    			add_location(br28, file$5, 30, 82, 1443);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, img);
    			append_dev(section, br0);
    			append_dev(section, t0);
    			append_dev(section, h3);
    			append_dev(section, br1);
    			append_dev(section, t2);
    			append_dev(section, br2);
    			append_dev(section, br3);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t4);
    			append_dev(p, br4);
    			append_dev(p, br5);
    			append_dev(p, t5);
    			append_dev(p, br6);
    			append_dev(p, t6);
    			append_dev(p, br7);
    			append_dev(p, t7);
    			append_dev(p, br8);
    			append_dev(p, br9);
    			append_dev(p, t8);
    			append_dev(p, br10);
    			append_dev(p, t9);
    			append_dev(p, br11);
    			append_dev(p, t10);
    			append_dev(p, br12);
    			append_dev(p, br13);
    			append_dev(p, t11);
    			append_dev(p, br14);
    			append_dev(p, t12);
    			append_dev(p, br15);
    			append_dev(p, t13);
    			append_dev(p, br16);
    			append_dev(p, br17);
    			append_dev(p, t14);
    			append_dev(p, br18);
    			append_dev(p, t15);
    			append_dev(p, br19);
    			append_dev(p, t16);
    			append_dev(p, br20);
    			append_dev(p, br21);
    			append_dev(p, t17);
    			append_dev(p, br22);
    			append_dev(p, t18);
    			append_dev(p, br23);
    			append_dev(p, t19);
    			append_dev(p, br24);
    			append_dev(p, br25);
    			append_dev(p, t20);
    			append_dev(p, br26);
    			append_dev(p, br27);
    			append_dev(p, t21);
    			insert_dev(target, br28, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(br28);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Andrew", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Andrew> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ createEventDispatcher, Button });
    	return [];
    }

    class Andrew extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Andrew",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Libros.svelte generated by Svelte v3.29.4 */
    const file$6 = "src/components/Libros.svelte";

    function create_fragment$6(ctx) {
    	let body;
    	let br0;
    	let t0;
    	let p0;
    	let ferrari;
    	let t1;
    	let br1;
    	let br2;
    	let br3;
    	let t2;
    	let p1;
    	let andrew;
    	let current;
    	ferrari = new Ferrari({ $$inline: true });
    	andrew = new Andrew({ $$inline: true });

    	const block = {
    		c: function create() {
    			body = element("body");
    			br0 = element("br");
    			t0 = space();
    			p0 = element("p");
    			create_component(ferrari.$$.fragment);
    			t1 = space();
    			br1 = element("br");
    			br2 = element("br");
    			br3 = element("br");
    			t2 = space();
    			p1 = element("p");
    			create_component(andrew.$$.fragment);
    			add_location(br0, file$6, 6, 6, 166);
    			add_location(p0, file$6, 7, 0, 171);
    			add_location(br1, file$6, 7, 18, 189);
    			add_location(br2, file$6, 7, 22, 193);
    			add_location(br3, file$6, 7, 26, 197);
    			add_location(p1, file$6, 8, 0, 202);
    			add_location(body, file$6, 6, 0, 160);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, br0);
    			append_dev(body, t0);
    			append_dev(body, p0);
    			mount_component(ferrari, p0, null);
    			append_dev(p0, t1);
    			append_dev(body, br1);
    			append_dev(body, br2);
    			append_dev(body, br3);
    			append_dev(body, t2);
    			append_dev(body, p1);
    			mount_component(andrew, p1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ferrari.$$.fragment, local);
    			transition_in(andrew.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ferrari.$$.fragment, local);
    			transition_out(andrew.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_component(ferrari);
    			destroy_component(andrew);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Libros", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Libros> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ createEventDispatcher, Ferrari, Andrew });
    	return [];
    }

    class Libros extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Libros",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Filosofia.svelte generated by Svelte v3.29.4 */
    const file$7 = "src/components/Filosofia.svelte";

    function create_fragment$7(ctx) {
    	let section;
    	let br0;
    	let t0;
    	let br1;
    	let br2;
    	let t1;
    	let br3;
    	let br4;
    	let t2;

    	const block = {
    		c: function create() {
    			section = element("section");
    			br0 = element("br");
    			t0 = text("\n    MR White Label es un proyecto independiente que explora en profundidad ciertas \n        figuras y momentos clave de la historia de la electrónica, ya sean DJs, \n        productores, géneros o sellos.");
    			br1 = element("br");
    			br2 = element("br");
    			t1 = text("\n    La colección está diseñada pensando en aquellos amantes de la cultura de club \n        que busquen información detallada sobre estos momentos estelares en forma de \n        exhaustivos monográficos.");
    			br3 = element("br");
    			br4 = element("br");
    			t2 = text("\n    Cada referencia de la colección se publica sólo en papel y en edición limitada \n        para coleccionistas.");
    			add_location(br0, file$7, 4, 9, 83);
    			add_location(br1, file$7, 7, 38, 291);
    			add_location(br2, file$7, 7, 42, 295);
    			add_location(br3, file$7, 10, 33, 502);
    			add_location(br4, file$7, 10, 37, 506);
    			add_location(section, file$7, 4, 0, 74);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, br0);
    			append_dev(section, t0);
    			append_dev(section, br1);
    			append_dev(section, br2);
    			append_dev(section, t1);
    			append_dev(section, br3);
    			append_dev(section, br4);
    			append_dev(section, t2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Filosofia", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Filosofia> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ createEventDispatcher });
    	return [];
    }

    class Filosofia extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Filosofia",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/Nav.svelte generated by Svelte v3.29.4 */

    const navOptions = [
    	{ page: "FILOSOFIA", component: Filosofia },
    	{ page: "LIBROS", component: Libros },
    	{ page: "SUSCRÍBETE", component: Subscribe },
    	{
    		page: "SUGERENCIAS",
    		component: Sugerencias
    	}
    ];

    /* src/components/Footer.svelte generated by Svelte v3.29.4 */

    const file$8 = "src/components/Footer.svelte";

    function create_fragment$8(ctx) {
    	let footer;
    	let div;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			div.textContent = "Copyright 2020 MRWL";
    			attr_dev(div, "class", "copyright svelte-d9vkao");
    			add_location(div, file$8, 1, 4, 13);
    			attr_dev(footer, "class", "svelte-d9vkao");
    			add_location(footer, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/Anime.svelte generated by Svelte v3.29.4 */

    const file$9 = "src/components/Anime.svelte";

    function create_fragment$9(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let img2;
    	let img2_src_value;
    	let t2;
    	let img3;
    	let img3_src_value;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			img1 = element("img");
    			t1 = space();
    			img2 = element("img");
    			t2 = space();
    			img3 = element("img");
    			if (img0.src !== (img0_src_value = "/img/break_01.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "breakdancer");
    			attr_dev(img0, "class", "breaker01");
    			add_location(img0, file$9, 5, 10, 113);
    			if (img1.src !== (img1_src_value = "/img/break_02.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "breakdancer");
    			attr_dev(img1, "class", "breaker02");
    			add_location(img1, file$9, 6, 10, 189);
    			if (img2.src !== (img2_src_value = "/img/break_03.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "breakdancer");
    			attr_dev(img2, "class", "breaker03");
    			add_location(img2, file$9, 7, 10, 265);
    			if (img3.src !== (img3_src_value = "/img/break_04.jpg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "breakdancer");
    			attr_dev(img3, "class", "breaker04");
    			add_location(img3, file$9, 8, 10, 341);
    			attr_dev(div0, "class", "breakDance");
    			add_location(div0, file$9, 4, 6, 77);
    			attr_dev(div1, "class", "col s12");
    			add_location(div1, file$9, 3, 4, 49);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$9, 2, 2, 27);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$9, 1, 0, 1);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img0);
    			append_dev(div0, t0);
    			append_dev(div0, img1);
    			append_dev(div0, t1);
    			append_dev(div0, img2);
    			append_dev(div0, t2);
    			append_dev(div0, img3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Anime", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Anime> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Anime extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Anime",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/shared/Tabs.svelte generated by Svelte v3.29.4 */
    const file$a = "src/shared/Tabs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (14:20) {#each menus as menu}
    function create_each_block(ctx) {
    	let li;
    	let div;
    	let t0_value = /*menu*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*menu*/ ctx[4], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "svelte-1pbpy0s");
    			toggle_class(div, "active", /*menu*/ ctx[4] === /*menuActivo*/ ctx[1]);
    			add_location(div, file$a, 15, 24, 432);
    			attr_dev(li, "class", "svelte-1pbpy0s");
    			add_location(li, file$a, 14, 20, 358);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*menus*/ 1 && t0_value !== (t0_value = /*menu*/ ctx[4] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*menus, menuActivo*/ 3) {
    				toggle_class(div, "active", /*menu*/ ctx[4] === /*menuActivo*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(14:20) {#each menus as menu}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let ul;
    	let each_value = /*menus*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-1pbpy0s");
    			add_location(ul, file$a, 12, 16, 291);
    			attr_dev(div0, "class", "tabs svelte-1pbpy0s");
    			add_location(div0, file$a, 11, 12, 256);
    			attr_dev(div1, "class", "col s12");
    			add_location(div1, file$a, 10, 8, 222);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$a, 9, 4, 196);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$a, 8, 0, 168);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*dispatch, menus, menuActivo*/ 7) {
    				each_value = /*menus*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tabs", slots, []);
    	const dispatch = createEventDispatcher();
    	let { menus } = $$props;
    	let { menuActivo } = $$props;
    	const writable_props = ["menus", "menuActivo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	const click_handler = menu => dispatch("tabChange", menu);

    	$$self.$$set = $$props => {
    		if ("menus" in $$props) $$invalidate(0, menus = $$props.menus);
    		if ("menuActivo" in $$props) $$invalidate(1, menuActivo = $$props.menuActivo);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		menus,
    		menuActivo
    	});

    	$$self.$inject_state = $$props => {
    		if ("menus" in $$props) $$invalidate(0, menus = $$props.menus);
    		if ("menuActivo" in $$props) $$invalidate(1, menuActivo = $$props.menuActivo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [menus, menuActivo, dispatch, click_handler];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { menus: 0, menuActivo: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*menus*/ ctx[0] === undefined && !("menus" in props)) {
    			console.warn("<Tabs> was created without expected prop 'menus'");
    		}

    		if (/*menuActivo*/ ctx[1] === undefined && !("menuActivo" in props)) {
    			console.warn("<Tabs> was created without expected prop 'menuActivo'");
    		}
    	}

    	get menus() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menus(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get menuActivo() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menuActivo(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/Card.svelte generated by Svelte v3.29.4 */

    const file$b = "src/shared/Card.svelte";

    function create_fragment$b(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "card svelte-95hsns");
    			add_location(div, file$b, 1, 0, 1);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */
    const file$c = "src/App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (26:2) {#each navOptions as option, i}
    function create_each_block$1(ctx) {
    	let li;
    	let button;
    	let t0_value = /*option*/ ctx[3].page + "";
    	let t0;
    	let button_class_value;
    	let button_id_value;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(button, "class", button_class_value = /*intSelected*/ ctx[1] == /*i*/ ctx[5]
    			? "nav-link active p-2 ml-1"
    			: "p-2 ml-1 nav-link");

    			attr_dev(button, "id", button_id_value = /*i*/ ctx[5]);
    			attr_dev(button, "role", "tab");
    			add_location(button, file$c, 27, 3, 785);
    			attr_dev(li, "class", "nav-item");
    			add_location(li, file$c, 26, 2, 760);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*changeComponent*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*intSelected*/ 2 && button_class_value !== (button_class_value = /*intSelected*/ ctx[1] == /*i*/ ctx[5]
    			? "nav-link active p-2 ml-1"
    			: "p-2 ml-1 nav-link")) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(26:2) {#each navOptions as option, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let link;
    	let t0;
    	let header;
    	let t1;
    	let anime;
    	let t2;
    	let br;
    	let t3;
    	let div3;
    	let ul;
    	let t4;
    	let div2;
    	let div1;
    	let div0;
    	let switch_instance;
    	let t5;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });
    	anime = new Anime({ $$inline: true });
    	let each_value = navOptions;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	var switch_value = /*selected*/ ctx[0].component;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(anime.$$.fragment);
    			t2 = space();
    			br = element("br");
    			t3 = space();
    			div3 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t5 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css");
    			add_location(link, file$c, 18, 0, 537);
    			add_location(br, file$c, 22, 0, 663);
    			attr_dev(ul, "class", "nav nav-tabs loco svelte-x1oqs9");
    			add_location(ul, file$c, 24, 1, 693);
    			attr_dev(div0, "class", "p-2");
    			add_location(div0, file$c, 33, 3, 1008);
    			attr_dev(div1, "class", "col-sm-12");
    			add_location(div1, file$c, 32, 2, 981);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$c, 31, 1, 961);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$c, 23, 0, 668);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(anime, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			if (switch_instance) {
    				mount_component(switch_instance, div0, null);
    			}

    			insert_dev(target, t5, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*intSelected, changeComponent, navOptions*/ 6) {
    				each_value = navOptions;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (switch_value !== (switch_value = /*selected*/ ctx[0].component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div0, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(anime.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(anime.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link);
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(anime, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if (switch_instance) destroy_component(switch_instance);
    			if (detaching) detach_dev(t5);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let selected = navOptions[0];
    	let intSelected = 0;

    	function changeComponent(event) {
    		$$invalidate(0, selected = navOptions[event.srcElement.id]);
    		$$invalidate(1, intSelected = event.srcElement.id);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		navOptions,
    		Footer,
    		Anime,
    		Tabs,
    		Card,
    		Button,
    		selected,
    		intSelected,
    		changeComponent
    	});

    	$$self.$inject_state = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("intSelected" in $$props) $$invalidate(1, intSelected = $$props.intSelected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected, intSelected, changeComponent];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
