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
                "target": "_blank"
            }, [
                json.score >= 1000 ? "official" :
                json.score == -1 ? json.score : "+" + json.score,
                " ↗"
            ])
        ]),
        mkelem("p", null, [json.definition]),
        json.notes ? mkelem("details", null, [
            mkelem("summary", null, ["more info"]),
            mkelem("p", null, [json.notes])
        ]) : null
    ]);
    return entry;
}
function load(res, page) {
    const start = page * 100;
    const end = (page + 1) * 100;
    var nodes = [];
    for (var i = start; i < end; i++) {
        if (res[i]) {
            res[i] = [tohtml(res[i][0]), res[i][1]];
            nodes.push(res[i][1] == 10 ? mkelem("x-exact", {"className": "group"}, [res[i][0]]) : res[i][0]);
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