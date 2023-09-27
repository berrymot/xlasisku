const id = (x) => document.getElementById(x);
// searching & rendering
var observer;
var rhyme = false;
function tohtml(json) {
    // TODO: rework
    var s = [];
    s.push("<div class=entry>");
    s.push("<p><b>" + json.word + "</b> ");
    if (json.selmaho) {
        s.push("<code class=selmaho>" + json.selmaho + "</code> ");
    }
    if (json.rafsi) {
        s.push("<code>[");
        for (var i = 0; i < json.rafsi.length; i++) {
            s.push("-" + json.rafsi[i]);
        }
        s.push("-]</code> ");
    }
    const url = json.word.replace(/ /g, "%20");
    s.push("<a href=https://jbovlaste.lojban.org/dict/" + url + ">");
    if (json.score < -1) {
        s.push("<b class=warn>" + json.score + "</b> ↗</a></p> ");
    } else if (json.score > 1000) {
        s.push("official ↗</a></p> ");
    } else {
        s.push("↗</a></p> ");
    }
    s.push("<p>" + json.definition + "</p> ");
    if (json.notes) {
        s.push("<details class=notes><summary>more info</summary> <p>" + json.notes + "</p></details> ");
    }
    if (json.glosswords) {
        s.push("<p>");
        for (var i = 0; i < json.glosswords.length; i++) {
            s.push("<i class=glosswords>" + json.glosswords[i] + "</i>, ");
        }
        var last = s[s.length - 1];
        s[s.length - 1] = last.substring(0, last.length - 2);
        s.push("</p>");
    }
    s.push("</div>");
    return s.join("");
}
function fields(json) {
    return [json.selmaho || null, json.rafsi || null, json.definition, json.word, json.glosswords || null, json.notes || null];
}
// TODO: selmaho()
function selmahois(x, y) {
    const [a, b, c] = x;
    const [aa, bb, cc] = y;
    return a == aa && (b == bb || b == null) && (!c || cc);
}
function search(query) {
    var results = [];
    if (rhyme) {
        // TODO: sort
        for (const entry of jbo) {
            vowels = query.replace(/[^aeiouy]/gi, "");
            var text = entry.word.replace(/[^aeiouy]/gi, "");
            if (text.endsWith(vowels)) {
                results.push([tohtml(entry), 1]);
            }
        }
    } else {
        // exact matches
        for (const entry of jbo) {
            const text = entry.word.replace(/\s+/g, " ").replace(/&lt;/g, "<");
            if (text == query) {
                results.push(["<x-exact class=group>", 10]);
                results.push([tohtml(entry), 10]);
                results.push(["</x-exact>", 10]);
                break;
            }
        }
        for (const entry of jbo) {
            var html = tohtml(entry);
            for (var field of fields(entry)) {
                var score = 6 - fields(entry).indexOf(field);
                switch (field) {
                    case entry.word:
                        if (field.startsWith(query)) {
                            results.push([html, score + 0.5 + query.length / field.length / 2]);
                        } else if (field.includes(query)) {
                            results.push([html, score + query.length / field.length / 2]);
                        }
                        break;
                    case entry.rafsi:
                        if (field) {
                            score = 8;
                            for (const r of field) {
                                if (r == query) {
                                    results.push([html, score]);
                                }
                            }
                        }
                        break;
                    case entry.selmaho:
                        // const bits = selmaho(query);
                        // console.log(bits);
                        // if (field) {
                        //     if (selmahois(bits, selmaho(field))) {
                        //         results.push([html, score]);
                        //     }
                        // }
                        break;
                    case entry.glosswords:
                        if (field) {
                            for (const g of field) {
                                if (g.includes(query)) {
                                    results.push([html, score]);
                                }
                            }
                        }
                        break;
                    default:
                        if (field && field.toLowerCase().includes(query)) {
                            results.push([html, score]);
                        }
                        break;
                }
            }
        }
    }
    results = results.sort((a, b) => b[1] - a[1]).reduce((acc, curr) => {
        const x = acc.find(item => item[0] == curr[0]);
        if (!x || x == curr) {
            acc.push(curr);
        }
        return acc;
    }, []);
    return results;
}
function load(res, page) {
    const start = page * 100;
    const end = (page + 1) * 100;
    var html = [];
    for (var i = start; i < end; i++) {
        if (res[i]) {
            html.push(res[i]);
        }
    }
    id("results").insertAdjacentHTML("beforeend", html.join(""));
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
var timer;
id("search").addEventListener("input", function() {
    clearTimeout(timer);
    var q = id("search").value.trim().toLowerCase();
    id("results").innerHTML = "";
    let page = 0;
    if (observer) {
        observer.disconnect();
    }
    // for debouncing
    timer = setTimeout(function() {
        if ((rhyme ? q.replace(/[^aeiouy]/gi, "") : q).length) {
            const res = search(q);
            id("results").innerHTML = "";
            load(res, page);
            observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    page++;
                    load(res, page);
                }
            }, {"root": null, "rootMargin": "200px"});
            observer.observe(id("bottom"));
            const params = new URLSearchParams({"q": q});
            if (rhyme) params.append("rhyme", "");
            const url = "https://berrymot.github.io/xlasisku/?" + params.toString().replace(/=$/, "");
            window.history.pushState(null, null, url);
        } else {
            id("results").innerHTML = "";
            page = 0;
            const url = "https://berrymot.github.io/xlasisku/" + (rhyme ? "?rhyme" : "");
            window.history.pushState(null, null, url);
        }
    }, 100);
});
// rhyming
id("sm").addEventListener("change", searchmode);
id("rm").addEventListener("change", rhymemode);
function searchmode() {
    id("sm").checked = true;
    rhyme = false;
    document.body.classList.remove("rhyme");
    id("search").dispatchEvent(new Event("input", {"bubbles": true}));
}
function rhymemode() {
    id("rm").checked = true;
    rhyme = true;
    document.body.classList.add("rhyme");
    id("search").dispatchEvent(new Event("input", {"bubbles": true}));
}