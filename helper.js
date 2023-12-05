const id = (x) => document.getElementById(x);
function createHTMLElement(tag, props, children) {
    const element = document.createElement(tag);
    Object.assign(element, props);
    for (const child of children) {
      if (child) {
        element.append(child);
      }
    }
    return element;
}
function convertJSONToHTMLElement(json) {
    const entry = createHTMLElement("div", {"className": "entry"}, [
        createHTMLElement("p", null, [
            createHTMLElement("a", {
                "href": "?q=" + json.word,
                "target": config["rhyme"] || config["regex"] ? "_blank" : "_self"
            }, [
                createHTMLElement("b", null, [json.word])
            ]),
            " ",
            RAFSI.get(json.word) ? createHTMLElement("i", {"className": "rafsi"}, [
                "-", ...RAFSI.get(json.word).join("-"), "-"
            ]) : null,
            " ",
            json.selmaho ? createHTMLElement("code", {"className": "selmaho"}, [json.selmaho]) : null,
            " ",
            createHTMLElement("a", {
                "href": "https://jbovlaste.lojban.org/dict/" + json.word.replace(/ /g, "%20"),
                "target": "_blank",
            }, [
                json.score >= 1000 ? "official" :
                json.score == -1 ? json.score : "+" + json.score,
                "\u{a0}↗"
            ])
        ]),
        createHTMLElement("p", null, replaceLinks(json.definition)),
        json.notes ? createHTMLElement("details", null, [
            createHTMLElement("summary", null, ["more info"]),
            createHTMLElement("p", null, replaceLinks(json.notes))
        ]) : null
    ]);
    return entry;
}
function replaceLinks(str) {
    var bits = str.replace(/\$/g, "💵$").split("💵");
    for (var i = 0; i < bits.length; i++) {
        if (i % 2 == 0 || i == bits.length - 1) {
            if (i) {
                bits[i] = bits[i].slice(1);
                bits[i - 1] = bits[i - 1] + "$";
            }
            bits[i] = bits[i].replace(/\{/g, "📦{").replace(/\}/g, "}📦").split("📦").map((item) =>
                /\{[a-g'i-pr-vx-z., ]+\}/i.test(item) ? createHTMLElement("a", {
                    "href": "?q=" + item.slice(1, -1) + "&fromwordlink",
                    "target": config["rhyme"] || config["regex"] ? "_blank" : "_self"
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
            nodes.push(convertJSONToHTMLElement(res[i][0]));
        }
    }
    id("results").append(...nodes);
    // latex
    renderMathInElement(document.body, {
        "delimiters": [
            {"left": "$$",  "right": "$$",  "display": true },
            {"left": "$",   "right": "$",   "display": false},
            {"left": "\\(", "right": "\\)", "display": false},
            {"left": "\\[", "right": "\\]", "display": true }
        ]
    });
}