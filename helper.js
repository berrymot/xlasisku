const id = (x) => document.getElementById(x);
function mkelem(tag, props, children) {
    const e = document.createElement(tag);
    Object.assign(e, props);
    for (const c of children) {
        if (c != null) {
            e.append(c);
        }
    }
    return e;
}
function tohtml(json) {
    const entry = mkelem("div", {"className": "entry"}, [
        mkelem("p", null, [
            mkelem("a", {
                "href": "?q=" + json.word,
                "target": rhyme || regex ? "_blank" : "_self"
            }, [
                mkelem("b", null, [json.word])
            ]),
            " ",
            json.rafsi ? mkelem("i", {"className": "rafsi"}, [
                ...json.rafsi.map(i => "-" + i), "-"
            ]) : null,
            " ",
            json.selmaho ? mkelem("code", {"className": "selmaho"}, [json.selmaho]) : null,
            " ",
            mkelem("a", {
                "href": "https://jbovlaste.lojban.org/dict/" + json.word.replace(/ /g, "%20"),
                "target": "_blank",
                "className": "nobr"
            }, [
                json.score >= 1000 ? "official" :
                json.score == -1 ? json.score : "+" + json.score,
                " ↗"
            ])
        ]),
        mkelem("p", null, replacelinks(json.definition)),
        json.notes ? mkelem("details", null, [
            mkelem("summary", null, ["more info"]),
            mkelem("p", null, replacelinks(json.notes))
        ]) : null
    ]);
    return entry;
}
function replacelinks(str) {
    var bits = str.replace(/\$/g, "💵$").split("💵");
    for (var i = 0; i < bits.length; i++) {
        if (i % 2 == 0 || i == bits.length - 1) {
            if (i != 0) {
                bits[i] = bits[i].slice(1);
                bits[i - 1] = bits[i - 1] + "$";
            }
            bits[i] = bits[i].replace(/\{/g, "📦{").replace(/\}/g, "}📦").split("📦").map((item) =>
                /\{[a-z'., ]+\}/.test(item) ? mkelem("a", {
                    "href": "?q=" + item.slice(1, -1),
                    "target": rhyme || regex ? "_blank" : "_self"
                }, item.slice(1, -1)) : item
            );
        }
    }
    return bits.flat();
}
function load(res, page) {
    const start = page * 100;
    const end = (page + 1) * 100;
    var nodes = [];
    for (var i = start; i < end; i++) {
        if (res[i]) {
            res[i] = [tohtml(res[i][0]), res[i][1]];
            nodes.push(res[i][0]);
        }
    }
    id("results").append(...nodes);
    // latex
    renderMathInElement(document.body, {
        "delimiters": [
            { "left": "$$",    "right": "$$",    "display": true  },
            { "left": "$",     "right": "$",     "display": false },
            { "left": "\\(",   "right": "\\)",   "display": false },
            { "left": "\\[",   "right": "\\]",   "display": true  }
        ]
    });
}