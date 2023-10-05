const id = (x) => document.getElementById(x);
// searching & rendering
var rhyme = false;
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
                results.push([tohtml(entry), 10]);
                break;
            }
        }
        e: for (const entry of jbo) {
            var html = tohtml(entry);
            for (var field of fields(entry)) {
                var score = 6 - fields(entry).indexOf(field);
                var added = false;
                switch (field) {
                    case entry.word:
                        if (field.startsWith(query)) {
                            results.push([html, score + 0.5 + query.length / field.length / 2]);
                            added = true;
                        } else if (field.includes(query)) {
                            results.push([html, score + query.length / field.length / 2]);
                            added = true;
                        }
                        break;
                    case entry.rafsi:
                        if (field) {
                            score = 8;
                            for (const r of field) {
                                if (r == query) {
                                    results.push([html, score]);
                                    added = true;
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
                        //         added = true;
                        //     }
                        // }
                        break;
                    case entry.glosswords:
                        if (field) {
                            for (const g of field) {
                                if (g == query) {
                                    results.push([html, score]);
                                    added = true;
                                }
                            }
                        }
                        break;
                    default:
                        const regex = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        if (field && new RegExp(`[^\\p{L}\\p{Mc}\\p{Me}]${regex}e?s?[^\\p{L}\\p{Mc}\\p{Me}]`, "iu").test(field)) {
                            results.push([html, score]);
                            added = true;
                        }
                        break;
                }
                // we don't need to be in here still
                if (added) continue e; // next entry
            }
        }
    }
    results = results.sort((a, b) => b[1] - a[1]).reduce((acc, curr) => {
        const x = acc.find(item => item[0].isEqualNode(curr[0]));
        if (!x) {
            acc.push(curr);
        }
        return acc;
    }, []);
    return results;
}
function load(res, page) {
    const start = page * 100;
    const end = (page + 1) * 100;
    var nodes = [];
    for (var i = start; i < end; i++) {
        if (res[i]) {
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
var timer;
var observer;
id("search").addEventListener("input", function() {
    // FIXME: doesn't clear?
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
id("sm").addEventListener("click", searchmode);
id("rm").addEventListener("click", rhymemode);
function searchmode() {
    clearTimeout(timer);
    document.body.classList.remove("rhyme");
    id("sm").classList.add("checked");
    id("rm").classList.remove("checked");
    rhyme = false;
    id("search").dispatchEvent(new Event("input", {"bubbles": true}));
}
function rhymemode() {
    clearTimeout(timer);
    document.body.classList.add("rhyme");
    id("rm").classList.add("checked");
    id("sm").classList.remove("checked");
    rhyme = true;
    id("search").dispatchEvent(new Event("input", {"bubbles": true}));
}